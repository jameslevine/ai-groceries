import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { dynamodb } from './dynamodb';
import { TABLES } from '../constants';

interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  familyId: string;
  preferences: UserPreferences;
  rewardCards: RewardCard[];
  createdAt: string;
  updatedAt: string;
}

interface UserPreferences {
  currency: string;
  language: string;
  preferredStores: string[];
  dietaryRestrictions: string[];
  householdSize: number;
  notificationsEnabled: boolean;
  expiryAlertDays: number;
}

interface RewardCard {
  cardId: string;
  storeName: string;
  cardNumber: string;
  barcodeData?: string;
  createdAt: string;
}

const createPK = (userId: string) => `USER#${userId}`;

export const getDbUserById = async (userId: string): Promise<User | null> => {
  const params = {
    TableName: TABLES.USERS,
    Key: {
      pk: createPK(userId),
      sk: 'PROFILE',
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    return (response.Item as User) || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

export const createDbUser = async (data: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<User> => {
  const now = dayjs().toISOString();
  const familyId = uuidv4();

  const user: User = {
    userId: data.userId,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    familyId,
    preferences: {
      currency: 'GBP',
      language: 'en',
      preferredStores: ['TESCO', 'SAINSBURYS', 'ASDA'],
      dietaryRestrictions: [],
      householdSize: 2,
      notificationsEnabled: true,
      expiryAlertDays: 3,
    },
    rewardCards: [],
    createdAt: now,
    updatedAt: now,
  };

  const params = {
    TableName: TABLES.USERS,
    Item: {
      pk: createPK(data.userId),
      sk: 'PROFILE',
      gsi1pk: `EMAIL#${data.email}`,
      ...user,
    },
  };

  await dynamodb.send(new PutCommand(params));
  return user;
};

export const updateDbUser = async (
  userId: string,
  updates: Partial<Pick<User, 'firstName' | 'lastName'>>,
): Promise<User | null> => {
  const now = dayjs().toISOString();
  const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
  const expressionAttributeNames: Record<string, string> = {
    '#updatedAt': 'updatedAt',
  };
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
  };

  if (updates.firstName !== undefined) {
    updateExpressions.push('#firstName = :firstName');
    expressionAttributeNames['#firstName'] = 'firstName';
    expressionAttributeValues[':firstName'] = updates.firstName;
  }

  if (updates.lastName !== undefined) {
    updateExpressions.push('#lastName = :lastName');
    expressionAttributeNames['#lastName'] = 'lastName';
    expressionAttributeValues[':lastName'] = updates.lastName;
  }

  const params = {
    TableName: TABLES.USERS,
    Key: {
      pk: createPK(userId),
      sk: 'PROFILE',
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' as const,
  };

  const response = await dynamodb.send(new UpdateCommand(params));
  return (response.Attributes as User) || null;
};

export const updateDbUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>,
): Promise<UserPreferences | null> => {
  const now = dayjs().toISOString();
  const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
  const expressionAttributeNames: Record<string, string> = {
    '#updatedAt': 'updatedAt',
  };
  const expressionAttributeValues: Record<string, any> = {
    ':updatedAt': now,
  };

  const prefFields = [
    'currency',
    'language',
    'preferredStores',
    'dietaryRestrictions',
    'householdSize',
    'notificationsEnabled',
    'expiryAlertDays',
  ];

  for (const field of prefFields) {
    if ((preferences as any)[field] !== undefined) {
      updateExpressions.push(`#preferences.#${field} = :${field}`);
      expressionAttributeNames[`#${field}`] = field;
      expressionAttributeNames['#preferences'] = 'preferences';
      expressionAttributeValues[`:${field}`] = (preferences as any)[field];
    }
  }

  const params = {
    TableName: TABLES.USERS,
    Key: {
      pk: createPK(userId),
      sk: 'PROFILE',
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW' as const,
  };

  const response = await dynamodb.send(new UpdateCommand(params));
  return (response.Attributes as User)?.preferences || null;
};

export const addDbRewardCard = async (
  userId: string,
  data: { storeName: string; cardNumber: string; barcodeData?: string },
): Promise<RewardCard> => {
  const card: RewardCard = {
    cardId: uuidv4(),
    storeName: data.storeName,
    cardNumber: data.cardNumber,
    barcodeData: data.barcodeData,
    createdAt: dayjs().toISOString(),
  };

  const params = {
    TableName: TABLES.USERS,
    Key: {
      pk: createPK(userId),
      sk: 'PROFILE',
    },
    UpdateExpression:
      'SET #rewardCards = list_append(if_not_exists(#rewardCards, :emptyList), :newCard), #updatedAt = :now',
    ExpressionAttributeNames: {
      '#rewardCards': 'rewardCards',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':newCard': [card],
      ':emptyList': [],
      ':now': dayjs().toISOString(),
    },
  };

  await dynamodb.send(new UpdateCommand(params));
  return card;
};
