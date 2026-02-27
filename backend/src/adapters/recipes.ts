import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { dynamodb } from './dynamodb';
import { TABLES } from '../constants';
import { Recipe, PaginatedResponse } from '../types';

const createPK = (recipeId: string) => `RECIPE#${recipeId}`;

export const getDbRecipesByUser = async (
  userId: string,
  limit: number = 20,
  lastEvaluatedKey?: Record<string, any>,
): Promise<PaginatedResponse<Recipe>> => {
  const params = {
    TableName: TABLES.RECIPES,
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :gsi1pk',
    ExpressionAttributeValues: {
      ':gsi1pk': `USER#${userId}`,
    },
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return {
      items: (response.Items || []) as Recipe[],
      lastEvaluatedKey: response.LastEvaluatedKey,
      hasMore: !!response.LastEvaluatedKey,
    };
  } catch (error) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
};

export const getDbRecipeById = async (
  recipeId: string,
): Promise<Recipe | null> => {
  const params = {
    TableName: TABLES.RECIPES,
    Key: {
      pk: createPK(recipeId),
      sk: 'META',
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    return (response.Item as Recipe) || null;
  } catch (error) {
    console.error('Error fetching recipe:', error);
    throw error;
  }
};

export const createDbRecipe = async (
  userId: string,
  familyId: string,
  data: Omit<
    Recipe,
    | 'recipeId'
    | 'userId'
    | 'familyId'
    | 'rating'
    | 'ratingCount'
    | 'createdAt'
    | 'updatedAt'
  >,
): Promise<Recipe> => {
  const now = dayjs().toISOString();
  const recipeId = uuidv4();

  const recipe: Recipe = {
    recipeId,
    userId,
    familyId,
    name: data.name,
    description: data.description,
    ingredients: data.ingredients,
    directions: data.directions,
    prepTime: data.prepTime,
    cookTime: data.cookTime,
    totalTime: data.prepTime + data.cookTime,
    servings: data.servings,
    nutrition: data.nutrition,
    rating: 0,
    ratingCount: 0,
    imageUrl: data.imageUrl,
    sourceUrl: data.sourceUrl,
    tags: data.tags || [],
    cuisine: data.cuisine,
    difficulty: data.difficulty,
    isPublic: data.isPublic,
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLES.RECIPES,
    Item: {
      pk: createPK(recipeId),
      sk: 'META',
      gsi1pk: `USER#${userId}`,
      ...recipe,
    },
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return recipe;
  } catch (error) {
    console.error('Error creating recipe:', error);
    throw error;
  }
};

export const updateDbRecipe = async (
  recipeId: string,
  updates: Partial<Recipe>,
): Promise<Recipe | null> => {
  const now = dayjs().toISOString();
  const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
  const expressionAttributeNames: Record<string, string> = {
    '#updatedAt': 'updatedAt',
  };
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
  };

  const fields = [
    'name',
    'description',
    'ingredients',
    'directions',
    'prepTime',
    'cookTime',
    'servings',
    'nutrition',
    'imageUrl',
    'tags',
    'cuisine',
    'difficulty',
    'isPublic',
  ];

  for (const field of fields) {
    if ((updates as any)[field] !== undefined) {
      updateExpressions.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = (updates as any)[field];
    }
  }

  if (updates.prepTime !== undefined || updates.cookTime !== undefined) {
    updateExpressions.push('#totalTime = :totalTime');
    expressionAttributeNames['#totalTime'] = 'totalTime';
    expressionAttributeValues[':totalTime'] =
      (updates.prepTime || 0) + (updates.cookTime || 0);
  }

  const params = {
    TableName: TABLES.RECIPES,
    Key: {
      pk: createPK(recipeId),
      sk: 'META',
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return (response.Attributes as Recipe) || null;
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

export const deleteDbRecipe = async (recipeId: string): Promise<void> => {
  const params = {
    TableName: TABLES.RECIPES,
    Key: {
      pk: createPK(recipeId),
      sk: 'META',
    },
  };

  try {
    await dynamodb.send(new DeleteCommand(params));
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

export const rateDbRecipe = async (
  recipeId: string,
  rating: number,
): Promise<Recipe | null> => {
  const params = {
    TableName: TABLES.RECIPES,
    Key: {
      pk: createPK(recipeId),
      sk: 'META',
    },
    UpdateExpression:
      'SET #rating = (if_not_exists(#rating, :zero) * if_not_exists(#ratingCount, :zero) + :newRating) / (if_not_exists(#ratingCount, :zero) + :one), #ratingCount = if_not_exists(#ratingCount, :zero) + :one, #updatedAt = :now',
    ExpressionAttributeNames: {
      '#rating': 'rating',
      '#ratingCount': 'ratingCount',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':newRating': rating,
      ':zero': 0,
      ':one': 1,
      ':now': dayjs().toISOString(),
    },
    ReturnValues: 'ALL_NEW' as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return (response.Attributes as Recipe) || null;
  } catch (error) {
    console.error('Error rating recipe:', error);
    throw error;
  }
};

export const searchDbRecipes = async (
  query: string,
  limit: number = 20,
): Promise<Recipe[]> => {
  // For a production app, this would use OpenSearch/Elasticsearch
  // For now, we do a scan with filter (not ideal for large datasets)
  const params = {
    TableName: TABLES.RECIPES,
    FilterExpression:
      'contains(#name, :query) OR contains(#description, :query)',
    ExpressionAttributeNames: {
      '#name': 'name',
      '#description': 'description',
    },
    ExpressionAttributeValues: {
      ':query': query.toLowerCase(),
    },
    Limit: limit,
  };

  try {
    const response = await dynamodb.send(new ScanCommand(params));
    return (response.Items || []) as Recipe[];
  } catch (error) {
    console.error('Error searching recipes:', error);
    throw error;
  }
};
