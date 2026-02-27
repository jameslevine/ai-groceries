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
 * Co-op Scraper
 *
 * Uses HTML parsing with Cheerio. Co-op has a smaller online range (~5000 products).
 * Features Co-op Member pricing.
 */

const COOP_CATEGORIES: StoreCategory[] = [
  { id: 'fruit-veg', name: 'Fruit & Vegetables', url: '/c/fruit-and-veg' },
  { id: 'meat-fish', name: 'Meat & Fish', url: '/c/meat-fish-and-poultry' },
  { id: 'dairy', name: 'Dairy & Chilled', url: '/c/dairy-and-chilled' },
  { id: 'bakery', name: 'Bakery', url: '/c/bakery' },
  { id: 'frozen', name: 'Frozen', url: '/c/frozen' },
  { id: 'food-cupboard', name: 'Food Cupboard', url: '/c/food-cupboard' },
  { id: 'drinks', name: 'Drinks', url: '/c/drinks' },
  { id: 'household', name: 'Household', url: '/c/household' },
  { id: 'health-beauty', name: 'Health & Beauty', url: '/c/health-and-beauty' },
  { id: 'baby', name: 'Baby', url: '/c/baby' },
  { id: 'pet', name: 'Pet', url: '/c/pet' },
  {
    id: 'beer-wine-spirits',
    name: 'Beer, Wine & Spirits',
    url: '/c/beer-wine-and-spirits',
  },
];

export class CoopScraper extends BaseScraper {
  private static readonly BASE_URL = 'https://shop.coop.co.uk';

  constructor() {
    const meta = STORE_METADATA.COOP;
    super({
      store: 'COOP',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: meta.searchUrl,
      maxConcurrency: 1,
      requestDelayMs: 1500,
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 6000,
      categories: COOP_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
    });
  }

  async getCategories(): Promise<StoreCategory[]> {
    return COOP_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${CoopScraper.BASE_URL}${category.url}?page=${page}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProducts(html, category.name);
        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          products.push(...pageProducts);
          page++;
          if (products.length >= 1500 || page > 30) hasMore = false;
        }
      } catch (error: any) {
        console.error(
          `[Co-op] Error page ${page} of ${category.name}: ${error.message}`,
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
        : `${CoopScraper.BASE_URL}/product/${productIdOrUrl}`;
      const html = await this.httpClient.getHtml(url);
      const products = this.parseProducts(html, 'single');
      return products[0] || null;
    } catch {
      return null;
    }
  }

  protected async performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]> {
    try {
      const url = `${CoopScraper.BASE_URL}/search?q=${encodeURIComponent(query)}`;
      const html = await this.httpClient.getHtml(url);
      return this.parseProducts(html, 'search').slice(0, limit);
    } catch (error: any) {
      console.error(`[Co-op] Search error: ${error.message}`);
      return [];
    }
  }

  private parseProducts(html: string, categoryName: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    const $ = cheerio.load(html);

    $('.product-card, .product-tile, [data-testid="product"]').each((_, el) => {
      try {
        const $el = $(el);
        const name = $el
          .find('.product-card__name, .product-tile__name, h3 a')
          .first()
          .text()
          .trim();
        if (!name) return;

        const priceText = $el
          .find('.product-card__price, .product-tile__price, .price')
          .first()
          .text()
          .trim();
        const price = this.parsePriceToPence(priceText);
        if (price <= 0) return;

        const memberPriceText = $el
          .find('.member-price, [data-testid="member-price"]')
          .first()
          .text()
          .trim();
        const memberPrice = memberPriceText
          ? this.parsePriceToPence(memberPriceText)
          : undefined;

        const href = $el.find('a[href]').first().attr('href') || '';
        const productUrl = href.startsWith('http')
          ? href
          : `${CoopScraper.BASE_URL}${href}`;
        const productId = href.split('/').filter(Boolean).pop() || '';

        const imageUrl =
          $el.find('img').first().attr('src') ||
          $el.find('img').first().attr('data-src') ||
          undefined;

        const isOnOffer = memberPrice !== undefined && memberPrice < price;

        products.push({
          storeProductId: productId,
          name,
          price,
          memberPrice,
          isOnOffer,
          offerType: isOnOffer ? 'LOYALTY_PRICE' : undefined,
          offerDescription: memberPrice
            ? `Co-op Member price: £${(memberPrice / 100).toFixed(2)}`
            : undefined,
          category: categoryName,
          imageUrl,
          productUrl,
          isAvailable: true,
          scrapedAt: this.now(),
        });
      } catch {
        // Skip
      }
    });

    return products;
  }
}
