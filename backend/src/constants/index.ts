// ==================== HTTP Status Codes ====================

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ==================== DynamoDB Table Names ====================

export const TABLES = {
  USERS: process.env.USERS_TABLE || 'ai-groceries-users',
  SHOPPING_LISTS:
    process.env.SHOPPING_LISTS_TABLE || 'ai-groceries-shopping-lists',
  INVENTORY: process.env.INVENTORY_TABLE || 'ai-groceries-inventory',
  RECIPES: process.env.RECIPES_TABLE || 'ai-groceries-recipes',
  MEAL_PLANS: process.env.MEAL_PLANS_TABLE || 'ai-groceries-meal-plans',
  PRODUCTS: process.env.PRODUCTS_TABLE || 'ai-groceries-products',
  PRICE_HISTORY:
    process.env.PRICE_HISTORY_TABLE || 'ai-groceries-price-history',
} as const;

// ==================== S3 Buckets ====================

export const BUCKETS = {
  IMAGES: process.env.IMAGES_BUCKET || 'ai-groceries-images',
  RECEIPTS: process.env.RECEIPTS_BUCKET || 'ai-groceries-receipts',
} as const;

// ==================== Cognito ====================

export const COGNITO = {
  USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || '',
  CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
  REGION: process.env.AWS_REGION || 'eu-west-2',
} as const;

// ==================== UK Supermarkets ====================

export const UK_SUPERMARKETS = {
  TESCO: {
    name: 'Tesco',
    baseUrl: 'https://www.tesco.com',
    searchUrl: 'https://www.tesco.com/groceries/en-GB/search',
    colour: '#00539F',
  },
  SAINSBURYS: {
    name: "Sainsbury's",
    baseUrl: 'https://www.sainsburys.co.uk',
    searchUrl: 'https://www.sainsburys.co.uk/gol-ui/SearchResults',
    colour: '#F06C00',
  },
  ASDA: {
    name: 'Asda',
    baseUrl: 'https://groceries.asda.com',
    searchUrl: 'https://groceries.asda.com/search',
    colour: '#78BE20',
  },
  MORRISONS: {
    name: 'Morrisons',
    baseUrl: 'https://groceries.morrisons.com',
    searchUrl: 'https://groceries.morrisons.com/search',
    colour: '#007A3D',
  },
  ALDI: {
    name: 'Aldi',
    baseUrl: 'https://www.aldi.co.uk',
    searchUrl: 'https://www.aldi.co.uk/search',
    colour: '#00205B',
  },
  LIDL: {
    name: 'Lidl',
    baseUrl: 'https://www.lidl.co.uk',
    searchUrl: 'https://www.lidl.co.uk/search',
    colour: '#0050AA',
  },
  WAITROSE: {
    name: 'Waitrose',
    baseUrl: 'https://www.waitrose.com',
    searchUrl: 'https://www.waitrose.com/ecom/shop/search',
    colour: '#5D8C51',
  },
  OCADO: {
    name: 'Ocado',
    baseUrl: 'https://www.ocado.com',
    searchUrl: 'https://www.ocado.com/search',
    colour: '#6F2C91',
  },
  COOP: {
    name: 'Co-op',
    baseUrl: 'https://www.coop.co.uk',
    searchUrl: 'https://shop.coop.co.uk/search',
    colour: '#00B1E7',
  },
  MS_FOOD: {
    name: 'M&S Food',
    baseUrl: 'https://www.ocado.com/browse/m-and-s',
    searchUrl: 'https://www.ocado.com/search',
    colour: '#000000',
  },
} as const;

// ==================== Grocery Categories ====================

export const GROCERY_CATEGORIES = [
  'Fruit & Vegetables',
  'Meat & Poultry',
  'Fish & Seafood',
  'Dairy & Eggs',
  'Bread & Bakery',
  'Cereals & Breakfast',
  'Pasta, Rice & Grains',
  'Tinned & Canned Goods',
  'Sauces & Condiments',
  'Herbs, Spices & Seasonings',
  'Snacks & Crisps',
  'Biscuits & Confectionery',
  'Frozen Food',
  'Drinks & Beverages',
  'Tea & Coffee',
  'Alcohol',
  'Baby & Toddler',
  'Health & Beauty',
  'Household & Cleaning',
  'Pet Food & Supplies',
  'World Foods',
  'Free From',
  'Organic',
  'Deli & Prepared Foods',
  'Other',
] as const;

// ==================== Meal Types ====================

export const MEAL_TYPES = [
  'BREAKFAST',
  'LUNCH',
  'SNACK',
  'DINNER',
  'DESSERT',
] as const;

// ==================== Units ====================

export const UNITS = [
  'each',
  'g',
  'kg',
  'ml',
  'l',
  'oz',
  'lb',
  'cup',
  'tbsp',
  'tsp',
  'bunch',
  'pack',
  'tin',
  'bottle',
  'bag',
  'box',
  'jar',
  'slice',
  'piece',
  'clove',
  'head',
  'stalk',
  'sprig',
  'pinch',
] as const;

// ==================== AI ====================

export const AI_CONFIG = {
  BEDROCK_MODEL_ID:
    process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0',
  BEDROCK_REGION: process.env.BEDROCK_REGION || 'eu-west-2',
  MAX_IMAGE_SIZE_MB: 10,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const;

// ==================== Pagination ====================

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ==================== Recipe Sources ====================

export const RECIPE_SOURCES = {
  BBC_GOOD_FOOD: 'https://www.bbcgoodfood.com',
  ALL_RECIPES: 'https://www.allrecipes.com',
  DELICIOUS_MAGAZINE: 'https://www.deliciousmagazine.co.uk',
  JAMIE_OLIVER: 'https://www.jamieoliver.com',
  GREAT_BRITISH_CHEFS: 'https://www.greatbritishchefs.com',
} as const;
