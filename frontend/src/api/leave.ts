import { apiClient } from './client';
import {
  LeaveRequest,
  LeaveRequestFilterParams,
  LeaveRequestListResponse,
  CreateLeaveRequestPayload,
  ApproveLeavePayload,
  CancelLeavePayload,
} from '../types/leave';

export const leaveApi = {
  /**
   * Lấy danh sách đơn từ (phân trang, lọc theo status, type, scope)
   */
  getLeaveRequests: async (
    params?: LeaveRequestFilterParams
  ): Promise<LeaveRequestListResponse> => {
    const res = await apiClient.get<LeaveRequestListResponse>('/leave-requests', {
      params,
    });
    return res.data;
  },

  /**
   * Lấy chi tiết đơn từ theo ID
   */
  getLeaveRequestById: async (
    id: string
  ): Promise<{ success: boolean; data: LeaveRequest }> => {
    const res = await apiClient.get<{ success: boolean; data: LeaveRequest }>(
      `/leave-requests/${id}`
    );
    return res.data;
  },

  /**
   * Nộp đơn từ mới (ANNUAL, SICK, OT, WFH, FORGOT_CHECKIN)
   */
  createLeaveRequest: async (
    payload: CreateLeaveRequestPayload
  ): Promise<{ success: boolean; message: string; data: LeaveRequest }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: LeaveRequest }>(
      '/leave-requests',
      payload
    );
    return res.data;
  },

  /**
   * Phê duyệt Cấp 1 (Quản lý trực tiếp)
   */
  approveStage1: async (
    id: string,
    payload: ApproveLeavePayload
  ): Promise<{ success: boolean; message: string; data: LeaveRequest }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: LeaveRequest }>(
      `/leave-requests/${id}/approve-manager`,
      payload
    );
    return res.data;
  },

  /**
   * Phê duyệt Cấp 2 (HR Manager / CEO cấp cuối)
   */
  approveStage2: async (
    id: string,
    payload: ApproveLeavePayload
  ): Promise<{ success: boolean; message: string; data: LeaveRequest }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: LeaveRequest }>(
      `/leave-requests/${id}/approve-hr`,
      payload
    );
    return res.data;
  },

  /**
   * Hủy đơn từ (Người nộp hoặc HR)
   */
  cancelLeaveRequest: async (
    id: string,
    payload: CancelLeavePayload
  ): Promise<{ success: boolean; message: string; data: LeaveRequest }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: LeaveRequest }>(
      `/leave-requests/${id}/cancel`,
      payload
    );
    return res.data;
  },
};
