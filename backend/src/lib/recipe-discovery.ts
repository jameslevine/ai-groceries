import axios from 'axios';

// TheMealDB - Free API, no key required
const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

export interface DiscoveredRecipe {
  externalId: string;
  source: string;
  name: string;
  description: string;
  imageUrl?: string;
  sourceUrl?: string;
  cuisine?: string;
  tags: string[];
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
  }[];
  directions: {
    stepNumber: number;
    instruction: string;
  }[];
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: string;
}

interface MealDBMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strArea: string;
  strInstructions: string;
  strMealThumb: string;
  strTags: string | null;
  strYoutube: string;
  strSource: string | null;
  [key: string]: string | null;
}

const parseMealDBIngredients = (
  meal: MealDBMeal,
): { name: string; quantity: string; unit: string }[] => {
  const ingredients: { name: string; quantity: string; unit: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        quantity: measure?.trim() || '',
        unit: '',
      });
    }
  }
  return ingredients;
};

const parseInstructions = (
  instructions: string,
): { stepNumber: number; instruction: string }[] => {
  if (!instructions) return [];

  // Split by newlines, numbered steps, or periods followed by capital letters
  const steps = instructions
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10) // Filter out very short lines
    .map((s) => s.replace(/^\d+[\.\)]\s*/, '')); // Remove leading numbers

  if (steps.length === 0) {
    // If no line breaks, try splitting by sentences
    return instructions
      .split(/\.\s+(?=[A-Z])/)
      .filter((s) => s.trim().length > 10)
      .map((instruction, index) => ({
        stepNumber: index + 1,
        instruction: instruction.trim().endsWith('.')
          ? instruction.trim()
          : instruction.trim() + '.',
      }));
  }

  return steps.map((instruction, index) => ({
    stepNumber: index + 1,
    instruction,
  }));
};

const mapMealDBToRecipe = (meal: MealDBMeal): DiscoveredRecipe => ({
  externalId: meal.idMeal,
  source: 'themealdb',
  name: meal.strMeal,
  description: `${meal.strArea || ''} ${meal.strCategory || ''} recipe`.trim(),
  imageUrl: meal.strMealThumb,
  sourceUrl: meal.strSource || undefined,
  cuisine: meal.strArea || undefined,
  tags: meal.strTags
    ? meal.strTags.split(',').map((t) => t.trim())
    : ([meal.strCategory].filter(Boolean) as string[]),
  ingredients: parseMealDBIngredients(meal),
  directions: parseInstructions(meal.strInstructions),
  prepTime: 15,
  cookTime: 30,
  totalTime: 45,
  servings: 4,
  difficulty: 'medium',
});

export const searchExternalRecipes = async (
  query: string,
): Promise<DiscoveredRecipe[]> => {
  try {
    const response = await axios.get(`${MEALDB_BASE}/search.php`, {
      params: { s: query },
      timeout: 10000,
    });

    const meals: MealDBMeal[] = response.data?.meals || [];
    return meals.map(mapMealDBToRecipe);
  } catch (error) {
    console.error('Error searching external recipes:', error);
    return [];
  }
};

export const getExternalRecipeById = async (
  externalId: string,
): Promise<DiscoveredRecipe | null> => {
  try {
    const response = await axios.get(`${MEALDB_BASE}/lookup.php`, {
      params: { i: externalId },
      timeout: 10000,
    });

    const meals: MealDBMeal[] = response.data?.meals || [];
    if (meals.length === 0) return null;
    return mapMealDBToRecipe(meals[0]);
  } catch (error) {
    console.error('Error fetching external recipe:', error);
    return null;
  }
};

export const getRecipesByCategory = async (
  category: string,
): Promise<DiscoveredRecipe[]> => {
  try {
    // First get the list of meals in the category
    const listResponse = await axios.get(`${MEALDB_BASE}/filter.php`, {
      params: { c: category },
      timeout: 10000,
    });

    const mealSummaries = listResponse.data?.meals || [];

    // Fetch full details for up to 10 meals
    const detailPromises = mealSummaries
      .slice(0, 10)
      .map((m: { idMeal: string }) => getExternalRecipeById(m.idMeal));

    const results = await Promise.all(detailPromises);
    return results.filter(Boolean) as DiscoveredRecipe[];
  } catch (error) {
    console.error('Error fetching recipes by category:', error);
    return [];
  }
};

export const getRecipesByArea = async (
  area: string,
): Promise<DiscoveredRecipe[]> => {
  try {
    const listResponse = await axios.get(`${MEALDB_BASE}/filter.php`, {
      params: { a: area },
      timeout: 10000,
    });

    const mealSummaries = listResponse.data?.meals || [];

    const detailPromises = mealSummaries
      .slice(0, 10)
      .map((m: { idMeal: string }) => getExternalRecipeById(m.idMeal));

    const results = await Promise.all(detailPromises);
    return results.filter(Boolean) as DiscoveredRecipe[];
  } catch (error) {
    console.error('Error fetching recipes by area:', error);
    return [];
  }
};

export const getRandomRecipes = async (
  count: number = 6,
): Promise<DiscoveredRecipe[]> => {
  try {
    const promises = Array.from({ length: count }, () =>
      axios
        .get(`${MEALDB_BASE}/random.php`, { timeout: 10000 })
        .then((r) => r.data?.meals?.[0])
        .catch(() => null),
    );

    const meals = await Promise.all(promises);
    return meals
      .filter(Boolean)
      .map((meal: MealDBMeal) => mapMealDBToRecipe(meal));
  } catch (error) {
    console.error('Error fetching random recipes:', error);
    return [];
  }
};

export const getCategories = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${MEALDB_BASE}/list.php`, {
      params: { c: 'list' },
      timeout: 10000,
    });

    return (response.data?.meals || []).map(
      (m: { strCategory: string }) => m.strCategory,
    );
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getCuisines = async (): Promise<string[]> => {
  try {
    const response = await axios.get(`${MEALDB_BASE}/list.php`, {
      params: { a: 'list' },
      timeout: 10000,
    });

    return (response.data?.meals || []).map(
      (m: { strArea: string }) => m.strArea,
    );
  } catch (error) {
    console.error('Error fetching cuisines:', error);
    return [];
  }
};
