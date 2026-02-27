import { Request, Response } from 'express';
import {
  getDbUserById,
  updateDbUser,
  updateDbUserPreferences,
  addDbRewardCard,
} from '../adapters/users';

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await getDbUserById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await updateDbUser(req.user.sub, req.body);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user profile' });
  }
};

export const getUserPreferences = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await getDbUserById(req.user.sub);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.preferences);
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ message: 'Error fetching preferences' });
  }
};

export const updateUserPreferences = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const preferences = await updateDbUserPreferences(req.user.sub, req.body);
    if (!preferences) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(preferences);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ message: 'Error updating preferences' });
  }
};

export const createRewardCard = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const card = await addDbRewardCard(req.user.sub, req.body);
    res.status(201).json(card);
  } catch (error) {
    console.error('Error creating reward card:', error);
    res.status(500).json({ message: 'Error creating reward card' });
  }
};
