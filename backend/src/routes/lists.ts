import { Router } from 'express';
import { validateBody, validateParams } from '../middleware/validation';
import {
  createListSchema,
  updateListSchema,
  addListItemSchema,
  shareListSchema,
  listParamsSchema,
  listItemParamsSchema,
} from '../models/lists';
import {
  getShoppingLists,
  getShoppingListById,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  addShoppingListItem,
  shareShoppingList,
} from '../controllers/lists';

export const router = Router();

router.get('/', getShoppingLists);

router.post('/', validateBody(createListSchema), createShoppingList);

router.get('/:listId', validateParams(listParamsSchema), getShoppingListById);

router.patch(
  '/:listId',
  validateParams(listParamsSchema),
  validateBody(updateListSchema),
  updateShoppingList,
);

router.delete('/:listId', validateParams(listParamsSchema), deleteShoppingList);

router.post(
  '/:listId/items',
  validateParams(listParamsSchema),
  validateBody(addListItemSchema),
  addShoppingListItem,
);

router.post(
  '/:listId/share',
  validateParams(listParamsSchema),
  validateBody(shareListSchema),
  shareShoppingList,
);
