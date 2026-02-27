// ==================== Store Identifiers ====================

export type UKStore =
  | 'TESCO'
  | 'SAINSBURYS'
  | 'ASDA'
  | 'MORRISONS'
  | 'ALDI'
  | 'LIDL'
  | 'WAITROSE'
  | 'OCADO'
  | 'COOP'
  | 'MS_FOOD';

// ==================== Offer Types ====================

export type OfferType =
  | 'PRICE_CUT'
  | 'MULTI_BUY'
  | 'LOYALTY_PRICE'
  | 'ROLLBACK'
  | 'MEAL_DEAL'
  | 'BUNDLE'
  | 'PERCENTAGE_OFF'
  | 'BOGOF'
  | 'HALF_PRICE';

// ==================== Scraper Configuration ====================

export interface ScraperConfig {
  store: UKStore;
  storeName: string;
  baseUrl: string;
  searchUrl: string;
  maxConcurrency: number;
  requestDelayMs: number;
  maxRetries: number;
  timeoutMs: number;
  maxProducts: number;
  categories: StoreCategory[];
  userAgents: string[];
  proxyConfig?: ProxyConfig;
  headers?: Record<string, string>;
}

export interface StoreCategory {
  id: string;
  name: string;
  url: string;
  subcategories?: StoreCategory[];
}

export interface ProxyConfig {
  enabled: boolean;
  urls: string[];
  rotateAfterRequests: number;
}

// ==================== Scraped Product (Raw) ====================

export interface ScrapedProduct {
  // Identity
  storeProductId: string;
  barcode?: string;
  name: string;
  brand?: string;

  // Pricing (all in pence)
  price: number;
  pricePerUnit?: number;
  unitForPricing?: string;

  // Loyalty Pricing (all in pence, undefined if not applicable)
  clubcardPrice?: number;
  nectarPrice?: number;
  moreCardPrice?: number;
  lidlPlusPrice?: number;
  myWaitrosePrice?: number;
  memberPrice?: number;
  smartPassPrice?: number;

  // Offers
  isOnOffer: boolean;
  offerType?: OfferType;
  offerDescription?: string;
  originalPrice?: number;
  offerValidUntil?: string;

  // Store-specific offer flags
  isAldiPriceMatch?: boolean;
  isPriceLock?: boolean;
  isRollback?: boolean;
  isSuper6?: boolean;
  isWeeklySpecial?: boolean;
  isDineIn?: boolean;

  // Product Details
  category: string;
  subcategory?: string;
  weight?: string;
  imageUrl?: string;
  productUrl: string;
  description?: string;

  // Availability
  isAvailable: boolean;

  // Metadata
  scrapedAt: string;
}

// ==================== Scraper Result ====================

export interface ScraperResult {
  store: UKStore;
  storeName: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  totalProducts: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  products: ScrapedProduct[];
  errors: ScraperError[];
  categories: CategoryResult[];
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  productCount: number;
  errorCount: number;
  durationMs: number;
}

export interface ScraperError {
  url: string;
  message: string;
  statusCode?: number;
  timestamp: string;
  retryCount: number;
  category?: string;
}

// ==================== Scraper Job (SQS Message) ====================

export interface ScrapeJob {
  jobId: string;
  jobType: 'FULL_CRAWL' | 'HOT_PRODUCTS' | 'SINGLE_PRODUCT' | 'CATEGORY';
  store: UKStore;
  categories?: string[];
  productBarcodes?: string[];
  createdAt: string;
}

// ==================== Canonical Product (Normalised) ====================

export interface CanonicalProduct {
  productId: string;
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  description?: string;
  weight?: string;
  unit?: string;
  storeProducts: Record<
    string,
    {
      storeProductId: string;
      storeName: string;
      productUrl: string;
    }
  >;
  qualityScore: number;
  matchConfidence: number;
  lastUpdated: string;
  createdAt: string;
}

// ==================== Price Record ====================

export interface PriceRecord {
  productId: string;
  barcode: string;
  store: UKStore;
  date: string;
  shelfPrice: number;
  loyaltyPrice?: number;
  loyaltyScheme?: string;
  effectivePrice: number;
  pricePerUnit?: number;
  unitForPricing?: string;
  isOnOffer: boolean;
  offerType?: OfferType;
  offerDescription?: string;
  originalPrice?: number;
  scrapedAt: string;
}

// ==================== Circuit Breaker ====================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerState {
  store: UKStore;
  state: CircuitState;
  failureCount: number;
  lastFailureAt?: string;
  openedAt?: string;
  halfOpenTestAt?: string;
}

// ==================== Scraper Interface ====================

export interface IScraper {
  readonly store: UKStore;
  readonly config: ScraperConfig;

  /**
   * Scrape all products across all categories for this store.
   */
  scrapeAll(): Promise<ScraperResult>;

  /**
   * Scrape products in a specific category.
   */
  scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]>;

  /**
   * Scrape a single product by its store product ID or URL.
   */
  scrapeProduct(productIdOrUrl: string): Promise<ScrapedProduct | null>;

  /**
   * Search for products by query string.
   */
  searchProducts(query: string, limit?: number): Promise<ScrapedProduct[]>;

  /**
   * Get the list of categories available for this store.
   */
  getCategories(): Promise<StoreCategory[]>;

  /**
   * Test connectivity to the store website.
   */
  healthCheck(): Promise<boolean>;
}

// ==================== Transform Types ====================

export interface TransformResult {
  newProducts: number;
  updatedProducts: number;
  newPrices: number;
  priceChanges: number;
  dealsFound: number;
  errors: number;
  durationMs: number;
}

export interface ProductMatch {
  barcode: string;
  canonicalProductId?: string;
  matchType: 'BARCODE_EXACT' | 'NAME_FUZZY' | 'BRAND_WEIGHT' | 'NEW_PRODUCT';
  confidence: number;
}

export interface CategoryMapping {
  storeCategory: string;
  standardCategory: string;
  standardSubcategory?: string;
  confidence: number;
}

// ==================== Store Metadata ====================

export const STORE_METADATA: Record<
  UKStore,
  {
    name: string;
    baseUrl: string;
    searchUrl: string;
    colour: string;
    loyaltyScheme?: string;
    hasOnlineGroceries: boolean;
    estimatedProducts: number;
    scrapingMethod: 'API' | 'HTML' | 'PUPPETEER';
    tier: 1 | 2 | 3;
  }
> = {
  TESCO: {
    name: 'Tesco',
    baseUrl: 'https://www.tesco.com',
    searchUrl: 'https://www.tesco.com/groceries/en-GB/search',
    colour: '#00539F',
    loyaltyScheme: 'Clubcard',
    hasOnlineGroceries: true,
    estimatedProducts: 45000,
    scrapingMethod: 'API',
    tier: 1,
  },
  SAINSBURYS: {
    name: "Sainsbury's",
    baseUrl: 'https://www.sainsburys.co.uk',
    searchUrl: 'https://www.sainsburys.co.uk/gol-ui/SearchResults',
    colour: '#F06C00',
    loyaltyScheme: 'Nectar',
    hasOnlineGroceries: true,
    estimatedProducts: 35000,
    scrapingMethod: 'HTML',
    tier: 1,
  },
  ASDA: {
    name: 'Asda',
    baseUrl: 'https://groceries.asda.com',
    searchUrl: 'https://groceries.asda.com/search',
    colour: '#78BE20',
    loyaltyScheme: undefined,
    hasOnlineGroceries: true,
    estimatedProducts: 40000,
    scrapingMethod: 'API',
    tier: 1,
  },
  MORRISONS: {
    name: 'Morrisons',
    baseUrl: 'https://groceries.morrisons.com',
    searchUrl: 'https://groceries.morrisons.com/search',
    colour: '#007A3D',
    loyaltyScheme: 'More Card',
    hasOnlineGroceries: true,
    estimatedProducts: 30000,
    scrapingMethod: 'API',
    tier: 2,
  },
  ALDI: {
    name: 'Aldi',
    baseUrl: 'https://www.aldi.co.uk',
    searchUrl: 'https://www.aldi.co.uk/search',
    colour: '#00205B',
    loyaltyScheme: undefined,
    hasOnlineGroceries: false,
    estimatedProducts: 2000,
    scrapingMethod: 'HTML',
    tier: 2,
  },
  LIDL: {
    name: 'Lidl',
    baseUrl: 'https://www.lidl.co.uk',
    searchUrl: 'https://www.lidl.co.uk/search',
    colour: '#0050AA',
    loyaltyScheme: 'Lidl Plus',
    hasOnlineGroceries: false,
    estimatedProducts: 2500,
    scrapingMethod: 'HTML',
    tier: 2,
  },
  WAITROSE: {
    name: 'Waitrose',
    baseUrl: 'https://www.waitrose.com',
    searchUrl: 'https://www.waitrose.com/ecom/shop/search',
    colour: '#5D8C51',
    loyaltyScheme: 'myWaitrose',
    hasOnlineGroceries: true,
    estimatedProducts: 25000,
    scrapingMethod: 'API',
    tier: 3,
  },
  OCADO: {
    name: 'Ocado',
    baseUrl: 'https://www.ocado.com',
    searchUrl: 'https://www.ocado.com/search',
    colour: '#6F2C91',
    loyaltyScheme: 'Smart Pass',
    hasOnlineGroceries: true,
    estimatedProducts: 50000,
    scrapingMethod: 'PUPPETEER',
    tier: 3,
  },
  COOP: {
    name: 'Co-op',
    baseUrl: 'https://www.coop.co.uk',
    searchUrl: 'https://shop.coop.co.uk/search',
    colour: '#00B1E7',
    loyaltyScheme: 'Member',
    hasOnlineGroceries: true,
    estimatedProducts: 5000,
    scrapingMethod: 'HTML',
    tier: 3,
  },
  MS_FOOD: {
    name: 'M&S Food',
    baseUrl: 'https://www.ocado.com/browse/m-and-s',
    searchUrl: 'https://www.ocado.com/search',
    colour: '#000000',
    loyaltyScheme: undefined,
    hasOnlineGroceries: true,
    estimatedProducts: 6000,
    scrapingMethod: 'PUPPETEER',
    tier: 3,
  },
};

// ==================== Default User Agents ====================

export const DEFAULT_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

// ==================== Validation ====================

export const PRICE_VALIDATION = {
  MIN_PRICE_PENCE: 1,
  MAX_PRICE_PENCE: 99999,
  MAX_NAME_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_URL_LENGTH: 2000,
} as const;
