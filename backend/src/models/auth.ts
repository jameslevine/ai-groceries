import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  newPassword: Joi.string().min(8).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
