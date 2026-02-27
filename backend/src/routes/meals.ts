import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validation';
import {
  createMealSchema,
  updateMealSchema,
  copyWeekSchema,
  mealParamsSchema,
  mealQuerySchema,
} from '../models/meals';
import {
  getMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  copyMealWeek,
} from '../controllers/meals';

export const router = Router();

router.get('/', validateQuery(mealQuerySchema), getMeals);

router.post('/', validateBody(createMealSchema), createMeal);

router.patch(
  '/:mealId',
  validateParams(mealParamsSchema),
  validateBody(updateMealSchema),
  updateMeal,
);

router.delete('/:mealId', validateParams(mealParamsSchema), deleteMeal);

router.post('/copy-week', validateBody(copyWeekSchema), copyMealWeek);
