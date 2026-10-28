import { apiClient } from './client';

export interface GpsLocation {
  locationId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface CompanyProfile {
  _id: string;
  name: string;
  code: string;
  settings?: {
    locations?: GpsLocation[];
  };
}

export const companyApi = {
  getProfile: async () => {
    const res = await apiClient.get<{ success: boolean; data: CompanyProfile }>('/companies/profile');
    return res.data;
  },

  updateProfile: async (data: { name?: string; code?: string }) => {
    const res = await apiClient.patch<{ success: boolean; data: CompanyProfile; message: string }>(
      '/companies/profile',
      data
    );
    return res.data;
  },

  addLocation: async (location: {
    locationId?: string;
    name: string;
    latitude: number;
    longitude: number;
    radiusMeters?: number;
  }) => {
    const res = await apiClient.post<{ success: boolean; data: GpsLocation; message: string }>(
      '/companies/locations',
      location
    );
    return res.data;
  },

  getLocations: async () => {
    const res = await apiClient.get<{ success: boolean; data: GpsLocation[] }>('/companies/locations');
    return res.data;
  },
};
