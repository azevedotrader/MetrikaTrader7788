# Trading Analytics Platform (Métrika)

## Overview

Métrika is a full-stack web application designed for traders to track performance, analyze trades, maintain a trading journal, and visualize progress through key metrics and charts. It provides a unified analytical view across multiple brokers, supporting manual entries, CSV imports, and automated API synchronizations. The platform includes advanced features like real-time charting, AI-driven CSV analysis, and an intelligent bankroll management system with WhatsApp integration, aiming to be a comprehensive tool for trading analysis and risk management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS, custom CSS variables, shadcn/ui-based design system
- **UI Components**: Radix UI primitives
- **State Management**: React Context API (authentication), TanStack Query (server state)
- **Build Tool**: Vite
- **UI/UX**: Dark theme optimized for trading, custom purple/blue gradient branding, responsive design, collapsible sidebar, multi-tab interface for broker management. Landing page is professional, sales-focused, with pricing, testimonials, and feature showcases, including a dedicated section for WhatsApp integration.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Development**: tsx
- **Production Build**: esbuild
- **Authentication**: Supports traditional email/password login and Google OAuth 2.0. Utilizes secure opaque codes and JWTs.
- **WhatsApp Integration**: Features a full WhatsApp bot for saving trades, managing bankroll, and an interactive questionnaire with 7 personalized questions. Includes intelligent parsing of natural language messages, HMAC-SHA256 signature verification, state-driven conversational flows, and interactive button menu for easy navigation. Users can create personalized risk management directly through WhatsApp buttons without typing commands.
- **AI Integration**: Leverages OpenAI GPT-5 for collaborative CSV analysis, working alongside a traditional parser to extract trade data from various formats, including performance reports.
- **Image Uploads**: Allows one image upload per trade with dedicated backend routes.

### Database
- **ORM**: Drizzle ORM with Zod validation
- **Database**: PostgreSQL
- **Migrations**: Drizzle Kit
- **Tables**: Users, Trades, Broker API Configs, CSV Imports, Subscription Plans, Subscriptions, Platform Stats, Password Reset Tokens, Diary Entries, Bankroll Managements, WhatsApp Messages, Questionnaire States, Diary Images.
- **Features**: Multi-broker support (Crypto, Forex, B3), intelligent bankroll management with deterministic projections, automatic USD to BRL conversion for CSV imports, and a comprehensive admin support system.

### Key Features
- **Trading Dashboard**: Overview of performance, key metrics.
- **Trade Entry**: Form-based recording with validation.
- **Real-time Charts**: TradingView integration for Forex, Crypto, and B3.
- **Brokers Management**: Comprehensive system for Tickmill (CSV/manual), Clear (CSV/manual), and Gate.io (API/CSV/manual).
- **CSV Import**: Bulk import with broker-specific mapping, auto-detection of delimiters, encodings, and data structures, and preservation of original dates.
- **API Integration**: Gate.io API for automatic trade synchronization.
- **Data Consolidation**: Unified view across all brokers.
- **Analytics**: Filtering and analysis by broker or consolidated.
- **Journal**: Trading diary with image uploads per trade.
- **Intelligent Bankroll Management**: Comprehensive system with personalized risk profiles via 7-question WhatsApp questionnaire, automatic projections, and streak tracking. Interactive button-driven flow allows users to create personalized risk management by simply clicking "🎯 Criar Gestão" button and answering questions with A/B/C options. System calculates 5 critical risk parameters based on trader profile: risk_per_operation (0.3-3%), max_daily_risk (1-8%), max_weekly_risk (2-15%), min_risk_reward_ratio (1.2-5.0), and drawdown_trigger_losses (1-7). Parameters are automatically adjusted based on experience level, markets traded, timeframe, psychological profile, and custom metrics (win rate/risk reward). Final message includes specific R$ values for each parameter based on user's bankroll.
- **Dashboard Reset**: Fully functional reset to clear all user data.

## External Dependencies

- **UI Framework**: React ecosystem
- **Styling**: Tailwind CSS, PostCSS
- **Forms**: React Hook Form, Zod
- **Date Handling**: date-fns
- **File Processing**: Multer, csv-parser, Papa Parse
- **Database**: Neon serverless PostgreSQL driver, connect-pg-simple
- **Charting**: TradingView Widget API
- **Gate.io**: External API for crypto trade synchronization
- **Frankfurter API**: For real-time currency exchange rates (USD to BRL conversion)
- **OpenAI**: GPT-5 for AI-driven analysis
- **SendGrid**: For email communications (welcome, password reset)
- **Meta/Facebook (WhatsApp Business API)**: For WhatsApp integration
- **Passport.js**: For Google OAuth 2.0 authentication