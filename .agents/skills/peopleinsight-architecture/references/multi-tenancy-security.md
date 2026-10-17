# THAM CHIẾU: BẢO MẬT & CÔ LẬP MULTI-TENANCY (FAIL-CLOSED)

> **Mục tiêu:** Ngăn chặn tuyệt đối việc rò rỉ dữ liệu giữa các công ty (Cross-tenant Data Leak), kiểm soát lỗ hổng IDOR, bảo vệ dữ liệu nhạy cảm (mật khẩu, refresh token, cấu hình lương, số dư phép) cả trên **đường đọc (Read)** lẫn **đường ghi (Write)** và trong các thao tác đồng thời.

---

## 1. MONGOOSE MULTI-TENANT PLUGIN BẢO VỆ TOÀN DIỆN (READ & WRITE FAIL-CLOSED)

Plugin sử dụng `AsyncLocalStorage` của Node.js để tự động quản lý ngữ cảnh `companyId` xuyên suốt vòng đời HTTP request, đồng thời chặn đứng hành vi ghi sai tenant và sửa đổi tenant trái phép.

```javascript
// backend/src/plugins/tenantPlugin.js
import { AsyncLocalStorage } from 'node:async_hooks';
import mongoose from 'mongoose';

export const tenantStore = new AsyncLocalStorage();

const QUERY_OPS = [
  'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete',
  'updateOne', 'updateMany', 'deleteOne', 'deleteMany',
  'countDocuments', 'distinct'
];

export function tenantPlugin(schema) {
  // 1. Thêm trường companyId bất biến (immutable) có đánh index
  if (!schema.path('companyId')) {
    schema.add({
      companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true,
        immutable: true // Chống đổi tenant sau khi tạo
      }
    });
  }

  // 2. Hàm lấy tenantId chuẩn Fail-Closed
  const getTenantId = (options) => {
    if (options?.skipTenant) return null;

    const store = tenantStore.getStore();
    const id = store?.companyId;

    if (!id) {
      // FAIL-CLOSED: Ném lỗi ngay lập tức để chặn đứng truy vấn không có tenant context
      throw new Error('SECURITY_VIOLATION: Missing tenant context (Fail-Closed). Access blocked.');
    }
    return id;
  };

  // 3. BẢO VỆ ĐƯỜNG GHI MỚI (create / save): Hook pre('validate')
  schema.pre('validate', function () {
    if (!this.isNew) return;
    const id = getTenantId({});
    if (!id) return;

    // Chặn đứng hành vi truyền companyId giả mạo trong request body
    if (this.companyId && String(this.companyId) !== String(id)) {
      throw new Error('SECURITY_VIOLATION: Tenant mismatch on document creation.');
    }
    this.companyId = id; // Ghi đè bắt buộc từ ngữ cảnh xác thực
  });

  // 4. BẢO VỆ ĐƯỜNG CẬP NHẬT: Chặn sửa đổi companyId trong findOneAndUpdate / updateOne / updateMany
  schema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function () {
    const update = this.getUpdate();
    if (!update) return;

    if (update.companyId || update.$set?.companyId) {
      throw new Error('SECURITY_VIOLATION: companyId is immutable and cannot be updated.');
    }

    const id = getTenantId(this.getOptions());
    if (id) {
      this.where({ companyId: id });
    }
  });

  // 5. Tự động chèn filter vào các Query hooks
  QUERY_OPS.forEach((op) => {
    if (['findOneAndUpdate', 'updateOne', 'updateMany'].includes(op)) return; // Đã xử lý ở trên
    schema.pre(op, function () {
      const id = getTenantId(this.getOptions());
      if (id) {
        this.where({ companyId: id });
      }
    });
  });

  // 6. Tự động chèn vào Aggregate Pipeline gốc
  schema.pre('aggregate', function () {
    const id = getTenantId(this.options);
    if (id) {
      // Bắt buộc chuyển đổi sang ObjectId để khớp chuẩn xác
      this.pipeline().unshift({ $match: { companyId: new mongoose.Types.ObjectId(id) } });
    }
  });
}
```

### Các Quy tắc Bất biến về Thao tác Dữ liệu:
1. **KHÔNG áp dụng plugin lên collection `companies`:** Vì đây là bảng quản lý danh mục toàn bộ doanh nghiệp.
2. **CẤM DÙNG DRIVER THÔ:** Cấm gọi `Model.collection.*`, `bulkWrite`, `insertMany`, `estimatedDocumentCount` trực tiếp trong mã nguồn ứng dụng (vì chúng bỏ qua toàn bộ middleware hook của Mongoose).
3. **Quy tắc `$lookup`, `$unionWith`, `$graphLookup`:** Bắt buộc tự chèn điều kiện `{ companyId: new mongoose.Types.ObjectId(companyId) }` bên trong pipeline con. **Bắt buộc ép kiểu `new mongoose.Types.ObjectId(...)`**, tuyệt đối không để dạng String vì `$eq` trong pipeline sẽ rỗng âm thầm.

---

## 2. XỬ LÝ CÁC LUỒNG KHÔNG CÓ JWT (AUTHENTICATION & BACKGROUND WORKERS)

Vì cơ chế là Fail-Closed, các luồng không có JWT từ client phải được khởi tạo ngữ cảnh `tenantStore.run` đúng chuẩn:

### 2.1 Luồng Đăng nhập (Login)
- `email` được thiết kế duy nhất toàn cục (`unique: true` trên `users`), hoặc kết hợp mã công ty `companyCode`.
- Controller đăng nhập tra cứu tài khoản bằng cờ `skipTenant: true` (được ghi nhận trong AuditLog):
  ```javascript
  const user = await User.findOne({ email }).setOptions({ skipTenant: true }).select('+passwordHash +refreshTokens');
  ```
- Sau khi xác thực mật khẩu hợp lệ, toàn bộ quá trình cập nhật token tiếp theo được bọc ngay trong:
  ```javascript
  await tenantStore.run({ companyId: user.companyId }, async () => {
    // Cập nhật refresh token nguyên tử cho user
  });
  ```

### 2.2 Middleware Express gắn Tenant Context
Sau khi JWT Authentication Middleware xác thực token thành công:
```javascript
// backend/src/middleware/tenantContext.js
export function attachTenantContext(req, res, next) {
  if (req.user?.companyId) {
    tenantStore.run({ companyId: req.user.companyId }, () => next());
  } else {
    next();
  }
}
```

### 2.3 Điểm danh Kiosk (`POST /api/attendance/kiosk-checkin`)
- Kiosk gửi Kiosk Token qua Header `x-kiosk-token`.
- Backend tra cứu thiết bị trong collection `companies` (bảng này không gắn plugin):
  ```javascript
  const company = await Company.findOne({ 'kioskDevices.tokenHash': hashedToken });
  if (!company) throw new UnauthorizedError('Thiết bị Kiosk không hợp lệ.');
  
  // Chạy toàn bộ luồng điểm danh trong tenantStore của công ty đó:
  await tenantStore.run({ companyId: company._id }, async () => {
    // Tìm nhân viên, kiểm tra liveness và ghi attendanceLogs
  });
  ```

### 2.4 Cron Jobs Định kỳ
- Tuyệt đối không dùng `skipTenant` cho cron job xử lý dữ liệu để tránh bug trộn chéo dữ liệu giữa các công ty.
- Lặp qua từng công ty đang hoạt động và chạy từng vòng lặp trong `tenantStore.run`:
  ```javascript
  const activeCompanies = await Company.find({ status: 'ACTIVE' });
  for (const comp of activeCompanies) {
    await tenantStore.run({ companyId: comp._id }, async () => {
      // Tính công tự động, quét cảnh báo nhân sự cho riêng công ty comp._id
    });
  }
  ```

### 2.5 Cô lập Real-time qua Socket.io
- Khi kết nối (Handshake), xác thực JWT và giải mã `companyId`, `userId`.
- Đưa socket vào Room có tiền tố tenant:
  ```javascript
  socket.join(`tenant:${companyId}`);
  socket.join(`tenant:${companyId}:user:${userId}`);
  ```
- Bọc mọi Socket Event Handler bằng `tenantStore.run({ companyId }, ...)`.

---

## 3. MASS ASSIGNMENT & PHÒNG CHỐNG NOSQL INJECTION

1. **Bật Sanitize Filter Mongoose:**
   Tại `backend/src/config/database.js`:
   ```javascript
   mongoose.set('sanitizeFilter', true); // Chặn đứng NoSQL Injection dạng { "$gt": "" }
   ```
2. **Kiểm soát Dữ liệu Đầu vào bằng Zod `strict()`:**
   Không bao giờ truyền `req.body` trực tiếp vào Mongoose. Mọi endpoint phải lọc qua Zod schema:
   ```javascript
   const UpdateProfileSchema = z.object({
     fullName: z.string().min(2).max(100),
     phone: z.string().regex(/^[0-9+]{9,15}$/).optional(),
     address: z.string().max(200).optional()
   }).strict(); // Từ chối nếu body chứa các trường lạ như role, salaryConfig, companyId
   ```
3. **Endpoint Riêng cho Thao tác Đặc quyền:**
   - Việc phân quyền (`role`), ký hợp đồng (`contracts[]`), cấu hình lương (`salaryConfig`) chỉ được thực hiện qua các endpoint quản trị chuyên biệt dành riêng cho `HR_MANAGER` và `CEO`, có kiểm tra quyền từ DB và ghi `auditLogs`.

---

## 4. MA TRẬN PHÂN QUYỀN RBAC & HÀM `canAccess()` TẬP TRUNG

Thay vì rải rác các lệnh `if` kiểm tra quyền ở từng controller, hệ thống sử dụng hàm kiểm soát truy cập tập trung `canAccess(user, resource, action)`:

```javascript
// backend/src/security/rbac.js
export function canAccess(user, resource, action) {
  // 1. Khác tenant -> Từ chối tuyệt đối
  if (String(user.companyId) !== String(resource.companyId)) return false;

  // 2. CEO & HR_MANAGER: Toàn quyền trong công ty (trừ một số thao tác chéo giữa các admin)
  if (['CEO', 'HR_MANAGER'].includes(user.role)) return true;

  // 3. MANAGER (Quản lý trực tiếp):
  if (user.role === 'MANAGER') {
    // Được duyệt đơn từ, xem công của nhân viên thuộc phòng ban mình phụ trách
    if (['leaveRequest', 'attendanceLog'].includes(resource.type)) {
      return String(user.departmentId) === String(resource.departmentId);
    }
    // TUYỆT ĐỐI KHÔNG ĐƯỢC XEM LƯƠNG CỦA NGƯỜI KHÁC
    if (resource.type === 'payroll') {
      return String(user._id) === String(resource.userId);
    }
  }

  // 4. EMPLOYEE (Nhân viên thông thường): Chỉ được truy cập tài nguyên của chính mình
  if (user.role === 'EMPLOYEE') {
    return String(user._id) === String(resource.userId);
  }

  return false;
}
```

> [!NOTE]
> Bất cứ khi nào `HR_MANAGER` hoặc `CEO` truy cập xem phiếu lương của người khác, backend bắt buộc ghi nhận vào collection `auditLogs`:
> `action: 'VIEW_OTHERS_PAYSLIP'`, `targetUserId`, `viewerId`, `timestamp`.

---

## 5. XỬ LÝ PHIÊN REFRESH TOKEN AN TOÀN (GRACE WINDOW & DỌN DẸP QUÁ HẠN)

Để tránh tình trạng người dùng mở 2 tab cùng lúc gửi trùng refresh token dẫn đến việc bị đăng xuất oan (False Revocation), hệ thống áp dụng cơ chế **Grace Window**:

```javascript
// backend/src/services/authService.js
const REFRESH_GRACE_WINDOW_MS = 20 * 1000; // 20 giây

export async function rotateRefreshToken(userId, companyId, incomingTokenHash, newSession) {
  const user = await User.findOne({ _id: userId, companyId }).select('+refreshTokens');
  if (!user) throw new UnauthorizedError();

  const now = new Date();
  
  // 1. Tìm phiên khớp với token gửi lên
  const existingSession = user.refreshTokens.find(s => s.tokenHash === incomingTokenHash);

  // 2. Xử lý Token Reuse
  if (!existingSession) {
    // Kiểm tra xem token này có vừa được xoay vòng trong Grace Window (20s) hay không
    const recentlyRotated = user.refreshTokens.find(s => 
      s.replacedByTokenHash === incomingTokenHash && 
      (now - new Date(s.rotatedAt)) < REFRESH_GRACE_WINDOW_MS
    );

    if (recentlyRotated) {
      // Chấp nhận yêu cầu hợp lệ do request song song từ tab khác, trả về token hiện hành
      return { success: true, isGraceWindow: true };
    }

    // NGUY CƠ TẤN CÔNG THỰC SỰ: Thu hồi toàn bộ phiên ngay lập tức
    await User.findOneAndUpdate(
      { _id: userId, companyId },
      { $set: { refreshTokens: [] } }
    );
    throw new UnauthorizedError('Cảnh báo bảo mật: Phát hiện sử dụng lại token trái phép. Toàn bộ phiên đã bị thu hồi.');
  }

  // 3. Xoay vòng token nguyên tử + Dọn dẹp token hết hạn
  await User.findOneAndUpdate(
    { _id: userId, companyId },
    {
      // Xóa các token đã hết hạn
      $pull: { refreshTokens: { expiresAt: { $lt: now } } }
    }
  );

  await User.findOneAndUpdate(
    { _id: userId, companyId, 'refreshTokens.tokenHash': incomingTokenHash },
    {
      $set: {
        'refreshTokens.$.rotatedAt': now,
        'refreshTokens.$.replacedByTokenHash': newSession.tokenHash
      },
      $push: {
        refreshTokens: {
          $each: [newSession],
          $slice: -5 // Giữ tối đa 5 phiên hoạt động
        }
      }
    }
  );
}
```

---

## 6. PHÊ DUYỆT PHÉP IDEMPOTENT & MONGO TRANSACTION 2 CHIỀU

Đảm bảo nếu HR click duyệt 2 lần hoặc request bị retry qua mạng, số dư ngày phép không bao giờ bị trừ 2 lần. Áp dụng Transaction nguyên tử:

### 6.1 Luồng Duyệt Phép (Duyệt & Trừ Phép Nguyên Tử)
```javascript
export async function approveLeaveRequest(requestId, hrUserId, companyId) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      // Bước 1: Chuyển trạng thái đơn với điều kiện status PHẢI LÀ 'MANAGER_APPROVED' (đã qua Manager cấp 1)
      const lr = await LeaveRequest.findOneAndUpdate(
        { _id: requestId, companyId, status: 'MANAGER_APPROVED' },
        { 
          $set: { 
            status: 'HR_APPROVED', 
            'hrApproval.approverId': hrUserId,
            'hrApproval.decision': 'HR_APPROVED',
            'hrApproval.decidedAt': new Date()
          } 
        },
        { session, new: true }
      );

      // Idempotency check: Nếu đơn đã duyệt trước đó -> Báo lỗi 409 Conflict
      if (!lr) {
        throw new ConflictError('Đơn xin nghỉ phép đã được phê duyệt trước đó hoặc không hợp lệ.');
      }

      // Bước 2: Trừ số dư phép của nhân viên (chỉ trừ nếu còn đủ phép)
      const u = await User.findOneAndUpdate(
        { 
          _id: lr.userId, 
          companyId, 
          'leaveBalance.annualRemaining': { $gte: lr.daysRequested } 
        },
        { 
          $inc: { 
            'leaveBalance.annualUsed': lr.daysRequested, 
            'leaveBalance.annualRemaining': -lr.daysRequested 
          } 
        },
        { session, new: true }
      );

      // Nếu không đủ phép -> Transaction tự rollback (abort)
      if (!u) {
        throw new UnprocessableEntityError('Số dư ngày phép năm của nhân viên không đủ.');
      }

      result = lr;
    });
    return result;
  } finally {
    await session.endSession();
  }
}
```

### 6.2 Luồng Hoàn Phép khi Hủy Đơn đã Duyệt
Khi một đơn nghỉ phép đã `APPROVED` bị hủy bỏ:
```javascript
export async function cancelApprovedLeave(requestId, hrUserId, companyId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const lr = await LeaveRequest.findOneAndUpdate(
        { _id: requestId, companyId, status: 'HR_APPROVED' },
        { $set: { status: 'CANCELLED', 'hrApproval.comment': 'Đã hủy đơn và hoàn trả số dư ngày phép', updatedAt: new Date() } },
        { session, new: true }
      );
      if (!lr) throw new ConflictError('Không tìm thấy đơn đã duyệt để hủy.');

      // Hoàn lại ngày phép
      await User.findOneAndUpdate(
        { _id: lr.userId, companyId },
        { 
          $inc: { 
            'leaveBalance.annualUsed': -lr.daysRequested, 
            'leaveBalance.annualRemaining': lr.daysRequested 
          } 
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}
```

---

## 7. KHÓA KỲ LƯƠNG NGUYÊN TỬ (PERIOD LOCKING) TOÀN HỆ THỐNG

1. **Ràng buộc Duy nhất:**
   Trong `backend/src/models/Payroll.js`, bắt buộc có unique index:
   ```javascript
   PayrollSchema.index({ companyId: 1, userId: 1, period: 1 }, { unique: true });
   ```
   *Mục đích:* Ngăn chặn tuyệt đối việc 2 tiến trình tính lương song song tạo trùng bảng lương cho cùng một nhân viên trong cùng kỳ.
2. **Bảo vệ Bất biến sau khi Khóa (`pre('findOneAndUpdate')`):**
   ```javascript
   PayrollSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function () {
     const query = this.getQuery();
     // Nếu phiếu lương đã bị khóa -> Chặn đứng mọi hành vi sửa đổi
     this.where({ periodLockedAt: null });
   });
   ```
3. **Khóa Toàn bộ Kỳ Lương:**
   HR Manager khóa kỳ lương tháng `period` trong 1 thao tác:
   ```javascript
   await Payroll.updateMany(
     { companyId, period, periodLockedAt: null },
     { $set: { periodLockedAt: new Date(), lockedBy: req.user._id } }
   );
   ```
4. **Chặn Sửa Dữ liệu Nguồn của Kỳ Đã Khóa:**
   Mọi thao tác chỉnh sửa chấm công (`attendanceLogs`), tạo đơn nghỉ phép bù (`leaveRequests`) có ngày rơi vào kỳ lương đã khóa (`periodLockedAt != null`) đều bị từ chối, bắt buộc phải tạo bản ghi điều chỉnh bổ sung cho kỳ tiếp theo.

---

## 8. DANH MỤC CÁC KIỂM THỬ BẢO MẬT BẮT BUỘC (INTEGRATION TESTS)

Trong thư mục `backend/tests/security/`, bắt buộc phải pass 100% bộ 8 kiểm thử sau trước khi bàn giao:
1. `tenant_fail_closed.test.js`: Gọi model mà không có `tenantStore.run` $\rightarrow$ ném lỗi bảo mật.
2. `tenant_write_isolation.test.js`: Tạo tài liệu với `companyId` của tenant khác $\rightarrow$ bị ghi đè thành tenant của mình hoặc bị ném lỗi `SECURITY_VIOLATION`.
3. `tenant_immutable_update.test.js`: Cố tình chạy `findOneAndUpdate` cập nhật `companyId` $\rightarrow$ bị chặn đứng.
4. `tenant_aggregation_lookup.test.js`: Chạy pipeline có `$lookup` $\rightarrow$ không rò rỉ dữ liệu chéo công ty.
5. `mass_assignment_role.test.js`: Request thông thường gửi `{ role: 'CEO' }` hoặc `{ salaryConfig: ... }` $\rightarrow$ bị Zod chặn hoặc Mongoose loại bỏ.
6. `leave_idempotency_race.test.js`: Giả lập 2 request duyệt phép gửi đồng thời cho cùng 1 đơn $\rightarrow$ đúng 1 request thành công, 1 request trả về 409 Conflict, phép chỉ bị trừ 1 lần.
7. `payroll_concurrent_lock.test.js`: Giả lập 2 request khóa kỳ lương song song $\rightarrow$ chỉ 1 request thực thi, không sinh lỗi ghi đè.
8. `rbac_matrix_can_access.test.js`: Kiểm thử ma trận quyền của hàm `canAccess` cho cả 4 roles trên mọi tài nguyên.
