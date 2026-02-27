import { Router } from 'express';
import {
  searchProducts,
  getProductByBarcodeHandler,
  comparePrices,
  getPriceHistoryHandler,
  getDeals,
  getStores,
} from '../controllers/products';

export const router = Router();

// Products
router.get('/search', searchProducts);
router.get('/barcode/:barcode', getProductByBarcodeHandler);
router.get('/categories', searchProducts); // Reuse with category filter

// Prices
export const pricesRouter = Router();
pricesRouter.get('/compare', comparePrices);
pricesRouter.get('/history/:productId', getPriceHistoryHandler);
pricesRouter.get('/deals', getDeals);
pricesRouter.get('/stores', getStores);
