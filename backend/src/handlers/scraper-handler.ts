import { SQSEvent, SQSRecord, Context } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dayjs from 'dayjs';
import {
  ScrapeJob,
  ScraperResult,
  UKStore,
  STORE_METADATA,
} from '../scrapers/types';
import { createScraper, isScraperAvailable } from '../scrapers/scraper-factory';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-west-2' });
const RAW_DATA_BUCKET = process.env.RAW_DATA_BUCKET || 'ai-groceries-raw-data';

/**
 * Lambda handler triggered by SQS messages.
 * Each message contains a ScrapeJob specifying which store to scrape.
 *
 * Flow: EventBridge → SQS → This Lambda → S3 (raw data) → Transform Lambda
 */
export const handler = async (
  event: SQSEvent,
  context: Context,
): Promise<void> => {
  console.log(`Scraper handler invoked with ${event.Records.length} messages`);

  for (const record of event.Records) {
    await processMessage(record);
  }
};

const processMessage = async (record: SQSRecord): Promise<void> => {
  let job: ScrapeJob;

  try {
    job = JSON.parse(record.body) as ScrapeJob;
  } catch (error) {
    console.error('Failed to parse SQS message:', record.body);
    return;
  }

  console.log(
    `Processing scrape job: ${job.jobId} | Store: ${job.store} | Type: ${job.jobType}`,
  );

  // Check if scraper is available for this store
  if (!isScraperAvailable(job.store)) {
    console.warn(`Scraper not available for store: ${job.store}. Skipping.`);
    return;
  }

  try {
    const scraper = createScraper(job.store);
    let result: ScraperResult;

    switch (job.jobType) {
      case 'FULL_CRAWL':
        result = await scraper.scrapeAll();
        break;

      case 'CATEGORY':
        if (!job.categories || job.categories.length === 0) {
          console.warn('CATEGORY job has no categories specified. Skipping.');
          return;
        }
        const categories = await scraper.getCategories();
        const targetCategories = categories.filter((c) =>
          job.categories!.includes(c.id),
        );
        const products = [];
        for (const cat of targetCategories) {
          const catProducts = await scraper.scrapeCategory(cat);
          products.push(...catProducts);
        }
        result = {
          store: job.store,
          storeName: STORE_METADATA[job.store].name,
          startedAt: dayjs().toISOString(),
          completedAt: dayjs().toISOString(),
          durationMs: 0,
          totalProducts: products.length,
          successCount: products.length,
          errorCount: 0,
          skippedCount: 0,
          products,
          errors: [],
          categories: [],
        };
        break;

      case 'SINGLE_PRODUCT':
        if (!job.productBarcodes || job.productBarcodes.length === 0) {
          console.warn('SINGLE_PRODUCT job has no barcodes. Skipping.');
          return;
        }
        const singleProducts = [];
        for (const barcode of job.productBarcodes) {
          const product = await scraper.scrapeProduct(barcode);
          if (product) singleProducts.push(product);
        }
        result = {
          store: job.store,
          storeName: STORE_METADATA[job.store].name,
          startedAt: dayjs().toISOString(),
          completedAt: dayjs().toISOString(),
          durationMs: 0,
          totalProducts: singleProducts.length,
          successCount: singleProducts.length,
          errorCount: 0,
          skippedCount: 0,
          products: singleProducts,
          errors: [],
          categories: [],
        };
        break;

      case 'HOT_PRODUCTS':
        // For hot products, search for the most popular items
        const hotProducts = await scraper.searchProducts(
          'milk bread eggs chicken',
          100,
        );
        result = {
          store: job.store,
          storeName: STORE_METADATA[job.store].name,
          startedAt: dayjs().toISOString(),
          completedAt: dayjs().toISOString(),
          durationMs: 0,
          totalProducts: hotProducts.length,
          successCount: hotProducts.length,
          errorCount: 0,
          skippedCount: 0,
          products: hotProducts,
          errors: [],
          categories: [],
        };
        break;

      default:
        console.warn(`Unknown job type: ${job.jobType}`);
        return;
    }

    // Save raw results to S3
    await saveToS3(job, result);

    console.log(
      `Scrape complete for ${job.store}: ${result.successCount} products, ${result.errorCount} errors`,
    );
  } catch (error: any) {
    console.error(
      `Fatal error scraping ${job.store}: ${error.message}`,
      error.stack,
    );
    throw error; // Let SQS retry
  }
};

/**
 * Save raw scrape results to S3.
 * Path: s3://{bucket}/{store}/{date}/scrape-{jobId}.json
 */
const saveToS3 = async (
  job: ScrapeJob,
  result: ScraperResult,
): Promise<void> => {
  const date = dayjs().format('YYYY-MM-DD');
  const key = `${job.store}/${date}/scrape-${job.jobId}.json`;

  const command = new PutObjectCommand({
    Bucket: RAW_DATA_BUCKET,
    Key: key,
    Body: JSON.stringify(result, null, 2),
    ContentType: 'application/json',
    Metadata: {
      store: job.store,
      jobType: job.jobType,
      jobId: job.jobId,
      productCount: String(result.successCount),
      errorCount: String(result.errorCount),
    },
  });

  await s3.send(command);
  console.log(`Saved raw data to s3://${RAW_DATA_BUCKET}/${key}`);
};
