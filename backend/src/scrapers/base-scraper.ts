import dayjs from 'dayjs';
import {
  IScraper,
  ScraperConfig,
  ScraperResult,
  ScrapedProduct,
  ScraperError,
  StoreCategory,
  CategoryResult,
  UKStore,
  CircuitBreakerState,
  PRICE_VALIDATION,
} from './types';
import { HttpClient, createStoreHttpClient } from './utils/http-client';

export abstract class BaseScraper implements IScraper {
  readonly store: UKStore;
  readonly config: ScraperConfig;
  protected httpClient: HttpClient;
  protected circuitBreaker: CircuitBreakerState;
  protected errors: ScraperError[] = [];

  constructor(config: ScraperConfig) {
    this.store = config.store;
    this.config = config;
    this.httpClient = createStoreHttpClient({
      baseUrl: config.baseUrl,
      requestDelayMs: config.requestDelayMs,
      maxRetries: config.maxRetries,
      timeoutMs: config.timeoutMs,
      headers: config.headers,
    });
    this.circuitBreaker = {
      store: config.store,
      state: 'CLOSED',
      failureCount: 0,
    };
  }

  /**
   * Scrape all products across all categories.
   */
  async scrapeAll(): Promise<ScraperResult> {
    const startedAt = dayjs().toISOString();
    const startTime = Date.now();
    const allProducts: ScrapedProduct[] = [];
    const categoryResults: CategoryResult[] = [];
    this.errors = [];

    console.log(`[${this.config.storeName}] Starting full scrape...`);

    // Check circuit breaker
    if (this.isCircuitOpen()) {
      console.warn(
        `[${this.config.storeName}] Circuit breaker is OPEN. Skipping scrape.`,
      );
      return this.buildResult(
        startedAt,
        startTime,
        allProducts,
        categoryResults,
      );
    }

    try {
      const categories = await this.getCategories();
      console.log(
        `[${this.config.storeName}] Found ${categories.length} categories to scrape.`,
      );

      for (const category of categories) {
        const catStartTime = Date.now();
        let catErrorCount = 0;

        try {
          console.log(
            `[${this.config.storeName}] Scraping category: ${category.name}`,
          );
          const products = await this.scrapeCategory(category);
          const validProducts = products.filter((p) => this.validateProduct(p));

          allProducts.push(...validProducts);

          categoryResults.push({
            categoryId: category.id,
            categoryName: category.name,
            productCount: validProducts.length,
            errorCount: catErrorCount,
            durationMs: Date.now() - catStartTime,
          });

          console.log(
            `[${this.config.storeName}] Category "${category.name}": ${validProducts.length} products scraped.`,
          );

          // Reset circuit breaker on success
          this.resetCircuitBreaker();
        } catch (error: any) {
          catErrorCount++;
          this.recordError(
            category.url,
            error.message,
            error.response?.status,
            category.name,
          );
          this.recordCircuitBreakerFailure();

          categoryResults.push({
            categoryId: category.id,
            categoryName: category.name,
            productCount: 0,
            errorCount: 1,
            durationMs: Date.now() - catStartTime,
          });

          console.error(
            `[${this.config.storeName}] Error scraping category "${category.name}": ${error.message}`,
          );

          // If circuit breaker opens, stop scraping
          if (this.isCircuitOpen()) {
            console.warn(
              `[${this.config.storeName}] Circuit breaker opened. Stopping scrape.`,
            );
            break;
          }
        }

        // Check if we've hit the max products limit
        if (allProducts.length >= this.config.maxProducts) {
          console.log(
            `[${this.config.storeName}] Reached max products limit (${this.config.maxProducts}). Stopping.`,
          );
          break;
        }
      }
    } catch (error: any) {
      console.error(
        `[${this.config.storeName}] Fatal error during scrape: ${error.message}`,
      );
      this.recordError(this.config.baseUrl, error.message, undefined, 'FATAL');
    }

    const result = this.buildResult(
      startedAt,
      startTime,
      allProducts,
      categoryResults,
    );

    console.log(
      `[${this.config.storeName}] Scrape complete. ${result.successCount} products, ${result.errorCount} errors, ${result.durationMs}ms`,
    );

    return result;
  }

  /**
   * Search for products by query string.
   */
  async searchProducts(
    query: string,
    limit: number = 20,
  ): Promise<ScrapedProduct[]> {
    try {
      const products = await this.performSearch(query, limit);
      return products.filter((p) => this.validateProduct(p));
    } catch (error: any) {
      console.error(
        `[${this.config.storeName}] Search error for "${query}": ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Test connectivity to the store website.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get(this.config.baseUrl);
      return response.status >= 200 && response.status < 400;
    } catch {
      return false;
    }
  }

  // ==================== Abstract Methods (implemented by each store) ====================

  /**
   * Scrape all products in a specific category. Must be implemented by each store scraper.
   */
  abstract scrapeCategory(category: StoreCategory): Promise<ScrapedProduct[]>;

  /**
   * Scrape a single product by its store product ID or URL.
   */
  abstract scrapeProduct(
    productIdOrUrl: string,
  ): Promise<ScrapedProduct | null>;

  /**
   * Get the list of categories for this store.
   */
  abstract getCategories(): Promise<StoreCategory[]>;

  /**
   * Perform a product search. Must be implemented by each store scraper.
   */
  protected abstract performSearch(
    query: string,
    limit: number,
  ): Promise<ScrapedProduct[]>;

  // ==================== Validation ====================

  protected validateProduct(product: ScrapedProduct): boolean {
    if (!product.name || product.name.trim().length === 0) {
      return false;
    }

    if (product.name.length > PRICE_VALIDATION.MAX_NAME_LENGTH) {
      return false;
    }

    if (
      !product.price ||
      product.price < PRICE_VALIDATION.MIN_PRICE_PENCE ||
      product.price > PRICE_VALIDATION.MAX_PRICE_PENCE
    ) {
      return false;
    }

    if (!product.storeProductId || product.storeProductId.trim().length === 0) {
      return false;
    }

    if (!product.productUrl || product.productUrl.trim().length === 0) {
      return false;
    }

    return true;
  }

  // ==================== Circuit Breaker ====================

  protected isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'OPEN') {
      // Check if enough time has passed to try half-open
      if (this.circuitBreaker.openedAt) {
        const openDuration =
          Date.now() - new Date(this.circuitBreaker.openedAt).getTime();
        const cooldownMs = 60 * 60 * 1000; // 1 hour

        if (openDuration >= cooldownMs) {
          this.circuitBreaker.state = 'HALF_OPEN';
          this.circuitBreaker.halfOpenTestAt = dayjs().toISOString();
          console.log(
            `[${this.config.storeName}] Circuit breaker moving to HALF_OPEN.`,
          );
          return false;
        }
      }
      return true;
    }
    return false;
  }

  protected recordCircuitBreakerFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureAt = dayjs().toISOString();

    const threshold = 5;
    if (this.circuitBreaker.failureCount >= threshold) {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.openedAt = dayjs().toISOString();
      console.warn(
        `[${this.config.storeName}] Circuit breaker OPENED after ${threshold} consecutive failures.`,
      );
    }
  }

  protected resetCircuitBreaker(): void {
    if (this.circuitBreaker.state !== 'CLOSED') {
      console.log(
        `[${this.config.storeName}] Circuit breaker reset to CLOSED.`,
      );
    }
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.failureCount = 0;
  }

  // ==================== Error Recording ====================

  protected recordError(
    url: string,
    message: string,
    statusCode?: number,
    category?: string,
  ): void {
    this.errors.push({
      url,
      message,
      statusCode,
      timestamp: dayjs().toISOString(),
      retryCount: this.config.maxRetries,
      category,
    });
  }

  // ==================== Helpers ====================

  protected buildResult(
    startedAt: string,
    startTime: number,
    products: ScrapedProduct[],
    categories: CategoryResult[],
  ): ScraperResult {
    const completedAt = dayjs().toISOString();
    return {
      store: this.store,
      storeName: this.config.storeName,
      startedAt,
      completedAt,
      durationMs: Date.now() - startTime,
      totalProducts: products.length + this.errors.length,
      successCount: products.length,
      errorCount: this.errors.length,
      skippedCount: 0,
      products,
      errors: this.errors,
      categories,
    };
  }

  /**
   * Helper to extract price in pence from a price string like "£1.75" or "1.75".
   */
  protected parsePriceToPence(priceStr: string): number {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/[£$€,\s]/g, '').trim();
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }

  /**
   * Helper to create a timestamp for the current scrape.
   */
  protected now(): string {
    return dayjs().toISOString();
  }
}
