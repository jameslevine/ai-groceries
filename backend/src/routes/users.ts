import { Router } from 'express';
import {
  getCurrentUser,
  updateCurrentUser,
  getUserPreferences,
  updateUserPreferences,
  createRewardCard,
} from '../controllers/users';

export const router = Router();

router.get('/me', getCurrentUser);
router.patch('/me', updateCurrentUser);
router.get('/me/preferences', getUserPreferences);
router.patch('/me/preferences', updateUserPreferences);
router.post('/me/reward-cards', createRewardCard);
