import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

const LISTS_KEY = 'shopping-lists';

// ==================== Types ====================

interface ShoppingListItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  category?: string;
  aisle?: string;
  imageUrl?: string;
  isChecked: boolean;
  price?: number;
  store?: string;
  barcode?: string;
  notes?: string;
  addedBy: string;
  addedAt: string;
}

interface ShoppingList {
  listId: string;
  familyId: string;
  name: string;
  items: ShoppingListItem[];
  sharedWith: string[];
  isFavourite: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedLists {
  items: ShoppingList[];
  hasMore: boolean;
  lastEvaluatedKey?: string;
}

// ==================== Queries ====================

export const useShoppingLists = (options = {}) => {
  return useQuery({
    queryKey: [LISTS_KEY],
    queryFn: async () => {
      return apiClient.get<PaginatedLists>('/lists');
    },
    ...options,
  });
};

export const useShoppingList = (listId: string, options = {}) => {
  return useQuery({
    queryKey: [LISTS_KEY, listId],
    queryFn: async () => {
      return apiClient.get<ShoppingList>(`/lists/${listId}`);
    },
    enabled: !!listId,
    ...options,
  });
};

// ==================== Mutations ====================

export const useCreateList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      items?: Partial<ShoppingListItem>[];
    }) => {
      return apiClient.post<ShoppingList>('/lists', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTS_KEY] });
    },
  });
};

export const useUpdateList = (listId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; isFavourite?: boolean }) => {
      return apiClient.patch<ShoppingList>(`/lists/${listId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [LISTS_KEY, listId] });
    },
  });
};

export const useDeleteList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      return apiClient.delete(`/lists/${listId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTS_KEY] });
    },
  });
};

export const useAddListItem = (listId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ShoppingListItem>) => {
      return apiClient.post<ShoppingListItem>(`/lists/${listId}/items`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTS_KEY, listId] });
    },
  });
};

export const useUpdateListItem = (listId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: Partial<ShoppingListItem>;
    }) => {
      return apiClient.patch<ShoppingListItem>(
        `/lists/${listId}/items/${itemId}`,
        data,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTS_KEY, listId] });
    },
  });
};

export const useDeleteListItem = (listId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      return apiClient.delete(`/lists/${listId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTS_KEY, listId] });
    },
  });
};

export const useShareList = (listId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userIds: string[] }) => {
      return apiClient.post<ShoppingList>(`/lists/${listId}/share`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LISTS_KEY, listId] });
    },
  });
};
