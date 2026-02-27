import { router as authRouter } from './routes/auth';
import { router as usersRouter } from './routes/users';
import { router as listsRouter } from './routes/lists';
import { router as inventoryRouter } from './routes/inventory';
import { router as recipesRouter } from './routes/recipes';
import { router as mealsRouter } from './routes/meals';
import { router as productsRouter, pricesRouter } from './routes/products';
import { cognitoAuthMiddleware } from './middleware/cognito-auth';
import { errorHandler } from './middleware/error-handler';
import cors from 'cors';
import express from 'express';
import serverless from 'serverless-http';

const app = express();

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Amz-Date',
      'X-Api-Key',
      'X-Amz-Security-Token',
    ],
    maxAge: 300,
  }),
);

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Health check endpoint (no auth required)
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (no auth middleware required)
app.use('/api/v1/auth', authRouter);

// Apply auth middleware to all other API routes
app.use('/api/v1', cognitoAuthMiddleware);

// API Routes (authenticated)
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/lists', listsRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/recipes', recipesRouter);
app.use('/api/v1/meals', mealsRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/prices', pricesRouter);

// Error handler
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Lambda handler
export const handler = serverless(app);
