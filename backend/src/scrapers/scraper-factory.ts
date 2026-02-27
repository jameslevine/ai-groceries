import { IScraper, UKStore } from './types';
import { TescoScraper } from './stores/tesco';
import { AsdaScraper } from './stores/asda';
import { SainsburysScraper } from './stores/sainsburys';
import { MorrisonsScraper } from './stores/morrisons';
import { AldiScraper } from './stores/aldi';
import { LidlScraper } from './stores/lidl';
import { WaitroseScraper } from './stores/waitrose';
import { OcadoScraper } from './stores/ocado';
import { CoopScraper } from './stores/coop';
import { MSFoodScraper } from './stores/ms-food';

/**
 * Factory to create store-specific scraper instances.
 * New store scrapers are registered here as they are implemented.
 */
export const createScraper = (store: UKStore): IScraper => {
  switch (store) {
    case 'TESCO':
      return new TescoScraper();
    case 'ASDA':
      return new AsdaScraper();
    case 'SAINSBURYS':
      return new SainsburysScraper();
    case 'MORRISONS':
      return new MorrisonsScraper();
    case 'ALDI':
      return new AldiScraper();
    case 'LIDL':
      return new LidlScraper();
    case 'WAITROSE':
      return new WaitroseScraper();
    case 'OCADO':
      return new OcadoScraper();
    case 'COOP':
      return new CoopScraper();
    case 'MS_FOOD':
      return new MSFoodScraper();

    default:
      throw new Error(`Unknown store: ${store}`);
  }
};

/**
 * Get list of all stores that have implemented scrapers.
 */
export const getAvailableScrapers = (): UKStore[] => {
  return [
    'TESCO',
    'ASDA',
    'SAINSBURYS',
    'MORRISONS',
    'ALDI',
    'LIDL',
    'WAITROSE',
    'OCADO',
    'COOP',
    'MS_FOOD',
  ];
};

/**
 * Check if a scraper is available for a given store.
 */
export const isScraperAvailable = (store: UKStore): boolean => {
  return getAvailableScrapers().includes(store);
};
