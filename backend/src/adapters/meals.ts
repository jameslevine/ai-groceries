import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { dynamodb } from './dynamodb';
import { TABLES } from '../constants';
import { MealPlan, MealPlanItem } from '../types';

const createPK = (familyId: string) => `FAMILY#${familyId}`;
const createSK = (date: string, mealType: string) => `MEAL#${date}#${mealType}`;

export const getDbMealsByDateRange = async (
  familyId: string,
  startDate: string,
  endDate: string,
): Promise<MealPlan[]> => {
  const params = {
    TableName: TABLES.MEAL_PLANS,
    KeyConditionExpression: 'pk = :pk AND sk BETWEEN :startSk AND :endSk',
    ExpressionAttributeValues: {
      ':pk': createPK(familyId),
      ':startSk': `MEAL#${startDate}`,
      ':endSk': `MEAL#${endDate}~`,
    },
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return (response.Items || []) as MealPlan[];
  } catch (error) {
    console.error('Error fetching meals:', error);
    throw error;
  }
};

export const createDbMeal = async (
  familyId: string,
  userId: string,
  data: {
    date: string;
    mealType: string;
    recipeId?: string;
    recipeName?: string;
    items?: Partial<MealPlanItem>[];
    notes?: string;
    servings?: number;
  },
): Promise<MealPlan> => {
  const now = dayjs().toISOString();
  const mealId = uuidv4();

  const items: MealPlanItem[] = (data.items || []).map((item) => ({
    itemId: uuidv4(),
    name: item.name || '',
    quantity: item.quantity || 1,
    unit: item.unit || 'each',
    inStock: false,
  }));

  const meal: MealPlan = {
    mealId,
    familyId,
    date: data.date,
    mealType: data.mealType,
    recipeId: data.recipeId,
    recipeName: data.recipeName,
    items,
    notes: data.notes,
    servings: data.servings || 1,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLES.MEAL_PLANS,
    Item: {
      pk: createPK(familyId),
      sk: createSK(data.date, data.mealType),
      ...meal,
    },
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return meal;
  } catch (error) {
    console.error('Error creating meal:', error);
    throw error;
  }
};

export const updateDbMeal = async (
  familyId: string,
  date: string,
  mealType: string,
  updates: Partial<MealPlan>,
): Promise<MealPlan | null> => {
  const now = dayjs().toISOString();
  const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
  const expressionAttributeNames: Record<string, string> = {
    '#updatedAt': 'updatedAt',
  };
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
  };

  const fields = ['recipeId', 'recipeName', 'items', 'notes', 'servings'];

  for (const field of fields) {
    if ((updates as any)[field] !== undefined) {
      updateExpressions.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = (updates as any)[field];
    }
  }

  const params = {
    TableName: TABLES.MEAL_PLANS,
    Key: {
      pk: createPK(familyId),
      sk: createSK(date, mealType),
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return (response.Attributes as MealPlan) || null;
  } catch (error) {
    console.error('Error updating meal:', error);
    throw error;
  }
};

export const deleteDbMeal = async (
  familyId: string,
  date: string,
  mealType: string,
): Promise<void> => {
  const params = {
    TableName: TABLES.MEAL_PLANS,
    Key: {
      pk: createPK(familyId),
      sk: createSK(date, mealType),
    },
  };

  try {
    await dynamodb.send(new DeleteCommand(params));
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
};

export const copyDbMealWeek = async (
  familyId: string,
  userId: string,
  sourceStartDate: string,
  targetStartDate: string,
): Promise<MealPlan[]> => {
  const sourceEnd = dayjs(sourceStartDate).add(6, 'day').format('YYYY-MM-DD');
  const sourceMeals = await getDbMealsByDateRange(
    familyId,
    sourceStartDate,
    sourceEnd,
  );

  const copiedMeals: MealPlan[] = [];

  for (const meal of sourceMeals) {
    const dayOffset = dayjs(meal.date).diff(dayjs(sourceStartDate), 'day');
    const newDate = dayjs(targetStartDate)
      .add(dayOffset, 'day')
      .format('YYYY-MM-DD');

    const copiedMeal = await createDbMeal(familyId, userId, {
      date: newDate,
      mealType: meal.mealType,
      recipeId: meal.recipeId,
      recipeName: meal.recipeName,
      items: meal.items,
      notes: meal.notes,
      servings: meal.servings,
    });

    copiedMeals.push(copiedMeal);
  }

  return copiedMeals;
};
