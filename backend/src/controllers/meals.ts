import { Request, Response } from 'express';
import {
  getDbMealsByDateRange,
  createDbMeal,
  updateDbMeal,
  deleteDbMeal,
  copyDbMealWeek,
} from '../adapters/meals';

export const getMeals = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'startDate and endDate are required' });
    }

    const meals = await getDbMealsByDateRange(
      familyId,
      startDate as string,
      endDate as string,
    );

    res.json({ items: meals });
  } catch (error) {
    console.error('Error getting meals:', error);
    res.status(500).json({ message: 'Error fetching meals' });
  }
};

export const createMeal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const userId = req.user.sub;

    const meal = await createDbMeal(familyId, userId, req.body);
    res.status(201).json(meal);
  } catch (error) {
    console.error('Error creating meal:', error);
    res.status(500).json({ message: 'Error creating meal' });
  }
};

export const updateMeal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { mealId } = req.params;
    const { date, mealType } = req.body;

    if (!date || !mealType) {
      return res
        .status(400)
        .json({ message: 'date and mealType are required for update' });
    }

    const meal = await updateDbMeal(familyId, date, mealType, req.body);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json(meal);
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({ message: 'Error updating meal' });
  }
};

export const deleteMeal = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const date = req.query.date as string;
    const mealType = req.query.mealType as string;

    if (!date || !mealType) {
      return res
        .status(400)
        .json({ message: 'date and mealType query params are required' });
    }

    await deleteDbMeal(familyId, date, mealType);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ message: 'Error deleting meal' });
  }
};

export const copyMealWeek = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const userId = req.user.sub;
    const { sourceStartDate, targetStartDate } = req.body;

    const copiedMeals = await copyDbMealWeek(
      familyId,
      userId,
      sourceStartDate,
      targetStartDate,
    );

    res.status(201).json({ items: copiedMeals });
  } catch (error) {
    console.error('Error copying meal week:', error);
    res.status(500).json({ message: 'Error copying meal week' });
  }
};
