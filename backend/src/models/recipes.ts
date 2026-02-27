import Joi from 'joi';

const ingredientSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  quantity: Joi.number().min(0).required(),
  unit: Joi.string().max(50).required(),
  notes: Joi.string().max(500).optional(),
  isOptional: Joi.boolean().default(false),
});

const directionSchema = Joi.object({
  stepNumber: Joi.number().min(1).required(),
  instruction: Joi.string().min(1).max(2000).required(),
  duration: Joi.number().min(0).optional(),
  ingredientRefs: Joi.array().items(Joi.string()).optional(),
  timerMinutes: Joi.number().min(0).optional(),
});

const nutritionSchema = Joi.object({
  calories: Joi.number().min(0).required(),
  protein: Joi.number().min(0).required(),
  carbohydrates: Joi.number().min(0).required(),
  fat: Joi.number().min(0).required(),
  fibre: Joi.number().min(0).optional(),
  sugar: Joi.number().min(0).optional(),
  sodium: Joi.number().min(0).optional(),
  servingSize: Joi.string().max(100).optional(),
});

export const createRecipeSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000).optional(),
  ingredients: Joi.array().items(ingredientSchema).min(1).required(),
  directions: Joi.array().items(directionSchema).min(1).required(),
  prepTime: Joi.number().min(0).required(),
  cookTime: Joi.number().min(0).required(),
  servings: Joi.number().min(1).required(),
  nutrition: nutritionSchema.optional(),
  imageUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  cuisine: Joi.string().max(100).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  isPublic: Joi.boolean().default(false),
});

export const updateRecipeSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(2000).optional(),
  ingredients: Joi.array().items(ingredientSchema).min(1).optional(),
  directions: Joi.array().items(directionSchema).min(1).optional(),
  prepTime: Joi.number().min(0).optional(),
  cookTime: Joi.number().min(0).optional(),
  servings: Joi.number().min(1).optional(),
  nutrition: nutritionSchema.optional(),
  imageUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
  cuisine: Joi.string().max(100).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  isPublic: Joi.boolean().optional(),
});

export const rateRecipeSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
});

export const importRecipeUrlSchema = Joi.object({
  url: Joi.string().uri().required(),
});

export const recipeParamsSchema = Joi.object({
  recipeId: Joi.string().required(),
});

export const recipeSearchQuerySchema = Joi.object({
  q: Joi.string().max(200).optional(),
  ingredients: Joi.string().max(500).optional(),
  cuisine: Joi.string().max(100).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  maxPrepTime: Joi.number().min(0).optional(),
  maxCookTime: Joi.number().min(0).optional(),
  tags: Joi.string().max(500).optional(),
  limit: Joi.number().min(1).max(100).default(20),
  lastKey: Joi.string().optional(),
});
