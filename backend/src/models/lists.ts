import Joi from 'joi';

export const createListSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1).max(200).required(),
        quantity: Joi.number().min(0).default(1),
        unit: Joi.string().max(50).default('each'),
        category: Joi.string().max(100).optional(),
        subcategory: Joi.string().max(100).optional(),
        aisle: Joi.string().max(100).optional(),
        imageUrl: Joi.string().uri().optional(),
        barcode: Joi.string().max(50).optional(),
        notes: Joi.string().max(500).optional(),
      }),
    )
    .optional(),
});

export const updateListSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  isFavourite: Joi.boolean().optional(),
});

export const addListItemSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  quantity: Joi.number().min(0).default(1),
  unit: Joi.string().max(50).default('each'),
  category: Joi.string().max(100).optional(),
  subcategory: Joi.string().max(100).optional(),
  aisle: Joi.string().max(100).optional(),
  imageUrl: Joi.string().uri().optional(),
  barcode: Joi.string().max(50).optional(),
  notes: Joi.string().max(500).optional(),
});

export const updateListItemSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  quantity: Joi.number().min(0).optional(),
  unit: Joi.string().max(50).optional(),
  category: Joi.string().max(100).optional(),
  subcategory: Joi.string().max(100).optional(),
  aisle: Joi.string().max(100).optional(),
  imageUrl: Joi.string().uri().optional(),
  isChecked: Joi.boolean().optional(),
  barcode: Joi.string().max(50).optional(),
  notes: Joi.string().max(500).optional(),
});

export const shareListSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().required()).min(1).required(),
});

export const listParamsSchema = Joi.object({
  listId: Joi.string().required(),
});

export const listItemParamsSchema = Joi.object({
  listId: Joi.string().required(),
  itemId: Joi.string().required(),
});
