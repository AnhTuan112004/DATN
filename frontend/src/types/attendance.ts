export interface GpsCheckInPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  deviceId?: string;
  note?: string;
}

export interface MatchedLocationInfo {
  name: string;
  distanceMeters: number;
  radiusMeters: number;
}

export interface GpsCheckInData {
  actionType: 'CHECK_IN' | 'CHECK_OUT';
  date: string;
  checkTime: string;
  formattedTime: string;
  matchedLocation: MatchedLocationInfo;
  isLate: boolean;
  workDurationMinutes: number;
  method: 'GPS' | 'FACE' | 'QR' | 'MANUAL_ADJUSTMENT';
  attendanceLogId: string;
}

export interface GpsCheckInResponse {
  success: boolean;
  actionType: 'CHECK_IN' | 'CHECK_OUT';
  message: string;
  data: GpsCheckInData;
}

export interface TodayAttendanceData {
  hasCheckIn: boolean;
  hasCheckOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  workDurationMinutes: number;
  method: 'GPS' | 'FACE' | 'QR' | 'MANUAL_ADJUSTMENT' | null;
  isLate: boolean;
  status: 'VALID' | 'SUSPICIOUS' | 'ABSENT' | null;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceMeters: number;
  } | null;
}

export interface AttendanceHistoryItem {
  _id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  method: 'GPS' | 'FACE' | 'QR' | 'MANUAL_ADJUSTMENT';
  status: 'VALID' | 'SUSPICIOUS' | 'ABSENT';
  deviceId?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    distanceMeters: number;
  };
  workDurationMinutes: number;
  isLate: boolean;
  isEarlyLeave: boolean;
  createdAt: string;
}

export interface DynamicQrPassData {
  qrCode: string;
  payload: {
    companyId: string;
    userId: string;
    timestamp: number;
    nonce: string;
    signature: string;
  };
  cycleSeconds: number;
  expiresInSeconds: number;
  expiresAt: number;
  user: {
    id: string;
    fullName: string;
    employeeCode: string;
    avatarUrl?: string;
  };
}

export interface DynamicQrPassResponse {
  success: boolean;
  data: DynamicQrPassData;
}

export interface QrScanPayload {
  qrData: string;
  deviceId?: string;
  note?: string;
}

export interface QrScanResultData {
  actionType: 'CHECK_IN' | 'CHECK_OUT';
  user: {
    id: string;
    fullName: string;
    employeeCode: string;
    avatarUrl?: string;
    departmentName?: string;
  };
  checkTime: string;
  date: string;
  isLate: boolean;
  workDurationMinutes: number;
  method: 'QR';
  status: 'VALID';
}

export interface QrScanResponse {
  success: boolean;
  message: string;
  data: QrScanResultData;
}
