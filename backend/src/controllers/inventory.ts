import { Request, Response } from 'express';
import {
  getDbInventoryItems,
  getDbInventoryItemsByLocation,
  getDbLowStockItems,
  getDbExpiredItems,
  createDbInventoryItem,
  updateDbInventoryItem,
  deleteDbInventoryItem,
  getItemStockStatus,
} from '../adapters/inventory';

export const getInventoryItems = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { location } = req.query;
    const limit = parseInt(req.query.limit as string) || 20;

    if (location) {
      const items = await getDbInventoryItemsByLocation(
        familyId,
        location as string,
      );
      const itemsWithStatus = items.map((item) => ({
        ...item,
        stockStatus: getItemStockStatus(item),
      }));
      return res.json({ items: itemsWithStatus, hasMore: false });
    }

    const result = await getDbInventoryItems(familyId, limit);
    const itemsWithStatus = result.items.map((item) => ({
      ...item,
      stockStatus: getItemStockStatus(item),
    }));

    res.json({ ...result, items: itemsWithStatus });
  } catch (error) {
    console.error('Error getting inventory items:', error);
    res.status(500).json({ message: 'Error fetching inventory items' });
  }
};

export const getLowStockItems = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const items = await getDbLowStockItems(familyId);
    const itemsWithStatus = items.map((item) => ({
      ...item,
      stockStatus: getItemStockStatus(item),
    }));

    res.json({ items: itemsWithStatus });
  } catch (error) {
    console.error('Error getting low stock items:', error);
    res.status(500).json({ message: 'Error fetching low stock items' });
  }
};

export const getExpiredItems = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const items = await getDbExpiredItems(familyId);
    const itemsWithStatus = items.map((item) => ({
      ...item,
      stockStatus: 'EXPIRED',
    }));

    res.json({ items: itemsWithStatus });
  } catch (error) {
    console.error('Error getting expired items:', error);
    res.status(500).json({ message: 'Error fetching expired items' });
  }
};

export const createInventoryItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const item = await createDbInventoryItem(familyId, req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Error creating inventory item' });
  }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { itemId } = req.params;
    const { location } = req.body;

    const item = await updateDbInventoryItem(
      familyId,
      location || 'PANTRY',
      itemId,
      req.body,
    );

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ message: 'Error updating inventory item' });
  }
};

export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const familyId = req.user['custom:familyId'] || req.user.sub;
    const { itemId } = req.params;
    const location = (req.query.location as string) || 'PANTRY';

    await deleteDbInventoryItem(familyId, location, itemId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ message: 'Error deleting inventory item' });
  }
};
