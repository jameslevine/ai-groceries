import { Router } from 'express';
import { validateBody } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../models/auth';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
} from '../controllers/auth';

export const router = Router();

// All auth routes are public (no auth middleware)
router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/verify', validateBody(verifyEmailSchema), verifyEmail);
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  '/reset-password',
  validateBody(resetPasswordSchema),
  resetPassword,
);
router.post('/refresh-token', validateBody(refreshTokenSchema), refreshToken);
