import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

const PRODUCTS_KEY = 'products';
const PRICES_KEY = 'prices';

// ==================== Types ====================

interface Product {
  productId: string;
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  weight?: string;
}

interface ProductPrice {
  productId: string;
  store: string;
  storeName: string;
  shelfPrice: number;
  loyaltyPrice?: number;
  loyaltyScheme?: string;
  effectivePrice: number;
  priceFormatted: string;
  loyaltyPriceFormatted?: string;
  pricePerUnit?: number;
  unitForPricing?: string;
  isOnOffer: boolean;
  offerDescription?: string;
}

interface PriceComparison {
  product: Product;
  prices: ProductPrice[];
  bestPrice: ProductPrice | null;
  averagePrice: number;
  averagePriceFormatted: string;
}

interface PriceHistoryEntry {
  date: string;
  price: number;
  isOnOffer: boolean;
}

interface StorePriceHistory {
  productId: string;
  store: string;
  storeName: string;
  entries: PriceHistoryEntry[];
  currentPrice?: number;
}

interface Deal {
  productId: string;
  store: string;
  storeName: string;
  shelfPrice: number;
  isOnOffer: boolean;
  offerDescription?: string;
}

interface StoreSummary {
  store: string;
  name: string;
  colour: string;
  websiteUrl: string;
  hasOnlineGroceries: boolean;
  loyaltyScheme?: string;
  tier: number;
}

// ==================== Product Queries ====================

export const useProductSearch = (query: string, options = {}) => {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'search', query],
    queryFn: () =>
      apiClient.get<{ items: Product[]; hasMore: boolean }>(
        `/products/search?q=${encodeURIComponent(query)}`,
      ),
    enabled: !!query && query.length >= 2,
    ...options,
  });
};

export const useProductByBarcode = (barcode: string, options = {}) => {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'barcode', barcode],
    queryFn: () =>
      apiClient.get<PriceComparison>(`/products/barcode/${barcode}`),
    enabled: !!barcode,
    ...options,
  });
};

export const useProductsByCategory = (category: string, options = {}) => {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'category', category],
    queryFn: () =>
      apiClient.get<{ items: Product[] }>(
        `/products/search?category=${encodeURIComponent(category)}`,
      ),
    enabled: !!category,
    ...options,
  });
};

// ==================== Price Queries ====================

export const usePriceComparison = (
  params: { productId?: string; barcode?: string },
  options = {},
) => {
  return useQuery({
    queryKey: [PRICES_KEY, 'compare', params],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params.productId) qs.set('productId', params.productId);
      if (params.barcode) qs.set('barcode', params.barcode);
      return apiClient.get<PriceComparison>(`/prices/compare?${qs.toString()}`);
    },
    enabled: !!(params.productId || params.barcode),
    ...options,
  });
};

export const usePriceHistory = (
  productId: string,
  store?: string,
  days: number = 90,
  options = {},
) => {
  return useQuery({
    queryKey: [PRICES_KEY, 'history', productId, store, days],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (store) qs.set('store', store);
      qs.set('days', String(days));
      return apiClient.get<{ items: StorePriceHistory[] }>(
        `/prices/history/${productId}?${qs.toString()}`,
      );
    },
    enabled: !!productId,
    ...options,
  });
};

export const useDeals = (store?: string, limit: number = 20, options = {}) => {
  return useQuery({
    queryKey: [PRICES_KEY, 'deals', store, limit],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (store) qs.set('store', store);
      qs.set('limit', String(limit));
      return apiClient.get<{ items: Deal[]; hasMore: boolean }>(
        `/prices/deals?${qs.toString()}`,
      );
    },
    ...options,
  });
};

export const useStores = (options = {}) => {
  return useQuery({
    queryKey: [PRICES_KEY, 'stores'],
    queryFn: () => apiClient.get<{ items: StoreSummary[] }>('/prices/stores'),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours — stores don't change often
    ...options,
  });
};
