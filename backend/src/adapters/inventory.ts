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
import { InventoryItem, PaginatedResponse, StockStatus } from '../types';

const createPK = (familyId: string) => `FAMILY#${familyId}`;
const createSK = (locationId: string, itemId: string) =>
  `INV#${locationId}#${itemId}`;

export const getDbInventoryItems = async (
  familyId: string,
  limit: number = 20,
  lastEvaluatedKey?: Record<string, any>,
): Promise<PaginatedResponse<InventoryItem>> => {
  const params = {
    TableName: TABLES.INVENTORY,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': createPK(familyId),
      ':skPrefix': 'INV#',
    },
    Limit: limit,
    ExclusiveStartKey: lastEvaluatedKey,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return {
      items: (response.Items || []) as InventoryItem[],
      lastEvaluatedKey: response.LastEvaluatedKey,
      hasMore: !!response.LastEvaluatedKey,
    };
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    throw error;
  }
};

export const getDbInventoryItemsByLocation = async (
  familyId: string,
  location: string,
): Promise<InventoryItem[]> => {
  const params = {
    TableName: TABLES.INVENTORY,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': createPK(familyId),
      ':skPrefix': `INV#${location}#`,
    },
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return (response.Items || []) as InventoryItem[];
  } catch (error) {
    console.error('Error fetching inventory by location:', error);
    throw error;
  }
};

export const getDbLowStockItems = async (
  familyId: string,
): Promise<InventoryItem[]> => {
  const allItems = await getDbInventoryItems(familyId, 1000);
  return allItems.items.filter(
    (item) => item.quantity <= item.lowStockThreshold,
  );
};

export const getDbExpiredItems = async (
  familyId: string,
): Promise<InventoryItem[]> => {
  const allItems = await getDbInventoryItems(familyId, 1000);
  const now = dayjs();
  return allItems.items.filter(
    (item) => item.expiryDate && dayjs(item.expiryDate).isBefore(now),
  );
};

export const createDbInventoryItem = async (
  familyId: string,
  data: Omit<InventoryItem, 'itemId' | 'familyId' | 'createdAt' | 'updatedAt'>,
): Promise<InventoryItem> => {
  const now = dayjs().toISOString();
  const itemId = uuidv4();

  const item: InventoryItem = {
    itemId,
    familyId,
    name: data.name,
    quantity: data.quantity,
    unit: data.unit,
    location: data.location,
    category: data.category,
    expiryDate: data.expiryDate,
    imageUrl: data.imageUrl,
    barcode: data.barcode,
    lowStockThreshold: data.lowStockThreshold || 1,
    notes: data.notes,
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLES.INVENTORY,
    Item: {
      pk: createPK(familyId),
      sk: createSK(data.location as string, itemId),
      gsi1pk: `ITEM#${itemId}`,
      ...item,
    },
  };

  try {
    await dynamodb.send(new PutCommand(params));
    return item;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
};

export const updateDbInventoryItem = async (
  familyId: string,
  location: string,
  itemId: string,
  updates: Partial<InventoryItem>,
): Promise<InventoryItem | null> => {
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
    'quantity',
    'unit',
    'category',
    'expiryDate',
    'imageUrl',
    'barcode',
    'lowStockThreshold',
    'notes',
  ];

  for (const field of fields) {
    if ((updates as any)[field] !== undefined) {
      updateExpressions.push(`#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeValues[`:${field}`] = (updates as any)[field];
    }
  }

  const params = {
    TableName: TABLES.INVENTORY,
    Key: {
      pk: createPK(familyId),
      sk: createSK(location, itemId),
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' as const,
  };

  try {
    const response = await dynamodb.send(new UpdateCommand(params));
    return (response.Attributes as InventoryItem) || null;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

export const deleteDbInventoryItem = async (
  familyId: string,
  location: string,
  itemId: string,
): Promise<void> => {
  const params = {
    TableName: TABLES.INVENTORY,
    Key: {
      pk: createPK(familyId),
      sk: createSK(location, itemId),
    },
  };

  try {
    await dynamodb.send(new DeleteCommand(params));
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

export const getItemStockStatus = (item: InventoryItem): StockStatus => {
  if (item.expiryDate && dayjs(item.expiryDate).isBefore(dayjs())) {
    return 'EXPIRED';
  }
  if (item.quantity === 0) {
    return 'OUT_OF_STOCK';
  }
  if (item.quantity <= item.lowStockThreshold) {
    return 'LOW_STOCK';
  }
  return 'IN_STOCK';
};
