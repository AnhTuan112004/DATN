import { apiClient } from './client';
import { DepartmentItem } from '../types/user';

export interface CreateDepartmentInput {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: string | null;
  managerId?: string | null;
}

export interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  description?: string;
  parentDepartmentId?: string | null;
  managerId?: string | null;
}

export const departmentsApi = {
  getDepartmentTree: async (): Promise<{ success: boolean; data: DepartmentItem[] }> => {
    const res = await apiClient.get<{ success: boolean; data: DepartmentItem[] }>('/departments');
    return res.data;
  },

  getAllDepartments: async (): Promise<{ success: boolean; data: DepartmentItem[] }> => {
    const res = await apiClient.get<{ success: boolean; data: DepartmentItem[] }>('/departments/list');
    return res.data;
  },

  getDepartmentById: async (id: string): Promise<{ success: boolean; data: DepartmentItem }> => {
    const res = await apiClient.get<{ success: boolean; data: DepartmentItem }>(`/departments/${id}`);
    return res.data;
  },

  createDepartment: async (
    data: CreateDepartmentInput
  ): Promise<{ success: boolean; message: string; data: DepartmentItem }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: DepartmentItem }>('/departments', data);
    return res.data;
  },

  updateDepartment: async (
    id: string,
    data: UpdateDepartmentInput
  ): Promise<{ success: boolean; message: string; data: DepartmentItem }> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: DepartmentItem }>(
      `/departments/${id}`,
      data
    );
    return res.data;
  },

  deleteDepartment: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/departments/${id}`);
    return res.data;
  },
};
