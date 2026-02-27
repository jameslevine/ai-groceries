import Joi from 'joi';
import { INVENTORY_LOCATIONS } from '../types';

export const createInventoryItemSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  quantity: Joi.number().min(0).required(),
  unit: Joi.string().max(50).default('each'),
  location: Joi.string().max(100).required(),
  category: Joi.string().max(100).optional(),
  expiryDate: Joi.string().isoDate().optional(),
  imageUrl: Joi.string().uri().optional(),
  barcode: Joi.string().max(50).optional(),
  lowStockThreshold: Joi.number().min(0).default(1),
  notes: Joi.string().max(500).optional(),
});

export const updateInventoryItemSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  quantity: Joi.number().min(0).optional(),
  unit: Joi.string().max(50).optional(),
  location: Joi.string().max(100).optional(),
  category: Joi.string().max(100).optional(),
  expiryDate: Joi.string().isoDate().allow(null).optional(),
  imageUrl: Joi.string().uri().optional(),
  barcode: Joi.string().max(50).optional(),
  lowStockThreshold: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
});

export const createLocationSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  icon: Joi.string().max(50).optional(),
});

export const inventoryItemParamsSchema = Joi.object({
  itemId: Joi.string().required(),
});

export const inventoryQuerySchema = Joi.object({
  location: Joi.string().max(100).optional(),
  category: Joi.string().max(100).optional(),
  status: Joi.string()
    .valid('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED')
    .optional(),
  limit: Joi.number().min(1).max(100).default(20),
  lastKey: Joi.string().optional(),
});
