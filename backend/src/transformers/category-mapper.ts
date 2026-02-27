import { CategoryMapping, UKStore } from '../scrapers/types';

/**
 * Maps store-specific category names to our standard 25 grocery categories.
 *
 * Each store has its own category taxonomy. This mapper normalises them
 * to a consistent set of categories for cross-store comparison.
 */

// Our 25 standard categories
const STANDARD_CATEGORIES = [
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

type StandardCategory = (typeof STANDARD_CATEGORIES)[number];

/**
 * Keyword-based mapping rules.
 * Each rule maps keywords found in store category names to our standard categories.
 */
const CATEGORY_RULES: Array<{
  keywords: string[];
  category: StandardCategory;
  subcategory?: string;
}> = [
  // Fruit & Vegetables
  { keywords: ['fruit'], category: 'Fruit & Vegetables', subcategory: 'Fruit' },
  {
    keywords: ['vegetable', 'veg'],
    category: 'Fruit & Vegetables',
    subcategory: 'Vegetables',
  },
  { keywords: ['salad'], category: 'Fruit & Vegetables', subcategory: 'Salad' },
  { keywords: ['fresh food'], category: 'Fruit & Vegetables' },

  // Meat & Poultry
  {
    keywords: [
      'meat',
      'poultry',
      'chicken',
      'beef',
      'pork',
      'lamb',
      'turkey',
      'sausage',
      'bacon',
      'mince',
    ],
    category: 'Meat & Poultry',
  },

  // Fish & Seafood
  {
    keywords: ['fish', 'seafood', 'prawn', 'salmon', 'tuna', 'cod'],
    category: 'Fish & Seafood',
  },

  // Dairy & Eggs
  {
    keywords: [
      'milk',
      'butter',
      'egg',
      'dairy',
      'cream',
      'yoghurt',
      'yogurt',
      'cheese',
    ],
    category: 'Dairy & Eggs',
  },

  // Bread & Bakery
  {
    keywords: [
      'bread',
      'bakery',
      'rolls',
      'wraps',
      'pitta',
      'crumpet',
      'muffin',
    ],
    category: 'Bread & Bakery',
  },

  // Cereals & Breakfast
  {
    keywords: ['cereal', 'breakfast', 'porridge', 'granola', 'muesli'],
    category: 'Cereals & Breakfast',
  },

  // Pasta, Rice & Grains
  {
    keywords: ['pasta', 'rice', 'noodle', 'grain', 'couscous', 'quinoa'],
    category: 'Pasta, Rice & Grains',
  },

  // Tinned & Canned Goods
  {
    keywords: ['tin', 'can', 'tinned', 'canned', 'baked beans', 'soup'],
    category: 'Tinned & Canned Goods',
  },

  // Sauces & Condiments
  {
    keywords: [
      'sauce',
      'condiment',
      'ketchup',
      'mayonnaise',
      'mustard',
      'vinegar',
      'oil',
      'dressing',
    ],
    category: 'Sauces & Condiments',
  },
  {
    keywords: ['cooking sauce', 'meal kit', 'stir fry'],
    category: 'Sauces & Condiments',
    subcategory: 'Cooking Sauces',
  },

  // Herbs, Spices & Seasonings
  {
    keywords: ['herb', 'spice', 'seasoning', 'pepper', 'salt', 'stock cube'],
    category: 'Herbs, Spices & Seasonings',
  },

  // Snacks & Crisps
  {
    keywords: ['crisp', 'snack', 'nut', 'popcorn', 'pretzel'],
    category: 'Snacks & Crisps',
  },

  // Biscuits & Confectionery
  {
    keywords: [
      'biscuit',
      'chocolate',
      'sweet',
      'confectionery',
      'candy',
      'cake',
      'cookie',
    ],
    category: 'Biscuits & Confectionery',
  },

  // Frozen Food
  { keywords: ['frozen', 'ice cream', 'freezer'], category: 'Frozen Food' },

  // Drinks & Beverages
  {
    keywords: [
      'drink',
      'beverage',
      'juice',
      'squash',
      'water',
      'soft drink',
      'cola',
      'lemonade',
      'energy drink',
    ],
    category: 'Drinks & Beverages',
  },

  // Tea & Coffee
  {
    keywords: ['tea', 'coffee', 'hot chocolate', 'hot drink'],
    category: 'Tea & Coffee',
  },

  // Alcohol
  {
    keywords: [
      'beer',
      'wine',
      'spirit',
      'alcohol',
      'lager',
      'cider',
      'gin',
      'vodka',
      'whisky',
      'rum',
      'prosecco',
      'champagne',
    ],
    category: 'Alcohol',
  },

  // Baby & Toddler
  {
    keywords: ['baby', 'toddler', 'nappy', 'nappies', 'formula', 'baby food'],
    category: 'Baby & Toddler',
  },

  // Health & Beauty
  {
    keywords: [
      'health',
      'beauty',
      'toiletries',
      'shampoo',
      'shower',
      'dental',
      'toothpaste',
      'deodorant',
      'skincare',
      'medicine',
      'vitamin',
    ],
    category: 'Health & Beauty',
  },

  // Household & Cleaning
  {
    keywords: [
      'household',
      'cleaning',
      'laundry',
      'washing',
      'kitchen roll',
      'bin bag',
      'toilet roll',
      'tissue',
      'detergent',
      'bleach',
    ],
    category: 'Household & Cleaning',
  },

  // Pet Food & Supplies
  {
    keywords: ['pet', 'dog', 'cat', 'pet food'],
    category: 'Pet Food & Supplies',
  },

  // World Foods
  {
    keywords: [
      'world food',
      'international',
      'asian',
      'indian',
      'chinese',
      'mexican',
      'italian',
      'polish',
      'caribbean',
    ],
    category: 'World Foods',
  },

  // Free From
  {
    keywords: [
      'free from',
      'gluten free',
      'dairy free',
      'vegan',
      'lactose free',
    ],
    category: 'Free From',
  },

  // Organic
  { keywords: ['organic'], category: 'Organic' },

  // Deli & Prepared Foods
  {
    keywords: [
      'deli',
      'prepared',
      'ready meal',
      'sandwich',
      'wrap',
      'cooked meat',
      'antipasti',
      'hummus',
      'pate',
      'quiche',
      'pie',
    ],
    category: 'Deli & Prepared Foods',
  },
];

/**
 * Map a store category string to our standard category.
 */
export const mapCategory = (
  storeCategory: string,
  store?: UKStore,
): CategoryMapping => {
  if (!storeCategory) {
    return {
      storeCategory: '',
      standardCategory: 'Other',
      confidence: 0,
    };
  }

  const normalised = storeCategory.toLowerCase().trim();

  // Try exact keyword matching
  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (normalised.includes(keyword)) {
        return {
          storeCategory,
          standardCategory: rule.category,
          standardSubcategory: rule.subcategory,
          confidence: keyword.length > 4 ? 0.9 : 0.7,
        };
      }
    }
  }

  // No match found
  return {
    storeCategory,
    standardCategory: 'Other',
    confidence: 0.1,
  };
};

/**
 * Map multiple store categories at once.
 */
export const mapCategories = (
  storeCategories: string[],
  store?: UKStore,
): CategoryMapping[] => {
  return storeCategories.map((cat) => mapCategory(cat, store));
};

/**
 * Get all standard categories.
 */
export const getStandardCategories = (): readonly string[] => {
  return STANDARD_CATEGORIES;
};
