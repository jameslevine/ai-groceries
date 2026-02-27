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
 * Aldi UK Scraper
 *
 * Uses HTML parsing with Cheerio. Aldi has a limited online grocery range
 * (~2000 products) compared to other supermarkets. No loyalty scheme.
 * Features Super 6 fruit & veg offers.
 *
 * Key pages:
 * - Categories: https://www.aldi.co.uk/c/{category}
 * - Search: https://www.aldi.co.uk/search?q={query}
 */

const ALDI_CATEGORIES: StoreCategory[] = [
  { id: 'fresh-food', name: 'Fresh Food', url: '/c/fresh-food' },
  { id: 'bakery', name: 'Bakery', url: '/c/bakery' },
  { id: 'frozen', name: 'Frozen', url: '/c/frozen' },
  { id: 'food-cupboard', name: 'Food Cupboard', url: '/c/food-cupboard' },
  { id: 'drinks', name: 'Drinks', url: '/c/drinks' },
  { id: 'baby-toddler', name: 'Baby & Toddler', url: '/c/baby-toddler' },
  { id: 'health-beauty', name: 'Health & Beauty', url: '/c/health-beauty' },
  { id: 'household', name: 'Household', url: '/c/household' },
  { id: 'pet-care', name: 'Pet Care', url: '/c/pet-care' },
  {
    id: 'beer-wine-spirits',
    name: 'Beer, Wine & Spirits',
    url: '/c/beer-wine-spirits',
  },
  { id: 'super-6', name: 'Super 6', url: '/c/super-6' },
];

export class AldiScraper extends BaseScraper {
  private static readonly BASE_URL = 'https://www.aldi.co.uk';

  constructor() {
    const meta = STORE_METADATA.ALDI;
    const config: ScraperConfig = {
      store: 'ALDI',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: meta.searchUrl,
      maxConcurrency: 1,
      requestDelayMs: 1500,
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 3000,
      categories: ALDI_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
    };
    super(config);
  }

  async getCategories(): Promise<StoreCategory[]> {
    return ALDI_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${AldiScraper.BASE_URL}${category.url}?page=${page}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProducts(
          html,
          category.name,
          category.id === 'super-6',
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
          `[Aldi] Error on page ${page} of ${category.name}: ${error.message}`,
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
        : `${AldiScraper.BASE_URL}/p/${productIdOrUrl}`;
      const html = await this.httpClient.getHtml(url);
      const products = this.parseProducts(html, 'single', false);
      return products.length > 0 ? products[0] : null;
    } catch (error: any) {
      console.error(`[Aldi] Error scraping product: ${error.message}`);
      return null;
    }
  }

  protected async performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]> {
    try {
      const url = `${AldiScraper.BASE_URL}/search?q=${encodeURIComponent(query)}`;
      const html = await this.httpClient.getHtml(url);
      return this.parseProducts(html, 'search', false).slice(0, limit);
    } catch (error: any) {
      console.error(`[Aldi] Search error: ${error.message}`);
      return [];
    }
  }

  private parseProducts(
    html: string,
    categoryName: string,
    isSuper6: boolean,
  ): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    const $ = cheerio.load(html);

    $(
      '.category-item, .product-tile, [data-qa="search-results"] .hover-item',
    ).each((_, el) => {
      try {
        const $el = $(el);
        const name = $el
          .find('.product-tile-title, .category-item__title, h2 a')
          .first()
          .text()
          .trim();
        if (!name) return;

        const priceText = $el
          .find('.product-tile-price .price, .category-item__price')
          .first()
          .text()
          .trim();
        const price = this.parsePriceToPence(priceText);
        if (price <= 0) return;

        const href = $el.find('a[href]').first().attr('href') || '';
        const productUrl = href.startsWith('http')
          ? href
          : `${AldiScraper.BASE_URL}${href}`;
        const productId = href.split('/').filter(Boolean).pop() || '';

        const imageUrl =
          $el.find('img').first().attr('src') ||
          $el.find('img').first().attr('data-src') ||
          undefined;

        const pricePerUnitText = $el
          .find('.product-tile-price .unit-price, .category-item__unit-price')
          .first()
          .text()
          .trim();
        const pricePerUnit = pricePerUnitText
          ? this.parsePriceToPence(pricePerUnitText)
          : undefined;

        const wasText = $el
          .find('.was-price, .product-tile-price--was')
          .first()
          .text()
          .trim();
        const originalPrice = wasText
          ? this.parsePriceToPence(wasText)
          : undefined;
        const isOnOffer = !!originalPrice || isSuper6;

        products.push({
          storeProductId: productId,
          name,
          price,
          pricePerUnit,
          unitForPricing: this.extractUnit(pricePerUnitText),
          isOnOffer,
          offerType: isSuper6
            ? 'PRICE_CUT'
            : originalPrice
              ? 'PRICE_CUT'
              : undefined,
          offerDescription: isSuper6 ? 'Super 6 Offer' : undefined,
          originalPrice,
          isSuper6,
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

  private extractUnit(text: string): string | undefined {
    if (!text) return undefined;
    const match = text.match(/per\s+(kg|litre|100g|100ml|each)/i);
    return match ? `per ${match[1]}` : undefined;
  }
}
