import { Request, Response } from 'express';

/**
 * AI Controllers — Placeholder
 * These will be fully implemented in Phase 6 using Amazon Bedrock.
 * For now, they return 501 Not Implemented.
 */

export const photoToRecipe = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'AI Photo to Recipe — coming soon' });
};

export const photoToList = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'AI Photo to Shopping List — coming soon' });
};

export const photoToNutrition = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'AI Photo to Nutrition — coming soon' });
};

export const receiptScan = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'AI Receipt Scan — coming soon' });
};

export const generateRecipe = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'AI Generate Recipe — coming soon' });
};

export const categorise = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'AI Smart Categorise — coming soon' });
};
