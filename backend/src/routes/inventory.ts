import { Router } from 'express';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validation';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  inventoryItemParamsSchema,
  inventoryQuerySchema,
} from '../models/inventory';
import {
  getInventoryItems,
  getLowStockItems,
  getExpiredItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../controllers/inventory';

export const router = Router();

router.get('/', validateQuery(inventoryQuerySchema), getInventoryItems);

router.get('/low-stock', getLowStockItems);

router.get('/expired', getExpiredItems);

router.post('/', validateBody(createInventoryItemSchema), createInventoryItem);

router.patch(
  '/:itemId',
  validateParams(inventoryItemParamsSchema),
  validateBody(updateInventoryItemSchema),
  updateInventoryItem,
);

router.delete(
  '/:itemId',
  validateParams(inventoryItemParamsSchema),
  deleteInventoryItem,
);
