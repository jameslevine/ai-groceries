import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { dynamodb } from './dynamodb';
import { TABLES } from '../constants';
import { ShoppingList, ShoppingListItem, PaginatedResponse } from '../types';

const createPK = (familyId: string) => `FAMILY#${familyId}`;
const createSK = (listId: string) => `LIST#${listId}`;

export const getDbShoppingLists = async (
  familyId: string,
  limit: number = 20,
  lastEvaluatedKey?: Record<string, any>,
): Promise<PaginatedResponse<ShoppingList>> => {
  const params = {
    TableName: TABLES.SHOPPING_LISTS,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': createPK(familyId),
      ':skPrefix': 'LIST#',
    },
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return {
      items: (response.Items || []) as ShoppingList[],
      lastEvaluatedKey: response.LastEvaluatedKey,
      hasMore: !!response.LastEvaluatedKey,
    };
  } catch (error) {
    console.error('Error fetching shopping lists:', error);
    throw error;
  }
};

export const getDbShoppingListById = async (
  familyId: string,
  listId: string,
): Promise<ShoppingList | null> => {
  const params = {
    TableName: TABLES.SHOPPING_LISTS,
    Key: {
      pk: createPK(familyId),
      sk: createSK(listId),
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    return (response.Item as ShoppingList) || null;
  } catch (error) {
    console.error('Error fetching shopping list:', error);
    throw error;
  }
};

export const createDbShoppingList = async (
  familyId: string,
  userId: string,
  data: { name: string; items?: Partial<ShoppingListItem>[] },
): Promise<ShoppingList> => {
  const now = dayjs().toISOString();
  const listId = uuidv4();

  const items: ShoppingListItem[] = (data.items || []).map((item) => ({
    itemId: uuidv4(),
    name: item.name || '',
    quantity: item.quantity || 1,
    unit: item.unit || 'each',
    category: item.category || 'Other',
    subcategory: item.subcategory,
    aisle: item.aisle,
    imageUrl: item.imageUrl,
    isChecked: false,
    price: item.price,
    store: item.store,
    barcode: item.barcode,
    notes: item.notes,
    addedBy: userId,
    addedAt: now,
  }));

  const list: ShoppingList = {
    listId,
    familyId,
    name: data.name,
    items,
    sharedWith: [],
    isFavourite: false,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLES.SHOPPING_LISTS,
    Item: {
      pk: createPK(familyId),
      sk: createSK(listId),
      ...list,
    },
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return list;
  } catch (error) {
    console.error('Error creating shopping list:', error);
    throw error;
  }
};

export const updateDbShoppingList = async (
  familyId: string,
  listId: string,
  updates: Partial<ShoppingList>,
): Promise<ShoppingList | null> => {
  const now = dayjs().toISOString();
  const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
  const expressionAttributeNames: Record<string, string> = {
    '#updatedAt': 'updatedAt',
  };
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
  };

  if (updates.name !== undefined) {
    updateExpressions.push('#name = :name');
    expressionAttributeNames['#name'] = 'name';
    expressionAttributeValues[':name'] = updates.name;
  }

  if (updates.isFavourite !== undefined) {
    updateExpressions.push('#isFavourite = :isFavourite');
    expressionAttributeNames['#isFavourite'] = 'isFavourite';
    expressionAttributeValues[':isFavourite'] = updates.isFavourite;
  }

  if (updates.items !== undefined) {
    updateExpressions.push('#items = :items');
    expressionAttributeNames['#items'] = 'items';
    expressionAttributeValues[':items'] = updates.items;
  }

  if (updates.sharedWith !== undefined) {
    updateExpressions.push('#sharedWith = :sharedWith');
    expressionAttributeNames['#sharedWith'] = 'sharedWith';
    expressionAttributeValues[':sharedWith'] = updates.sharedWith;
  }

  const params = {
    TableName: TABLES.SHOPPING_LISTS,
    Key: {
      pk: createPK(familyId),
      sk: createSK(listId),
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return (response.Attributes as ShoppingList) || null;
  } catch (error) {
    console.error('Error updating shopping list:', error);
    throw error;
  }
};

export const deleteDbShoppingList = async (
  familyId: string,
  listId: string,
): Promise<void> => {
  const params = {
    TableName: TABLES.SHOPPING_LISTS,
    Key: {
      pk: createPK(familyId),
      sk: createSK(listId),
    },
  };

  try {
    await dynamodb.send(new DeleteCommand(params));
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    throw error;
  }
};

export const addDbShoppingListItem = async (
  familyId: string,
  listId: string,
  userId: string,
  itemData: Partial<ShoppingListItem>,
): Promise<ShoppingListItem> => {
  const now = dayjs().toISOString();
  const newItem: ShoppingListItem = {
    itemId: uuidv4(),
    name: itemData.name || '',
    quantity: itemData.quantity || 1,
    unit: itemData.unit || 'each',
    category: itemData.category || 'Other',
    subcategory: itemData.subcategory,
    aisle: itemData.aisle,
    imageUrl: itemData.imageUrl,
    isChecked: false,
    price: itemData.price,
    store: itemData.store,
    barcode: itemData.barcode,
    notes: itemData.notes,
    addedBy: userId,
    addedAt: now,
  };

  const params = {
    TableName: TABLES.SHOPPING_LISTS,
    Key: {
      pk: createPK(familyId),
      sk: createSK(listId),
    },
    UpdateExpression:
      'SET #items = list_append(if_not_exists(#items, :emptyList), :newItem), #updatedAt = :now',
    ExpressionAttributeNames: {
      '#items': 'items',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':newItem': [newItem],
      ':emptyList': [],
      ':now': now,
    },
    ReturnValues: 'ALL_NEW' as const,
  };

  try {
    await dynamodb.send(new UpdateCommand(params));
    return newItem;
  } catch (error) {
    console.error('Error adding item to shopping list:', error);
    throw error;
  }
};
