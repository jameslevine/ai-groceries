# AI Groceries 🛒

A full-stack grocery planning application for UK families. Plan weekly meals, manage shopping lists, track home inventory, discover recipes, and leverage AI for smart grocery management with real-time price comparison across major UK supermarkets.

## Features

### 🛍️ Shopping Lists

- Visual shopping lists with images
- 2000+ pre-loaded grocery items
- Real-time family sharing & collaboration
- Barcode scanning (150M+ products)
- Voice-enabled list creation
- Aisle grouping & sorting
- Receipt scanning & history

### 🏠 Inventory / Pantry

- Real-time stock levels
- 18 built-in inventory locations + custom
- Expiry date alerts
- Low stock / out of stock indicators
- Barcode scanning import

### 📖 Recipes

- 10M+ recipe database access
- Powerful search (name, type, ingredients)
- Inventory integration (in-stock indicators)
- Colour-coded smart directions
- Recipe rating & sorting
- URL import & AI generation

### 📅 Meal Planner

- Weekly calendar view
- Meal types: Breakfast, Lunch, Snacks, Dinner, Desserts
- Inventory integration
- Copy meal plans between weeks

### 🤖 AI Super Powers

- **Photo → Recipe**: Snap a photo of any dish, get full recipe
- **Photo → Shopping List**: Photo of items generates a list
- **Receipt Scanner**: Import items from receipts
- **Photo → Nutrition**: Get nutrition values from food photos
- **AI Recipe Generation**: Generate recipes from ingredients
- **Smart Categorisation**: Auto-assign categories & locations

### 💰 Price Comparison

- Real-time UK supermarket pricing (Tesco, Sainsbury's, Asda, Morrisons, Aldi, Lidl, Waitrose, Ocado, Co-op, M&S)
- Price tracking over time
- Best deal finder

## Tech Stack

### Frontend (Web)

- React 18 + TypeScript + Vite
- MUI (Material UI) + Emotion
- Zustand (state management)
- TanStack Query (data fetching)
- Formik + Yup (forms)
- react-i18next (internationalisation)

### Backend

- Node.js + TypeScript + Express
- AWS Lambda (serverless-http)
- DynamoDB
- Amazon Bedrock (AI/ML)
- Amazon Textract (OCR)

### Infrastructure

- AWS SAM + CloudFormation
- API Gateway + Lambda
- Cognito (authentication)
- S3 + CloudFront (hosting)
- DynamoDB (database)

## Getting Started

### Prerequisites

- Node.js 20+
- AWS CLI configured
- SAM CLI installed

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Infrastructure Deployment

```bash
cd infrastructure
sam build
sam deploy --guided
```

## Project Structure

```
ai-groceries/
├── backend/                 # Express API (Lambda)
│   └── src/
│       ├── adapters/        # DynamoDB adapters
│       ├── constants/       # Static values
│       ├── controllers/     # Route handlers
│       ├── middleware/       # Auth, validation, errors
│       ├── models/          # Joi validation schemas
│       ├── routes/          # Express routes
│       ├── types/           # TypeScript types
│       └── index.ts         # Entry point
├── frontend/                # React SPA (Vite)
│   └── src/
│       ├── constants/       # Routes, static values
│       ├── i18n/            # Internationalisation
│       ├── layouts/         # Page layouts
│       ├── pages/           # Route-level components
│       ├── services/        # API client
│       ├── store/           # Zustand state
│       ├── styles/          # Theme configuration
│       └── App.tsx          # Root component
├── infrastructure/          # AWS SAM templates
│   └── template.yaml        # CloudFormation
├── mobile/                  # Expo React Native (future)
└── docs/                    # Documentation
    └── ARCHITECTURE.md      # System architecture
```

## Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:3001/api/v1
VITE_COGNITO_USER_POOL_ID=
VITE_COGNITO_CLIENT_ID=
VITE_AWS_REGION=eu-west-2
```

### Backend (.env)

```
NODE_ENV=development
PORT=3001
AWS_REGION=eu-west-2
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
```

## UK Supermarkets Supported

| Supermarket | Status     |
| ----------- | ---------- |
| Tesco       | 🟢 Planned |
| Sainsbury's | 🟢 Planned |
| Asda        | 🟢 Planned |
| Morrisons   | 🟢 Planned |
| Aldi        | 🟢 Planned |
| Lidl        | 🟢 Planned |
| Waitrose    | 🟢 Planned |
| Ocado       | 🟢 Planned |
| Co-op       | 🟢 Planned |
| M&S Food    | 🟢 Planned |

## License

Private - All rights reserved.
