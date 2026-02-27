import { Request, Response } from 'express';
import {
  getProductByBarcode,
  getLatestPrices,
  getPriceHistory,
  searchProductsByCategory,
  getDealsForStore,
} from '../adapters/products';
import { STORE_METADATA, UKStore } from '../scrapers/types';

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, category, limit } = req.query;
    const pageLimit = parseInt(limit as string) || 20;

    if (!q && !category) {
      return res
        .status(400)
        .json({ message: 'Search query (q) or category is required' });
    }

    if (category) {
      const result = await searchProductsByCategory(
        category as string,
        pageLimit,
      );
      return res.json(result);
    }

    // For text search, we'd need OpenSearch in production
    // For now, return empty with a message
    res.json({
      items: [],
      hasMore: false,
      message: 'Full-text search requires OpenSearch. Use category filter.',
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ message: 'Error searching products' });
  }
};

export const getProductByBarcodeHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const { barcode } = req.params;

    const product = await getProductByBarcode(barcode);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const prices = await getLatestPrices(barcode);

    const sortedPrices = prices.sort(
      (a, b) => a.effectivePrice - b.effectivePrice,
    );
    const bestPrice = sortedPrices[0] || null;
    const averagePrice =
      prices.length > 0
        ? Math.round(
            prices.reduce((sum, p) => sum + p.effectivePrice, 0) /
              prices.length,
          )
        : 0;

    res.json({
      product,
      prices: sortedPrices.map((p) => ({
        ...p,
        storeName: STORE_METADATA[p.store]?.name || p.store,
        priceFormatted: `£${(p.shelfPrice / 100).toFixed(2)}`,
        loyaltyPriceFormatted: p.loyaltyPrice
          ? `£${(p.loyaltyPrice / 100).toFixed(2)}`
          : undefined,
      })),
      bestPrice: bestPrice
        ? {
            ...bestPrice,
            storeName: STORE_METADATA[bestPrice.store]?.name || bestPrice.store,
            priceFormatted: `£${(bestPrice.effectivePrice / 100).toFixed(2)}`,
          }
        : null,
      averagePrice,
      averagePriceFormatted: `£${(averagePrice / 100).toFixed(2)}`,
    });
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

export const comparePrices = async (req: Request, res: Response) => {
  try {
    const { productId, barcode, q } = req.query;

    const lookupBarcode = (barcode as string) || (productId as string);
    if (!lookupBarcode) {
      return res
        .status(400)
        .json({ message: 'productId or barcode is required' });
    }

    const product = await getProductByBarcode(lookupBarcode);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const prices = await getLatestPrices(lookupBarcode);
    const sortedPrices = prices.sort(
      (a, b) => a.effectivePrice - b.effectivePrice,
    );

    res.json({
      product,
      prices: sortedPrices.map((p) => ({
        ...p,
        storeName: STORE_METADATA[p.store]?.name || p.store,
        priceFormatted: `£${(p.shelfPrice / 100).toFixed(2)}`,
      })),
      bestPrice: sortedPrices[0] || null,
      averagePrice:
        prices.length > 0
          ? Math.round(
              prices.reduce((sum, p) => sum + p.effectivePrice, 0) /
                prices.length,
            )
          : 0,
    });
  } catch (error) {
    console.error('Error comparing prices:', error);
    res.status(500).json({ message: 'Error comparing prices' });
  }
};

export const getPriceHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { store, days } = req.query;
    const numDays = parseInt(days as string) || 90;

    if (store) {
      const history = await getPriceHistory(
        productId,
        store as UKStore,
        numDays,
      );
      return res.json({
        items: [
          {
            productId,
            store,
            storeName: STORE_METADATA[store as UKStore]?.name || store,
            entries: history.map((h) => ({
              date: h.date,
              price: h.shelfPrice,
              isOnOffer: h.isOnOffer,
            })),
            currentPrice: history[0]?.shelfPrice,
          },
        ],
      });
    }

    // Get history for all stores
    const stores: UKStore[] = [
      'TESCO',
      'ASDA',
      'SAINSBURYS',
      'MORRISONS',
      'ALDI',
      'LIDL',
      'WAITROSE',
      'OCADO',
      'COOP',
      'MS_FOOD',
    ];
    const allHistory = await Promise.all(
      stores.map(async (s) => {
        const history = await getPriceHistory(productId, s, numDays);
        if (history.length === 0) return null;
        return {
          productId,
          store: s,
          storeName: STORE_METADATA[s]?.name || s,
          entries: history.map((h) => ({
            date: h.date,
            price: h.shelfPrice,
            isOnOffer: h.isOnOffer,
          })),
          currentPrice: history[0]?.shelfPrice,
        };
      }),
    );

    res.json({
      items: allHistory.filter(Boolean),
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ message: 'Error fetching price history' });
  }
};

export const getDeals = async (req: Request, res: Response) => {
  try {
    const { store, limit } = req.query;
    const pageLimit = parseInt(limit as string) || 20;

    if (store) {
      const deals = await getDealsForStore(store as UKStore, pageLimit);
      return res.json({
        items: deals.map((d) => ({
          ...d,
          storeName: STORE_METADATA[d.store]?.name || d.store,
        })),
        hasMore: false,
      });
    }

    // Get deals from all available stores
    const stores: UKStore[] = ['TESCO', 'ASDA', 'SAINSBURYS'];
    const allDeals = await Promise.all(
      stores.map((s) => getDealsForStore(s, 10)),
    );

    const combined = allDeals
      .flat()
      .map((d) => ({
        ...d,
        storeName: STORE_METADATA[d.store]?.name || d.store,
      }))
      .slice(0, pageLimit);

    res.json({ items: combined, hasMore: false });
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ message: 'Error fetching deals' });
  }
};

export const getStores = async (req: Request, res: Response) => {
  try {
    const stores = Object.entries(STORE_METADATA).map(([code, meta]) => ({
      store: code,
      name: meta.name,
      colour: meta.colour,
      websiteUrl: meta.baseUrl,
      hasOnlineGroceries: meta.hasOnlineGroceries,
      loyaltyScheme: meta.loyaltyScheme,
      tier: meta.tier,
    }));

    res.json({ items: stores });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ message: 'Error fetching stores' });
  }
};
