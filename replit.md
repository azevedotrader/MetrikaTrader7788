# Trading Analytics Platform (Métrika)

## Overview

This is a comprehensive trading analytics platform called "Métrika" built as a full-stack web application. The platform allows traders to track their performance, analyze trades, maintain a trading journal, and visualize their progress through various metrics and charts.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Custom component library built on Radix UI primitives
- **State Management**: React Context API for authentication, TanStack Query for server state
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for server bundling

### Database Architecture
- **ORM**: Drizzle ORM with Zod schema validation
- **Database**: PostgreSQL (configured but using in-memory storage currently)
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Context-based authentication using React Context
- Mock authentication implementation (simulates login)
- User session management with persistent state
- Role-based access control ready for implementation

### UI Component System
- Comprehensive design system based on shadcn/ui
- Dark theme optimized for trading applications
- Custom color scheme with purple/blue gradient branding
- Responsive design with mobile-first approach
- Accessibility features through Radix UI primitives

### Trading Features
- **Dashboard**: Overview of trading performance with key metrics
- **Trade Entry**: Form-based trade recording with validation
- **Analytics**: Advanced filtering and analysis of trading data
- **Journal**: Trading diary for reflections and notes
- **Profile**: User settings and trading preferences

### Data Models
- **Users**: Basic user information with username/password authentication
- **Trades**: Trade data structure ready for implementation
- **Extensible Schema**: Drizzle schema setup for easy model additions

## Data Flow

1. **Authentication Flow**: User logs in → Context updates → Protected routes accessible
2. **Trade Data Flow**: Form submission → Validation → Storage interface → Database
3. **Analytics Flow**: Filters applied → Data queried → Charts rendered → Insights displayed
4. **Real-time Updates**: TanStack Query manages server state with optimistic updates

## External Dependencies

### Core Dependencies
- **UI Framework**: React ecosystem with TypeScript support
- **Styling**: Tailwind CSS with PostCSS for processing
- **Forms**: React Hook Form with Zod resolvers for validation
- **Date Handling**: date-fns for date manipulation
- **Charts**: Ready for chart library integration (placeholders in place)

### Development Dependencies
- **Build Tools**: Vite for frontend, esbuild for backend
- **Development Server**: Hot reload with Vite middleware
- **Database Tools**: Drizzle Kit for migrations and schema management
- **Type Safety**: Full TypeScript coverage across frontend and backend

### Infrastructure
- **Session Management**: connect-pg-simple for PostgreSQL session store
- **Database Connection**: Neon serverless PostgreSQL driver
- **Environment**: Configured for Replit deployment with specific plugins

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot reload
- **Database**: In-memory storage for development (MemStorage class)
- **Asset Handling**: Vite handles all frontend assets and bundling

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves frontend assets in production

### Database Deployment
- **Schema Management**: Drizzle migrations in `migrations/` directory
- **Environment Variables**: `DATABASE_URL` required for PostgreSQL connection
- **Storage Interface**: Abstracted storage layer allows easy switching between implementations

### Replit-Specific Features
- **Error Handling**: Runtime error overlay for development
- **Cartographer**: Replit's code mapping tool integration
- **Development Banner**: Automatic Replit branding for external access

The application follows a monorepo structure with clear separation between client, server, and shared code. The storage layer is abstracted to allow easy migration from in-memory storage to PostgreSQL as the application scales.