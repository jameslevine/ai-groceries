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
 * Sainsbury's Grocery Scraper
 *
 * Uses HTML parsing with Cheerio. Sainsbury's uses Cloudflare protection
 * so may need Puppeteer fallback for some pages.
 *
 * Key endpoints:
 * - Search: https://www.sainsburys.co.uk/gol-ui/SearchResults/{query}
 * - Category: https://www.sainsburys.co.uk/shop/gb/groceries/{category}
 * - Product: https://www.sainsburys.co.uk/gol-ui/product/{productId}
 *
 * Sainsbury's also embeds JSON-LD structured data on product pages.
 */

const SAINSBURYS_CATEGORIES: StoreCategory[] = [
  {
    id: 'fruit-veg',
    name: 'Fruit & Vegetables',
    url: '/shop/gb/groceries/fruit-veg',
  },
  {
    id: 'meat-fish',
    name: 'Meat & Fish',
    url: '/shop/gb/groceries/meat-fish',
  },
  {
    id: 'dairy-eggs-chilled',
    name: 'Dairy, Eggs & Chilled',
    url: '/shop/gb/groceries/dairy-eggs-chilled',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    url: '/shop/gb/groceries/bakery',
  },
  {
    id: 'frozen',
    name: 'Frozen',
    url: '/shop/gb/groceries/frozen-702702',
  },
  {
    id: 'food-cupboard',
    name: 'Food Cupboard',
    url: '/shop/gb/groceries/food-cupboard',
  },
  {
    id: 'drinks',
    name: 'Drinks',
    url: '/shop/gb/groceries/drinks',
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    url: '/shop/gb/groceries/health-beauty-background',
  },
  {
    id: 'household',
    name: 'Household',
    url: '/shop/gb/groceries/household',
  },
  {
    id: 'baby-toddler',
    name: 'Baby',
    url: '/shop/gb/groceries/baby',
  },
  {
    id: 'pet',
    name: 'Pet',
    url: '/shop/gb/groceries/pet',
  },
  {
    id: 'beer-wine-spirits',
    name: 'Beer, Wine & Spirits',
    url: '/shop/gb/groceries/beer-wine-spirits',
  },
];

export class SainsburysScraper extends BaseScraper {
  private static readonly PRODUCTS_PER_PAGE = 36;
  private static readonly BASE_URL = 'https://www.sainsburys.co.uk';

  constructor() {
    const meta = STORE_METADATA.SAINSBURYS;
    const config: ScraperConfig = {
      store: 'SAINSBURYS',
      storeName: meta.name,
      baseUrl: meta.baseUrl,
      searchUrl: meta.searchUrl,
      maxConcurrency: 1,
      requestDelayMs: 2000, // Slower due to Cloudflare
      maxRetries: 3,
      timeoutMs: 30000,
      maxProducts: 40000,
      categories: SAINSBURYS_CATEGORIES,
      userAgents: DEFAULT_USER_AGENTS,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    };
    super(config);
  }

  async getCategories(): Promise<StoreCategory[]> {
    return SAINSBURYS_CATEGORIES;
  }

  async scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${SainsburysScraper.BASE_URL}${category.url}?pageNumber=${page}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProductsFromHtml(html, category.name);

        if (pageProducts.length === 0) {
          hasMore = false;
        } else {
          products.push(...pageProducts);
          page++;

          if (products.length >= 4000 || page > 100) {
            hasMore = false;
          }
        }
      } catch (error: any) {
        console.error(
          `[Sainsbury's] Error on page ${page} of ${category.name}: ${error.message}`,
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
        : `${SainsburysScraper.BASE_URL}/gol-ui/product/${productIdOrUrl}`;

      const html = await this.httpClient.getHtml(url);
      const products = this.parseProductsFromHtml(html, 'single');
      return products.length > 0 ? products[0] : null;
    } catch (error: any) {
      console.error(
        `[Sainsbury's] Error scraping product ${productIdOrUrl}: ${error.message}`,
      );
      return null;
    }
  }

  protected async performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]> {
    const products: ScrapedProduct[] = [];
    const pages = Math.ceil(limit / SainsburysScraper.PRODUCTS_PER_PAGE);

    for (let page = 1; page <= pages; page++) {
      try {
        const url = `${SainsburysScraper.BASE_URL}/gol-ui/SearchResults/${encodeURIComponent(query)}?pageNumber=${page}`;
        const html = await this.httpClient.getHtml(url);
        const pageProducts = this.parseProductsFromHtml(html, 'search');
        products.push(...pageProducts);

        if (products.length >= limit) break;
      } catch (error: any) {
        console.error(
          `[Sainsbury's] Search error page ${page}: ${error.message}`,
        );
        break;
      }
    }

    return products.slice(0, limit);
  }

  /**
   * Parse products from Sainsbury's HTML using Cheerio.
   */
  private parseProductsFromHtml(
    html: string,
    categoryName: string,
  ): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];
    const $ = cheerio.load(html);

    // Try JSON-LD first (most reliable)
    const jsonLdProducts = this.extractFromJsonLd($, categoryName);
    if (jsonLdProducts.length > 0) {
      return jsonLdProducts;
    }

    // Fallback: parse product tiles from HTML
    $(
      '[data-test-id="product-tile"], .pt-grid-item, .productLister .product',
    ).each((_, element) => {
      try {
        const $el = $(element);

        // Product name
        const name = $el
          .find(
            '[data-test-id="product-tile-name"], .productNameAndPromotions h3 a, .pt__title a',
          )
          .first()
          .text()
          .trim();

        if (!name) return;

        // Price
        const priceText = $el
          .find(
            '[data-test-id="pt-retail-price"], .pricePerUnit, .pt__cost__retail-price',
          )
          .first()
          .text()
          .trim();
        const price = this.parsePriceToPence(priceText);
        if (price <= 0) return;

        // Nectar price
        const nectarPriceText = $el
          .find('[data-test-id="nectar-price"], .nectarPrice')
          .first()
          .text()
          .trim();
        const nectarPrice = nectarPriceText
          ? this.parsePriceToPence(nectarPriceText)
          : undefined;

        // Price per unit
        const pricePerUnitText = $el
          .find('[data-test-id="pt-price-per-unit"], .pricePerMeasure')
          .first()
          .text()
          .trim();
        const pricePerUnit = pricePerUnitText
          ? this.parsePriceToPence(pricePerUnitText)
          : undefined;

        // Product URL
        const href =
          $el
            .find('a[href*="/product/"], a[href*="/gol-ui/product/"]')
            .first()
            .attr('href') || '';
        const productUrl = href.startsWith('http')
          ? href
          : `${SainsburysScraper.BASE_URL}${href}`;

        // Product ID from URL
        const productId = this.extractProductIdFromUrl(href);

        // Image
        const imageUrl =
          $el
            .find('img[src*="sainsburys"], img[data-src]')
            .first()
            .attr('src') ||
          $el
            .find('img[src*="sainsburys"], img[data-src]')
            .first()
            .attr('data-src') ||
          undefined;

        // Offer
        const offerText = $el
          .find('[data-test-id="offer-text"], .promotion, .offerDescription')
          .first()
          .text()
          .trim();
        const isOnOffer =
          !!offerText || (nectarPrice !== undefined && nectarPrice < price);

        // Was price
        const wasPriceText = $el
          .find('[data-test-id="was-price"], .was')
          .first()
          .text()
          .trim();
        const originalPrice = wasPriceText
          ? this.parsePriceToPence(wasPriceText)
          : undefined;

        // Determine offer type
        let offerType: ScrapedProduct['offerType'];
        if (nectarPrice && nectarPrice < price) {
          offerType = 'LOYALTY_PRICE';
        } else if (offerText?.toLowerCase().includes('buy')) {
          offerType = 'MULTI_BUY';
        } else if (offerText?.toLowerCase().includes('half price')) {
          offerType = 'HALF_PRICE';
        } else if (isOnOffer) {
          offerType = 'PRICE_CUT';
        }

        // Price Lock detection
        const isPriceLock =
          $el.find('.priceLock, [data-test-id="price-lock"]').length > 0 ||
          offerText?.toLowerCase().includes('price lock') ||
          false;

        products.push({
          storeProductId: productId,
          name,
          price,
          nectarPrice,
          pricePerUnit,
          unitForPricing: this.extractUnitFromPriceText(pricePerUnitText),
          isOnOffer,
          offerType,
          offerDescription: offerText || undefined,
          originalPrice,
          isPriceLock,
          category: categoryName,
          imageUrl,
          productUrl,
          isAvailable: true,
          scrapedAt: this.now(),
        });
      } catch {
        // Skip malformed product tiles
      }
    });

    return products;
  }

  /**
   * Extract products from JSON-LD structured data.
   */
  private extractFromJsonLd(
    $: cheerio.CheerioAPI,
    categoryName: string,
  ): ScrapedProduct[] {
    const products: ScrapedProduct[] = [];

    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonText = $(element).html();
        if (!jsonText) return;

        const data = JSON.parse(jsonText);

        // Handle ItemList (category pages)
        if (data['@type'] === 'ItemList' && data.itemListElement) {
          for (const item of data.itemListElement) {
            const product = item.item || item;
            if (product['@type'] === 'Product') {
              const mapped = this.mapJsonLdProduct(product, categoryName);
              if (mapped) products.push(mapped);
            }
          }
        }

        // Handle single Product
        if (data['@type'] === 'Product') {
          const mapped = this.mapJsonLdProduct(data, categoryName);
          if (mapped) products.push(mapped);
        }
      } catch {
        // Invalid JSON-LD, skip
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
            : `${SainsburysScraper.BASE_URL}${data.url}`
          : '',
        description: data.description || undefined,
        isAvailable: offer.availability?.includes('InStock') || true,
        scrapedAt: this.now(),
      };
    } catch {
      return null;
    }
  }

  private extractProductIdFromUrl(url: string): string {
    const match = url.match(/\/product\/([^/?]+)/);
    return match ? match[1] : url.split('/').pop() || '';
  }

  private extractUnitFromPriceText(text: string): string | undefined {
    if (!text) return undefined;
    const match = text.match(/per\s+(kg|litre|100g|100ml|each)/i);
    return match ? `per ${match[1]}` : undefined;
  }
}
