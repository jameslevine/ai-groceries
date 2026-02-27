# AI Groceries - Full Phased Project Plan

## Project Overview

**Product**: AI Groceries - Smart grocery planning application for UK families
**Target Market**: United Kingdom
**Platform**: Web (React) + Mobile (Expo React Native) + Backend (AWS Serverless)
**Timeline**: 24 weeks (6 months)

---

## Phase 1: Foundation & Authentication (Weeks 1-3)

### 1.1 Project Setup & CI/CD

- [x] Initialise monorepo structure (backend, frontend, infrastructure, mobile, docs)
- [x] Set up backend (Express + TypeScript + Lambda)
- [x] Set up frontend (React + Vite + TypeScript + MUI)
- [x] Set up infrastructure (AWS SAM + CloudFormation)
- [ ] Configure ESLint + Prettier for both frontend and backend
- [ ] Set up Husky pre-commit hooks with commitlint
- [ ] Configure Jest for backend unit testing
- [ ] Configure Jest + React Testing Library for frontend testing
- [ ] Set up GitHub repository with branch protection rules
- [ ] Create GitHub Actions CI pipeline (lint, test, build)
- [ ] Create GitHub Actions CD pipeline (deploy to AWS)

### 1.2 AWS Infrastructure Deployment

- [ ] Deploy Cognito User Pool with custom attributes (familyId)
- [ ] Deploy all 6 DynamoDB tables with GSIs
- [ ] Deploy S3 buckets (images, receipts) with OAC
- [ ] Deploy API Gateway with Cognito authorizer
- [ ] Deploy Lambda function for API
- [ ] Deploy CloudFront distribution for frontend
- [ ] Set up CloudWatch monitoring and alarms
- [ ] Configure AWS Secrets Manager for API keys
- [ ] Verify all infrastructure with integration tests

### 1.3 Authentication System

- [ ] **Backend**: Implement Cognito JWT verification middleware (done - needs testing)
- [ ] **Backend**: Create user registration endpoint (sign up → Cognito)
- [ ] **Backend**: Create user login endpoint (sign in → JWT tokens)
- [ ] **Backend**: Create email verification endpoint
- [ ] **Backend**: Create forgot password / reset password endpoints
- [ ] **Backend**: Create user profile CRUD (GET /me, PATCH /me)
- [ ] **Backend**: Create family management (create family, invite members, join family)
- [ ] **Frontend**: Build Login page with Formik + Yup validation
- [ ] **Frontend**: Build Registration page with Formik + Yup validation
- [ ] **Frontend**: Build Email Verification page
- [ ] **Frontend**: Build Forgot Password / Reset Password pages
- [ ] **Frontend**: Implement auth state management in Zustand
- [ ] **Frontend**: Implement protected route wrapper
- [ ] **Frontend**: Implement token refresh logic
- [ ] **Testing**: Unit tests for all auth endpoints (90%+ coverage)
- [ ] **Testing**: E2E test for full auth flow (register → verify → login → logout)

### 1.4 User & Family Management

- [ ] **Backend**: Users DynamoDB adapter (CRUD operations)
- [ ] **Backend**: Family DynamoDB adapter (create, join, leave, list members)
- [ ] **Frontend**: Profile settings page (edit name, preferences, dietary restrictions)
- [ ] **Frontend**: Family management page (view members, invite, remove)
- [ ] **Frontend**: Household size and preferences configuration
- [ ] **Testing**: Unit tests for user/family operations

**Phase 1 Deliverables:**

- ✅ Fully deployed AWS infrastructure
- ✅ Working authentication flow (register, login, verify, reset password)
- ✅ User profile and family management
- ✅ CI/CD pipeline running
- ✅ 90%+ test coverage on Phase 1 code

---

## Phase 2: Shopping Lists (Weeks 4-6)

### 2.1 Core Shopping List CRUD

- [ ] **Backend**: Verify and test shopping list adapter (create, read, update, delete)
- [ ] **Backend**: Verify and test list item operations (add, update, remove, check/uncheck)
- [ ] **Backend**: Implement list sharing (share with family members, real-time sync)
- [ ] **Backend**: Implement list favourites
- [ ] **Backend**: Implement list history (never lose receipts - auto-save completed lists)
- [ ] **Frontend**: Shopping Lists page - list of all lists with search/filter
- [ ] **Frontend**: Shopping List detail page - full item management
- [ ] **Frontend**: Create new list dialog with name and optional initial items
- [ ] **Frontend**: Add item to list - search from 2000+ pre-loaded items
- [ ] **Frontend**: Item check/uncheck with visual feedback
- [ ] **Frontend**: Swipe to delete items (mobile-friendly)
- [ ] **Frontend**: List sharing dialog (select family members)
- [ ] **Frontend**: Favourite lists toggle

### 2.2 Advanced List Features

- [ ] **Backend**: Implement aisle grouping and sorting
- [ ] **Backend**: Implement custom categories and subcategories
- [ ] **Backend**: Implement list templates (save list as template, create from template)
- [ ] **Frontend**: Aisle/category grouping view with collapsible sections
- [ ] **Frontend**: Sort items by aisle, category, name, or custom order
- [ ] **Frontend**: Drag-and-drop item reordering
- [ ] **Frontend**: Custom category management (create, edit, delete categories)
- [ ] **Frontend**: List templates (save as template, create from template)

### 2.3 Voice & Quick Add

- [ ] **Frontend**: Voice input for adding items (Web Speech API)
- [ ] **Frontend**: Quick add bar with autocomplete from 2000+ items
- [ ] **Frontend**: Quantity and unit picker (inline editing)
- [ ] **Frontend**: Recently added items suggestions

### 2.4 List Sharing & Email/SMS

- [ ] **Backend**: Implement email list sharing (SES)
- [ ] **Backend**: Implement SMS list sharing (SNS)
- [ ] **Frontend**: Share via email dialog
- [ ] **Frontend**: Share via SMS dialog
- [ ] **Frontend**: Copy list to clipboard
- [ ] **Frontend**: Real-time sync indicator (show when other family members are editing)

### 2.5 Shopping History

- [ ] **Backend**: Auto-save completed lists to history
- [ ] **Backend**: Shopping history query (by date range, store)
- [ ] **Frontend**: Shopping history page with date filters
- [ ] **Frontend**: View past receipts/lists
- [ ] **Frontend**: Re-create list from history

### 2.6 Seed Data

- [ ] Create seed script for 2000+ common UK grocery items with:
  - Names, categories, subcategories, typical aisles
  - Default units and quantities
  - Image URLs
  - Barcodes where available

**Phase 2 Deliverables:**

- ✅ Full shopping list CRUD with real-time family sharing
- ✅ 2000+ pre-loaded grocery items
- ✅ Aisle grouping, custom categories, voice input
- ✅ List sharing via app, email, SMS
- ✅ Shopping history with auto-save
- ✅ 90%+ test coverage

---

## Phase 3: Inventory / Pantry Management (Weeks 7-9)

### 3.1 Core Inventory CRUD

- [ ] **Backend**: Verify and test inventory adapter (create, read, update, delete)
- [ ] **Backend**: Implement inventory location management (18 built-in + custom)
- [ ] **Backend**: Implement stock level calculations (in stock, low stock, out of stock)
- [ ] **Backend**: Implement expiry date tracking and alerts
- [ ] **Frontend**: Inventory dashboard - overview of all locations with stock status
- [ ] **Frontend**: Location detail view - items in a specific location
- [ ] **Frontend**: Add item to inventory dialog (name, quantity, unit, location, expiry)
- [ ] **Frontend**: Edit item inline (quantity, expiry, location)
- [ ] **Frontend**: Delete/consume item

### 3.2 Stock Alerts & Notifications

- [ ] **Backend**: Implement expiry alert Lambda (EventBridge scheduled, daily check)
- [ ] **Backend**: Implement low stock alert Lambda
- [ ] **Backend**: Send push notifications via SNS for expiry/low stock
- [ ] **Frontend**: Alerts dashboard - items needing attention (expired, expiring soon, low stock)
- [ ] **Frontend**: Notification preferences (which alerts, how many days before expiry)
- [ ] **Frontend**: Visual indicators on items (red = expired, amber = expiring soon, green = OK)

### 3.3 Inventory Locations

- [ ] **Frontend**: Location management page (view all 18 built-in locations)
- [ ] **Frontend**: Create custom locations (name, icon)
- [ ] **Frontend**: Location icons and visual representation
- [ ] **Frontend**: Move items between locations

### 3.4 Inventory Filters & Search

- [ ] **Frontend**: Filter by location, category, stock status, expiry status
- [ ] **Frontend**: Search inventory items
- [ ] **Frontend**: Sort by name, quantity, expiry date, location
- [ ] **Frontend**: Group by category or location

### 3.5 Inventory ↔ Shopping List Integration

- [ ] **Backend**: When inventory item goes low stock, suggest adding to shopping list
- [ ] **Backend**: When shopping list item is checked off, offer to add to inventory
- [ ] **Frontend**: "Add to shopping list" button on low stock items
- [ ] **Frontend**: "Add to inventory" prompt when checking off shopping list items
- [ ] **Frontend**: Inventory status indicators on shopping list items

### 3.6 Web Image Search

- [ ] **Backend**: Implement image search API (Bing Image Search or similar)
- [ ] **Frontend**: Search for item photos on the web and attach to inventory items

**Phase 3 Deliverables:**

- ✅ Full inventory management with 18+ locations
- ✅ Real-time stock levels with visual indicators
- ✅ Expiry date tracking with alerts
- ✅ Deep integration with shopping lists
- ✅ Web image search for items
- ✅ 90%+ test coverage

---

## Phase 4: Recipes (Weeks 10-13)

### 4.1 Core Recipe CRUD

- [ ] **Backend**: Verify and test recipe adapter (create, read, update, delete)
- [ ] **Backend**: Implement recipe search (by name, ingredients, cuisine, difficulty)
- [ ] **Backend**: Implement recipe rating system
- [ ] **Frontend**: Recipes page - grid/list view of all recipes
- [ ] **Frontend**: Recipe detail page - full recipe with ingredients, directions, nutrition
- [ ] **Frontend**: Create recipe form (Formik + Yup) with all fields
- [ ] **Frontend**: Edit recipe form
- [ ] **Frontend**: Delete recipe with confirmation

### 4.2 Recipe Search & Discovery

- [ ] **Backend**: Implement full-text search (consider OpenSearch for production)
- [ ] **Backend**: Implement recipe filtering (cuisine, difficulty, prep time, cook time, tags)
- [ ] **Frontend**: Advanced search with filters
- [ ] **Frontend**: Recipe tags and tag-based browsing
- [ ] **Frontend**: Sort by rating, prep time, cook time, newest

### 4.3 Recipe URL Import

- [ ] **Backend**: Implement URL scraping for recipe import using cheerio
- [ ] **Backend**: Parse JSON-LD structured data (Schema.org Recipe)
- [ ] **Backend**: Parse microdata and meta tags as fallback
- [ ] **Backend**: Support major UK recipe sites (BBC Good Food, Jamie Oliver, Great British Chefs, Delicious Magazine, All Recipes)
- [ ] **Frontend**: "Import from URL" dialog - paste URL, preview extracted recipe, confirm import

### 4.4 Colour-Coded Smart Directions

- [ ] **Frontend**: Parse recipe directions to identify ingredient references
- [ ] **Frontend**: Colour-code ingredients in directions (tap for precise quantities)
- [ ] **Frontend**: Step-by-step cooking mode (distraction-free, large text)
- [ ] **Frontend**: Ingredient highlighting in each step

### 4.5 Recipe Timers

- [ ] **Frontend**: Detect timer durations in recipe directions
- [ ] **Frontend**: Inline timer buttons in directions
- [ ] **Frontend**: Multiple concurrent timers with floating timer widget
- [ ] **Frontend**: Timer notifications (sound + visual alert)
- [ ] **Frontend**: Timer stays on top during cooking mode

### 4.6 Recipe ↔ Inventory Integration

- [ ] **Backend**: Check recipe ingredients against inventory
- [ ] **Frontend**: Show in-stock/out-of-stock indicators on recipe ingredients
- [ ] **Frontend**: "Add missing ingredients to shopping list" button
- [ ] **Frontend**: Filter recipes by "can cook now" (all ingredients in stock)

### 4.7 External Recipe Access (10M+ Recipes)

- [ ] **Backend**: Integrate with recipe API (Spoonacular, Edamam, or TheMealDB)
- [ ] **Backend**: Cache external recipe results
- [ ] **Frontend**: External recipe search tab
- [ ] **Frontend**: Import external recipe to personal collection
- [ ] **Frontend**: Browse by cuisine, category, dietary requirements

### 4.8 Recipe Nutrition

- [ ] **Backend**: Calculate nutrition from ingredients (using nutrition database)
- [ ] **Frontend**: Nutrition panel on recipe detail (calories, protein, carbs, fat, fibre)
- [ ] **Frontend**: Nutrition per serving calculations

**Phase 4 Deliverables:**

- ✅ Full recipe management with search and filtering
- ✅ URL import from major UK recipe sites
- ✅ Colour-coded smart directions with timers
- ✅ Inventory integration (in-stock indicators)
- ✅ Access to 10M+ external recipes
- ✅ Nutrition information
- ✅ 90%+ test coverage

---

## Phase 5: Meal Planner (Weeks 14-16)

### 5.1 Core Meal Planning

- [ ] **Backend**: Verify and test meal plan adapter (create, read, update, delete)
- [ ] **Backend**: Implement date range queries for weekly/monthly views
- [ ] **Backend**: Implement copy week functionality
- [ ] **Frontend**: Weekly calendar view (Mon-Sun)
- [ ] **Frontend**: Day view with meal slots (Breakfast, Lunch, Snack, Dinner, Dessert)
- [ ] **Frontend**: Add meal to slot (select from recipes or add food items)
- [ ] **Frontend**: Drag-and-drop meals between slots/days
- [ ] **Frontend**: Edit/remove meals

### 5.2 Meal Types & Customisation

- [ ] **Frontend**: Default meal types (Breakfast, Lunch, Snack, Dinner, Dessert)
- [ ] **Frontend**: Create custom meal types
- [ ] **Frontend**: Meal type icons and colours

### 5.3 Copy & Template Meal Plans

- [ ] **Backend**: Copy week endpoint (source week → target week)
- [ ] **Frontend**: Copy week dialog (select source and target weeks)
- [ ] **Frontend**: Save week as template
- [ ] **Frontend**: Apply template to a week

### 5.4 Meal Plan ↔ Inventory Integration

- [ ] **Backend**: Check meal plan ingredients against inventory
- [ ] **Frontend**: Open a meal and see exactly what ingredients are in stock
- [ ] **Frontend**: Visual indicators (green = all in stock, amber = some missing, red = most missing)

### 5.5 Meal Plan → Shopping List

- [ ] **Backend**: Generate shopping list from meal plan (aggregate ingredients across meals)
- [ ] **Frontend**: "Generate shopping list for this week" button
- [ ] **Frontend**: Review and edit generated list before saving
- [ ] **Frontend**: Deduct inventory items from generated list

### 5.6 Nutrition Tracking

- [ ] **Frontend**: Daily nutrition summary (calories, macros)
- [ ] **Frontend**: Weekly nutrition overview chart (using Recharts)
- [ ] **Frontend**: Nutrition goals and tracking

**Phase 5 Deliverables:**

- ✅ Weekly meal planner with drag-and-drop
- ✅ 5 default + custom meal types
- ✅ Copy weeks and templates
- ✅ Inventory integration with stock indicators
- ✅ Auto-generate shopping lists from meal plans
- ✅ Nutrition tracking
- ✅ 90%+ test coverage

---

## Phase 6: AI Super Powers (Weeks 17-19)

### 6.1 AI Infrastructure

- [ ] **Backend**: Set up Amazon Bedrock client (Claude 3 Sonnet/Haiku)
- [ ] **Backend**: Set up Amazon Textract client (OCR)
- [ ] **Backend**: Set up Amazon Rekognition client (image analysis)
- [ ] **Backend**: Create S3 presigned URL generation for image uploads
- [ ] **Backend**: Create AI processing Lambda (separate from API Lambda for timeout reasons)
- [ ] **Backend**: Implement rate limiting for AI endpoints

### 6.2 Photo → Recipe

- [ ] **Backend**: Accept image upload, send to Bedrock (Claude multi-modal)
- [ ] **Backend**: Prompt engineering: "Identify this dish and provide full recipe with ingredients, directions, and nutrition"
- [ ] **Backend**: Parse AI response into Recipe type
- [ ] **Frontend**: Camera/upload interface (react-dropzone)
- [ ] **Frontend**: Processing indicator with animation
- [ ] **Frontend**: Preview extracted recipe, allow editing before saving
- [ ] **Frontend**: Save to recipe collection

### 6.3 Photo → Shopping List

- [ ] **Backend**: Accept image of items, send to Bedrock
- [ ] **Backend**: Prompt: "Identify all food/grocery items in this image and create a shopping list"
- [ ] **Backend**: Parse response into shopping list items
- [ ] **Frontend**: Camera/upload interface
- [ ] **Frontend**: Preview extracted items, allow editing
- [ ] **Frontend**: Add to existing list or create new list

### 6.4 Receipt Scanner

- [ ] **Backend**: Accept receipt image, send to Amazon Textract
- [ ] **Backend**: Parse Textract response to extract line items, prices, store name, date
- [ ] **Backend**: Use Bedrock to clean up and categorise extracted items
- [ ] **Frontend**: Camera/upload interface optimised for receipts
- [ ] **Frontend**: Preview extracted items with prices
- [ ] **Frontend**: Choose destination: add to shopping list OR add to inventory
- [ ] **Frontend**: Save receipt to history (never lose receipts)

### 6.5 Photo → Nutrition

- [ ] **Backend**: Accept food photo, send to Bedrock
- [ ] **Backend**: Prompt: "Identify this food item and provide detailed nutrition information per serving"
- [ ] **Backend**: Parse response into NutritionInfo type
- [ ] **Frontend**: Camera/upload interface
- [ ] **Frontend**: Display nutrition card (calories, protein, carbs, fat, fibre, sugar, sodium)
- [ ] **Frontend**: Save nutrition data to meal plan

### 6.6 AI Recipe Generation

- [ ] **Backend**: Accept ingredients list or recipe name
- [ ] **Backend**: Prompt: "Generate a detailed recipe for [name] using [ingredients] with full directions and nutrition"
- [ ] **Backend**: Parse response into Recipe type
- [ ] **Frontend**: Input form (ingredients text area OR recipe name)
- [ ] **Frontend**: Dietary preferences selector (vegetarian, vegan, gluten-free, etc.)
- [ ] **Frontend**: Preview generated recipe, allow editing
- [ ] **Frontend**: Save to recipe collection

### 6.7 Smart Categorisation

- [ ] **Backend**: Accept item name, use Bedrock to determine category and inventory location
- [ ] **Backend**: Prompt: "Categorise this grocery item and suggest the best home storage location"
- [ ] **Frontend**: Auto-categorise when adding items to lists or inventory
- [ ] **Frontend**: Suggest inventory location when importing items

### 6.8 Paper List Import

- [ ] **Backend**: Accept photo of handwritten list, use Textract + Bedrock
- [ ] **Backend**: Extract text, clean up, and create shopping list items
- [ ] **Frontend**: Camera/upload interface
- [ ] **Frontend**: Preview and edit extracted items
- [ ] **Frontend**: Add to existing or new list

### 6.9 Recipe Book Photo Import

- [ ] **Backend**: Accept photo of recipe book page, use Textract + Bedrock
- [ ] **Backend**: Extract and structure recipe from printed text
- [ ] **Frontend**: Camera/upload interface
- [ ] **Frontend**: Preview extracted recipe
- [ ] **Frontend**: Save to collection

**Phase 6 Deliverables:**

- ✅ All 6 AI tools fully functional
- ✅ Photo → Recipe, Photo → Shopping List, Receipt Scanner
- ✅ Photo → Nutrition, AI Recipe Generation, Smart Categorisation
- ✅ Paper list import, Recipe book photo import
- ✅ 90%+ test coverage (mock AI responses in tests)

---

## Phase 7: Price Scraping & Comparison (Weeks 20-22)

### 7.1 Scraping Infrastructure

- [ ] **Backend**: Create scraper Lambda function (separate from API)
- [ ] **Backend**: Set up EventBridge scheduled rules (daily scraping)
- [ ] **Backend**: Set up SQS queue for scraping jobs
- [ ] **Backend**: Products DynamoDB adapter (store scraped prices)
- [ ] **Backend**: Price history tracking (store daily prices)

### 7.2 UK Supermarket Scrapers

- [ ] **Tesco**: Implement scraper (Tesco API if available, otherwise web scraping)
- [ ] **Sainsbury's**: Implement web scraper (product pages, search results)
- [ ] **Asda**: Implement web scraper
- [ ] **Morrisons**: Implement web scraper
- [ ] **Aldi**: Implement web scraper
- [ ] **Lidl**: Implement web scraper
- [ ] **Waitrose**: Implement web scraper
- [ ] **Ocado**: Implement web scraper
- [ ] **Co-op**: Implement web scraper
- [ ] **M&S Food**: Implement web scraper (via Ocado)
- [ ] **All scrapers**: Handle anti-bot measures (rate limiting, user agents, proxies)
- [ ] **All scrapers**: Error handling and retry logic
- [ ] **All scrapers**: Data validation and cleaning

### 7.3 Barcode Scanning

- [ ] **Backend**: Barcode lookup API integration (Open Food Facts, UPC Database)
- [ ] **Backend**: Match barcodes to scraped products
- [ ] **Frontend**: Barcode scanner component (html5-qrcode)
- [ ] **Frontend**: Scan barcode → show product with prices across stores
- [ ] **Frontend**: Add scanned product to shopping list or inventory

### 7.4 Price Comparison UI

- [ ] **Frontend**: Product search with autocomplete
- [ ] **Frontend**: Price comparison table (product × store matrix)
- [ ] **Frontend**: Best deal highlighting
- [ ] **Frontend**: Store logos and brand colours
- [ ] **Frontend**: Price per unit calculations
- [ ] **Frontend**: Offer/promotion indicators

### 7.5 Price History & Tracking

- [ ] **Backend**: Price history queries (product × store × date range)
- [ ] **Frontend**: Price history chart (Recharts line chart)
- [ ] **Frontend**: Price alerts (notify when price drops below threshold)
- [ ] **Frontend**: Average price calculations

### 7.6 Shopping List Price Optimisation

- [ ] **Backend**: Calculate total shopping list cost per store
- [ ] **Backend**: Suggest optimal store(s) for cheapest basket
- [ ] **Frontend**: "Find cheapest store for my list" feature
- [ ] **Frontend**: Split list across stores for maximum savings
- [ ] **Frontend**: Savings calculator

### 7.7 Online Cart Transfer

- [ ] **Backend**: Research online cart APIs for UK supermarkets
- [ ] **Frontend**: "Transfer to online cart" button per store
- [ ] **Frontend**: Deep links to store product pages

### 7.8 Reward Cards

- [ ] **Backend**: Store reward card data (encrypted)
- [ ] **Frontend**: Add/manage reward cards (Tesco Clubcard, Nectar, etc.)
- [ ] **Frontend**: Display barcode for in-store scanning

**Phase 7 Deliverables:**

- ✅ Daily price scraping for 10 UK supermarkets
- ✅ Barcode scanning with price lookup
- ✅ Price comparison across all stores
- ✅ Price history charts
- ✅ Shopping list cost optimisation
- ✅ Reward card storage
- ✅ 90%+ test coverage

---

## Phase 8: Mobile App & Polish (Weeks 23-24)

### 8.1 Expo React Native App

- [ ] Initialise Expo project with TypeScript
- [ ] Set up Expo Router for navigation
- [ ] Set up React Native Paper for UI components
- [ ] Set up Zustand + TanStack Query (shared logic with web)
- [ ] Implement authentication screens (login, register, verify, forgot password)
- [ ] Implement shopping lists screens
- [ ] Implement inventory screens
- [ ] Implement recipes screens
- [ ] Implement meal planner screens
- [ ] Implement price comparison screens
- [ ] Implement AI tools screens (camera integration)
- [ ] Implement barcode scanner (expo-barcode-scanner)
- [ ] Implement push notifications (expo-notifications)
- [ ] Implement offline support (AsyncStorage caching)

### 8.2 Performance & Optimisation

- [ ] Frontend: Lazy loading for all route-level components
- [ ] Frontend: Image optimisation and caching
- [ ] Frontend: Bundle size analysis and optimisation
- [ ] Backend: Lambda cold start optimisation
- [ ] Backend: DynamoDB query optimisation (review access patterns)
- [ ] Backend: API response caching (API Gateway caching)

### 8.3 Accessibility

- [ ] WCAG 2.1 AA compliance audit
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] Colour contrast validation
- [ ] Focus management for dialogs and modals

### 8.4 Security Hardening

- [ ] CSP headers configuration
- [ ] Input sanitisation review
- [ ] Rate limiting on all API endpoints
- [ ] Dependency vulnerability audit (npm audit)
- [ ] Penetration testing
- [ ] GDPR compliance review (data retention, right to deletion)

### 8.5 Final Testing & QA

- [ ] Full E2E test suite (Cypress for web, Maestro for mobile)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Load testing (k6 or Artillery)
- [ ] User acceptance testing with real families

### 8.6 Documentation & Launch

- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide / help centre content
- [ ] Developer documentation (setup, architecture, contributing)
- [ ] App Store submission preparation (iOS + Android)
- [ ] Production deployment checklist
- [ ] Monitoring and alerting setup
- [ ] Launch!

**Phase 8 Deliverables:**

- ✅ Mobile app (iOS + Android) via Expo
- ✅ Performance optimised (Lighthouse 90+)
- ✅ WCAG 2.1 AA accessible
- ✅ Security hardened
- ✅ Full E2E test coverage
- ✅ Production-ready deployment

---

## Post-Launch Roadmap

### v1.1 - Enhanced AI

- AI meal plan suggestions based on dietary preferences and inventory
- AI-powered "what can I cook tonight?" based on current inventory
- Nutritional goal tracking with AI recommendations

### v1.2 - Social Features

- Share recipes with other AI Groceries users
- Public recipe collections
- Family recipe books
- Community ratings and reviews

### v1.3 - Smart Home Integration

- Integration with smart fridges (Samsung, LG)
- Alexa/Google Home voice commands
- Smart display recipe mode

### v1.4 - Advanced Analytics

- Spending analytics and budgeting
- Food waste tracking and reduction tips
- Seasonal produce recommendations
- Carbon footprint tracking

### v1.5 - Marketplace

- Direct ordering from supermarkets
- Meal kit partnerships
- Local farm/market integration
- Subscription box recommendations

---

## Success Metrics

| Metric             | Target                      | Measurement                      |
| ------------------ | --------------------------- | -------------------------------- |
| User Registration  | 10,000 in first 3 months    | Cognito metrics                  |
| Daily Active Users | 30% of registered users     | CloudWatch                       |
| Lists Created      | 5+ per active user/month    | DynamoDB metrics                 |
| Recipes Saved      | 20+ per active user         | DynamoDB metrics                 |
| AI Feature Usage   | 50% of users use AI weekly  | API metrics                      |
| Price Comparison   | 40% of users compare prices | API metrics                      |
| App Store Rating   | 4.5+ stars                  | App Store Connect / Play Console |
| API Latency (p95)  | < 500ms                     | CloudWatch                       |
| Uptime             | 99.9%                       | CloudWatch                       |
| Test Coverage      | 90%+                        | Jest coverage reports            |

---

## Team Requirements

| Role                 | Count | Phase        |
| -------------------- | ----- | ------------ |
| Full-Stack Developer | 2     | All phases   |
| Frontend Developer   | 1     | Phase 2+     |
| Backend Developer    | 1     | Phase 2+     |
| UI/UX Designer       | 1     | Phase 1-5    |
| QA Engineer          | 1     | Phase 3+     |
| DevOps Engineer      | 0.5   | Phase 1, 7-8 |
| Product Manager      | 1     | All phases   |

---

## Risk Register

| Risk                                | Probability | Impact | Mitigation                                                                                        |
| ----------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------- |
| Supermarket anti-scraping measures  | High        | High   | Use rotating proxies, respect robots.txt, implement fallback APIs, consider official partnerships |
| AI costs (Bedrock) exceeding budget | Medium      | Medium | Implement usage limits per user, cache AI responses, use cheaper models for simple tasks          |
| MUI breaking changes                | Low         | Medium | Pin versions, test upgrades in staging                                                            |
| Cognito limitations                 | Low         | Low    | Abstract auth layer for potential migration                                                       |
| DynamoDB hot partitions             | Medium      | Medium | Design keys carefully, implement caching layer                                                    |
| GDPR compliance issues              | Medium      | High   | Engage legal counsel, implement data deletion, consent management                                 |
| App Store rejection                 | Medium      | Medium | Follow guidelines strictly, prepare for review process                                            |

---

## Budget Estimates (Monthly, Production)

| Service                      | Estimated Cost       |
| ---------------------------- | -------------------- |
| Lambda (API + Scrapers + AI) | £50-150              |
| DynamoDB (on-demand)         | £20-80               |
| S3 + CloudFront              | £10-30               |
| Cognito                      | Free (first 50K MAU) |
| API Gateway                  | £10-30               |
| Bedrock (AI)                 | £100-500             |
| Textract (OCR)               | £20-50               |
| SES/SNS (notifications)      | £5-20                |
| CloudWatch                   | £10-20               |
| **Total**                    | **£225-880/month**   |

_Costs scale with usage. Estimates based on 10,000 active users._
