export type LeaveRequestType = 'ANNUAL' | 'SICK' | 'OT' | 'WFH' | 'FORGOT_CHECKIN';

export type ApprovalStatus =
  | 'PENDING'
  | 'MANAGER_APPROVED'
  | 'HR_APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ApprovalStep {
  approverId?: {
    _id: string;
    fullName: string;
    employeeCode: string;
  } | null;
  decision: ApprovalStatus;
  comment?: string;
  decidedAt?: string | null;
}

export interface ForgotCheckinDetails {
  targetDate?: string;
  checkType?: 'CHECK_IN' | 'CHECK_OUT' | 'BOTH' | null;
  requestedTime?: string;
}

export interface LeaveRequestUser {
  _id: string;
  fullName: string;
  employeeCode: string;
  email: string;
  avatarUrl?: string | null;
  departmentId?: string | { _id: string; name: string };
  role?: string;
  leaveBalance?: {
    annualTotal: number;
    annualRemaining: number;
    annualUsed: number;
    sickRemaining: number;
    sickUsed: number;
  };
}

export interface LeaveRequest {
  _id: string;
  companyId: string;
  userId: LeaveRequestUser;
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
  durationDays: number;
  otHoursRequested?: number;
  forgotDetails?: ForgotCheckinDetails;
  reason: string;
  status: ApprovalStatus;
  managerApproval?: ApprovalStep;
  hrApproval?: ApprovalStep;
  attachmentUrl?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequestPayload {
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
  durationDays?: number;
  otHoursRequested?: number;
  forgotDetails?: ForgotCheckinDetails;
  reason: string;
  attachmentUrl?: string | null;
}

export interface ApproveLeavePayload {
  decision: 'APPROVE' | 'REJECT';
  comment?: string;
}

export interface CancelLeavePayload {
  cancellationReason: string;
}

export interface LeaveRequestFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  scope?: 'all' | 'my' | 'team';
  startDate?: string;
  endDate?: string;
}

export interface LeaveRequestListResponse {
  success: boolean;
  items: LeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
