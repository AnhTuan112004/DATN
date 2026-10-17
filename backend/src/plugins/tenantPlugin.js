import { AsyncLocalStorage } from 'node:async_hooks';
import mongoose from 'mongoose';

/**
 * Tenant Store dùng AsyncLocalStorage để lưu ngữ cảnh tenant (companyId) cho từng request/luồng.
 */
export const tenantStore = new AsyncLocalStorage();

const TENANT_QUERY_OPS = [
  'find',
  'findOne',
  'findOneAndUpdate',
  'findOneAndDelete',
  'countDocuments',
  'distinct',
];

const TENANT_UPDATE_OPS = [
  'findOneAndUpdate',
  'updateOne',
  'updateMany',
  'replaceOne',
];

/**
 * Mongoose Plugin: Cách ly Multi-tenant Fail-Closed cả Đọc & Ghi
 * Không áp dụng lên collection Company.
 */
export function tenantPlugin(schema) {
  // 1. Trường companyId là bất biến (immutable)
  if (!schema.path('companyId')) {
    schema.add({
      companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true,
        immutable: true,
      },
    });
  } else {
    schema.path('companyId').immutable(true);
  }

  const getTenantId = (options) => {
    if (options?.skipTenant) return null; // Cho phép luồng đặc biệt (Login, Cron nội bộ, Seed)
    const store = tenantStore.getStore();
    const id = store?.companyId;
    if (!id) {
      throw new Error('SECURITY_ERROR: Missing tenant context in query (Fail-Closed)');
    }
    return id;
  };

  // 2. Bảo vệ đường Ghi (pre-validate): Tự động gán hoặc kiểm tra companyId
  schema.pre('validate', function () {
    // Nếu có skipTenant trong options
    if (this.$__.saveOptions?.skipTenant) return;
    const store = tenantStore.getStore();
    const id = store?.companyId;
    if (id) {
      if (this.companyId && this.companyId.toString() !== id.toString()) {
        throw new Error('SECURITY_ERROR: Cannot write document to different tenant');
      }
      this.companyId = id;
    }
  });

  // 3. Bảo vệ đường Đọc & Query Hooks
  TENANT_QUERY_OPS.forEach((op) => {
    schema.pre(op, function () {
      const id = getTenantId(this.getOptions());
      if (id) {
        this.where({ companyId: id });
      }
    });
  });

  // 4. Bảo vệ đường Cập nhật: Chặn sửa đổi companyId
  TENANT_UPDATE_OPS.forEach((op) => {
    schema.pre(op, function () {
      const id = getTenantId(this.getOptions());
      if (id) {
        this.where({ companyId: id });
        const update = this.getUpdate();
        if (update && (update.companyId || (update.$set && update.$set.companyId))) {
          throw new Error('SECURITY_ERROR: Modifying companyId is forbidden');
        }
      }
    });
  });

  // 5. Bảo vệ Aggregate (chèn match tenant vào đầu pipeline)
  schema.pre('aggregate', function () {
    const id = getTenantId(this.options);
    if (id) {
      const firstStage = this.pipeline()[0];
      // Ngoại trừ $vectorSearch của Atlas (RAG P1) bắt buộc là stage đầu tiên
      if (!firstStage || !firstStage.$vectorSearch) {
        this.pipeline().unshift({ $match: { companyId: new mongoose.Types.ObjectId(id) } });
      }
    }
  });
}
