import Joi from 'joi';

export const createMealSchema = Joi.object({
  date: Joi.string().isoDate().required(),
  mealType: Joi.string().min(1).max(50).required(),
  recipeId: Joi.string().optional(),
  recipeName: Joi.string().max(200).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1).max(200).required(),
        quantity: Joi.number().min(0).default(1),
        unit: Joi.string().max(50).default('each'),
      }),
    )
    .optional(),
  notes: Joi.string().max(1000).optional(),
  servings: Joi.number().min(1).default(1),
});

export const updateMealSchema = Joi.object({
  date: Joi.string().isoDate().optional(),
  mealType: Joi.string().min(1).max(50).optional(),
  recipeId: Joi.string().allow(null).optional(),
  recipeName: Joi.string().max(200).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1).max(200).required(),
        quantity: Joi.number().min(0).default(1),
        unit: Joi.string().max(50).default('each'),
      }),
    )
    .optional(),
  notes: Joi.string().max(1000).optional(),
  servings: Joi.number().min(1).optional(),
});

export const copyWeekSchema = Joi.object({
  sourceStartDate: Joi.string().isoDate().required(),
  targetStartDate: Joi.string().isoDate().required(),
});

export const mealParamsSchema = Joi.object({
  mealId: Joi.string().required(),
});

export const mealQuerySchema = Joi.object({
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
});
