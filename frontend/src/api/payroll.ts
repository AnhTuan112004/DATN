import { apiClient } from './client';
import { PayrollRecord } from '../types/payroll';

export interface CalculatePayrollPayload {
  period: string; // YYYY-MM
  employeeIds?: string[];
}

export interface LockPayrollPayload {
  period: string; // YYYY-MM
}

export interface PayrollApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    count?: number;
    period?: string;
    isLocked?: boolean;
    periodLockedAt?: string | null;
  };
}

export const payrollApi = {
  /**
   * Chạy tính lương toàn doanh nghiệp hoặc danh sách nhân viên
   */
  calculatePayroll: async (
    payload: CalculatePayrollPayload
  ): Promise<PayrollApiResponse<PayrollRecord[]>> => {
    const res = await apiClient.post<PayrollApiResponse<PayrollRecord[]>>(
      '/payrolls/calculate',
      payload
    );
    return res.data;
  },

  /**
   * Khóa kỳ lương nguyên tử
   */
  lockPayroll: async (
    payload: LockPayrollPayload
  ): Promise<PayrollApiResponse<{ lockedCount: number; periodLockedAt: string }>> => {
    const res = await apiClient.post<
      PayrollApiResponse<{ lockedCount: number; periodLockedAt: string }>
    >('/payrolls/lock', payload);
    return res.data;
  },

  /**
   * Lấy danh sách bảng lương cả công ty theo kỳ (CEO / HR Manager)
   */
  getPeriodPayrolls: async (
    period: string
  ): Promise<PayrollApiResponse<PayrollRecord[]>> => {
    const res = await apiClient.get<PayrollApiResponse<PayrollRecord[]>>(
      `/payrolls/period/${period}`
    );
    return res.data;
  },

  /**
   * Xem phiếu lương của chính mình (Tất cả vai trò)
   */
  getMyPayslip: async (
    period: string
  ): Promise<PayrollApiResponse<PayrollRecord>> => {
    const res = await apiClient.get<PayrollApiResponse<PayrollRecord>>(
      `/payrolls/me/${period}`
    );
    return res.data;
  },

  /**
   * Xem phiếu lương của nhân viên cụ thể (Chỉ CEO / HR Manager - ghi AuditLog)
   */
  getUserPayslip: async (
    userId: string,
    period: string
  ): Promise<PayrollApiResponse<PayrollRecord>> => {
    const res = await apiClient.get<PayrollApiResponse<PayrollRecord>>(
      `/payrolls/user/${userId}/${period}`
    );
    return res.data;
  },
};
