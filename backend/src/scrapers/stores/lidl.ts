import * as cheerio from 'cheerio';
import { BaseScraper } from '../base-scraper';
import {
  ScraperConfig,
  ScrapedProduct,
  StoreCategory,
  STORE_METADATA,
  DEFAULT_USER_AGENTS,
} from '../types';

/**
 * Lidl UK Scraper
 *
 * Uses HTML parsing with Cheerio. Lidl has a limited online grocery range
 * (~2500 products). Features Lidl Plus loyalty pricing and weekly specials.
 *
 * Key pages:
 * - Categories: https://www.lidl.co.uk/c/{category}
 * - Search: https://www.lidl.co.uk/search?query={query}
 */

const LIDL_CATEGORIES: StoreCategory[] = [
  {
    id: 'fruit-vegetables',
    name: 'Fruit & Vegetables',
    url: '/c/fruit-vegetables',
  },
  { id: 'meat-fish', name: 'Meat & Fish', url: '/c/meat-fish' },
  { id: 'dairy-eggs', name: 'Dairy & Eggs', url: '/c/dairy-eggs' },
  { id: 'bakery', name: 'Bakery', url: '/c/bakery' },
  { id: 'frozen', name: 'Frozen', url: '/c/frozen-food' },
  { id: 'food-cupboard', name: 'Food Cupboard', url: '/c/food-cupboard' },
  { id: 'drinks', name: 'Drinks', url: '/c/drinks' },
  { id: 'health-beauty', name: 'Health & Beauty', url: '/c/health-beauty' },
  { id: 'household', name: 'Household', url: '/c/household' },
  { id: 'baby', name: 'Baby', url: '/c/baby' },
  { id: 'pet', name: 'Pet', url: '/c/pet' },
  {
    id: 'beer-wine-spirits',
    name: 'Beer, Wine & Spirits',
    url: '/c/beer-wine-spirits',
  },
  {
    id: 'this-week',
    name: 'This Week at Lidl',
    url: '/c/this-week',
  },
];

export class LidlScraper extends BaseScraper {
  private static readonly BASE_URL = 'https://www.lidl.co.uk';

  constructor() {
    const meta = STORE_METADATA.LIDL;
    const config: ScraperConfig = {
      store: 'LIDL',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: meta.searchUrl,
      maxConcurrency: 1,
      requestDelayMs: 1500,
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 3500,
      categories: LIDL_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
    };
    super(config);
  }

  async getCategories(): Promise<StoreCategory[]> {
    return LIDL_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;
    const isWeeklySpecial = category.id === 'this-week';

    while (hasMore) {
      try {
        const url = `${LidlScraper.BASE_URL}${category.url}?page=${page}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProducts(
          html,
          category.name,
          isWeeklySpecial,
        );

        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          products.push(...pageProducts);
          page++;
          if (products.length >= 1000 || page > 20) hasMore = false;
        }
      } catch (error: any) {
        console.error(
          `[Lidl] Error on page ${page} of ${category.name}: ${error.message}`,
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
        : `${LidlScraper.BASE_URL}/p/${productIdOrUrl}`;
      const html = await this.httpClient.getHtml(url);
      const products = this.parseProducts(html, 'single', false);
      return products.length > 0 ? products[0] : null;
    } catch (error: any) {
      console.error(`[Lidl] Error scraping product: ${error.message}`);
      return null;
    }
  }

  protected async performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]> {
    try {
      const url = `${LidlScraper.BASE_URL}/search?query=${encodeURIComponent(query)}`;
      const html = await this.httpClient.getHtml(url);
      return this.parseProducts(html, 'search', false).slice(0, limit);
    } catch (error: any) {
      console.error(`[Lidl] Search error: ${error.message}`);
      return [];
    }
  }

  private parseProducts(
    html: string,
    categoryName: string,
    isWeeklySpecial: boolean,
  ): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    const $ = cheerio.load(html);

    $('.product-grid-box, .product-item, [data-testid="product-card"]').each(
      (_, el) => {
        try {
          const $el = $(el);
          const name = $el
            .find('.product-grid-box__title, .product-item__title, h3')
            .first()
            .text()
            .trim();
          if (!name) return;

          const priceText = $el
            .find('.product-grid-box__price, .product-item__price, .price')
            .first()
            .text()
            .trim();
          const price = this.parsePriceToPence(priceText);
          if (price <= 0) return;

          const href = $el.find('a[href]').first().attr('href') || '';
          const productUrl = href.startsWith('http')
            ? href
            : `${LidlScraper.BASE_URL}${href}`;
          const productId = href.split('/').filter(Boolean).pop() || '';

          const imageUrl =
            $el.find('img').first().attr('src') ||
            $el.find('img').first().attr('data-src') ||
            undefined;

          // Lidl Plus price
          const lidlPlusText = $el
            .find('.lidl-plus-price, [data-testid="lidl-plus-price"]')
            .first()
            .text()
            .trim();
          const lidlPlusPrice = lidlPlusText
            ? this.parsePriceToPence(lidlPlusText)
            : undefined;

          // Price per unit
          const pricePerUnitText = $el
            .find('.product-grid-box__unit-price, .unit-price')
            .first()
            .text()
            .trim();
          const pricePerUnit = pricePerUnitText
            ? this.parsePriceToPence(pricePerUnitText)
            : undefined;

          // Was price
          const wasText = $el
            .find('.was-price, .product-grid-box__price--old')
            .first()
            .text()
            .trim();
          const originalPrice = wasText
            ? this.parsePriceToPence(wasText)
            : undefined;

          const isOnOffer =
            !!originalPrice ||
            isWeeklySpecial ||
            (lidlPlusPrice !== undefined && lidlPlusPrice < price);

          let offerType: ScrapedProduct['offerType'];
          if (lidlPlusPrice && lidlPlusPrice < price) {
            offerType = 'LOYALTY_PRICE';
          } else if (originalPrice) {
            offerType = 'PRICE_CUT';
          }

          products.push({
            storeProductId: productId,
            name,
            price,
            pricePerUnit,
            unitForPricing: this.extractUnit(pricePerUnitText),
            lidlPlusPrice,
            isOnOffer,
            offerType,
            offerDescription: isWeeklySpecial ? 'This Week at Lidl' : undefined,
            originalPrice,
            isWeeklySpecial,
            category: categoryName,
            imageUrl,
            productUrl,
            isAvailable: true,
            scrapedAt: this.now(),
          });
        } catch {
          // Skip
        }
      },
    );

    return products;
  }

  private extractUnit(text: string): string | undefined {
    if (!text) return undefined;
    const match = text.match(/per\s+(kg|litre|100g|100ml|each)/i);
    return match ? `per ${match[1]}` : undefined;
  }
}
