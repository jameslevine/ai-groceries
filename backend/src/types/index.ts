import { Request } from 'express';

// ==================== Auth Types ====================

export interface CognitoUser {
  sub: string;
  email: string;
  'cognito:username': string;
  'custom:familyId'?: string;
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  iat: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: CognitoUser;
    }
  }
}

// ==================== User Types ====================

export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  familyId: string;
  preferences: UserPreferences;
  rewardCards: RewardCard[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  currency: string;
  language: string;
  preferredStores: string[];
  dietaryRestrictions: string[];
  householdSize: number;
  notificationsEnabled: boolean;
  expiryAlertDays: number;
}

export interface RewardCard {
  storeName: string;
  cardNumber: string;
  barcodeData?: string;
}

// ==================== Family Types ====================

export interface Family {
  familyId: string;
  name: string;
  members: FamilyMember[];
  createdBy: string;
  createdAt: string;
}

export interface FamilyMember {
  userId: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member';
  joinedAt: string;
}

// ==================== Shopping List Types ====================

export interface ShoppingList {
  listId: string;
  familyId: string;
  name: string;
  items: ShoppingListItem[];
  sharedWith: string[];
  isFavourite: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  subcategory?: string;
  aisle?: string;
  imageUrl?: string;
  isChecked: boolean;
  price?: number;
  store?: string;
  barcode?: string;
  notes?: string;
  addedBy: string;
  addedAt: string;
}

// ==================== Inventory Types ====================

export const INVENTORY_LOCATIONS = [
  'FRIDGE',
  'FREEZER',
  'PANTRY',
  'CUPBOARD',
  'SPICE_RACK',
  'FRUIT_BOWL',
  'BREAD_BIN',
  'DRINKS_CABINET',
  'WINE_RACK',
  'GARAGE',
  'UTILITY_ROOM',
  'SHED',
  'CELLAR',
  'COUNTERTOP',
  'UNDER_SINK',
  'BATHROOM',
  'MEDICINE_CABINET',
  'OTHER',
] as const;

export type InventoryLocation = (typeof INVENTORY_LOCATIONS)[number];

export interface InventoryItem {
  itemId: string;
  familyId: string;
  name: string;
  quantity: number;
  unit: string;
  location: InventoryLocation | string;
  category: string;
  expiryDate?: string;
  imageUrl?: string;
  barcode?: string;
  lowStockThreshold: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED';

// ==================== Recipe Types ====================

export interface Recipe {
  recipeId: string;
  userId: string;
  familyId?: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  directions: RecipeDirection[];
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  nutrition: NutritionInfo;
  rating: number;
  ratingCount: number;
  imageUrl?: string;
  sourceUrl?: string;
  tags: string[];
  cuisine?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
  isOptional: boolean;
  inventoryItemId?: string;
}

export interface RecipeDirection {
  stepNumber: number;
  instruction: string;
  duration?: number;
  ingredientRefs?: string[];
  timerMinutes?: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fibre: number;
  sugar: number;
  sodium: number;
  servingSize: string;
}

// ==================== Meal Plan Types ====================

export type MealType =
  | 'BREAKFAST'
  | 'LUNCH'
  | 'SNACK'
  | 'DINNER'
  | 'DESSERT'
  | string;

export interface MealPlan {
  mealId: string;
  familyId: string;
  date: string;
  mealType: MealType;
  recipeId?: string;
  recipeName?: string;
  items: MealPlanItem[];
  notes?: string;
  servings: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  inStock: boolean;
}

// ==================== Product / Price Types ====================

export type UKSupermarket =
  | 'TESCO'
  | 'SAINSBURYS'
  | 'ASDA'
  | 'MORRISONS'
  | 'ALDI'
  | 'LIDL'
  | 'WAITROSE'
  | 'OCADO'
  | 'COOP'
  | 'MS_FOOD';

export interface Product {
  productId: string;
  barcode: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  description?: string;
  weight?: string;
  unit?: string;
}

export interface ProductPrice {
  productId: string;
  store: UKSupermarket;
  price: number;
  currency: 'GBP';
  pricePerUnit?: number;
  unitForPricing?: string;
  isOnOffer: boolean;
  offerDescription?: string;
  originalPrice?: number;
  url?: string;
  scrapedAt: string;
}

export interface PriceComparison {
  product: Product;
  prices: ProductPrice[];
  bestPrice: ProductPrice;
  averagePrice: number;
}

export interface PriceHistory {
  productId: string;
  store: UKSupermarket;
  prices: { date: string; price: number }[];
}

// ==================== AI Types ====================

export interface AIPhotoAnalysis {
  type: 'recipe' | 'shopping_list' | 'nutrition' | 'receipt' | 'inventory';
  confidence: number;
  result: any;
}

export interface AIRecipeGeneration {
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  directions: RecipeDirection[];
  prepTime: number;
  cookTime: number;
  servings: number;
  nutrition: NutritionInfo;
  tags: string[];
}

export interface AIReceiptScan {
  storeName: string;
  date: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
}

// ==================== Pagination Types ====================

export interface PaginatedResponse<T> {
  items: T[];
  total?: number;
  lastEvaluatedKey?: Record<string, any>;
  hasMore: boolean;
}

// ==================== Common Types ====================

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiSuccess<T> {
  data: T;
  message?: string;
}
