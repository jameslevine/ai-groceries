# AI Groceries - Architecture Document

## Overview

AI Groceries is a full-stack grocery planning application for UK families. It enables users to plan weekly meals, manage shopping lists, track home inventory, discover recipes, and leverage AI for smart grocery management. The app scrapes major UK supermarkets for real-time pricing.

## Target Market

- **Region**: United Kingdom
- **Users**: Families planning weekly grocery shopping
- **Supermarkets**: Tesco, Sainsbury's, Asda, Morrisons, Aldi, Lidl, Waitrose, Ocado, Co-op, M&S Food

## Core Features

### 1. Shopping Lists

- Visual shopping lists with images
- 2000+ pre-loaded grocery items
- Real-time family sharing & collaboration
- Barcode scanning (150M+ products)
- Voice-enabled list creation
- Aisle grouping & sorting
- Custom categories & subcategories
- Receipt scanning & history
- Favourites lists
- Email/SMS sharing
- Reward card storage
- Transfer to online retailer carts

### 2. Inventory / Pantry

- Real-time stock levels
- 18 built-in inventory locations + custom locations
- Expiry date alerts
- Low stock / out of stock indicators
- Barcode scanning import
- 2000+ inventory items included
- Web image search for items
- Deep integration with meal planning & recipes

### 3. Recipes

- 10M+ recipe database access
- Powerful search (name, type, ingredients)
- Inventory integration (in-stock indicators)
- Colour-coded smart directions
- Recipe rating & sorting
- URL import (paste URL, get recipe)
- Multiple concurrent timers
- AI recipe generation
- Photo-to-recipe conversion
- Recipe book photo import

### 4. Meal Planner

- Weekly calendar view
- Meal types: Breakfast, Lunch, Snacks, Dinner, Desserts + custom
- Inventory integration (ingredient stock check)
- Nutrition tracking
- Copy meal plans between weeks
- 2000+ food items + millions online

### 5. AI Super Powers

- **Smart Lists**: Photo → shopping list, receipt → import, paper list → import
- **Intelligent Inventory**: Auto-assign inventory locations, photo → inventory
- **AI-Crafted Recipes**: Photo → recipe, ingredients → recipe, name → recipe
- **Efficient Meal Planner**: AI-suggested meal plans, nutrition analysis
- **Nutrition Scanner**: Photo → nutrition values

### 6. Price Comparison

- Real-time UK supermarket pricing
- Price tracking over time
- Best deal finder
- Barcode-based average pricing
- One-tap price access

## Technical Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CloudFront CDN                        │
│              (S3 OAC - Static Assets)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │  React SPA   │    │     API Gateway (REST)        │  │
│  │  (Vite/MUI)  │───▶│  + Cognito Authorizer        │  │
│  └──────────────┘    └──────────┬───────────────────┘  │
│                                 │                       │
│                    ┌────────────▼────────────────┐      │
│                    │   Lambda (Express Monolith)  │      │
│                    │   + Lambda Layers            │      │
│                    └────────────┬────────────────┘      │
│                                 │                       │
│         ┌───────────────────────┼───────────────┐      │
│         │                       │               │      │
│  ┌──────▼──────┐  ┌────────────▼──┐  ┌────────▼────┐ │
│  │  DynamoDB    │  │  S3 (Images/  │  │  Secrets    │ │
│  │  (Tables)    │  │   Receipts)   │  │  Manager    │ │
│  └─────────────┘  └───────────────┘  └─────────────┘ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Background Processing                  │   │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │   │
│  │  │ Scraper  │  │ AI/ML     │  │ Notification │ │   │
│  │  │ Lambda   │  │ Lambda    │  │ Lambda       │ │   │
│  │  │(EventBr.)│  │(Bedrock)  │  │ (SES/SNS)   │ │   │
│  │  └──────────┘  └───────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend (Web)

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: MUI (Material UI)
- **Styling**: Emotion (`@emotion/styled`)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: Formik + Yup
- **Routing**: React Router v6
- **i18n**: react-i18next (English, Spanish, RTL support)
- **Auth**: AWS Cognito
- **Testing**: Jest + React Testing Library, Cypress (E2E)

#### Frontend (Mobile)

- **Framework**: Expo SDK + React Native + TypeScript
- **Navigation**: Expo Router
- **UI**: React Native Paper
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Auth**: Expo Auth Session + Cognito
- **Testing**: Jest + RNTL, Maestro (E2E)

#### Backend

- **Runtime**: Node.js + TypeScript
- **Framework**: Express
- **Validation**: Joi
- **Auth**: Amazon Cognito JWT verification
- **Compute**: AWS Lambda (monolith via serverless-http)
- **Database**: DynamoDB
- **AI/ML**: Amazon Bedrock (Claude) + Amazon Rekognition
- **Testing**: Jest

#### Infrastructure

- **Cloud**: AWS
- **IaC**: CloudFormation (YAML) via SAM CLI
- **CDN**: CloudFront
- **Storage**: S3 (OAC)
- **Auth**: Cognito User Pools
- **API**: API Gateway (REST)
- **Monitoring**: CloudWatch
- **Secrets**: AWS Secrets Manager

### DynamoDB Table Design

#### Users Table

| Attribute   | Type | Description      |
| ----------- | ---- | ---------------- |
| pk          | S    | `USER#<userId>`  |
| sk          | S    | `PROFILE`        |
| email       | S    | User email       |
| firstName   | S    | First name       |
| lastName    | S    | Last name        |
| familyId    | S    | Family group ID  |
| preferences | M    | User preferences |
| createdAt   | S    | ISO timestamp    |

#### Shopping Lists Table

| Attribute  | Type | Description                 |
| ---------- | ---- | --------------------------- |
| pk         | S    | `FAMILY#<familyId>`         |
| sk         | S    | `LIST#<listId>`             |
| gsi1pk     | S    | `LIST#<listId>`             |
| gsi1sk     | S    | `ITEM#<itemId>` (for items) |
| name       | S    | List name                   |
| items      | L    | List items                  |
| sharedWith | SS   | User IDs                    |
| createdBy  | S    | User ID                     |
| createdAt  | S    | ISO timestamp               |

#### Inventory Table

| Attribute  | Type | Description                 |
| ---------- | ---- | --------------------------- |
| pk         | S    | `FAMILY#<familyId>`         |
| sk         | S    | `INV#<locationId>#<itemId>` |
| gsi1pk     | S    | `ITEM#<itemId>`             |
| itemName   | S    | Item name                   |
| quantity   | N    | Current quantity            |
| unit       | S    | Unit of measurement         |
| location   | S    | Storage location            |
| expiryDate | S    | Expiry date                 |
| category   | S    | Item category               |
| imageUrl   | S    | Item image URL              |

#### Recipes Table

| Attribute   | Type | Description                 |
| ----------- | ---- | --------------------------- |
| pk          | S    | `RECIPE#<recipeId>`         |
| sk          | S    | `META`                      |
| gsi1pk      | S    | `USER#<userId>` or `PUBLIC` |
| name        | S    | Recipe name                 |
| description | S    | Description                 |
| ingredients | L    | Ingredient list             |
| directions  | L    | Step-by-step directions     |
| prepTime    | N    | Prep time (minutes)         |
| cookTime    | N    | Cook time (minutes)         |
| servings    | N    | Number of servings          |
| nutrition   | M    | Nutrition info              |
| rating      | N    | Average rating              |
| imageUrl    | S    | Recipe image                |
| sourceUrl   | S    | Original URL                |
| tags        | SS   | Recipe tags                 |

#### Meal Plans Table

| Attribute | Type | Description              |
| --------- | ---- | ------------------------ |
| pk        | S    | `FAMILY#<familyId>`      |
| sk        | S    | `MEAL#<date>#<mealType>` |
| recipeId  | S    | Recipe reference         |
| items     | L    | Food items               |
| notes     | S    | Meal notes               |

#### Products Table (Price Data)

| Attribute | Type | Description              |
| --------- | ---- | ------------------------ |
| pk        | S    | `PRODUCT#<barcode>`      |
| sk        | S    | `STORE#<storeId>#<date>` |
| gsi1pk    | S    | `STORE#<storeId>`        |
| gsi1sk    | S    | `CAT#<category>#<name>`  |
| name      | S    | Product name             |
| price     | N    | Price in pence           |
| currency  | S    | `GBP`                    |
| imageUrl  | S    | Product image            |
| category  | S    | Product category         |
| barcode   | S    | EAN/UPC barcode          |
| store     | S    | Store name               |
| scrapedAt | S    | ISO timestamp            |

### UK Supermarket Scraping Strategy

| Supermarket | Method            | Notes                  |
| ----------- | ----------------- | ---------------------- |
| Tesco       | API (Partner API) | Official API available |
| Sainsbury's | Web scraping      | Product pages          |
| Asda        | Web scraping      | Product pages          |
| Morrisons   | Web scraping      | Product pages          |
| Aldi        | Web scraping      | Product pages          |
| Lidl        | Web scraping      | Product pages          |
| Waitrose    | Web scraping      | Product pages          |
| Ocado       | Web scraping      | Product pages          |
| Co-op       | Web scraping      | Product pages          |
| M&S Food    | Web scraping      | Product pages          |

Scraping runs on scheduled Lambda functions via EventBridge (daily/hourly for popular items).

### AI/ML Architecture

| Feature               | AWS Service                    | Model           |
| --------------------- | ------------------------------ | --------------- |
| Photo → Recipe        | Bedrock (Claude) + Rekognition | Multi-modal     |
| Photo → Shopping List | Bedrock (Claude) + Rekognition | Multi-modal     |
| Photo → Nutrition     | Bedrock (Claude) + Rekognition | Multi-modal     |
| Receipt OCR           | Textract                       | Built-in        |
| Recipe Generation     | Bedrock (Claude)               | Text generation |
| Smart Categorisation  | Bedrock (Claude)               | Classification  |
| Inventory Location    | Bedrock (Claude)               | Classification  |

### API Routes

```
/api/v1/
├── auth/
│   ├── POST /register
│   ├── POST /login
│   ├── POST /verify
│   ├── POST /forgot-password
│   └── POST /reset-password
├── users/
│   ├── GET /me
│   ├── PATCH /me
│   └── GET /family
├── lists/
│   ├── GET /
│   ├── POST /
│   ├── GET /:listId
│   ├── PATCH /:listId
│   ├── DELETE /:listId
│   ├── POST /:listId/items
│   ├── PATCH /:listId/items/:itemId
│   ├── DELETE /:listId/items/:itemId
│   └── POST /:listId/share
├── inventory/
│   ├── GET /
│   ├── POST /
│   ├── GET /locations
│   ├── POST /locations
│   ├── GET /low-stock
│   ├── GET /expired
│   ├── PATCH /:itemId
│   └── DELETE /:itemId
├── recipes/
│   ├── GET /
│   ├── POST /
│   ├── GET /search
│   ├── GET /external (10M+ recipes)
│   ├── GET /:recipeId
│   ├── PATCH /:recipeId
│   ├── DELETE /:recipeId
│   ├── POST /:recipeId/rate
│   └── POST /import-url
├── meals/
│   ├── GET / (by date range)
│   ├── POST /
│   ├── PATCH /:mealId
│   ├── DELETE /:mealId
│   └── POST /copy-week
├── products/
│   ├── GET /search
│   ├── GET /barcode/:barcode
│   ├── GET /compare/:productId
│   └── GET /categories
├── ai/
│   ├── POST /photo-to-recipe
│   ├── POST /photo-to-list
│   ├── POST /photo-to-nutrition
│   ├── POST /receipt-scan
│   ├── POST /generate-recipe
│   └── POST /categorise
└── prices/
    ├── GET /compare
    ├── GET /history/:productId
    └── GET /deals
```
