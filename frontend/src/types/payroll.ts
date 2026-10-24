export interface TaxBracketSnapshot {
  bracket: number;
  maxIncome: number | null;
  rate: number;
}

export interface TaxPolicySnapshot {
  personalDeduction: number;
  dependentDeduction: number;
  mealAllowanceExemptCap: number;
  brackets: TaxBracketSnapshot[];
}

export interface InsuranceRatesSnapshot {
  employee: {
    social: number;
    health: number;
    unemployment: number;
    total: number;
  };
  employer: {
    social: number;
    health: number;
    unemployment: number;
    total: number;
  };
}

export interface PolicySnapshot {
  taxPolicy: TaxPolicySnapshot;
  insuranceRates: InsuranceRatesSnapshot;
  socialInsuranceCap: number;
  unemploymentInsuranceCap: number;
}

export interface AttendanceBreakdown {
  standardWorkingDays: number;
  actualWorkingDays: number;
  paidLeaveDays: number;
  sickLeaveDays: number;
  unpaidLeaveDays: number;
  otHoursWeekday: number;
  otHoursWeekend: number;
  otHoursHoliday: number;
  otHoursNight: number;
  totalOtHours: number;
  monthlyOtCapHours: number;
  dailyOverCapHours: number;
  yearlyOverCapHours: number;
  hasDaytimeOtBeforeNight: boolean;
  nightWorkHours: number;
}

export interface IncomeBreakdown {
  baseSalary: number;
  effectiveWorkingDays: number;
  proratedBaseSalary: number;
  allowances: {
    meal: number;
    transport: number;
    phone: number;
    housing: number;
    other: number;
    total: number;
  };
  otPay: {
    exempt: number;
    taxable: number;
    total: number;
  };
  nightWorkPay: {
    exempt: number;
    taxable: number;
    total: number;
  };
  unusedLeaveComp: {
    days: number;
    amount: number;
    exempt: boolean;
  };
  bonus: number;
  grossIncome: number;
}

export interface InsuranceBreakdown {
  insurableSalary: number;
  isSickLeaveExempt: boolean;
  employee: {
    social: number;
    health: number;
    unemployment: number;
    total: number;
  };
  employer: {
    social: number;
    health: number;
    unemployment: number;
    total: number;
  };
}

export interface TaxBreakdown {
  taxableIncome: number;
  exemptions: {
    mealAllowance: number;
    otExempt: number;
    nightExempt: number;
    unusedLeaveExempt: number;
    total: number;
  };
  deductions: {
    personal: number;
    dependents: number;
    dependentCount: number;
    insurance: number;
    total: number;
  };
  assessableIncome: number;
  pitAmount: number;
}

export interface PayrollRecord {
  _id: string;
  companyId: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    employeeCode?: string;
    departmentId?: {
      _id: string;
      name: string;
    } | string;
    position?: string;
  } | string;
  period: string; // YYYY-MM
  periodLockedAt: string | null;
  policySnapshot: PolicySnapshot;
  attendanceBreakdown: AttendanceBreakdown;
  incomeBreakdown: IncomeBreakdown;
  insuranceBreakdown: InsuranceBreakdown;
  taxBreakdown: TaxBreakdown;
  netSalary: number;
  employerTotalCost: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSummary {
  period: string;
  isLocked: boolean;
  periodLockedAt: string | null;
  totalEmployees: number;
  totalGrossSalary: number;
  totalNetSalary: number;
  totalEmployeeInsurance: number;
  totalEmployerInsurance: number;
  totalPit: number;
  totalEmployerCost: number;
}
