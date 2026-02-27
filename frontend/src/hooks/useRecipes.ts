import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

const RECIPES_KEY = 'recipes';

interface RecipeIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  isOptional: boolean;
}

interface RecipeDirection {
  stepNumber: number;
  instruction: string;
  duration?: number;
  timerMinutes?: number;
}

interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fibre?: number;
  sugar?: number;
  sodium?: number;
}

interface Recipe {
  recipeId: string;
  userId: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  directions: RecipeDirection[];
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  nutrition?: NutritionInfo;
  rating: number;
  ratingCount: number;
  imageUrl?: string;
  sourceUrl?: string;
  tags: string[];
  cuisine?: string;
  difficulty: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useRecipes = (options = {}) => {
  return useQuery({
    queryKey: [RECIPES_KEY],
    queryFn: () =>
      apiClient.get<{ items: Recipe[]; hasMore: boolean }>('/recipes'),
    ...options,
  });
};

export const useRecipe = (recipeId: string, options = {}) => {
  return useQuery({
    queryKey: [RECIPES_KEY, recipeId],
    queryFn: () => apiClient.get<Recipe>(`/recipes/${recipeId}`),
    enabled: !!recipeId,
    ...options,
  });
};

export const useSearchRecipes = (query: string, options = {}) => {
  return useQuery({
    queryKey: [RECIPES_KEY, 'search', query],
    queryFn: () =>
      apiClient.get<{ items: Recipe[]; hasMore: boolean }>(
        `/recipes/search?q=${encodeURIComponent(query)}`,
      ),
    enabled: !!query && query.length >= 2,
    ...options,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Recipe>) =>
      apiClient.post<Recipe>('/recipes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
};

export const useUpdateRecipe = (recipeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Recipe>) =>
      apiClient.patch<Recipe>(`/recipes/${recipeId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY] });
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY, recipeId] });
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId: string) => apiClient.delete(`/recipes/${recipeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
};

export const useRateRecipe = (recipeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rating: number) =>
      apiClient.post<Recipe>(`/recipes/${recipeId}/rate`, { rating }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY, recipeId] });
    },
  });
};

export const useImportRecipeFromUrl = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) =>
      apiClient.post<Recipe>('/recipes/import-url', { url }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
};

// ==================== Discovery Types ====================

export interface DiscoveredRecipe {
  externalId: string;
  source: string;
  name: string;
  description: string;
  imageUrl?: string;
  sourceUrl?: string;
  cuisine?: string;
  tags: string[];
  ingredients: { name: string; quantity: string; unit: string }[];
  directions: { stepNumber: number; instruction: string }[];
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: string;
}

// ==================== Discovery Hooks ====================

const DISCOVER_KEY = 'discover-recipes';

export const useDiscoverRecipes = (
  params: { q?: string; category?: string; cuisine?: string } = {},
  options = {},
) => {
  const queryString = new URLSearchParams(
    Object.entries(params).filter(([, v]) => !!v) as [string, string][],
  ).toString();

  return useQuery({
    queryKey: [DISCOVER_KEY, params],
    queryFn: () =>
      apiClient.get<{ items: DiscoveredRecipe[]; source: string }>(
        `/recipes/discover${queryString ? `?${queryString}` : ''}`,
      ),
    ...options,
  });
};

export const useDiscoverCategories = (options = {}) => {
  return useQuery({
    queryKey: [DISCOVER_KEY, 'categories'],
    queryFn: () =>
      apiClient.get<{ categories: string[]; cuisines: string[] }>(
        '/recipes/discover/categories',
      ),
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
    ...options,
  });
};

export const useSaveDiscoveredRecipe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DiscoveredRecipe>) =>
      apiClient.post<Recipe>('/recipes/discover/save', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECIPES_KEY] });
    },
  });
};
