import { S3Event, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import dayjs from 'dayjs';
import { ScraperResult, UKStore } from '../scrapers/types';
import { ingestScrapedProducts } from '../adapters/products';
import { detectDeals } from '../transformers/deal-detector';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });

/**
 * Transform Lambda handler.
 * Triggered by S3 PutObject events when raw scrape data is uploaded.
 *
 * Flow: S3 (raw data) → This Lambda → DynamoDB (products + prices)
 *
 * Steps:
 * 1. Read raw scrape JSON from S3
 * 2. Normalise categories
 * 3. Upsert products to DynamoDB
 * 4. Record prices (latest + history)
 * 5. Detect deals
 * 6. Log summary metrics
 */
export const handler = async (
  event: S3Event,
  context: Context,
): Promise<void> => {
  console.log(
    `Transform handler invoked with ${event.Records.length} S3 events`,
  );

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing: s3://${bucket}/${key}`);

    try {
      // 1. Read raw scrape data from S3
      const scrapeResult = await readScrapeResult(bucket, key);

      if (
        !scrapeResult ||
        !scrapeResult.products ||
        scrapeResult.products.length === 0
      ) {
        console.warn(`No products found in ${key}. Skipping.`);
        continue;
      }

      console.log(
        `[${scrapeResult.storeName}] Processing ${scrapeResult.products.length} products...`,
      );

      // 2. Ingest products and prices into DynamoDB
      const startTime = Date.now();
      const result = await ingestScrapedProducts(
        scrapeResult.products,
        scrapeResult.store,
      );

      const durationMs = Date.now() - startTime;

      // 3. Detect deals
      const deals = detectDeals(
        scrapeResult.products,
        scrapeResult.store,
        scrapeResult.storeName,
      );

      // 4. Log summary
      console.log(
        JSON.stringify({
          event: 'TRANSFORM_COMPLETE',
          store: scrapeResult.store,
          storeName: scrapeResult.storeName,
          s3Key: key,
          inputProducts: scrapeResult.products.length,
          productsUpserted: result.productsUpserted,
          pricesRecorded: result.pricesRecorded,
          dealsFound: deals.length,
          errors: result.errors,
          durationMs,
          timestamp: dayjs().toISOString(),
        }),
      );

      // Log top 5 deals
      if (deals.length > 0) {
        console.log(
          `[${scrapeResult.storeName}] Top deals:`,
          deals.slice(0, 5).map((d) => ({
            name: d.productName,
            savings: `${d.savingsPercentage.toFixed(0)}%`,
            description: d.offerDescription,
          })),
        );
      }
    } catch (error: any) {
      console.error(`Error processing ${key}: ${error.message}`, error.stack);
      // Don't throw — process remaining records
    }
  }
};

/**
 * Read and parse a ScraperResult JSON file from S3.
 */
const readScrapeResult = async (
  bucket: string,
  key: string,
): Promise<ScraperResult | null> => {
  try {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    if (!response.Body) {
      console.error(`Empty body for s3://${bucket}/${key}`);
      return null;
    }

    const bodyString = await response.Body.transformToString();
    return JSON.parse(bodyString) as ScraperResult;
  } catch (error: any) {
    console.error(`Error reading s3://${bucket}/${key}: ${error.message}`);
    return null;
  }
};
