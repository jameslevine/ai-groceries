import { Request, Response } from 'express';
import {
  getDbShoppingLists,
  getDbShoppingListById,
  createDbShoppingList,
  updateDbShoppingList,
  deleteDbShoppingList,
  addDbShoppingListItem,
} from '../adapters/lists';

export const getShoppingLists = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const limit = parseInt(req.query.limit as string) || 20;
    const lastKey = req.query.lastKey
      ? JSON.parse(decodeURIComponent(req.query.lastKey as string))
      : undefined;

    const lists = await getDbShoppingLists(familyId, limit, lastKey);
    res.json(lists);
  } catch (error) {
    console.error('Error getting shopping lists:', error);
    res.status(500).json({ message: 'Error fetching shopping lists' });
  }
};

export const getShoppingListById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { listId } = req.params;

    const list = await getDbShoppingListById(familyId, listId);
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    res.json(list);
  } catch (error) {
    console.error('Error getting shopping list:', error);
    res.status(500).json({ message: 'Error fetching shopping list' });
  }
};

export const createShoppingList = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const userId = req.user.sub;

    const list = await createDbShoppingList(familyId, userId, req.body);
    res.status(201).json(list);
  } catch (error) {
    console.error('Error creating shopping list:', error);
    res.status(500).json({ message: 'Error creating shopping list' });
  }
};

export const updateShoppingList = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { listId } = req.params;

    const list = await updateDbShoppingList(familyId, listId, req.body);
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    res.json(list);
  } catch (error) {
    console.error('Error updating shopping list:', error);
    res.status(500).json({ message: 'Error updating shopping list' });
  }
};

export const deleteShoppingList = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { listId } = req.params;

    await deleteDbShoppingList(familyId, listId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    res.status(500).json({ message: 'Error deleting shopping list' });
  }
};

export const addShoppingListItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const userId = req.user.sub;
    const { listId } = req.params;

    const item = await addDbShoppingListItem(
      familyId,
      listId,
      userId,
      req.body,
    );
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding item to shopping list:', error);
    res.status(500).json({ message: 'Error adding item' });
  }
};

export const shareShoppingList = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { listId } = req.params;
    const { userIds } = req.body;

    const list = await getDbShoppingListById(familyId, listId);
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    const updatedSharedWith = [...new Set([...list.sharedWith, ...userIds])];

    const updatedList = await updateDbShoppingList(familyId, listId, {
      sharedWith: updatedSharedWith,
    });

    res.json(updatedList);
  } catch (error) {
    console.error('Error sharing shopping list:', error);
    res.status(500).json({ message: 'Error sharing shopping list' });
  }
};
