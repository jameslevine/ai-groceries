import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  GetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { dynamodb } from './dynamodb';
import { TABLES } from '../constants';
import {
  CanonicalProduct,
  PriceRecord,
  ScrapedProduct,
  UKStore,
  STORE_METADATA,
} from '../scrapers/types';
import { mapCategory } from '../transformers/category-mapper';

const PRODUCTS_TABLE = TABLES.PRODUCTS;
const PRICE_HISTORY_TABLE = TABLES.PRICE_HISTORY;

// ==================== Product Operations ====================

/**
 * Get a canonical product by barcode.
 */
export const getProductByBarcode = async (
  barcode: string,
): Promise<CanonicalProduct | null> => {
  const params = {
    TableName: PRODUCTS_TABLE,
    Key: {
      pk: `PRODUCT#${barcode}`,
      sk: 'META',
    },
  };

  try {
    const response = await dynamodb.send(new GetCommand(params));
    return (response.Item as CanonicalProduct) || null;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    throw error;
  }
};

/**
 * Create or update a canonical product from scraped data.
 */
export const upsertProductFromScrape = async (
  scraped: ScrapedProduct,
  store: UKStore,
): Promise<CanonicalProduct> => {
  const barcode = scraped.barcode;
  if (!barcode) {
    // Products without barcodes get a generated ID based on store + storeProductId
    const syntheticBarcode = `${store}-${scraped.storeProductId}`;
    return upsertProductWithBarcode(scraped, store, syntheticBarcode);
  }
  return upsertProductWithBarcode(scraped, store, barcode);
};

const upsertProductWithBarcode = async (
  scraped: ScrapedProduct,
  store: UKStore,
  barcode: string,
): Promise<CanonicalProduct> => {
  const now = dayjs().toISOString();
  const existing = await getProductByBarcode(barcode);
  const categoryMapping = mapCategory(scraped.category, store);
  const storeMeta = STORE_METADATA[store];

  if (existing) {
    // Update existing product — add/update store mapping
    const updatedStoreProducts = {
      ...existing.storeProducts,
      [store]: {
        storeProductId: scraped.storeProductId,
        storeName: storeMeta.name,
        productUrl: scraped.productUrl,
      },
    };

    const params = {
      TableName: PRODUCTS_TABLE,
      Key: {
        pk: `PRODUCT#${barcode}`,
        sk: 'META',
      },
      UpdateExpression:
        'SET #storeProducts = :storeProducts, #lastUpdated = :lastUpdated, #imageUrl = if_not_exists(#imageUrl, :imageUrl), #brand = if_not_exists(#brand, :brand), #description = if_not_exists(#description, :description), #weight = if_not_exists(#weight, :weight)',
      ExpressionAttributeNames: {
        '#storeProducts': 'storeProducts',
        '#lastUpdated': 'lastUpdated',
        '#imageUrl': 'imageUrl',
        '#brand': 'brand',
        '#description': 'description',
        '#weight': 'weight',
      },
      ExpressionAttributeValues: {
        ':storeProducts': updatedStoreProducts,
        ':lastUpdated': now,
        ':imageUrl': scraped.imageUrl || existing.imageUrl,
        ':brand': scraped.brand || existing.brand,
        ':description': scraped.description || existing.description,
        ':weight': scraped.weight || existing.weight,
      },
      ReturnValues: 'ALL_NEW' as const,
    };

    const response = await dynamodb.send(new UpdateCommand(params));
    return response.Attributes as CanonicalProduct;
  }

  // Create new product
  const product: CanonicalProduct = {
    productId: uuidv4(),
    barcode,
    name: scraped.name,
    brand: scraped.brand,
    category: categoryMapping.standardCategory,
    subcategory: categoryMapping.standardSubcategory,
    imageUrl: scraped.imageUrl,
    description: scraped.description,
    weight: scraped.weight,
    unit: extractUnit(scraped.weight),
    storeProducts: {
      [store]: {
        storeProductId: scraped.storeProductId,
        storeName: storeMeta.name,
        productUrl: scraped.productUrl,
      },
    },
    qualityScore: calculateQualityScore(scraped),
    matchConfidence: scraped.barcode ? 1.0 : 0.5,
    lastUpdated: now,
    createdAt: now,
  };

  const params = {
    TableName: PRODUCTS_TABLE,
    Item: {
      pk: `PRODUCT#${barcode}`,
      sk: 'META',
      gsi1pk: `CAT#${product.category}`,
      gsi1sk: `NAME#${product.name}`,
      ...product,
    },
  };

  await dynamodb.send(new PutCommand(params));
  return product;
};

// ==================== Price Operations ====================

/**
 * Record a price for a product at a store.
 * Writes both the "latest" price and a historical entry.
 */
export const recordPrice = async (
  scraped: ScrapedProduct,
  store: UKStore,
  barcode: string,
  productId: string,
): Promise<PriceRecord> => {
  const now = dayjs();
  const date = now.format('YYYY-MM-DD');
  const storeMeta = STORE_METADATA[store];

  // Determine loyalty price
  const loyaltyPrice = getBestLoyaltyPrice(scraped);
  const loyaltyScheme = getLoyaltyScheme(scraped);
  const effectivePrice = loyaltyPrice
    ? Math.min(scraped.price, loyaltyPrice)
    : scraped.price;

  const priceRecord: PriceRecord = {
    productId,
    barcode,
    store,
    date,
    shelfPrice: scraped.price,
    loyaltyPrice: loyaltyPrice || undefined,
    loyaltyScheme: loyaltyScheme || undefined,
    effectivePrice,
    pricePerUnit: scraped.pricePerUnit,
    unitForPricing: scraped.unitForPricing,
    isOnOffer: scraped.isOnOffer,
    offerType: scraped.offerType,
    offerDescription: scraped.offerDescription,
    originalPrice: scraped.originalPrice,
    scrapedAt: scraped.scrapedAt,
  };

  // Write latest price (overwrite)
  const latestParams = {
    TableName: PRODUCTS_TABLE,
    Item: {
      pk: `PRODUCT#${barcode}`,
      sk: `PRICE#${store}#LATEST`,
      gsi2pk: `STORE#${store}`,
      gsi2sk: `CAT#${scraped.category}#${scraped.name}`,
      ...priceRecord,
      storeName: storeMeta.name,
      productName: scraped.name,
    },
  };

  // Write historical price entry
  const historyParams = {
    TableName: PRICE_HISTORY_TABLE,
    Item: {
      pk: `PRODUCT#${barcode}`,
      sk: `HIST#${store}#${date}`,
      ...priceRecord,
      ttl: Math.floor(now.add(365, 'day').valueOf() / 1000), // TTL: 1 year
    },
  };

  await Promise.all([
    dynamodb.send(new PutCommand(latestParams)),
    dynamodb.send(new PutCommand(historyParams)),
  ]);

  return priceRecord;
};

/**
 * Get latest prices for a product across all stores.
 */
export const getLatestPrices = async (
  barcode: string,
): Promise<PriceRecord[]> => {
  const params = {
    TableName: PRODUCTS_TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
    ExpressionAttributeValues: {
      ':pk': `PRODUCT#${barcode}`,
      ':skPrefix': 'PRICE#',
    },
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return (response.Items || []) as PriceRecord[];
  } catch (error) {
    console.error('Error fetching latest prices:', error);
    throw error;
  }
};

/**
 * Get price history for a product at a specific store.
 */
export const getPriceHistory = async (
  barcode: string,
  store: UKStore,
  days: number = 90,
): Promise<PriceRecord[]> => {
  const startDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD');
  const endDate = dayjs().format('YYYY-MM-DD');

  const params = {
    TableName: PRICE_HISTORY_TABLE,
    KeyConditionExpression: 'pk = :pk AND sk BETWEEN :start AND :end',
    ExpressionAttributeValues: {
      ':pk': `PRODUCT#${barcode}`,
      ':start': `HIST#${store}#${startDate}`,
      ':end': `HIST#${store}#${endDate}~`,
    },
    ScanIndexForward: false,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return (response.Items || []) as PriceRecord[];
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw error;
  }
};

/**
 * Search products by category.
 */
export const searchProductsByCategory = async (
  category: string,
  limit: number = 20,
  lastKey?: Record<string, any>,
): Promise<{ items: CanonicalProduct[]; lastKey?: Record<string, any> }> => {
  const params = {
    TableName: PRODUCTS_TABLE,
    IndexName: 'gsi1',
    KeyConditionExpression: 'gsi1pk = :gsi1pk',
    ExpressionAttributeValues: {
      ':gsi1pk': `CAT#${category}`,
    },
    Limit: limit,
    ExclusiveStartKey: lastKey,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return {
      items: (response.Items || []) as CanonicalProduct[],
      lastKey: response.LastEvaluatedKey,
    };
  } catch (error) {
    console.error('Error searching products by category:', error);
    throw error;
  }
};

/**
 * Get deals for a specific store.
 */
export const getDealsForStore = async (
  store: UKStore,
  limit: number = 50,
): Promise<PriceRecord[]> => {
  const params = {
    TableName: PRODUCTS_TABLE,
    IndexName: 'gsi2',
    KeyConditionExpression: 'gsi2pk = :gsi2pk',
    FilterExpression: 'isOnOffer = :isOnOffer',
    ExpressionAttributeValues: {
      ':gsi2pk': `STORE#${store}`,
      ':isOnOffer': true,
    },
    Limit: limit,
  };

  try {
    const response = await dynamodb.send(new QueryCommand(params));
    return (response.Items || []) as PriceRecord[];
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
};

// ==================== Batch Operations ====================

/**
 * Batch upsert products and record prices from a scrape result.
 * This is the main entry point for the transform pipeline.
 */
export const ingestScrapedProducts = async (
  products: ScrapedProduct[],
  store: UKStore,
): Promise<{
  productsUpserted: number;
  pricesRecorded: number;
  errors: number;
}> => {
  let productsUpserted = 0;
  let pricesRecorded = 0;
  let errors = 0;

  for (const scraped of products) {
    try {
      const product = await upsertProductFromScrape(scraped, store);
      productsUpserted++;

      const barcode = scraped.barcode || `${store}-${scraped.storeProductId}`;
      await recordPrice(scraped, store, barcode, product.productId);
      pricesRecorded++;
    } catch (error: any) {
      errors++;
      console.error(
        `Error ingesting product ${scraped.name}: ${error.message}`,
      );
    }
  }

  return { productsUpserted, pricesRecorded, errors };
};

// ==================== Helpers ====================

const getBestLoyaltyPrice = (product: ScrapedProduct): number | null => {
  const prices = [
    product.clubcardPrice,
    product.nectarPrice,
    product.moreCardPrice,
    product.lidlPlusPrice,
    product.myWaitrosePrice,
    product.memberPrice,
    product.smartPassPrice,
  ].filter((p): p is number => p !== undefined && p !== null && p > 0);

  return prices.length > 0 ? Math.min(...prices) : null;
};

const getLoyaltyScheme = (product: ScrapedProduct): string | null => {
  if (product.clubcardPrice) return 'Clubcard';
  if (product.nectarPrice) return 'Nectar';
  if (product.moreCardPrice) return 'More Card';
  if (product.lidlPlusPrice) return 'Lidl Plus';
  if (product.myWaitrosePrice) return 'myWaitrose';
  if (product.memberPrice) return 'Co-op Member';
  if (product.smartPassPrice) return 'Smart Pass';
  return null;
};

const extractUnit = (weight?: string): string | undefined => {
  if (!weight) return undefined;
  const match = weight.match(/(ml|l|g|kg|cl)\b/i);
  return match ? match[1].toLowerCase() : undefined;
};

const calculateQualityScore = (product: ScrapedProduct): number => {
  let score = 0;
  if (product.barcode) score += 20;
  if (product.imageUrl) score += 15;
  if (product.description) score += 10;
  if (product.weight) score += 10;
  if (product.brand) score += 10;
  if (product.category) score += 10;
  if (product.pricePerUnit) score += 10;
  if (product.price > 0) score += 15;
  return Math.min(score, 100);
};
