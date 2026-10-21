import { Role } from './auth';

export type ContractType = 'PROBATION' | 'DEFINITE' | 'INDEFINITE';
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED';

export interface Contract {
  _id?: string;
  contractNumber: string;
  contractType: ContractType;
  effectiveFrom: string;
  effectiveTo?: string | null;
  baseSalary: number;
  allowance: number;
  status: ContractStatus;
  signedDate?: string;
}

export interface LeaveBalance {
  annualTotal: number;
  annualUsed: number;
  annualRemaining: number;
  seniorityBonusDays: number;
  sickUsed: number;
  sickRemaining: number;
}

export interface SalaryConfig {
  baseSalary: number;
  positionAllowance: number;
  mealAllowance: number;
  dependentsCount: number;
  isResident: boolean;
  contractDurationMonths: number;
}

export interface DepartmentRef {
  _id: string;
  name: string;
  code: string;
}

export interface ManagerRef {
  _id: string;
  fullName: string;
  employeeCode: string;
}

export interface UserItem {
  _id: string;
  companyId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  phone?: string | null;
  hireDate: string;
  isActive: boolean;
  departmentId?: DepartmentRef | null;
  managerId?: ManagerRef | null;
  contracts?: Contract[];
  leaveBalance?: LeaveBalance;
  totalWorkingYears?: number;
  numCompaniesWorked?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersResponse {
  success: boolean;
  users: UserItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateUserInput {
  employeeCode?: string;
  fullName: string;
  email: string;
  password?: string;
  role?: Role;
  phone?: string;
  departmentId?: string;
  managerId?: string;
  hireDate?: string;
  initialSalary?: {
    baseSalary: number;
    positionAllowance?: number;
    mealAllowance?: number;
    dependentsCount?: number;
    isResident?: boolean;
    contractDurationMonths?: number;
  };
  initialContract?: {
    contractNumber: string;
    contractType: ContractType;
    effectiveFrom: string;
    effectiveTo?: string | null;
    baseSalary: number;
    allowance?: number;
  };
}

export interface UpdateUserInput {
  fullName?: string;
  phone?: string | null;
  departmentId?: string | null;
  managerId?: string | null;
  isActive?: boolean;
  hireDate?: string;
}

export interface DepartmentItem {
  _id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: string | null;
  managerId?: ManagerRef | null;
  employeeCount?: number;
  children?: DepartmentItem[];
}
