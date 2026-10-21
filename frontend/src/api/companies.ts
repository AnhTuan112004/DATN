import { apiClient } from './client';

export interface LocationItem {
  locationId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface CreateLocationInput {
  locationId?: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export interface UpdateLocationInput {
  name?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export const companiesApi = {
  getLocations: async (): Promise<{ success: boolean; data: LocationItem[] }> => {
    const res = await apiClient.get<{ success: boolean; data: LocationItem[] }>('/companies/locations');
    return res.data;
  },

  addLocation: async (
    data: CreateLocationInput
  ): Promise<{ success: boolean; message: string; data: LocationItem }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: LocationItem }>(
      '/companies/locations',
      data
    );
    return res.data;
  },

  updateLocation: async (
    locationId: string,
    data: UpdateLocationInput
  ): Promise<{ success: boolean; message: string; data: LocationItem }> => {
    const res = await apiClient.patch<{ success: boolean; message: string; data: LocationItem }>(
      `/companies/locations/${locationId}`,
      data
    );
    return res.data;
  },

  deleteLocation: async (locationId: string): Promise<{ success: boolean; message: string }> => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(
      `/companies/locations/${locationId}`
    );
    return res.data;
  },

  seedDefenseLocation: async (): Promise<{ success: boolean; message: string; data: LocationItem }> => {
    const res = await apiClient.post<{ success: boolean; message: string; data: LocationItem }>(
      '/companies/locations/seed-defense-room'
    );
    return res.data;
  },
};
