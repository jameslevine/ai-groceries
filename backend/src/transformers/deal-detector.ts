import {
  ScrapedProduct,
  OfferType,
  PriceRecord,
  UKStore,
} from '../scrapers/types';

/**
 * Detects and classifies deals from scraped product data.
 * Compares current prices against previous prices to identify price drops,
 * and extracts offer information from product data.
 */

export interface DetectedDeal {
  barcode?: string;
  storeProductId: string;
  productName: string;
  store: UKStore;
  storeName: string;
  currentPrice: number;
  previousPrice?: number;
  loyaltyPrice?: number;
  loyaltyScheme?: string;
  savingsAmount: number;
  savingsPercentage: number;
  offerType: OfferType;
  offerDescription: string;
  validUntil?: string;
  detectedAt: string;
}

/**
 * Detect deals from a scraped product by analysing its pricing data.
 */
export const detectDealFromProduct = (
  product: ScrapedProduct,
  store: UKStore,
  storeName: string,
  previousPrice?: number,
): DetectedDeal | null => {
  // Check for explicit offers
  if (product.isOnOffer && product.offerDescription) {
    const savings = calculateSavings(product);
    if (savings.amount > 0) {
      return {
        barcode: product.barcode,
        storeProductId: product.storeProductId,
        productName: product.name,
        store,
        storeName,
        currentPrice: product.price,
        previousPrice: product.originalPrice,
        loyaltyPrice: getLoyaltyPrice(product),
        loyaltyScheme: getLoyaltyScheme(product),
        savingsAmount: savings.amount,
        savingsPercentage: savings.percentage,
        offerType: product.offerType || 'PRICE_CUT',
        offerDescription: product.offerDescription,
        validUntil: product.offerValidUntil,
        detectedAt: product.scrapedAt,
      };
    }
  }

  // Check for loyalty card savings
  const loyaltyPrice = getLoyaltyPrice(product);
  if (loyaltyPrice && loyaltyPrice < product.price) {
    const savingsAmount = product.price - loyaltyPrice;
    const savingsPercentage = (savingsAmount / product.price) * 100;

    return {
      barcode: product.barcode,
      storeProductId: product.storeProductId,
      productName: product.name,
      store,
      storeName,
      currentPrice: product.price,
      loyaltyPrice,
      loyaltyScheme: getLoyaltyScheme(product),
      savingsAmount,
      savingsPercentage,
      offerType: 'LOYALTY_PRICE',
      offerDescription: `${getLoyaltyScheme(product)} price: £${(loyaltyPrice / 100).toFixed(2)} (save £${(savingsAmount / 100).toFixed(2)})`,
      detectedAt: product.scrapedAt,
    };
  }

  // Check for price drop vs previous price
  if (previousPrice && product.price < previousPrice) {
    const savingsAmount = previousPrice - product.price;
    const savingsPercentage = (savingsAmount / previousPrice) * 100;

    // Only flag as a deal if savings are significant (>5%)
    if (savingsPercentage >= 5) {
      return {
        barcode: product.barcode,
        storeProductId: product.storeProductId,
        productName: product.name,
        store,
        storeName,
        currentPrice: product.price,
        previousPrice,
        savingsAmount,
        savingsPercentage,
        offerType: 'PRICE_CUT',
        offerDescription: `Price dropped from £${(previousPrice / 100).toFixed(2)} to £${(product.price / 100).toFixed(2)}`,
        detectedAt: product.scrapedAt,
      };
    }
  }

  return null;
};

/**
 * Calculate savings from a product's offer data.
 */
const calculateSavings = (
  product: ScrapedProduct,
): { amount: number; percentage: number } => {
  if (product.originalPrice && product.originalPrice > product.price) {
    const amount = product.originalPrice - product.price;
    const percentage = (amount / product.originalPrice) * 100;
    return { amount, percentage };
  }

  // Try to parse savings from offer description
  if (product.offerDescription) {
    const wasMatch = product.offerDescription.match(/was\s*£?([\d.]+)/i);
    if (wasMatch) {
      const wasPrice = Math.round(parseFloat(wasMatch[1]) * 100);
      if (wasPrice > product.price) {
        const amount = wasPrice - product.price;
        const percentage = (amount / wasPrice) * 100;
        return { amount, percentage };
      }
    }
  }

  return { amount: 0, percentage: 0 };
};

/**
 * Get the best loyalty card price from a product.
 */
const getLoyaltyPrice = (product: ScrapedProduct): number | undefined => {
  const prices = [
    product.clubcardPrice,
    product.nectarPrice,
    product.moreCardPrice,
    product.lidlPlusPrice,
    product.myWaitrosePrice,
    product.memberPrice,
    product.smartPassPrice,
  ].filter((p): p is number => p !== undefined && p !== null && p > 0);

  return prices.length > 0 ? Math.min(...prices) : undefined;
};

/**
 * Get the loyalty scheme name for a product.
 */
const getLoyaltyScheme = (product: ScrapedProduct): string | undefined => {
  if (product.clubcardPrice) return 'Clubcard';
  if (product.nectarPrice) return 'Nectar';
  if (product.moreCardPrice) return 'More Card';
  if (product.lidlPlusPrice) return 'Lidl Plus';
  if (product.myWaitrosePrice) return 'myWaitrose';
  if (product.memberPrice) return 'Co-op Member';
  if (product.smartPassPrice) return 'Smart Pass';
  return undefined;
};

/**
 * Batch detect deals from an array of scraped products.
 */
export const detectDeals = (
  products: ScrapedProduct[],
  store: UKStore,
  storeName: string,
  previousPrices?: Map<string, number>,
): DetectedDeal[] => {
  const deals: DetectedDeal[] = [];

  for (const product of products) {
    const previousPrice = previousPrices?.get(product.storeProductId);
    const deal = detectDealFromProduct(
      product,
      store,
      storeName,
      previousPrice,
    );
    if (deal) {
      deals.push(deal);
    }
  }

  // Sort by savings percentage (best deals first)
  deals.sort((a, b) => b.savingsPercentage - a.savingsPercentage);

  return deals;
};
