import { BaseScraper } from '../base-scraper';
import {
  ScraperConfig,
  ScrapedProduct,
  StoreCategory,
  STORE_METADATA,
  DEFAULT_USER_AGENTS,
} from '../types';

/**
 * Waitrose Scraper
 *
 * Uses Waitrose's REST API endpoints.
 * Features myWaitrose loyalty pricing and Essential Waitrose range.
 */

const WAITROSE_CATEGORIES: StoreCategory[] = [
  {
    id: 'fruit-veg',
    name: 'Fruit & Vegetables',
    url: '/api/custsearch-prod/v3/search/-1/fruit-and-vegetables',
  },
  {
    id: 'meat-fish',
    name: 'Meat & Fish',
    url: '/api/custsearch-prod/v3/search/-1/meat-and-fish',
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy, Eggs & Chilled',
    url: '/api/custsearch-prod/v3/search/-1/dairy-eggs-and-chilled',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    url: '/api/custsearch-prod/v3/search/-1/bakery',
  },
  {
    id: 'frozen',
    name: 'Frozen',
    url: '/api/custsearch-prod/v3/search/-1/frozen',
  },
  {
    id: 'food-cupboard',
    name: 'Food Cupboard',
    url: '/api/custsearch-prod/v3/search/-1/food-cupboard',
  },
  {
    id: 'drinks',
    name: 'Drinks',
    url: '/api/custsearch-prod/v3/search/-1/drinks',
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    url: '/api/custsearch-prod/v3/search/-1/health-and-beauty',
  },
  {
    id: 'household',
    name: 'Household',
    url: '/api/custsearch-prod/v3/search/-1/household',
  },
  {
    id: 'baby',
    name: 'Baby & Toddler',
    url: '/api/custsearch-prod/v3/search/-1/baby-and-toddler',
  },
  { id: 'pet', name: 'Pet', url: '/api/custsearch-prod/v3/search/-1/pet' },
  {
    id: 'beer-wine-spirits',
    name: 'Beer, Wine & Spirits',
    url: '/api/custsearch-prod/v3/search/-1/beer-wine-and-spirits',
  },
];

interface WaitroseApiResponse {
  componentsAndProducts?: Array<{
    products?: WaitroseProduct[];
  }>;
  totalMatches?: number;
}

interface WaitroseProduct {
  id: string;
  lineNumber?: string;
  name: string;
  brand?: string;
  currentSaleUnitPrice?: { price: { amount: number; currencyCode: string } };
  typicalWeight?: string;
  size?: string;
  thumbnail?: string;
  displayPriceQualifier?: string;
  myWaitrosePrice?: { amount: number };
  promotions?: Array<{
    promotionDescription: string;
    promotionType: string;
    endDate?: string;
  }>;
  available?: boolean;
  categories?: Array<{ name: string }>;
}

export class WaitroseScraper extends BaseScraper {
  private static readonly BASE_URL = 'https://www.waitrose.com';
  private static readonly PRODUCTS_PER_PAGE = 48;

  constructor() {
    const meta = STORE_METADATA.WAITROSE;
    super({
      store: 'WAITROSE',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: meta.searchUrl,
      maxConcurrency: 1,
      requestDelayMs: 1500,
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 30000,
      categories: WAITROSE_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
      headers: { Accept: 'application/json' },
    });
  }

  async getCategories(): Promise<StoreCategory[]> {
    return WAITROSE_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${WaitroseScraper.BASE_URL}${category.url}?size=${WaitroseScraper.PRODUCTS_PER_PAGE}&page=${page}`;
        const data = await this.httpClient.getJson<WaitroseApiResponse>(url);
        const items =
          data.componentsAndProducts?.flatMap((c) => c.products || []) || [];
        if (items.length === 0) {
          hasMore = false;
          continue;
        }
        const mapped = items
          .map((p) => this.mapProduct(p, category.name))
          .filter((p): p is ScrapedProduct => p !== null);
        products.push(...mapped);
        page++;
        if (products.length >= 4000 || page > 60) hasMore = false;
      } catch (error: any) {
        console.error(
          `[Waitrose] Error page ${page} of ${category.name}: ${error.message}`,
        );
        hasMore = false;
      }
    }
    return products;
  }

  async scrapeProduct(productIdOrUrl: string): Promise<ScrapedProduct | null> {
    try {
      const results = await this.performSearch(productIdOrUrl, 1);
      return results[0] || null;
    } catch {
      return null;
    }
  }

  protected async performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]> {
    try {
      const url = `${WaitroseScraper.BASE_URL}/api/custsearch-prod/v3/search/-1?query=${encodeURIComponent(query)}&size=${limit}`;
      const data = await this.httpClient.getJson<WaitroseApiResponse>(url);
      const items =
        data.componentsAndProducts?.flatMap((c) => c.products || []) || [];
      return items
        .map((p) => this.mapProduct(p, 'search'))
        .filter((p): p is ScrapedProduct => p !== null)
        .slice(0, limit);
    } catch (error: any) {
      console.error(`[Waitrose] Search error: ${error.message}`);
      return [];
    }
  }

  private mapProduct(
    product: WaitroseProduct,
    categoryName: string,
  ): ScrapedProduct | null {
    try {
      const price = Math.round(
        (product.currentSaleUnitPrice?.price?.amount || 0) * 100,
      );
      if (price <= 0) return null;

      const myWaitrosePrice = product.myWaitrosePrice
        ? Math.round(product.myWaitrosePrice.amount * 100)
        : undefined;
      let isOnOffer = false;
      let offerType: ScrapedProduct['offerType'];
      let offerDescription: string | undefined;

      if (myWaitrosePrice && myWaitrosePrice < price) {
        isOnOffer = true;
        offerType = 'LOYALTY_PRICE';
        offerDescription = `myWaitrose price: £${(myWaitrosePrice / 100).toFixed(2)}`;
      }

      if (product.promotions && product.promotions.length > 0) {
        isOnOffer = true;
        offerDescription = product.promotions[0].promotionDescription;
        if (!offerType) offerType = 'PRICE_CUT';
      }

      return {
        storeProductId: product.id || product.lineNumber || '',
        name: product.name,
        brand: product.brand,
        price,
        myWaitrosePrice,
        isOnOffer,
        offerType,
        offerDescription,
        category: categoryName,
        weight: product.size || product.typicalWeight,
        imageUrl: product.thumbnail,
        productUrl: `${WaitroseScraper.BASE_URL}/ecom/products/${product.lineNumber || product.id}`,
        isAvailable: product.available !== false,
        scrapedAt: this.now(),
      };
    } catch {
      return null;
    }
  }
}
