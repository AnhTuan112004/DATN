import { apiClient } from './client';
import {
  UsersResponse,
  UserItem,
  CreateUserInput,
  UpdateUserInput,
  SalaryConfig,
  Contract,
} from '../types/user';
import { Role } from '../types/auth';

export interface GetUsersParams {
  page?: number;
  limit?: number;
  departmentId?: string;
  role?: string;
  isActive?: boolean | string;
  search?: string;
}

export const usersApi = {
  getUsers: async (params?: GetUsersParams): Promise<UsersResponse> => {
    const res = await apiClient.get<UsersResponse>('/users', { params });
    return res.data;
  },

  getUserById: async (id: string): Promise<{ success: boolean; data: UserItem }> => {
    const res = await apiClient.get<{ success: boolean; data: UserItem }>(`/users/${id}`);
    return res.data;
  },

  createUser: async (data: CreateUserInput): Promise<{ success: boolean; message: string; data: UserItem }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: UserItem }>('/users', data);
    return res.data;
  },

  updateUser: async (
    id: string,
    data: UpdateUserInput
  ): Promise<{ success: boolean; message: string; data: UserItem }> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: UserItem }>(`/users/${id}`, data);
    return res.data;
  },

  updateUserRole: async (
    id: string,
    role: Role
  ): Promise<{ success: boolean; message: string; data: UserItem }> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: UserItem }>(`/users/${id}/role`, {
      role,
    });
    return res.data;
  },

  getUserSalary: async (id: string): Promise<{ success: boolean; data: SalaryConfig }> => {
    const res = await apiClient.get<{ success: boolean; data: SalaryConfig }>(`/users/${id}/salary`);
    return res.data;
  },

  updateUserSalary: async (
    id: string,
    data: SalaryConfig
  ): Promise<{ success: boolean; message: string; data: SalaryConfig }> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: SalaryConfig }>(
      `/users/${id}/salary`,
      data
    );
    return res.data;
  },

  addContract: async (
    id: string,
    data: Omit<Contract, '_id' | 'status'>
  ): Promise<{ success: boolean; message: string; data: Contract }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: Contract }>(
      `/users/${id}/contracts`,
      data
    );
    return res.data;
  },

  uploadAvatar: async (
    id: string,
    file: File
  ): Promise<{ success: boolean; message: string; data: { avatarUrl: string; user: UserItem } }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await apiClient.post<{ success: boolean; message: string; data: { avatarUrl: string; user: UserItem } }>(
      `/users/${id}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/users/${id}`);
    return res.data;
  },
};
