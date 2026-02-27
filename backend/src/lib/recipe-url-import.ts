import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ImportedRecipe {
  name: string;
  description: string;
  imageUrl?: string;
  sourceUrl: string;
  cuisine?: string;
  tags: string[];
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
  }[];
  directions: {
    stepNumber: number;
    instruction: string;
  }[];
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  difficulty: string;
}

const parseDuration = (duration: string | undefined): number => {
  if (!duration) return 0;
  // Parse ISO 8601 duration (PT30M, PT1H30M, etc.)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  return hours * 60 + minutes;
};

const parseServings = (yields: string | number | undefined): number => {
  if (!yields) return 4;
  if (typeof yields === 'number') return yields;
  const match = yields.match(/(\d+)/);
  return match ? parseInt(match[1]) : 4;
};

const parseIngredientText = (
  text: string,
): { name: string; quantity: string; unit: string } => {
  // Try to parse "2 cups flour" or "1/2 tsp salt" patterns
  const match = text.match(
    /^([\d\/\.\s]+)?\s*(cups?|tbsp|tsp|tablespoons?|teaspoons?|oz|ounces?|lbs?|pounds?|g|kg|ml|l|litres?|liters?|pinch|dash|cloves?|pieces?|slices?|bunch|handful)?\s*(?:of\s+)?(.+)/i,
  );

  if (match) {
    return {
      quantity: (match[1] || '').trim(),
      unit: (match[2] || '').trim(),
      name: (match[3] || text).trim(),
    };
  }

  return { name: text.trim(), quantity: '', unit: '' };
};

const extractJsonLd = ($: cheerio.CheerioAPI): any => {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const content = $(scripts[i]).html();
      if (!content) continue;

      const data = JSON.parse(content);

      // Handle @graph arrays
      if (data['@graph']) {
        const recipe = data['@graph'].find(
          (item: any) =>
            item['@type'] === 'Recipe' ||
            (Array.isArray(item['@type']) && item['@type'].includes('Recipe')),
        );
        if (recipe) return recipe;
      }

      // Direct Recipe type
      if (
        data['@type'] === 'Recipe' ||
        (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))
      ) {
        return data;
      }

      // Array of items
      if (Array.isArray(data)) {
        const recipe = data.find(
          (item: any) =>
            item['@type'] === 'Recipe' ||
            (Array.isArray(item['@type']) && item['@type'].includes('Recipe')),
        );
        if (recipe) return recipe;
      }
    } catch {
      continue;
    }
  }
  return null;
};

const extractMicrodata = ($: cheerio.CheerioAPI): any => {
  const recipeEl = $('[itemtype*="schema.org/Recipe"]');
  if (recipeEl.length === 0) return null;

  const getText = (prop: string): string =>
    recipeEl.find(`[itemprop="${prop}"]`).first().text().trim() ||
    recipeEl.find(`[itemprop="${prop}"]`).first().attr('content') ||
    '';

  const getImage = (): string =>
    recipeEl.find('[itemprop="image"]').first().attr('src') ||
    recipeEl.find('[itemprop="image"]').first().attr('content') ||
    '';

  const ingredients: string[] = [];
  recipeEl
    .find('[itemprop="recipeIngredient"], [itemprop="ingredients"]')
    .each((_, el) => {
      const text = $(el).text().trim();
      if (text) ingredients.push(text);
    });

  const instructions: string[] = [];
  recipeEl.find('[itemprop="recipeInstructions"]').each((_, el) => {
    const text = $(el).text().trim();
    if (text) instructions.push(text);
  });

  return {
    name: getText('name'),
    description: getText('description'),
    image: getImage(),
    prepTime: getText('prepTime'),
    cookTime: getText('cookTime'),
    totalTime: getText('totalTime'),
    recipeYield: getText('recipeYield'),
    recipeIngredient: ingredients,
    recipeInstructions: instructions.length > 0 ? instructions : undefined,
    recipeCategory: getText('recipeCategory'),
    recipeCuisine: getText('recipeCuisine'),
    keywords: getText('keywords'),
  };
};

export const importRecipeFromUrl = async (
  url: string,
): Promise<ImportedRecipe> => {
  const response = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; AIGroceries/1.0; +https://aigroceries.co.uk)',
      Accept: 'text/html,application/xhtml+xml',
    },
    maxRedirects: 5,
  });

  const $ = cheerio.load(response.data);

  // Try JSON-LD first (most reliable)
  let recipeData = extractJsonLd($);

  // Fall back to microdata
  if (!recipeData) {
    recipeData = extractMicrodata($);
  }

  if (!recipeData) {
    throw new Error(
      'Could not find recipe data on this page. The page may not contain structured recipe data.',
    );
  }

  // Parse ingredients
  const rawIngredients: string[] = recipeData.recipeIngredient || [];
  const ingredients = rawIngredients.map(parseIngredientText);

  // Parse instructions
  let directions: { stepNumber: number; instruction: string }[] = [];
  const rawInstructions = recipeData.recipeInstructions;

  if (Array.isArray(rawInstructions)) {
    directions = rawInstructions
      .map((step: any, index: number) => {
        if (typeof step === 'string') {
          return { stepNumber: index + 1, instruction: step.trim() };
        }
        if (step.text) {
          return { stepNumber: index + 1, instruction: step.text.trim() };
        }
        if (step['@type'] === 'HowToStep') {
          return {
            stepNumber: index + 1,
            instruction: (step.text || step.name || '').trim(),
          };
        }
        if (step['@type'] === 'HowToSection') {
          // Flatten sections
          return (step.itemListElement || []).map(
            (subStep: any, subIndex: number) => ({
              stepNumber: index + subIndex + 1,
              instruction: (subStep.text || subStep.name || '').trim(),
            }),
          );
        }
        return null;
      })
      .flat()
      .filter(Boolean)
      .map((step: any, index: number) => ({
        ...step,
        stepNumber: index + 1,
      }));
  } else if (typeof rawInstructions === 'string') {
    directions = rawInstructions
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5)
      .map((instruction, index) => ({
        stepNumber: index + 1,
        instruction,
      }));
  }

  // Parse image
  let imageUrl: string | undefined;
  if (recipeData.image) {
    if (typeof recipeData.image === 'string') {
      imageUrl = recipeData.image;
    } else if (Array.isArray(recipeData.image)) {
      imageUrl = recipeData.image[0];
    } else if (recipeData.image.url) {
      imageUrl = recipeData.image.url;
    }
  }

  // Parse tags
  const tags: string[] = [];
  if (recipeData.keywords) {
    if (typeof recipeData.keywords === 'string') {
      tags.push(...recipeData.keywords.split(',').map((t: string) => t.trim()));
    } else if (Array.isArray(recipeData.keywords)) {
      tags.push(...recipeData.keywords);
    }
  }
  if (recipeData.recipeCategory) {
    if (typeof recipeData.recipeCategory === 'string') {
      tags.push(recipeData.recipeCategory);
    } else if (Array.isArray(recipeData.recipeCategory)) {
      tags.push(...recipeData.recipeCategory);
    }
  }

  const prepTime = parseDuration(recipeData.prepTime);
  const cookTime = parseDuration(recipeData.cookTime);
  const totalTime =
    parseDuration(recipeData.totalTime) || prepTime + cookTime || 30;

  return {
    name: recipeData.name || $('title').text().trim() || 'Imported Recipe',
    description:
      recipeData.description ||
      $('meta[name="description"]').attr('content') ||
      '',
    imageUrl,
    sourceUrl: url,
    cuisine:
      typeof recipeData.recipeCuisine === 'string'
        ? recipeData.recipeCuisine
        : Array.isArray(recipeData.recipeCuisine)
          ? recipeData.recipeCuisine[0]
          : undefined,
    tags: [...new Set(tags)].slice(0, 10),
    ingredients,
    directions,
    prepTime: prepTime || 15,
    cookTime: cookTime || 15,
    totalTime,
    servings: parseServings(recipeData.recipeYield),
    difficulty: totalTime > 60 ? 'hard' : totalTime > 30 ? 'medium' : 'easy',
  };
};
