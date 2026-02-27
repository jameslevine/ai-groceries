import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validation';
import {
  createRecipeSchema,
  updateRecipeSchema,
  rateRecipeSchema,
  importRecipeUrlSchema,
  recipeParamsSchema,
  recipeSearchQuerySchema,
} from '../models/recipes';
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  rateRecipe,
  searchRecipes,
  importRecipeFromUrl,
  discoverRecipes,
  getDiscoverRecipeById,
  saveDiscoveredRecipe,
  getDiscoverCategories,
} from '../controllers/recipes';

export const router = Router();

router.get('/', getRecipes);

router.get('/search', validateQuery(recipeSearchQuerySchema), searchRecipes);

// Discovery endpoints (external recipe sources)
router.get('/discover', discoverRecipes);
router.get('/discover/categories', getDiscoverCategories);
router.get('/discover/:externalId', getDiscoverRecipeById);
router.post('/discover/save', saveDiscoveredRecipe);

router.post('/', validateBody(createRecipeSchema), createRecipe);

router.post(
  '/import-url',
  validateBody(importRecipeUrlSchema),
  importRecipeFromUrl,
);

router.get('/:recipeId', validateParams(recipeParamsSchema), getRecipeById);

router.patch(
  '/:recipeId',
  validateParams(recipeParamsSchema),
  validateBody(updateRecipeSchema),
  updateRecipe,
);

router.delete('/:recipeId', validateParams(recipeParamsSchema), deleteRecipe);

router.post(
  '/:recipeId/rate',
  validateParams(recipeParamsSchema),
  validateBody(rateRecipeSchema),
  rateRecipe,
);
