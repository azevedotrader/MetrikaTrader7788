# Trading Analytics Platform (Métrika)

## Overview

Métrika is a comprehensive, full-stack web application designed for traders to track performance, analyze trades, maintain a trading journal, and visualize progress through key metrics and charts. The platform aims to provide a unified analytical view across multiple brokers, supporting both manual entries, CSV imports, and automated API synchronizations. It includes advanced features like real-time charting, AI-driven CSV analysis, and a professional landing page for marketing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom CSS variables, shadcn/ui-based design system
- **UI Components**: Radix UI primitives
- **State Management**: React Context API (authentication), TanStack Query (server state)
- **Build Tool**: Vite
- **UI/UX**: Dark theme optimized for trading, custom purple/blue gradient branding, responsive design, collapsible sidebar (hover-activated), multi-tab interface for broker management.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Development**: tsx
- **Production Build**: esbuild

### Database
- **ORM**: Drizzle ORM with Zod validation
- **Database**: PostgreSQL (Neon Database)
- **Migrations**: Drizzle Kit
- **Tables**: Users, Trades (separated by broker, origin tracking), Broker API Configs, CSV Import History
- **Multi-broker Support**: Data segregated for Tickmill, Clear, Gate.io, supporting manual, CSV, and API origins.

### Key Features
- **Authentication**: Context-based, mock implementation for development, persistent user sessions.
- **Trading Dashboard**: Overview of performance, key metrics.
- **Trade Entry**: Form-based recording with validation.
- **Real-time Charts**: TradingView integration for Forex, Crypto, and B3 markets, with technical analysis tools.
- **Brokers Management**: Comprehensive system for Tickmill (CSV/manual), Clear (CSV/manual), and Gate.io (API/CSV/manual).
- **CSV Import**: Bulk trade import with broker-specific field mapping and intelligent trade detection. Supports universal CSV formats, auto-detects delimiters, encodings, and data structures, and preserves original dates.
- **API Integration**: Gate.io API for automatic trade synchronization.
- **Data Consolidation**: Unified view across all brokers.
- **Analytics**: Filtering and analysis by broker or consolidated.
- **Journal**: Trading diary.
- **Profile**: User settings and preferences.
- **Dashboard Reset**: Fully functional reset to clear all user data (trades, CSV imports, API configs).
- **Landing Page**: Professional, sales-focused design with value proposition, pricing, testimonials, and feature showcases.

## External Dependencies

- **UI Framework**: React ecosystem
- **Styling**: Tailwind CSS, PostCSS
- **Forms**: React Hook Form, Zod
- **Date Handling**: date-fns
- **File Processing**: Multer (CSV uploads), csv-parser (data processing), Papa Parse (for reliable CSV parsing).
- **Database**: Neon serverless PostgreSQL driver, connect-pg-simple (session store).
- **Charting**: TradingView Widget API.
- **Gate.io**: External API for crypto trade synchronization.