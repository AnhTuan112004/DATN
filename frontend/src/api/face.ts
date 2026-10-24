import { apiClient } from './client';
import { FaceStatusResponse, EnrollFacePayload, EnrollFaceResponse } from '../types/face';

export const faceApi = {
  /**
   * Lấy trạng thái đăng ký FaceID & thông tin đồng ý Luật BVDLCN của nhân viên
   */
  getFaceStatus: async (userId: string): Promise<{ success: boolean; data: FaceStatusResponse }> => {
    const res = await apiClient.get<{ success: boolean; data: FaceStatusResponse }>(`/users/${userId}/face-status`);
    return res.data;
  },

  /**
   * Thực hiện lấy mẫu trực tiếp có HR giám sát tại văn phòng
   * Yêu cầu quyền CEO hoặc HR_MANAGER
   */
  enrollFace: async (userId: string, payload: EnrollFacePayload): Promise<EnrollFaceResponse> => {
    const res = await apiClient.post<EnrollFaceResponse>(`/users/${userId}/face-enrollment`, payload);
    return res.data;
  },

  /**
   * Rút lại sự đồng ý & Xóa vĩnh viễn dữ liệu khuôn mặt theo Khoản 2 Điều 14 Luật BVDLCN 91/2025/QH15
   */
  revokeConsent: async (userId: string): Promise<{ success: boolean; deleted: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; deleted: boolean; message: string }>(
      `/users/${userId}/face-template`
    );
    return res.data;
  },
};
