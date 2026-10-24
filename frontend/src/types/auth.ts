export type Role = 'CEO' | 'HR_MANAGER' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  _id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  role: Role;
  companyId: string;
  departmentId?: {
    _id: string;
    name: string;
    code: string;
  } | string | null;
  managerId?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  hireDate?: string;
  isActive: boolean;
  totalWorkingYears?: number;
  numCompaniesWorked?: number;
  leaveBalance?: {
    annualTotal: number;
    annualRemaining: number;
    annualUsed: number;
    seniorityBonusDays?: number;
    sickRemaining: number;
    sickUsed: number;
  };
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken: string;
  };
}

export interface RefreshResponse {
  success: boolean;
  message?: string;
  data: {
    accessToken: string;
  };
}
