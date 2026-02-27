import { Request, Response } from 'express';
import {
  getDbRecipesByUser,
  getDbRecipeById,
  createDbRecipe,
  updateDbRecipe,
  deleteDbRecipe,
  rateDbRecipe,
  searchDbRecipes,
} from '../adapters/recipes';
import {
  searchExternalRecipes,
  getExternalRecipeById,
  getRecipesByCategory,
  getRecipesByArea,
  getRandomRecipes,
  getCategories,
  getCuisines,
} from '../lib/recipe-discovery';
import { importRecipeFromUrl as importFromUrl } from '../lib/recipe-url-import';

export const getRecipes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.sub;
    const limit = parseInt(req.query.limit as string) || 20;

    const recipes = await getDbRecipesByUser(userId, limit);
    res.json(recipes);
  } catch (error) {
    console.error('Error getting recipes:', error);
    res.status(500).json({ message: 'Error fetching recipes' });
  }
};

export const getRecipeById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { recipeId } = req.params;
    const recipe = await getDbRecipeById(recipeId);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({ message: 'Error fetching recipe' });
  }
};

export const createRecipe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.sub;
    const familyId = req.user['custom:familyId'] || req.user.sub;

    const recipe = await createDbRecipe(userId, familyId, req.body);
    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ message: 'Error creating recipe' });
  }
};

export const updateRecipe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { recipeId } = req.params;

    const existing = await getDbRecipeById(recipeId);
    if (!existing) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (existing.userId !== req.user.sub) {
      return res
        .status(403)
        .json({ message: 'Not authorised to edit this recipe' });
    }

    const recipe = await updateDbRecipe(recipeId, req.body);
    res.json(recipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ message: 'Error updating recipe' });
  }
};

export const deleteRecipe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { recipeId } = req.params;

    const existing = await getDbRecipeById(recipeId);
    if (!existing) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    if (existing.userId !== req.user.sub) {
      return res
        .status(403)
        .json({ message: 'Not authorised to delete this recipe' });
    }

    await deleteDbRecipe(recipeId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Error deleting recipe' });
  }
};

export const rateRecipe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { recipeId } = req.params;
    const { rating } = req.body;

    const recipe = await rateDbRecipe(recipeId, rating);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error rating recipe:', error);
    res.status(500).json({ message: 'Error rating recipe' });
  }
};

export const searchRecipes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const recipes = await searchDbRecipes(q as string, limit);
    res.json({ items: recipes, hasMore: false });
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ message: 'Error searching recipes' });
  }
};

export const importRecipeFromUrl = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.sub;
    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { url } = req.body;

    const imported = await importFromUrl(url);

    // Save to user's recipes
    const recipe = await createDbRecipe(userId, familyId, {
      name: imported.name,
      description: imported.description,
      imageUrl: imported.imageUrl,
      sourceUrl: imported.sourceUrl,
      cuisine: imported.cuisine,
      tags: imported.tags,
      ingredients: imported.ingredients.map((ing, index) => ({
        ingredientId: `ing-${index}`,
        name: ing.name,
        quantity: parseFloat(ing.quantity) || 1,
        unit: ing.unit || 'piece',
        isOptional: false,
      })),
      directions: imported.directions,
      prepTime: imported.prepTime,
      cookTime: imported.cookTime,
      totalTime: imported.totalTime,
      servings: imported.servings,
      difficulty: imported.difficulty as 'easy' | 'medium' | 'hard',
      isPublic: false,
      nutrition: undefined as any,
    });

    res.status(201).json(recipe);
  } catch (error: any) {
    console.error('Error importing recipe from URL:', error);
    const message =
      error.message ||
      'Error importing recipe. The URL may not contain structured recipe data.';
    res.status(400).json({ message });
  }
};

// ==================== Discovery Endpoints ====================

export const discoverRecipes = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { q, category, cuisine } = req.query;

    let recipes;
    if (q) {
      recipes = await searchExternalRecipes(q as string);
    } else if (category) {
      recipes = await getRecipesByCategory(category as string);
    } else if (cuisine) {
      recipes = await getRecipesByArea(cuisine as string);
    } else {
      recipes = await getRandomRecipes(8);
    }

    res.json({ items: recipes, source: 'themealdb' });
  } catch (error) {
    console.error('Error discovering recipes:', error);
    res.status(500).json({ message: 'Error searching external recipes' });
  }
};

export const getDiscoverRecipeById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { externalId } = req.params;
    const recipe = await getExternalRecipeById(externalId);

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Error fetching external recipe:', error);
    res.status(500).json({ message: 'Error fetching recipe' });
  }
};

export const saveDiscoveredRecipe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.sub;
    const familyId = req.user['custom:familyId'] || req.user.sub;
    const recipeData = req.body;

    const recipe = await createDbRecipe(userId, familyId, {
      name: recipeData.name,
      description: recipeData.description,
      imageUrl: recipeData.imageUrl,
      sourceUrl: recipeData.sourceUrl,
      cuisine: recipeData.cuisine,
      tags: recipeData.tags || [],
      ingredients: (recipeData.ingredients || []).map(
        (ing: any, index: number) => ({
          ingredientId: `ing-${index}`,
          name: ing.name,
          quantity: parseFloat(ing.quantity) || 1,
          unit: ing.unit || 'piece',
          isOptional: false,
        }),
      ),
      directions: recipeData.directions || [],
      prepTime: recipeData.prepTime || 15,
      cookTime: recipeData.cookTime || 30,
      totalTime: recipeData.totalTime || 45,
      servings: recipeData.servings || 4,
      difficulty: (recipeData.difficulty || 'medium') as
        | 'easy'
        | 'medium'
        | 'hard',
      isPublic: false,
      nutrition: undefined as any,
    });

    res.status(201).json(recipe);
  } catch (error) {
    console.error('Error saving discovered recipe:', error);
    res.status(500).json({ message: 'Error saving recipe' });
  }
};

export const getDiscoverCategories = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [categories, cuisines] = await Promise.all([
      getCategories(),
      getCuisines(),
    ]);

    res.json({ categories, cuisines });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};
