import { OcadoScraper } from './ocado';
import {
  ScraperConfig,
  ScrapedProduct,
  StoreCategory,
  STORE_METADATA,
  DEFAULT_USER_AGENTS,
} from '../types';
import { BaseScraper } from '../base-scraper';

/**
 * M&S Food Scraper
 *
 * M&S Food products are sold through Ocado's platform.
 * This scraper browses the M&S section on Ocado and filters for M&S branded products.
 */

const MS_FOOD_CATEGORIES: StoreCategory[] = [
  { id: 'ms-all', name: 'M&S Food', url: '/browse/m-and-s-702780' },
  { id: 'ms-fresh', name: 'M&S Fresh', url: '/browse/m-and-s/fresh-702781' },
  {
    id: 'ms-chilled',
    name: 'M&S Chilled',
    url: '/browse/m-and-s/chilled-702782',
  },
  { id: 'ms-frozen', name: 'M&S Frozen', url: '/browse/m-and-s/frozen-702783' },
  { id: 'ms-bakery', name: 'M&S Bakery', url: '/browse/m-and-s/bakery-702784' },
  { id: 'ms-drinks', name: 'M&S Drinks', url: '/browse/m-and-s/drinks-702785' },
  {
    id: 'ms-cupboard',
    name: 'M&S Food Cupboard',
    url: '/browse/m-and-s/food-cupboard-702786',
  },
  {
    id: 'ms-dine-in',
    name: 'M&S Dine In',
    url: '/browse/m-and-s/dine-in-702787',
  },
];

export class MSFoodScraper extends BaseScraper {
  private static readonly BASE_URL = 'https://www.ocado.com';

  constructor() {
    const meta = STORE_METADATA.MS_FOOD;
    super({
      store: 'MS_FOOD',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: meta.searchUrl,
      maxConcurrency: 1,
      requestDelayMs: 2000,
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 8000,
      categories: MS_FOOD_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
    });
  }

  async getCategories(): Promise<StoreCategory[]> {
    return MS_FOOD_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${MSFoodScraper.BASE_URL}${category.url}?page=${page}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProducts(html, category.name);
        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          products.push(...pageProducts);
          page++;
          if (products.length >= 2000 || page > 40) hasMore = false;
        }
      } catch (error: any) {
        console.error(
          `[M&S Food] Error page ${page} of ${category.name}: ${error.message}`,
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
        : `${MSFoodScraper.BASE_URL}/products/${productIdOrUrl}`;
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
      // Search Ocado but filter for M&S products
      const url = `${MSFoodScraper.BASE_URL}/search?entry=${encodeURIComponent('M&S ' + query)}`;
      const html = await this.httpClient.getHtml(url);
      return this.parseProducts(html, 'search').slice(0, limit);
    } catch (error: any) {
      console.error(`[M&S Food] Search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse products from Ocado HTML, same approach as OcadoScraper
   * but marks products as M&S Food store.
   */
  private parseProducts(html: string, categoryName: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    // Use cheerio to parse (same as Ocado)
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);

    // Try JSON-LD
    $('script[type="application/ld+json"]').each((_: number, el: any) => {
      try {
        const data = JSON.parse($(el).html() || '');
        if (data['@type'] === 'ItemList' && data.itemListElement) {
          for (const item of data.itemListElement) {
            const product = item.item || item;
            if (product['@type'] === 'Product') {
              const price = this.parsePriceToPence(
                String(
                  product.offers?.price || product.offers?.[0]?.price || '0',
                ),
              );
              if (price <= 0) continue;

              const isDineIn =
                categoryName.toLowerCase().includes('dine in') ||
                product.name?.toLowerCase().includes('dine in') ||
                false;

              products.push({
                storeProductId: product.sku || product.productID || '',
                barcode: product.gtin13 || product.gtin || undefined,
                name: product.name || '',
                brand: 'M&S',
                price,
                isOnOffer: false,
                isDineIn,
                category: categoryName,
                imageUrl: product.image?.[0] || product.image || undefined,
                productUrl: product.url
                  ? product.url.startsWith('http')
                    ? product.url
                    : `${MSFoodScraper.BASE_URL}${product.url}`
                  : '',
                description: product.description || undefined,
                isAvailable: true,
                scrapedAt: this.now(),
              });
            }
          }
        }
      } catch {
        // Skip
      }
    });

    if (products.length > 0) return products;

    // Fallback HTML parsing
    $('.fop-item, [data-sku], .product-card').each((_: number, el: any) => {
      try {
        const $el = $(el);
        const name = $el
          .find('.fop-title, .product-card__name, h4 a')
          .first()
          .text()
          .trim();
        if (!name) return;

        const priceText = $el
          .find('.fop-price, .product-card__price, .price')
          .first()
          .text()
          .trim();
        const price = this.parsePriceToPence(priceText);
        if (price <= 0) return;

        const href = $el.find('a[href]').first().attr('href') || '';
        const productUrl = href.startsWith('http')
          ? href
          : `${MSFoodScraper.BASE_URL}${href}`;
        const productId =
          $el.attr('data-sku') || href.split('/').filter(Boolean).pop() || '';

        products.push({
          storeProductId: productId,
          name,
          brand: 'M&S',
          price,
          isOnOffer: false,
          isDineIn: categoryName.toLowerCase().includes('dine in'),
          category: categoryName,
          imageUrl: $el.find('img').first().attr('src') || undefined,
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
