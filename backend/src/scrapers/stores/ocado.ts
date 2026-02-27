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
 * Ocado Scraper
 *
 * Uses HTML parsing with Cheerio + JSON-LD extraction.
 * Ocado has aggressive anti-bot measures — may need Puppeteer in production.
 * Features Smart Pass discounts. Also hosts M&S Food products.
 */

const OCADO_CATEGORIES: StoreCategory[] = [
  {
    id: 'fruit-veg',
    name: 'Fruit & Vegetables',
    url: '/browse/fruit-and-vegetables-702702',
  },
  {
    id: 'meat-fish',
    name: 'Meat, Fish & Poultry',
    url: '/browse/meat-fish-and-poultry-702703',
  },
  {
    id: 'dairy-eggs',
    name: 'Dairy & Eggs',
    url: '/browse/dairy-eggs-and-chilled-702704',
  },
  { id: 'bakery', name: 'Bakery', url: '/browse/bakery-702705' },
  { id: 'frozen', name: 'Frozen', url: '/browse/frozen-702706' },
  {
    id: 'food-cupboard',
    name: 'Food Cupboard',
    url: '/browse/food-cupboard-702707',
  },
  { id: 'drinks', name: 'Drinks', url: '/browse/drinks-702708' },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    url: '/browse/health-and-beauty-702709',
  },
  { id: 'household', name: 'Household', url: '/browse/household-702710' },
  { id: 'baby', name: 'Baby', url: '/browse/baby-702711' },
  { id: 'pet', name: 'Pet', url: '/browse/pet-702712' },
  {
    id: 'beer-wine-spirits',
    name: 'Beer, Wine & Spirits',
    url: '/browse/beer-wine-and-spirits-702713',
  },
];

export class OcadoScraper extends BaseScraper {
  private static readonly BASE_URL = 'https://www.ocado.com';

  constructor() {
    const meta = STORE_METADATA.OCADO;
    super({
      store: 'OCADO',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: meta.searchUrl,
      maxConcurrency: 1,
      requestDelayMs: 2000, // Slower due to anti-bot
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 55000,
      categories: OCADO_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
    });
  }

  async getCategories(): Promise<StoreCategory[]> {
    return OCADO_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${OcadoScraper.BASE_URL}${category.url}?page=${page}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProducts(html, category.name);
        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          products.push(...pageProducts);
          page++;
          if (products.length >= 5000 || page > 80) hasMore = false;
        }
      } catch (error: any) {
        console.error(
          `[Ocado] Error page ${page} of ${category.name}: ${error.message}`,
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
        : `${OcadoScraper.BASE_URL}/products/${productIdOrUrl}`;
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
      const url = `${OcadoScraper.BASE_URL}/search?entry=${encodeURIComponent(query)}`;
      const html = await this.httpClient.getHtml(url);
      return this.parseProducts(html, 'search').slice(0, limit);
    } catch (error: any) {
      console.error(`[Ocado] Search error: ${error.message}`);
      return [];
    }
  }

  private parseProducts(html: string, categoryName: string): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    const $ = cheerio.load(html);

    // Try JSON-LD first
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '');
        if (data['@type'] === 'ItemList' && data.itemListElement) {
          for (const item of data.itemListElement) {
            const product = item.item || item;
            if (product['@type'] === 'Product') {
              const mapped = this.mapJsonLdProduct(product, categoryName);
              if (mapped) products.push(mapped);
            }
          }
        }
        if (data['@type'] === 'Product') {
          const mapped = this.mapJsonLdProduct(data, categoryName);
          if (mapped) products.push(mapped);
        }
      } catch {
        // Skip invalid JSON-LD
      }
    });

    if (products.length > 0) return products;

    // Fallback: HTML parsing
    $('.fop-item, [data-sku], .product-card').each((_, el) => {
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
          : `${OcadoScraper.BASE_URL}${href}`;
        const productId =
          $el.attr('data-sku') || href.split('/').filter(Boolean).pop() || '';

        const imageUrl =
          $el.find('img').first().attr('src') ||
          $el.find('img').first().attr('data-src') ||
          undefined;

        const offerText = $el
          .find('.fop-offer, .offer-text')
          .first()
          .text()
          .trim();

        products.push({
          storeProductId: productId,
          name,
          price,
          isOnOffer: !!offerText,
          offerType: offerText ? 'PRICE_CUT' : undefined,
          offerDescription: offerText || undefined,
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

  private mapJsonLdProduct(
    data: any,
    categoryName: string,
  ): ScrapedProduct | null {
    try {
      const offer = data.offers?.[0] || data.offers;
      if (!offer) return null;
      const price = this.parsePriceToPence(String(offer.price || '0'));
      if (price <= 0) return null;

      return {
        storeProductId: data.sku || data.productID || '',
        barcode: data.gtin13 || data.gtin || undefined,
        name: data.name || '',
        brand: data.brand?.name || undefined,
        price,
        isOnOffer: false,
        category: categoryName,
        imageUrl: data.image?.[0] || data.image || undefined,
        productUrl: data.url
          ? data.url.startsWith('http')
            ? data.url
            : `${OcadoScraper.BASE_URL}${data.url}`
          : '',
        description: data.description || undefined,
        isAvailable: offer.availability?.includes('InStock') || true,
        scrapedAt: this.now(),
      };
    } catch {
      return null;
    }
  }
}
