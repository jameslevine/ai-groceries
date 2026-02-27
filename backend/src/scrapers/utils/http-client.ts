import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { DEFAULT_USER_AGENTS } from '../types';

interface HttpClientConfig {
  baseUrl?: string;
  requestDelayMs: number;
  maxRetries: number;
  timeoutMs: number;
  userAgents?: string[];
  headers?: Record<string, string>;
}

interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export class HttpClient {
  private client: AxiosInstance;
  private requestDelayMs: number;
  private maxRetries: number;
  private userAgents: string[];
  private lastRequestTime: number = 0;
  private requestCount: number = 0;

  constructor(config: HttpClientConfig) {
    this.requestDelayMs = config.requestDelayMs;
    this.maxRetries = config.maxRetries;
    this.userAgents = config.userAgents || DEFAULT_USER_AGENTS;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeoutMs,
      maxRedirects: 5,
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        ...config.headers,
      },
    });
  }

  /**
   * Make a GET request with rate limiting, retry, and User-Agent rotation.
   */
  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.requestWithRetry<T>('GET', url, undefined, config);
  }

  /**
   * Make a POST request with rate limiting, retry, and User-Agent rotation.
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.requestWithRetry<T>('POST', url, data, config);
  }

  /**
   * Get the raw HTML content of a page.
   */
  async getHtml(url: string): Promise<string> {
    const response = await this.get<string>(url, {
      responseType: 'text',
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    return response.data;
  }

  /**
   * Get JSON data from an API endpoint.
   */
  async getJson<T = any>(
    url: string,
    params?: Record<string, any>,
  ): Promise<T> {
    const response = await this.get<T>(url, {
      params,
      headers: {
        Accept: 'application/json',
      },
    });
    return response.data;
  }

  private async requestWithRetry<T>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Rate limiting — wait between requests
        await this.enforceRateLimit();

        // Rotate User-Agent
        const userAgent = this.getNextUserAgent();

        const requestConfig: AxiosRequestConfig = {
          ...config,
          method,
          url,
          data,
          headers: {
            ...config?.headers,
            'User-Agent': userAgent,
          },
        };

        const response = await this.client.request<T>(requestConfig);
        this.requestCount++;
        return response;
      } catch (error: any) {
        lastError = error;
        const statusCode = error.response?.status;

        // Don't retry on client errors (except 429 Too Many Requests)
        if (
          statusCode &&
          statusCode >= 400 &&
          statusCode < 500 &&
          statusCode !== 429
        ) {
          throw error;
        }

        // If rate limited (429), wait longer
        if (statusCode === 429) {
          const retryAfter = parseInt(
            error.response?.headers?.['retry-after'] || '60',
            10,
          );
          console.warn(
            `Rate limited on ${url}. Waiting ${retryAfter}s before retry ${attempt + 1}/${this.maxRetries}`,
          );
          await this.sleep(retryAfter * 1000);
          continue;
        }

        // Exponential backoff for other errors
        if (attempt < this.maxRetries) {
          const delay = this.calculateBackoff(attempt);
          console.warn(
            `Request failed (${statusCode || error.code}): ${url}. Retry ${attempt + 1}/${this.maxRetries} in ${delay}ms`,
          );
          await this.sleep(delay);
        }
      }
    }

    throw (
      lastError ||
      new Error(`Request failed after ${this.maxRetries} retries: ${url}`)
    );
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestDelayMs) {
      const waitTime = this.requestDelayMs - timeSinceLastRequest;
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
  }

  private getNextUserAgent(): string {
    const index = this.requestCount % this.userAgents.length;
    return this.userAgents[index];
  }

  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s... capped at 30s
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get the total number of requests made by this client.
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Reset the request counter.
   */
  resetRequestCount(): void {
    this.requestCount = 0;
  }
}

/**
 * Create an HTTP client configured for a specific store.
 */
export const createStoreHttpClient = (config: {
  baseUrl: string;
  requestDelayMs?: number;
  maxRetries?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}): HttpClient => {
  return new HttpClient({
    baseUrl: config.baseUrl,
    requestDelayMs: config.requestDelayMs || 1000,
    maxRetries: config.maxRetries || 3,
    timeoutMs: config.timeoutMs || 30000,
    headers: config.headers,
  });
};
