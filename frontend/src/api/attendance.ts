import { apiClient } from './client';
import {
  GpsCheckInPayload,
  GpsCheckInResponse,
  TodayAttendanceData,
  AttendanceHistoryItem,
  DynamicQrPassResponse,
  QrScanPayload,
  QrScanResponse,
} from '../types/attendance';

export const attendanceApi = {
  /**
   * Điểm danh di động qua GPS Geofencing
   */
  checkInGps: async (payload: GpsCheckInPayload): Promise<GpsCheckInResponse> => {
    const res = await apiClient.post<GpsCheckInResponse>('/attendance/gps', payload);
    return res.data;
  },

  /**
   * Lấy mã QR động phục vụ điểm danh (chu kỳ 30s)
   */
  getDynamicQrPass: async (): Promise<DynamicQrPassResponse> => {
    const res = await apiClient.get<DynamicQrPassResponse>('/attendance/qr-pass');
    return res.data;
  },

  /**
   * Quét mã QR điểm danh (quầy lễ tân hoặc máy quét)
   */
  scanQrAttendance: async (payload: QrScanPayload): Promise<QrScanResponse> => {
    const res = await apiClient.post<QrScanResponse>('/attendance/qr-scan', payload);
    return res.data;
  },

  /**
   * Lấy trạng thái điểm danh hôm nay của cá nhân
   */
  getTodayAttendance: async (): Promise<{ success: boolean; data: TodayAttendanceData }> => {
    const res = await apiClient.get<{ success: boolean; data: TodayAttendanceData }>('/attendance/today');
    return res.data;
  },

  /**
   * Lấy lịch sử điểm danh của cá nhân
   */
  getMyAttendanceHistory: async (
    limit: number = 30
  ): Promise<{ success: boolean; data: AttendanceHistoryItem[] }> => {
    const res = await apiClient.get<{ success: boolean; data: AttendanceHistoryItem[] }>(
      '/attendance/my-history',
      {
        params: { limit },
      }
    );
    return res.data;
  },
};

