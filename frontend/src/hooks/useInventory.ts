import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

const INVENTORY_KEY = 'inventory';

interface InventoryItem {
  itemId: string;
  familyId: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
  category: string;
  expiryDate?: string;
  imageUrl?: string;
  barcode?: string;
  lowStockThreshold: number;
  notes?: string;
  stockStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface InventorySummary {
  totalItems: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiredCount: number;
  expiringSoonCount: number;
}

export const useInventoryItems = (
  params?: { location?: string; status?: string },
  options = {},
) => {
  return useQuery({
    queryKey: [INVENTORY_KEY, params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.location) queryParams.set('location', params.location);
      if (params?.status) queryParams.set('status', params.status);
      const qs = queryParams.toString();
      return apiClient.get<{ items: InventoryItem[]; hasMore: boolean }>(
        `/inventory${qs ? `?${qs}` : ''}`,
      );
    },
    ...options,
  });
};

export const useInventorySummary = (options = {}) => {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'summary'],
    queryFn: () => apiClient.get<InventorySummary>('/inventory/summary'),
    ...options,
  });
};

export const useLowStockItems = (options = {}) => {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'low-stock'],
    queryFn: () =>
      apiClient.get<{ items: InventoryItem[] }>('/inventory/low-stock'),
    ...options,
  });
};

export const useExpiredItems = (options = {}) => {
  return useQuery({
    queryKey: [INVENTORY_KEY, 'expired'],
    queryFn: () =>
      apiClient.get<{ items: InventoryItem[] }>('/inventory/expired'),
    ...options,
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) =>
      apiClient.post<InventoryItem>('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: Partial<InventoryItem>;
    }) => apiClient.patch<InventoryItem>(`/inventory/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, location }: { itemId: string; location: string }) =>
      apiClient.delete(`/inventory/${itemId}?location=${location}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVENTORY_KEY] });
    },
  });
};
