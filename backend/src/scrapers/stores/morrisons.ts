import { BaseScraper } from '../base-scraper';
import {
  ScraperConfig,
  ScrapedProduct,
  StoreCategory,
  STORE_METADATA,
  DEFAULT_USER_AGENTS,
} from '../types';

/**
 * Morrisons Grocery Scraper
 *
 * Morrisons embeds product data in a `window.__INITIAL_STATE__` JSON blob
 * within their search and category pages. This scraper:
 * 1. Fetches the HTML page with browser-like headers
 * 2. Extracts the __INITIAL_STATE__ JSON
 * 3. Parses products from data.products.productEntities
 *
 * Key data paths:
 * - Products: data.products.productEntities (dict of UUID -> product)
 * - Product groups: data.products.catalogue.data.productGroups[0].products (ordered list)
 * - Total: data.products.catalogue.data.totalProducts
 * - Pagination: ?entry={query}&page={page}&count={count}
 */

const MORRISONS_CATEGORIES: StoreCategory[] = [
  {
    id: 'fresh',
    name: 'Fresh',
    url: '/browse/fresh-128866',
  },
  {
    id: 'fruit-veg',
    name: 'Fruit & Veg',
    url: '/browse/fruit-veg-176738',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    url: '/browse/bakery-102705',
  },
  {
    id: 'frozen',
    name: 'Frozen',
    url: '/browse/frozen-180331',
  },
  {
    id: 'food-cupboard',
    name: 'Food Cupboard',
    url: '/browse/food-cupboard-102211',
  },
  {
    id: 'drinks',
    name: 'Drinks',
    url: '/browse/drinks-103120',
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    url: '/browse/health-beauty-102866',
  },
  {
    id: 'household',
    name: 'Household',
    url: '/browse/household-102535',
  },
  {
    id: 'baby',
    name: 'Baby',
    url: '/browse/baby-102862',
  },
  {
    id: 'pets',
    name: 'Pets',
    url: '/browse/pets-102861',
  },
  {
    id: 'beer-wine-spirits',
    name: 'Beer, Wine & Spirits',
    url: '/browse/beer-wine-spirits-103659',
  },
];

interface MorrisonsProduct {
  productId: string;
  retailerProductId: string;
  name: string;
  brand?: string;
  available: boolean;
  isNew?: boolean;
  categoryPath?: Array<{ name: string; id: string }>;
  price: {
    current: { amount: string; currency: string };
    original?: { amount: string; currency: string };
    unit?: {
      label: string;
      current: { amount: string; currency: string };
      original?: { amount: string; currency: string };
    };
  };
  image?: {
    src: string;
    description?: string;
  };
  size?: { value: string };
  offers?: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  offer?: {
    id: string;
    title: string;
    description?: string;
  };
  attributes?: Record<string, string>;
}

interface MorrisonsInitialState {
  data: {
    products: {
      productEntities: Record<string, MorrisonsProduct>;
      catalogue: {
        data: {
          totalProducts: number;
          productGroups: Array<{
            type: string;
            products: string[];
            name?: string;
          }>;
        };
      };
    };
  };
}

export class MorrisonsScraper extends BaseScraper {
  private static readonly BASE_URL = 'https://groceries.morrisons.com';
  private static readonly PRODUCTS_PER_PAGE = 30;

  constructor() {
    const meta = STORE_METADATA.MORRISONS;
    const config: ScraperConfig = {
      store: 'MORRISONS',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: `${MorrisonsScraper.BASE_URL}/search`,
      maxConcurrency: 1,
      requestDelayMs: 2000,
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 50000,
      categories: MORRISONS_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    };
    super(config);
  }

  async getCategories(): Promise<StoreCategory[]> {
    return MORRISONS_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${MorrisonsScraper.BASE_URL}${category.url}?page=${page}&count=${MorrisonsScraper.PRODUCTS_PER_PAGE}`;
        const pageProducts = await this.fetchAndParseProducts(
          url,
          category.name,
        );

        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          products.push(...pageProducts);
          page++;
          if (products.length >= 5000 || page > 100) {
            hasMore = false;
          }
        }
      } catch (error: any) {
        console.error(
          `[Morrisons] Error on page ${page} of ${category.name}: ${error.message}`,
        );
        hasMore = false;
      }
    }

    return products;
  }

  async scrapeProduct(productIdOrUrl: string): Promise<ScrapedProduct | null> {
    try {
      const url = productIdOrUrl.startsWith('http')
        ? productIdOrUrl
        : `${MorrisonsScraper.BASE_URL}/products/${productIdOrUrl}`;

      const products = await this.fetchAndParseProducts(url, 'single');
      return products.length > 0 ? products[0] : null;
    } catch (error: any) {
      console.error(
        `[Morrisons] Error scraping product ${productIdOrUrl}: ${error.message}`,
      );
      return null;
    }
  }

  protected async performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const pages = Math.ceil(limit / MorrisonsScraper.PRODUCTS_PER_PAGE);

    for (let page = 1; page <= pages; page++) {
      try {
        const url = `${MorrisonsScraper.BASE_URL}/search?entry=${encodeURIComponent(query)}&page=${page}&count=${MorrisonsScraper.PRODUCTS_PER_PAGE}`;
        const pageProducts = await this.fetchAndParseProducts(url, 'search');
        products.push(...pageProducts);

        if (products.length >= limit) break;
      } catch (error: any) {
        console.error(
          `[Morrisons] Search error page ${page}: ${error.message}`,
        );
        break;
      }
    }

    return products.slice(0, limit);
  }

  /**
   * Fetch a Morrisons page and extract products from __INITIAL_STATE__.
   */
  private async fetchAndParseProducts(
    url: string,
    categoryName: string,
  ): Promise<ScrapedProduct[]> {
    const html = await this.httpClient.getHtml(url);
    return this.parseProductsFromInitialState(html, categoryName);
  }

  /**
   * Extract products from the window.__INITIAL_STATE__ JSON blob.
   */
  private parseProductsFromInitialState(
    html: string,
    categoryName: string,
  ): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    try {
      // Find the __INITIAL_STATE__ JSON
      const stateMatch = html.indexOf('window.__INITIAL_STATE__');
      if (stateMatch === -1) {
        console.warn('[Morrisons] No __INITIAL_STATE__ found in page');
        return products;
      }

      // Find the start of the JSON object
      const jsonStart = html.indexOf('=', stateMatch) + 1;
      const rawJson = html.substring(jsonStart);

      // Parse JSON using a streaming approach to handle trailing data
      let braceCount = 0;
      let inString = false;
      let escape = false;
      let jsonEnd = 0;

      for (let i = 0; i < rawJson.length; i++) {
        const char = rawJson[i];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\') {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (inString) continue;

        if (char === '{') braceCount++;
        if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }

      if (jsonEnd === 0) {
        console.warn(
          '[Morrisons] Could not find end of __INITIAL_STATE__ JSON',
        );
        return products;
      }

      const data: MorrisonsInitialState = JSON.parse(
        rawJson.substring(0, jsonEnd),
      );

      // Extract product entities
      const entities = data?.data?.products?.productEntities;
      if (!entities || Object.keys(entities).length === 0) {
        console.warn('[Morrisons] No product entities found');
        return products;
      }

      // Map each product entity to our ScrapedProduct format
      for (const [, product] of Object.entries(entities)) {
        const mapped = this.mapMorrisonsProduct(product, categoryName);
        if (mapped) {
          products.push(mapped);
        }
      }

      console.log(
        `[Morrisons] Parsed ${products.length} products from ${categoryName}`,
      );
    } catch (error: any) {
      console.error(
        `[Morrisons] Error parsing __INITIAL_STATE__: ${error.message}`,
      );
    }

    return products;
  }

  /**
   * Map a Morrisons product entity to our ScrapedProduct interface.
   */
  private mapMorrisonsProduct(
    product: MorrisonsProduct,
    categoryName: string,
  ): ScrapedProduct | null {
    try {
      if (!product.name || !product.price?.current?.amount) return null;

      const price = Math.round(parseFloat(product.price.current.amount) * 100);
      if (price <= 0) return null;

      // Original price (for offers)
      let originalPrice: number | undefined;
      let isOnOffer = false;
      let offerDescription: string | undefined;
      let offerType: ScrapedProduct['offerType'];

      if (product.price.original) {
        originalPrice = Math.round(
          parseFloat(product.price.original.amount) * 100,
        );
        if (originalPrice > price) {
          isOnOffer = true;
          offerType = 'PRICE_CUT';
          offerDescription = `Was £${product.price.original.amount}`;
        }
      }

      // Check for explicit offers
      const offer = product.offer || (product.offers && product.offers[0]);
      if (offer) {
        isOnOffer = true;
        offerDescription = offer.title || offer.description;
        if (
          offerDescription?.toLowerCase().includes('buy') ||
          offerDescription?.toLowerCase().includes('for')
        ) {
          offerType = 'MULTI_BUY';
        } else if (!offerType) {
          offerType = 'PRICE_CUT';
        }
      }

      // More Card price (Morrisons loyalty)
      let moreCardPrice: number | undefined;
      // Morrisons More Card prices are sometimes in the offers
      if (
        offerDescription?.toLowerCase().includes('more card') ||
        offerDescription?.toLowerCase().includes('my morrisons')
      ) {
        moreCardPrice = price;
        offerType = 'LOYALTY_PRICE';
      }

      // Price per unit
      let pricePerUnit: number | undefined;
      let unitForPricing: string | undefined;
      if (product.price.unit?.current?.amount) {
        pricePerUnit = Math.round(
          parseFloat(product.price.unit.current.amount) * 100,
        );
        // Map label to readable format
        const labelMap: Record<string, string> = {
          'fop.price.per.litre': 'per litre',
          'fop.price.per.kg': 'per kg',
          'fop.price.per.100gram': 'per 100g',
          'fop.price.per.100ml': 'per 100ml',
          'fop.price.per.each': 'each',
          'fop.price.per.10ml': 'per 10ml',
          'fop.price.per.wash': 'per wash',
          'fop.price.per.meter': 'per metre',
          'fop.price.per.100each': 'per 100',
        };
        unitForPricing =
          labelMap[product.price.unit.label] || product.price.unit.label;
      }

      // Category from categoryPath
      const category =
        product.categoryPath && product.categoryPath.length > 0
          ? product.categoryPath[product.categoryPath.length - 1].name
          : categoryName;

      return {
        storeProductId: product.retailerProductId || product.productId,
        name: product.name.trim(),
        brand: product.brand || undefined,
        price,
        pricePerUnit,
        unitForPricing,
        moreCardPrice,
        isOnOffer,
        offerType,
        offerDescription,
        originalPrice,
        category,
        weight: product.size?.value || this.extractWeight(product.name),
        imageUrl: product.image?.src || undefined,
        productUrl: `${MorrisonsScraper.BASE_URL}/products/${product.retailerProductId}`,
        isAvailable: product.available !== false,
        scrapedAt: this.now(),
      };
    } catch (error: any) {
      console.error(
        `[Morrisons] Error mapping product ${product.name}: ${error.message}`,
      );
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
}
