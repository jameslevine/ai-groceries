import { BaseScraper } from '../base-scraper';
import {
  ScraperConfig,
  ScrapedProduct,
  StoreCategory,
  STORE_METADATA,
  DEFAULT_USER_AGENTS,
} from '../types';

/**
 * Tesco Grocery Scraper
 *
 * Uses Tesco's unofficial REST API endpoints that power their grocery website.
 * The search endpoint returns JSON with product details including Clubcard pricing.
 *
 * Key endpoints:
 * - Search: https://www.tesco.com/groceries/en-GB/search?query={query}&page={page}&count={count}
 * - Category: https://www.tesco.com/groceries/en-GB/shop/{category}/all?page={page}&count={count}
 * - Product: https://www.tesco.com/groceries/en-GB/products/{productId}
 */

// Tesco category structure
const TESCO_CATEGORIES: StoreCategory[] = [
  {
    id: 'fresh-food',
    name: 'Fresh Food',
    url: '/groceries/en-GB/shop/fresh-food/all',
    subcategories: [
      {
        id: 'fresh-fruit',
        name: 'Fresh Fruit',
        url: '/groceries/en-GB/shop/fresh-food/fresh-fruit/all',
      },
      {
        id: 'fresh-vegetables',
        name: 'Fresh Vegetables',
        url: '/groceries/en-GB/shop/fresh-food/fresh-vegetables/all',
      },
      {
        id: 'fresh-salad-dips',
        name: 'Salads & Dips',
        url: '/groceries/en-GB/shop/fresh-food/fresh-salad-and-dips/all',
      },
      {
        id: 'milk-butter-eggs',
        name: 'Milk, Butter & Eggs',
        url: '/groceries/en-GB/shop/fresh-food/milk-butter-and-eggs/all',
      },
      {
        id: 'cheese',
        name: 'Cheese',
        url: '/groceries/en-GB/shop/fresh-food/cheese/all',
      },
      {
        id: 'fresh-meat',
        name: 'Fresh Meat & Poultry',
        url: '/groceries/en-GB/shop/fresh-food/fresh-meat-and-poultry/all',
      },
      {
        id: 'fresh-fish',
        name: 'Fresh Fish & Seafood',
        url: '/groceries/en-GB/shop/fresh-food/chilled-fish-and-seafood/all',
      },
      {
        id: 'cooked-meat',
        name: 'Cooked Meat, Pies & Quiche',
        url: '/groceries/en-GB/shop/fresh-food/cooked-meat-antipasti-and-deli/all',
      },
      {
        id: 'yoghurts',
        name: 'Yoghurts',
        url: '/groceries/en-GB/shop/fresh-food/yoghurts/all',
      },
    ],
  },
  {
    id: 'bakery',
    name: 'Bakery',
    url: '/groceries/en-GB/shop/bakery/all',
  },
  {
    id: 'frozen',
    name: 'Frozen',
    url: '/groceries/en-GB/shop/frozen-food/all',
  },
  {
    id: 'food-cupboard',
    name: 'Food Cupboard',
    url: '/groceries/en-GB/shop/food-cupboard/all',
    subcategories: [
      {
        id: 'tins-cans',
        name: 'Tins & Cans',
        url: '/groceries/en-GB/shop/food-cupboard/tinned-food/all',
      },
      {
        id: 'pasta-rice-noodles',
        name: 'Pasta, Rice & Noodles',
        url: '/groceries/en-GB/shop/food-cupboard/pasta-rice-and-noodles/all',
      },
      {
        id: 'cereals',
        name: 'Cereals',
        url: '/groceries/en-GB/shop/food-cupboard/cereals/all',
      },
      {
        id: 'cooking-sauces',
        name: 'Cooking Sauces & Meal Kits',
        url: '/groceries/en-GB/shop/food-cupboard/cooking-sauces-and-meal-kits/all',
      },
      {
        id: 'condiments',
        name: 'Condiments',
        url: '/groceries/en-GB/shop/food-cupboard/table-sauces-oils-and-condiments/all',
      },
    ],
  },
  {
    id: 'drinks',
    name: 'Drinks',
    url: '/groceries/en-GB/shop/drinks/all',
    subcategories: [
      { id: 'tea', name: 'Tea', url: '/groceries/en-GB/shop/drinks/tea/all' },
      {
        id: 'coffee',
        name: 'Coffee',
        url: '/groceries/en-GB/shop/drinks/coffee/all',
      },
      {
        id: 'soft-drinks',
        name: 'Soft Drinks',
        url: '/groceries/en-GB/shop/drinks/soft-drinks/all',
      },
      {
        id: 'water',
        name: 'Water',
        url: '/groceries/en-GB/shop/drinks/water/all',
      },
      {
        id: 'juice',
        name: 'Juice',
        url: '/groceries/en-GB/shop/drinks/juice/all',
      },
    ],
  },
  {
    id: 'snacks',
    name: 'Snacks & Confectionery',
    url: '/groceries/en-GB/shop/food-cupboard/sweets-chocolate-and-snacks/all',
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    url: '/groceries/en-GB/shop/health-and-beauty/all',
  },
  {
    id: 'household',
    name: 'Household',
    url: '/groceries/en-GB/shop/household/all',
  },
  {
    id: 'baby',
    name: 'Baby',
    url: '/groceries/en-GB/shop/baby/all',
  },
  {
    id: 'pet',
    name: 'Pet',
    url: '/groceries/en-GB/shop/pets/all',
  },
  {
    id: 'beer-wine-spirits',
    name: 'Beer, Wine & Spirits',
    url: '/groceries/en-GB/shop/beer-wine-and-spirits/all',
  },
];

// Tesco API response types
interface TescoSearchResponse {
  uk: {
    ghs: {
      products: {
        results: TescoProduct[];
        totals: {
          all: number;
          new: number;
          offer: number;
        };
        page: number;
        pageCount: number;
      };
    };
  };
}

interface TescoProduct {
  id: string;
  dbid: string;
  title: string;
  price: number;
  unitPrice: number;
  unitOfMeasure: string;
  imageUrl: string;
  superDepartment: string;
  department: string;
  aisle: string;
  shelf: string;
  description: string[];
  brand: string;
  isNew: boolean;
  isOnOffer: boolean;
  isAvailable: boolean;
  promotions?: TescoPromotion[];
  clubcardPrice?: number;
  isAldiPriceMatch?: boolean;
  gtin?: string; // EAN barcode
  ContentAttributes?: Array<{
    name: string;
    values: string[];
  }>;
}

interface TescoPromotion {
  promotionId: string;
  promotionType: string;
  startDate: string;
  endDate: string;
  offerText: string;
  attributes: string[];
  promotionPrice?: number;
}

export class TescoScraper extends BaseScraper {
  private static readonly PRODUCTS_PER_PAGE = 48;
  private static readonly BASE_URL = 'https://www.tesco.com';

  constructor() {
    const meta = STORE_METADATA.TESCO;
    const config: ScraperConfig = {
      store: 'TESCO',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: meta.searchUrl,
      maxConcurrency: 1,
      requestDelayMs: 1000,
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 50000,
      categories: TESCO_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    };
    super(config);
  }

  async getCategories(): Promise<StoreCategory[]> {
    return TESCO_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    // If category has subcategories, scrape each subcategory
    if (category.subcategories && category.subcategories.length > 0) {
      for (const subcat of category.subcategories) {
        const subcatProducts = await this.scrapeCategoryPage(
          subcat.url,
          subcat.name,
        );
        products.push(...subcatProducts);
      }
      return products;
    }

    // Otherwise scrape the category directly
    while (hasMore) {
      try {
        const url = `${TescoScraper.BASE_URL}${category.url}?page=${page}&count=${TescoScraper.PRODUCTS_PER_PAGE}`;
        const html = await this.httpClient.getHtml(url);

        // Extract the JSON data embedded in the page
        const pageProducts = this.parseProductsFromPage(html, category.name);

        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          products.push(...pageProducts);
          page++;

          // Safety limit per category
          if (products.length >= 5000 || page > 100) {
            hasMore = false;
          }
        }
      } catch (error: any) {
        console.error(
          `[Tesco] Error on page ${page} of ${category.name}: ${error.message}`,
        );
        hasMore = false;
      }
    }

    return products;
  }

  private async scrapeCategoryPage(
    categoryUrl: string,
    categoryName: string,
  ): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${TescoScraper.BASE_URL}${categoryUrl}?page=${page}&count=${TescoScraper.PRODUCTS_PER_PAGE}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProductsFromPage(html, categoryName);

        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          products.push(...pageProducts);
          page++;
          if (products.length >= 3000 || page > 60) {
            hasMore = false;
          }
        }
      } catch (error: any) {
        console.error(
          `[Tesco] Error on page ${page} of ${categoryName}: ${error.message}`,
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
        : `${TescoScraper.BASE_URL}/groceries/en-GB/products/${productIdOrUrl}`;

      const html = await this.httpClient.getHtml(url);
      const products = this.parseProductsFromPage(html, 'single');
      return products.length > 0 ? products[0] : null;
    } catch (error: any) {
      console.error(
        `[Tesco] Error scraping product ${productIdOrUrl}: ${error.message}`,
      );
      return null;
    }
  }

  protected async performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const pages = Math.ceil(limit / TescoScraper.PRODUCTS_PER_PAGE);

    for (let page = 1; page <= pages; page++) {
      try {
        const url = `${TescoScraper.BASE_URL}/groceries/en-GB/search?query=${encodeURIComponent(query)}&page=${page}&count=${TescoScraper.PRODUCTS_PER_PAGE}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProductsFromPage(html, 'search');
        products.push(...pageProducts);

        if (products.length >= limit) break;
      } catch (error: any) {
        console.error(`[Tesco] Search error page ${page}: ${error.message}`);
        break;
      }
    }

    return products.slice(0, limit);
  }

  /**
   * Parse products from a Tesco page HTML.
   * Tesco embeds product data as JSON in a script tag.
   */
  private parseProductsFromPage(
    html: string,
    categoryName: string,
  ): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    try {
      // Tesco embeds product data in a __NEXT_DATA__ script tag
      const nextDataMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
      );

      if (!nextDataMatch) {
        // Fallback: try to find product data in other script tags
        return this.parseProductsFromHtml(html, categoryName);
      }

      const nextData = JSON.parse(nextDataMatch[1]);

      // Navigate the Next.js data structure to find products
      const pageProps = nextData?.props?.pageProps;
      if (!pageProps) return products;

      // Products can be in different locations depending on the page type
      const productList =
        pageProps?.results?.productItems ||
        pageProps?.results?.results ||
        pageProps?.productItems ||
        [];

      for (const item of productList) {
        const product = item.product || item;
        if (!product) continue;

        const scrapedProduct = this.mapTescoProduct(product, categoryName);
        if (scrapedProduct) {
          products.push(scrapedProduct);
        }
      }
    } catch (error: any) {
      console.error(`[Tesco] Error parsing page: ${error.message}`);
    }

    return products;
  }

  /**
   * Fallback HTML parsing using regex patterns.
   */
  private parseProductsFromHtml(
    html: string,
    categoryName: string,
  ): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    // Try to find product tiles in the HTML
    const productTileRegex = /data-auto="product-tile"[\s\S]*?<\/li>/g;
    const tiles = html.match(productTileRegex) || [];

    for (const tile of tiles) {
      try {
        const nameMatch = tile.match(
          /data-auto="product-tile--title"[^>]*>([^<]+)/,
        );
        const priceMatch = tile.match(/data-auto="price-value"[^>]*>([^<]+)/);
        const linkMatch = tile.match(
          /href="(\/groceries\/en-GB\/products\/[^"]+)"/,
        );
        const imgMatch = tile.match(
          /src="(https:\/\/[^"]*digitalcontent[^"]+)"/,
        );
        const clubcardMatch = tile.match(
          /data-auto="clubcard-price"[^>]*>([^<]+)/,
        );

        if (nameMatch && priceMatch && linkMatch) {
          const price = this.parsePriceToPence(priceMatch[1]);
          const clubcardPrice = clubcardMatch
            ? this.parsePriceToPence(clubcardMatch[1])
            : undefined;

          const productId = linkMatch[1].split('/').pop() || '';

          products.push({
            storeProductId: productId,
            name: nameMatch[1].trim(),
            price,
            clubcardPrice,
            isOnOffer: !!clubcardMatch || price < (clubcardPrice || Infinity),
            offerType: clubcardMatch ? 'LOYALTY_PRICE' : undefined,
            category: categoryName,
            productUrl: `${TescoScraper.BASE_URL}${linkMatch[1]}`,
            imageUrl: imgMatch ? imgMatch[1] : undefined,
            isAvailable: true,
            scrapedAt: this.now(),
          });
        }
      } catch {
        // Skip malformed tiles
      }
    }

    return products;
  }

  /**
   * Map a Tesco API product object to our ScrapedProduct interface.
   */
  private mapTescoProduct(
    product: TescoProduct,
    categoryName: string,
  ): ScrapedProduct | null {
    try {
      const price = Math.round((product.price || 0) * 100);
      if (price <= 0) return null;

      // Extract Clubcard price from promotions
      let clubcardPrice: number | undefined;
      let isOnOffer = product.isOnOffer || false;
      let offerDescription: string | undefined;
      let offerType: ScrapedProduct['offerType'];
      let originalPrice: number | undefined;
      let offerValidUntil: string | undefined;

      if (product.clubcardPrice) {
        clubcardPrice = Math.round(product.clubcardPrice * 100);
      }

      if (product.promotions && product.promotions.length > 0) {
        const promo = product.promotions[0];
        offerDescription = promo.offerText;
        offerValidUntil = promo.endDate;
        isOnOffer = true;

        if (promo.promotionType === 'CLUBCARD_PRICE') {
          offerType = 'LOYALTY_PRICE';
          if (promo.promotionPrice) {
            clubcardPrice = Math.round(promo.promotionPrice * 100);
          }
        } else if (promo.offerText?.toLowerCase().includes('buy')) {
          offerType = 'MULTI_BUY';
        } else if (promo.offerText?.toLowerCase().includes('half price')) {
          offerType = 'HALF_PRICE';
          originalPrice = price * 2;
        } else if (promo.offerText?.toLowerCase().includes('was')) {
          offerType = 'PRICE_CUT';
          const wasMatch = promo.offerText.match(/was\s*£?([\d.]+)/i);
          if (wasMatch) {
            originalPrice = this.parsePriceToPence(wasMatch[1]);
          }
        } else {
          offerType = 'PRICE_CUT';
        }
      }

      // Price per unit
      const pricePerUnit = product.unitPrice
        ? Math.round(product.unitPrice * 100)
        : undefined;

      return {
        storeProductId: product.id || product.dbid || '',
        barcode: product.gtin || undefined,
        name: product.title || '',
        brand: product.brand || undefined,
        price,
        pricePerUnit,
        unitForPricing: product.unitOfMeasure
          ? `per ${product.unitOfMeasure}`
          : undefined,
        clubcardPrice,
        isOnOffer,
        offerType,
        offerDescription,
        originalPrice,
        offerValidUntil,
        isAldiPriceMatch: product.isAldiPriceMatch || false,
        category: categoryName,
        subcategory: product.department || undefined,
        weight: this.extractWeight(product.title),
        imageUrl: product.imageUrl
          ? `https://digitalcontent.api.tesco.com/v2/media/ghs/snapshotimagehandler_m/${product.imageUrl}`
          : undefined,
        productUrl: `${TescoScraper.BASE_URL}/groceries/en-GB/products/${product.id}`,
        description: product.description?.join(' ') || undefined,
        isAvailable: product.isAvailable !== false,
        scrapedAt: this.now(),
      };
    } catch (error: any) {
      console.error(`[Tesco] Error mapping product: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract weight/volume from product title.
   * e.g. "Cravendale Semi Skimmed Milk 2L" → "2L"
   */
  private extractWeight(title: string): string | undefined {
    if (!title) return undefined;
    const weightMatch = title.match(
      /(\d+(?:\.\d+)?)\s*(ml|l|g|kg|cl|pk|pack|pint|pints|litre|litres)\b/i,
    );
    return weightMatch ? `${weightMatch[1]}${weightMatch[2]}` : undefined;
  }
}
