import { ScheduledEvent, Context } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { ScrapeJob, UKStore } from '../scrapers/types';
import { getAvailableScrapers } from '../scrapers/scraper-factory';

const sqs = new SQSClient({ region: process.env.AWS_REGION || 'eu-west-2' });
const SCRAPE_JOBS_QUEUE_URL = process.env.SCRAPE_JOBS_QUEUE_URL || '';
const HOT_PRODUCTS_QUEUE_URL = process.env.HOT_PRODUCTS_QUEUE_URL || '';

/**
 * Daily full crawl trigger.
 * Sends a FULL_CRAWL job to SQS for each available store scraper.
 * Triggered by EventBridge at 4:00 AM UTC daily.
 */
export const dailyHandler = async (
  event: ScheduledEvent,
  context: Context,
): Promise<void> => {
  const availableStores = getAvailableScrapers();
  console.log(
    `Daily crawl trigger: Sending jobs for ${availableStores.length} stores`,
  );

  for (const store of availableStores) {
    const job: ScrapeJob = {
      jobId: uuidv4(),
      jobType: 'FULL_CRAWL',
      store,
      createdAt: dayjs().toISOString(),
    };

    await sendToQueue(SCRAPE_JOBS_QUEUE_URL, job);
    console.log(`Sent FULL_CRAWL job for ${store}: ${job.jobId}`);
  }

  console.log(
    `Daily crawl trigger complete. ${availableStores.length} jobs sent.`,
  );
};

/**
 * Hot products refresh trigger.
 * Sends a HOT_PRODUCTS job to SQS for each available store scraper.
 * Triggered by EventBridge every 6 hours.
 */
export const hotProductsHandler = async (
  event: ScheduledEvent,
  context: Context,
): Promise<void> => {
  const availableStores = getAvailableScrapers();
  console.log(
    `Hot products trigger: Sending jobs for ${availableStores.length} stores`,
  );

  for (const store of availableStores) {
    const job: ScrapeJob = {
      jobId: uuidv4(),
      jobType: 'HOT_PRODUCTS',
      store,
      createdAt: dayjs().toISOString(),
    };

    await sendToQueue(HOT_PRODUCTS_QUEUE_URL, job);
    console.log(`Sent HOT_PRODUCTS job for ${store}: ${job.jobId}`);
  }

  console.log(
    `Hot products trigger complete. ${availableStores.length} jobs sent.`,
  );
};

/**
 * On-demand single product scrape.
 * Can be called from the API to refresh a specific product's price.
 */
export const onDemandScrape = async (
  store: UKStore,
  barcodes: string[],
): Promise<string> => {
  const job: ScrapeJob = {
    jobId: uuidv4(),
    jobType: 'SINGLE_PRODUCT',
    store,
    productBarcodes: barcodes,
    createdAt: dayjs().toISOString(),
  };

  await sendToQueue(SCRAPE_JOBS_QUEUE_URL, job);
  console.log(
    `Sent SINGLE_PRODUCT job for ${store} (${barcodes.length} barcodes): ${job.jobId}`,
  );

  return job.jobId;
};

const sendToQueue = async (queueUrl: string, job: ScrapeJob): Promise<void> => {
  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(job),
    MessageAttributes: {
      store: {
        DataType: 'String',
        StringValue: job.store,
      },
      jobType: {
        DataType: 'String',
        StringValue: job.jobType,
      },
    },
  });

  await sqs.send(command);
};
