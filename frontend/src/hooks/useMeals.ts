import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

const MEALS_KEY = 'meals';

interface MealPlanItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  inStock: boolean;
}

interface MealPlan {
  mealId: string;
  familyId: string;
  date: string;
  mealType: string;
  recipeId?: string;
  recipeName?: string;
  items: MealPlanItem[];
  notes?: string;
  servings: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export const useMeals = (startDate: string, endDate: string, options = {}) => {
  return useQuery({
    queryKey: [MEALS_KEY, startDate, endDate],
    queryFn: () =>
      apiClient.get<{ items: MealPlan[] }>(
        `/meals?startDate=${startDate}&endDate=${endDate}`,
      ),
    enabled: !!startDate && !!endDate,
    ...options,
  });
};

export const useCreateMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      date: string;
      mealType: string;
      recipeId?: string;
      recipeName?: string;
      items?: Partial<MealPlanItem>[];
      notes?: string;
      servings?: number;
    }) => apiClient.post<MealPlan>('/meals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEALS_KEY] });
    },
  });
};

export const useUpdateMeal = (mealId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MealPlan>) =>
      apiClient.patch<MealPlan>(`/meals/${mealId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEALS_KEY] });
    },
  });
};

export const useDeleteMeal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mealId,
      date,
      mealType,
    }: {
      mealId: string;
      date: string;
      mealType: string;
    }) =>
      apiClient.delete(`/meals/${mealId}?date=${date}&mealType=${mealType}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEALS_KEY] });
    },
  });
};

export const useCopyMealWeek = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sourceStartDate: string; targetStartDate: string }) =>
      apiClient.post<{ items: MealPlan[] }>('/meals/copy-week', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MEALS_KEY] });
    },
  });
};

export const useGenerateListFromMeals = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      startDate: string;
      endDate: string;
      deductInventory?: boolean;
      listName?: string;
    }) => apiClient.post('/meals/generate-list', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
    },
  });
};

export const useMealNutritionSummary = (
  startDate: string,
  endDate: string,
  options = {},
) => {
  return useQuery({
    queryKey: [MEALS_KEY, 'nutrition', startDate, endDate],
    queryFn: () =>
      apiClient.get(
        `/meals/nutrition-summary?startDate=${startDate}&endDate=${endDate}`,
      ),
    enabled: !!startDate && !!endDate,
    ...options,
  });
};
