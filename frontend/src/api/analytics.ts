import { apiClient } from './client';

export interface PrimaryRiskFactor {
  feature: string;
  label: string;
  impactScore: number;
  contribution: number;
}

export interface PredictionResult {
  probability: number;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskColor: string;
  riskLabel: string;
  primaryRiskFactors: PrimaryRiskFactor[];
  recommendedAction: string;
}

export interface EmployeeFeatures {
  overTime: number;
  otHoursMonth: number;
  yearsAtCompany: number;
  totalWorkingYears: number;
  monthlyIncome: number;
  numCompaniesWorked: number;
  distanceFromHome: number;
}

export interface AnalyzedEmployee {
  userId: string;
  employeeCode: string;
  fullName: string;
  email: string;
  role: string;
  department: {
    id?: string;
    name: string;
  };
  features: EmployeeFeatures;
  prediction: PredictionResult;
}

export interface DepartmentBreakdown {
  departmentName: string;
  totalEmployees: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRiskScore: number;
}

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  weight: number;
  impact: 'TĂNG_RỦI_RO' | 'GIẢM_RỦI_RO';
  absWeight: number;
}

export interface AttritionSummary {
  totalEmployees: number;
  highRiskCount: number;
  highRiskPercentage: number;
  mediumRiskCount: number;
  mediumRiskPercentage: number;
  lowRiskCount: number;
  lowRiskPercentage: number;
  averageRiskScore: number;
}

export interface AttritionOverviewData {
  summary: AttritionSummary;
  topRiskEmployees: AnalyzedEmployee[];
  allEmployees: AnalyzedEmployee[];
  departmentBreakdown: DepartmentBreakdown[];
  featureImportance: FeatureImportanceItem[];
  disclaimer: string;
}

export interface EmployeeRiskDetailData {
  user: {
    _id: string;
    employeeCode: string;
    fullName: string;
    email: string;
    role: string;
    department: {
      _id?: string;
      name: string;
      code?: string;
    };
  };
  features: EmployeeFeatures;
  prediction: PredictionResult;
  featureContributions: Array<{
    feature: string;
    label: string;
    value: number;
    normalizedValue: number;
    weight: number;
    contribution: number;
    impact: 'TĂNG_RỦI_RO' | 'GIẢM_RỦI_RO';
  }>;
  legalNote: string;
}

/**
 * Lấy dữ liệu tổng quan dự báo nguy cơ thôi việc toàn doanh nghiệp
 */
export const getAttritionOverview = async (departmentId?: string): Promise<AttritionOverviewData> => {
  const params: Record<string, string> = {};
  if (departmentId && departmentId !== 'ALL') {
    params.departmentId = departmentId;
  }
  const response = await apiClient.get<{ success: boolean; data: AttritionOverviewData }>(
    '/analytics/attrition-risk',
    { params }
  );
  return response.data.data;
};

/**
 * Lấy chi tiết phân tích nguy cơ thôi việc của 1 nhân sự cụ thể
 */
export const getEmployeeAttritionDetail = async (userId: string): Promise<EmployeeRiskDetailData> => {
  const response = await apiClient.get<{ success: boolean; data: EmployeeRiskDetailData }>(
    `/analytics/attrition-risk/${userId}`
  );
  return response.data.data;
};
