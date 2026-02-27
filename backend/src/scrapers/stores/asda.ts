import { BaseScraper } from '../base-scraper';
import {
  ScraperConfig,
  ScrapedProduct,
  StoreCategory,
  STORE_METADATA,
  DEFAULT_USER_AGENTS,
} from '../types';
import axios from 'axios';

/**
 * ASDA Grocery Scraper
 *
 * ASDA uses Algolia for their product search. The Algolia API is publicly
 * accessible with a read-only API key embedded in their frontend JavaScript.
 *
 * This scraper queries the Algolia ASDA_PRODUCTS index directly, which:
 * - Returns structured JSON (no HTML parsing needed)
 * - Works from any IP (no WAF/bot protection)
 * - Supports pagination, filtering, and faceting
 * - Returns up to 1000 hits per query
 *
 * Key Algolia config:
 * - Application ID: 8I6WSKCCNV
 * - API Key: 03e4272048dd17f771da37b57ff8a75e (read-only, public)
 * - Index: ASDA_PRODUCTS
 */

const ALGOLIA_APP_ID = '8I6WSKCCNV';
const ALGOLIA_API_KEY = '03e4272048dd17f771da37b57ff8a75e';
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID.toLowerCase()}-dsn.algolia.net/1/indexes/*/queries`;
const ALGOLIA_INDEX = 'ASDA_PRODUCTS';

// Base filter: active products, available online, in stock
const BASE_FILTER = '(STATUS:A OR STATUS:I) AND NOT DISPLAY_ONLINE:false';

// Attributes to retrieve from Algolia
const ATTRIBUTES_TO_RETRIEVE = [
  'STATUS',
  'BRAND',
  'CIN',
  'NAME',
  'AVG_RATING',
  'RATING_COUNT',
  'ICONS',
  'PRICES.EN',
  'SALES_TYPE',
  'MAX_QTY',
  'IS_FROZEN',
  'IS_BWS',
  'PROMOS.EN',
  'LABEL',
  'PRODUCT_TYPE',
  'CIN_ID',
  'PRIMARY_TAXONOMY',
  'IMAGE_ID',
  'PACK_SIZE',
  'SIZE_DESC',
  'REWARDS',
  'SHOW_PRICE_CS',
].join(',');

const ASDA_CATEGORIES: StoreCategory[] = [
  { id: 'fruit-veg', name: 'Fruit & Vegetables', url: 'fruit vegetables' },
  { id: 'meat-poultry', name: 'Meat & Poultry', url: 'meat poultry' },
  { id: 'fish-seafood', name: 'Fish & Seafood', url: 'fish seafood' },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    url: 'milk eggs cheese butter yoghurt',
  },
  { id: 'bread-bakery', name: 'Bread & Bakery', url: 'bread rolls bakery' },
  {
    id: 'cereals',
    name: 'Cereals & Breakfast',
    url: 'cereal porridge breakfast',
  },
  { id: 'pasta-rice', name: 'Pasta, Rice & Grains', url: 'pasta rice noodles' },
  { id: 'tinned', name: 'Tinned & Canned', url: 'tinned beans soup canned' },
  {
    id: 'sauces',
    name: 'Sauces & Condiments',
    url: 'sauce ketchup mayonnaise',
  },
  { id: 'snacks', name: 'Snacks & Crisps', url: 'crisps snacks nuts' },
  {
    id: 'biscuits',
    name: 'Biscuits & Confectionery',
    url: 'biscuits chocolate sweets',
  },
  { id: 'frozen', name: 'Frozen Food', url: 'frozen chips pizza ice cream' },
  {
    id: 'drinks',
    name: 'Drinks & Beverages',
    url: 'juice squash water fizzy drinks',
  },
  { id: 'tea-coffee', name: 'Tea & Coffee', url: 'tea coffee' },
  { id: 'alcohol', name: 'Alcohol', url: 'beer wine spirits lager' },
  { id: 'baby', name: 'Baby & Toddler', url: 'baby nappies formula' },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    url: 'shampoo toothpaste deodorant',
  },
  {
    id: 'household',
    name: 'Household & Cleaning',
    url: 'washing detergent cleaning',
  },
  { id: 'pet', name: 'Pet Food & Supplies', url: 'dog food cat food pet' },
];

interface AlgoliaHit {
  NAME: string;
  BRAND?: string;
  CIN: string;
  CIN_ID?: string;
  PRICES?: {
    EN?: {
      PRICE?: number;
      WASPRICE?: number;
      OFFER?: string;
      PRICEPERUOM?: number;
      PRICEPERUOMFORMATTED?: string;
    };
  };
  PROMOS?: {
    EN?: Array<{
      PROMO_TEXT?: string;
      PROMO_TYPE?: string;
      START_DATE?: number;
      END_DATE?: number;
    }>;
  };
  PACK_SIZE?: string;
  SIZE_DESC?: string;
  IMAGE_ID?: string;
  PRIMARY_TAXONOMY?: {
    SHELF_NAME?: string;
    AISLE_NAME?: string;
    DEPT_NAME?: string;
    SHELF_ID?: string;
  };
  AVG_RATING?: number;
  RATING_COUNT?: number;
  ICONS?: string[];
  IS_FROZEN?: boolean;
  IS_BWS?: boolean;
  PRODUCT_TYPE?: string;
  REWARDS?: any;
  objectID?: string;
}

interface AlgoliaResponse {
  results: Array<{
    hits: AlgoliaHit[];
    nbHits: number;
    page: number;
    nbPages: number;
    hitsPerPage: number;
  }>;
}

export class AsdaScraper extends BaseScraper {
  private static readonly HITS_PER_PAGE = 50;
  private static readonly BASE_URL = 'https://groceries.asda.com';

  constructor() {
    const meta = STORE_METADATA.ASDA;
    const config: ScraperConfig = {
      store: 'ASDA',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: ALGOLIA_URL,
      maxConcurrency: 2,
      requestDelayMs: 500, // Algolia can handle faster requests
      maxRetries: 3,
      timeoutMs: 15000,
      maxProducts: 50000,
      categories: ASDA_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
    };
    super(config);
  }

  async getCategories(): Promise<StoreCategory[]> {
    return ASDA_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    // For ASDA, categories are searched via Algolia using category keywords
    return this.performSearch(category.url, 1000);
  }

  async scrapeProduct(productIdOrUrl: string): Promise<ScrapedProduct | null> {
    try {
      // Search by CIN (product ID)
      const products = await this.queryAlgolia(productIdOrUrl, 1, 0);
      return products.length > 0 ? products[0] : null;
    } catch (error: any) {
      console.error(
        `[ASDA] Error scraping product ${productIdOrUrl}: ${error.message}`,
      );
      return null;
    }
  }

  protected async performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const pages = Math.ceil(Math.min(limit, 1000) / AsdaScraper.HITS_PER_PAGE);

    for (let page = 0; page < pages; page++) {
      try {
        const pageProducts = await this.queryAlgolia(
          query,
          AsdaScraper.HITS_PER_PAGE,
          page,
        );

        if (pageProducts.length === 0) break;
        products.push(...pageProducts);

        if (products.length >= limit) break;

        // Rate limiting between pages
        await this.sleep(this.config.requestDelayMs);
      } catch (error: any) {
        console.error(`[ASDA] Search error page ${page}: ${error.message}`);
        break;
      }
    }

    return products.slice(0, limit);
  }

  /**
   * Query the Algolia ASDA_PRODUCTS index.
   */
  private async queryAlgolia(
    query: string,
    hitsPerPage: number,
    page: number,
  ): Promise<ScrapedProduct[]> {
    const attrList = ATTRIBUTES_TO_RETRIEVE.split(',')
      .map((a) => `%22${a.trim()}%22`)
      .join('%2C');

    const params = [
      `hitsPerPage=${hitsPerPage}`,
      `page=${page}`,
      `filters=${encodeURIComponent(BASE_FILTER)}`,
      `attributesToRetrieve=%5B${attrList}%5D`,
      `analytics=false`,
    ].join('&');

    const response = await axios.post<AlgoliaResponse>(
      `${ALGOLIA_URL}?x-algolia-agent=Algolia%20for%20JavaScript%20(4.25.2)`,
      JSON.stringify({
        requests: [
          {
            indexName: ALGOLIA_INDEX,
            query,
            params,
          },
        ],
      }),
      {
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: 'https://www.asda.com',
          Referer: 'https://www.asda.com/',
          'x-algolia-api-key': ALGOLIA_API_KEY,
          'x-algolia-application-id': ALGOLIA_APP_ID,
        },
        timeout: this.config.timeoutMs,
      },
    );

    const result = response.data.results[0];
    if (!result || !result.hits) return [];

    console.log(
      `[ASDA] Algolia query "${query}" page ${page}: ${result.hits.length} hits (${result.nbHits} total)`,
    );

    return result.hits
      .map((hit) => this.mapAlgoliaHit(hit))
      .filter((p): p is ScrapedProduct => p !== null);
  }

  /**
   * Map an Algolia hit to our ScrapedProduct interface.
   */
  private mapAlgoliaHit(hit: AlgoliaHit): ScrapedProduct | null {
    try {
      const prices = hit.PRICES?.EN;
      if (!hit.NAME || !prices?.PRICE) return null;

      const price = Math.round(prices.PRICE * 100);
      if (price <= 0) return null;

      // Was price / offers
      let originalPrice: number | undefined;
      let isOnOffer = false;
      let offerDescription: string | undefined;
      let offerType: ScrapedProduct['offerType'];

      if (prices.WASPRICE && prices.WASPRICE > prices.PRICE) {
        originalPrice = Math.round(prices.WASPRICE * 100);
        isOnOffer = true;
        offerType = 'PRICE_CUT';
        offerDescription = `Was £${prices.WASPRICE.toFixed(2)}`;
      }

      if (prices.OFFER === 'Dropped') {
        isOnOffer = true;
        if (!offerType) offerType = 'PRICE_CUT';
        offerDescription = offerDescription || 'Price Dropped';
      }

      // Promotions
      const promos = hit.PROMOS?.EN;
      if (promos && promos.length > 0) {
        const promo = promos[0];
        isOnOffer = true;
        offerDescription = promo.PROMO_TEXT || offerDescription;
        if (promo.PROMO_TEXT?.toLowerCase().includes('buy')) {
          offerType = 'MULTI_BUY';
        } else if (!offerType) {
          offerType = 'PRICE_CUT';
        }
      }

      // Price per unit
      let pricePerUnit: number | undefined;
      let unitForPricing: string | undefined;
      if (prices.PRICEPERUOM) {
        pricePerUnit = Math.round(prices.PRICEPERUOM * 100);
        unitForPricing = prices.PRICEPERUOMFORMATTED
          ? prices.PRICEPERUOMFORMATTED.replace(/^[\d.£p]+/, '').trim() ||
            'per unit'
          : undefined;
      }

      // Category from taxonomy
      const category =
        hit.PRIMARY_TAXONOMY?.SHELF_NAME ||
        hit.PRIMARY_TAXONOMY?.AISLE_NAME ||
        hit.PRIMARY_TAXONOMY?.DEPT_NAME ||
        'Other';

      // Image URL
      const imageUrl = hit.IMAGE_ID
        ? `https://ui.assets-asda.com/dm/asdagroceries/${hit.IMAGE_ID}?defaultImage=asdagroceries/noImageAvailable&resMode=sharp2&id=&fmt=webp&dpr=off&fit=constrain,1&wid=300&hei=300`
        : undefined;

      return {
        storeProductId: hit.CIN || hit.objectID || '',
        name: hit.NAME.trim(),
        brand: hit.BRAND || undefined,
        price,
        pricePerUnit,
        unitForPricing,
        isOnOffer,
        offerType,
        offerDescription,
        originalPrice,
        category,
        weight: hit.PACK_SIZE || hit.SIZE_DESC || this.extractWeight(hit.NAME),
        imageUrl,
        productUrl: `${AsdaScraper.BASE_URL}/product/${hit.CIN}`,
        isAvailable: true,
        scrapedAt: this.now(),
      };
    } catch (error: any) {
      console.error(`[ASDA] Error mapping product: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract weight/volume from product name.
   */
  private extractWeight(name: string): string | undefined {
    if (!name) return undefined;
    const match = name.match(
      /(\d+(?:\.\d+)?)\s*(ml|l|g|kg|cl|pk|pack|pint|pints|litre|litres)\b/i,
    );
    return match ? `${match[1]}${match[2]}` : undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
