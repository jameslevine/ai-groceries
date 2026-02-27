# AI Groceries — Data Scraping & Ingestion Pipeline

## Overview

The scraping pipeline is the core data engine of AI Groceries. It collects real-time pricing data from all 10 major UK supermarkets, normalises it into a unified product catalogue, and serves it to users for price comparison, deal discovery, and shopping list optimisation.

**This is the competitive moat** — no other UK consumer app provides real-time, cross-supermarket price comparison with loyalty card pricing at this level of detail.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SCHEDULING LAYER                              │
│                                                                 │
│  EventBridge Rule (4am daily)  ──► SQS: scrape-jobs-queue      │
│  EventBridge Rule (every 6h)   ──► SQS: hot-products-queue     │
│  API Gateway (on-demand)       ──► SQS: on-demand-queue        │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SCRAPING LAYER                                │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Tesco   │ │Sainsburys│ │   Asda   │ │Morrisons │          │
│  │ Scraper  │ │ Scraper  │ │ Scraper  │ │ Scraper  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │             │             │             │                │
│  ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐ ┌────┴─────┐          │
│  │   Aldi   │ │   Lidl   │ │ Waitrose │ │  Ocado   │          │
│  │ Scraper  │ │ Scraper  │ │ Scraper  │ │ Scraper  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
│       │             │             │             │                │
│  ┌────┴─────┐ ┌────┴─────┐      │             │                │
│  │  Co-op   │ │ M&S Food │      │             │                │
│  │ Scraper  │ │ Scraper  │      │             │                │
│  └────┬─────┘ └────┬─────┘      │             │                │
│       └─────────────┴────────────┴─────────────┘                │
│                         │                                       │
│                         ▼                                       │
│              S3: raw-scrape-data/                                │
│              {store}/{date}/products.json                        │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRANSFORMATION LAYER                          │
│                                                                 │
│  S3 Event ──► Transform Lambda                                  │
│                │                                                │
│                ├── Product Matching (barcode → canonical ID)    │
│                ├── Category Normalisation (store → standard)    │
│                ├── Price Normalisation (pence, per-unit calc)   │
│                ├── Loyalty Price Extraction (Clubcard, Nectar)  │
│                ├── Deal Detection (price drops, multi-buys)     │
│                └── Data Quality Scoring                         │
│                         │                                       │
│                         ▼                                       │
│              DynamoDB: Products Table                            │
│              DynamoDB: Price History Table                       │
│              S3: analytics/ (Parquet for Athena)                │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVING LAYER                                 │
│                                                                 │
│  API Lambda ──► GET /products/search                            │
│             ──► GET /products/barcode/:barcode                  │
│             ──► GET /prices/compare                             │
│             ──► GET /prices/history/:productId                  │
│             ──► GET /prices/deals                               │
│             ──► POST /prices/basket                             │
│             ──► GET /prices/stores                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Store Scraping Strategies

### Tier 1 — High Priority (60%+ UK market share)

#### Tesco

- **Method**: Unofficial REST API (`/groceries/en-GB/search?query=...&page=...`)
- **Data format**: JSON response with product details
- **Pricing**: Standard price + Clubcard price + Aldi Price Match flag
- **Rate limit**: 1 request/second, rotate User-Agent
- **Categories**: ~25 top-level categories, paginate through each
- **Estimated products**: ~45,000
- **Anti-bot**: Moderate — session cookies, rate limiting

#### Sainsbury's

- **Method**: HTML parsing with Cheerio (fallback to Puppeteer if Cloudflare blocks)
- **Data format**: HTML product cards + JSON-LD structured data
- **Pricing**: Standard price + Nectar price + Price Lock flag
- **Rate limit**: 2 seconds between requests
- **Categories**: Category sitemap → paginate
- **Estimated products**: ~35,000
- **Anti-bot**: Cloudflare protection — may need Puppeteer + stealth plugin

#### Asda

- **Method**: Internal REST API (`/api/items/search?keyword=...`)
- **Data format**: JSON with detailed product data
- **Pricing**: Standard price + Rollback flag + Just Essentials range
- **Rate limit**: 1 request/second
- **Categories**: Category tree API → paginate
- **Estimated products**: ~40,000
- **Anti-bot**: API key in headers, session management

### Tier 2 — Medium Priority

#### Morrisons

- **Method**: REST API (`/webshop/api/v1/products?...`)
- **Data format**: JSON
- **Pricing**: Standard price + More Card price + Savers range
- **Estimated products**: ~30,000

#### Aldi

- **Method**: HTML parsing with Cheerio
- **Data format**: HTML product pages
- **Pricing**: Standard price only (no loyalty scheme) + Super 6 offers
- **Estimated products**: ~2,000 (limited online range)
- **Note**: Aldi has a much smaller online range than other supermarkets

#### Lidl

- **Method**: HTML parsing with Cheerio
- **Data format**: HTML product pages
- **Pricing**: Standard price + Lidl Plus price + weekly specials
- **Estimated products**: ~2,500 (limited online range)

### Tier 3 — Lower Priority

#### Waitrose

- **Method**: REST API (`/api/custsearch-prod/...`)
- **Data format**: JSON
- **Pricing**: Standard price + myWaitrose price + Essential range
- **Estimated products**: ~25,000

#### Ocado

- **Method**: HTML parsing + JSON-LD (Puppeteer for anti-bot)
- **Data format**: HTML with embedded JSON
- **Pricing**: Standard price + Smart Pass discounts
- **Estimated products**: ~50,000
- **Anti-bot**: Aggressive — requires Puppeteer + stealth + proxy rotation

#### Co-op

- **Method**: HTML parsing with Cheerio
- **Data format**: HTML product pages
- **Pricing**: Standard price + Member price
- **Estimated products**: ~5,000

#### M&S Food

- **Method**: Via Ocado (M&S products listed on Ocado)
- **Data format**: Same as Ocado, filtered by M&S brand
- **Pricing**: Standard Ocado pricing
- **Estimated products**: ~6,000

---

## Data Models

### Scraped Product (Raw)

```typescript
interface ScrapedProduct {
  // Identity
  storeProductId: string; // Store's internal product ID
  barcode?: string; // EAN-13 barcode (not always available)
  name: string; // Product name as displayed on store
  brand?: string; // Brand name

  // Pricing (all in pence)
  price: number; // Current shelf price
  pricePerUnit?: number; // Price per kg/litre
  unitForPricing?: string; // "per kg", "per litre", "per 100g"

  // Loyalty Pricing (all in pence, null if not applicable)
  clubcardPrice?: number | null; // Tesco Clubcard
  nectarPrice?: number | null; // Sainsbury's Nectar
  moreCardPrice?: number | null; // Morrisons More Card
  lidlPlusPrice?: number | null; // Lidl Plus
  myWaitrosePrice?: number | null; // myWaitrose
  memberPrice?: number | null; // Co-op Member
  smartPassPrice?: number | null; // Ocado Smart Pass

  // Offers
  isOnOffer: boolean;
  offerType?: OfferType;
  offerDescription?: string; // "Was £3.50, now £2.00"
  originalPrice?: number; // Pre-offer price in pence
  offerValidUntil?: string; // ISO date

  // Offer Flags (store-specific)
  isAldiPriceMatch?: boolean; // Tesco
  isPriceLock?: boolean; // Sainsbury's
  isRollback?: boolean; // Asda
  isSuper6?: boolean; // Aldi
  isWeeklySpecial?: boolean; // Lidl
  isDineIn?: boolean; // M&S

  // Product Details
  category: string; // Store's category path
  subcategory?: string;
  weight?: string; // "2L", "500g", "6 pack"
  imageUrl?: string;
  productUrl: string; // Direct link to product page
  description?: string;

  // Availability
  isAvailable: boolean;

  // Metadata
  scrapedAt: string; // ISO timestamp
}

type OfferType =
  | 'PRICE_CUT' // Simple price reduction
  | 'MULTI_BUY' // 2 for £3, 3 for 2, etc.
  | 'LOYALTY_PRICE' // Clubcard/Nectar exclusive price
  | 'ROLLBACK' // Asda Rollback
  | 'MEAL_DEAL' // Meal deal component
  | 'BUNDLE' // Bundle offer
  | 'PERCENTAGE_OFF' // 25% off
  | 'BOGOF' // Buy one get one free
  | 'HALF_PRICE'; // Half price
```

### Canonical Product (Normalised)

```typescript
interface CanonicalProduct {
  productId: string; // UUID
  barcode: string; // EAN-13 (primary key for matching)
  name: string; // Canonical product name
  brand?: string;
  category: string; // Our standard category
  subcategory?: string;
  imageUrl?: string; // Best quality image
  description?: string;
  weight?: string;
  unit?: string; // Base unit (kg, l, each)

  // Cross-store mapping
  storeProducts: {
    [store: string]: {
      // TESCO, SAINSBURYS, etc.
      storeProductId: string;
      storeName: string;
      productUrl: string;
    };
  };

  // Metadata
  qualityScore: number; // 0-100
  matchConfidence: number; // 0-1 (how confident the cross-store match is)
  lastUpdated: string;
  createdAt: string;
}
```

### Price Record

```typescript
interface PriceRecord {
  productId: string;
  store: UKSupermarket;
  date: string; // ISO date (YYYY-MM-DD)

  // Prices (all in pence)
  shelfPrice: number; // Standard shelf price
  loyaltyPrice?: number; // Best loyalty card price
  loyaltyScheme?: string; // "Clubcard", "Nectar", etc.
  effectivePrice: number; // Best available price (min of shelf + loyalty)
  pricePerUnit?: number;
  unitForPricing?: string;

  // Offers
  isOnOffer: boolean;
  offerType?: OfferType;
  offerDescription?: string;
  originalPrice?: number;

  // Metadata
  scrapedAt: string;
}
```

---

## DynamoDB Table Design

### Products Table

| Access Pattern            | pk                  | sk                                       | GSI                                                  |
| ------------------------- | ------------------- | ---------------------------------------- | ---------------------------------------------------- |
| Get product by barcode    | `PRODUCT#<barcode>` | `META`                                   | —                                                    |
| Get latest price at store | `PRODUCT#<barcode>` | `PRICE#<store>#LATEST`                   | —                                                    |
| Get all latest prices     | `PRODUCT#<barcode>` | begins_with(`PRICE#`) + filter `#LATEST` | —                                                    |
| Search by category        | —                   | —                                        | GSI1: pk=`CAT#<category>`, sk=`NAME#<name>`          |
| Search by store           | —                   | —                                        | GSI2: pk=`STORE#<store>`, sk=`CAT#<category>#<name>` |
| Get deals for store       | —                   | —                                        | GSI2: pk=`STORE#<store>`, filter `isOnOffer=true`    |

### Price History Table

| Access Pattern                         | pk                  | sk                                                            |
| -------------------------------------- | ------------------- | ------------------------------------------------------------- |
| Get price history for product at store | `PRODUCT#<barcode>` | `HIST#<store>#<date>`                                         |
| Get all history for product            | `PRODUCT#<barcode>` | begins_with(`HIST#`)                                          |
| Get recent history (last 90 days)      | `PRODUCT#<barcode>` | between `HIST#<store>#<90daysAgo>` and `HIST#<store>#<today>` |

**TTL**: Price history records older than 365 days are automatically deleted.

---

## Scheduling

| Schedule              | Trigger          | What                                           | Concurrency               | Est. Duration |
| --------------------- | ---------------- | ---------------------------------------------- | ------------------------- | ------------- |
| Daily 4:00 AM         | EventBridge cron | Full category crawl — all 10 stores            | 10 parallel (1 per store) | 30-60 min     |
| Every 6 hours         | EventBridge rate | Top 1000 most-viewed products refresh          | 5 parallel                | 10-15 min     |
| Weekly Sunday 2:00 AM | EventBridge cron | Full catalogue refresh + new product discovery | 10 parallel               | 60-120 min    |
| On-demand             | API request      | Single product price lookup (barcode scan)     | 1                         | 5-15 sec      |

---

## Error Handling

### Retry Strategy

- **Per-request**: 3 retries with exponential backoff (1s, 2s, 4s)
- **Per-store**: If >50% of requests fail, pause store scraper and alert
- **Per-job**: Failed SQS messages retry 3x then go to Dead Letter Queue

### Circuit Breaker

Each store scraper has a circuit breaker:

- **Closed** (normal): Requests flow normally
- **Open** (broken): After 5 consecutive failures, stop scraping this store for 1 hour
- **Half-open**: After 1 hour, try a single test request. If it succeeds, close the circuit.

### Data Validation

Every scraped product must pass validation:

- `name` is non-empty
- `price` is a positive integer (in pence)
- `price` is within reasonable range (1p to £999.99)
- `storeProductId` is non-empty
- `productUrl` is a valid URL

Products failing validation are logged to a `scrape-errors` table for review.

---

## Monitoring & Alerting

### CloudWatch Metrics (Custom)

- `ProductsScraped` — Count per store per run
- `ScraperErrors` — Error count per store per run
- `ScrapeDuration` — Duration per store per run
- `NewProductsFound` — New products discovered per run
- `PriceChangesDetected` — Price changes detected per run
- `DataFreshness` — Hours since last successful scrape per store

### CloudWatch Alarms

- **Scraper failure**: Any store fails completely → SNS alert
- **DLQ depth > 0**: Failed jobs in dead letter queue → SNS alert
- **Data staleness**: Any store not scraped in 48 hours → SNS alert
- **Error rate > 20%**: High error rate on any store → SNS alert

### Daily Summary (SES Email)

- Products scraped per store
- New products found
- Price changes detected (increases and decreases)
- Deals found
- Errors and failures
- Data quality scores

---

## Legal & Ethical Compliance

1. **robots.txt**: Respect all store robots.txt directives
2. **Rate limiting**: Never exceed 1 request per second per store
3. **Caching**: Cache aggressively — prices don't change more than daily
4. **User-Agent**: `AIGroceries/1.0 (price-comparison; contact@aigroceries.co.uk)`
5. **No personal data**: Only scrape publicly available product/price data
6. **Terms of Service**: Monitor for ToS changes; be prepared to switch to official APIs
7. **Data retention**: Raw scrape data retained for 30 days; price history for 365 days

---

## File Structure

```
backend/src/
├── scrapers/
│   ├── types.ts                  # All scraper interfaces and types
│   ├── base-scraper.ts           # Abstract base class
│   ├── scraper-factory.ts        # Factory to create store-specific scrapers
│   ├── stores/
│   │   ├── tesco.ts
│   │   ├── sainsburys.ts
│   │   ├── asda.ts
│   │   ├── morrisons.ts
│   │   ├── aldi.ts
│   │   ├── lidl.ts
│   │   ├── waitrose.ts
│   │   ├── ocado.ts
│   │   ├── coop.ts
│   │   └── ms-food.ts
│   └── utils/
│       ├── http-client.ts        # Axios wrapper with retry, rate limiting
│       ├── proxy-manager.ts      # Proxy rotation
│       ├── user-agent.ts         # User-Agent rotation
│       └── robots-txt.ts         # robots.txt parser and checker
├── transformers/
│   ├── product-matcher.ts        # Cross-store product matching
│   ├── category-mapper.ts        # Store category → standard category
│   ├── price-normaliser.ts       # Price normalisation
│   ├── deal-detector.ts          # Detect and classify deals
│   ├── quality-scorer.ts         # Product data quality scoring
│   └── deduplicator.ts           # Product deduplication
├── adapters/
│   ├── products.ts               # DynamoDB adapter for products
│   └── price-history.ts          # DynamoDB adapter for price history
└── handlers/
    ├── scraper-handler.ts        # Lambda: SQS → scrape → S3
    └── transform-handler.ts      # Lambda: S3 → transform → DynamoDB
```

---

## Implementation Order

1. Scraper types and interfaces
2. HTTP client with retry and rate limiting
3. Base scraper class
4. Tesco scraper (Tier 1)
5. Transform pipeline (matcher, normaliser, deal detector)
6. DynamoDB products adapter
7. Lambda handlers
8. CloudFormation infrastructure
9. Asda scraper (Tier 1)
10. Sainsbury's scraper (Tier 1)
11. Tier 2 scrapers
12. Tier 3 scrapers
13. Monitoring and alerting
