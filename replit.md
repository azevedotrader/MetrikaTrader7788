# Trading Analytics Platform (Métrika)

## Overview

Métrika is a comprehensive, full-stack web application designed for traders to track performance, analyze trades, maintain a trading journal, and visualize progress through key metrics and charts. The platform aims to provide a unified analytical view across multiple brokers, supporting both manual entries, CSV imports, and automated API synchronizations. It includes advanced features like real-time charting, AI-driven CSV analysis, and a professional landing page for marketing.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2025)

### Integração WhatsApp Business API - Janeiro 2025
- **WhatsApp Bot Completo**: ✅ Sistema de salvamento de trades via WhatsApp implementado
- **Parser Inteligente**: ✅ Extração automática de dados de trades de mensagens em linguagem natural
- **Respostas Automáticas**: ✅ Bot responde com confirmações, ajuda e exemplos
- **Comandos Disponíveis**: "ajuda", "exemplo", saudações
- **Webhook Configurado**: ✅ Endpoint `/webhooks/whatsapp` recebe mensagens do Meta/Facebook
- **Secrets Configurados**: WHATSAPP_ACCESS_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_VERIFY_TOKEN
- **Interface Usuário**: ✅ Campo no perfil para configurar número do WhatsApp
- **Banco de Dados**: ✅ Tabela `whatsapp_messages` para rastrear todas as mensagens e processamento

### Integração OpenAI e SendGrid Ativada - Janeiro 2025
- **OpenAI GPT-5**: ✅ Integrado e funcionando (modelo mais recente)
- **SendGrid**: ✅ Configurado para emails (boas-vindas, recuperação de senha)
- **Análise IA**: Sistema de análise de trades com GPT-5
- **Emails Automáticos**: Welcome emails e password reset funcionais
- **Chaves API**: OPENAI_API_KEY e SENDGRID_API_KEY configuradas

### Sistema de Suporte Admin Completo - Janeiro 2025
- **Conversas Resolvidas**: ✅ Admin pode marcar conversas como "resolvidas"
- **Filtro Admin**: ✅ Conversas resolvidas desaparecem automaticamente da lista do admin
- **Bloqueio de Mensagens**: ✅ Usuários não podem enviar mais mensagens em conversas resolvidas
- **Visibilidade Usuário**: ✅ Conversas resolvidas permanecem visíveis para o usuário
- **Interface Amigável**: ✅ Banner verde mostra "Problema Resolvido" e sugere criar novo suporte
- **Tratamento de Erros**: ✅ Mensagem amigável em caso de tentativa de envio em conversa resolvida
- **UX Melhorada**: ✅ Campo de mensagem desabilitado com placeholder explicativo

### Sistema Colaborativo ChatGPT + Tradicional - ACEITA QUALQUER FORMATO
- **Status**: Sistema híbrido ultra-flexível para análise de qualquer tipo de CSV
- **Nova Abordagem Colaborativa**: 
  - ChatGPT + Sistema Tradicional trabalham juntos
  - Se ChatGPT não encontra dados, sistema tradicional sempre tenta
  - Modo ultra-flexível: interpreta até dados de estatísticas como trades
  - Aceita qualquer formato, mesmo arquivos de performance/relatórios
- **Melhorias Implementadas (Janeiro 2025)**: 
  - Sistema colaborativo: ambos métodos sempre tentam extrair dados
  - Modo flexível: converte estatísticas em trades quando possível
  - Análise completa para arquivos até 800 linhas (antes 500)
  - Prompt melhorado: foco em extrair TODOS os trades linha por linha
  - Sistema tradicional ultra-permissivo: aceita dados não-tradicionais

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
- **Database**: PostgreSQL (configured and running)
- **Migrations**: Drizzle Kit
- **Status**: ✅ Database created and all tables deployed successfully
- **Deploy Status**: ✅ **PRONTO PARA DEPLOY** - Banco completamente configurado
- **Tables**: 
  - Users (complete user management with profiles, plans, authentication)
  - Trades (multi-broker trade tracking with detailed analytics)
  - Broker API Configs (API credentials management)
  - CSV Imports (import history tracking)
  - Subscription Plans (plan management system)
  - Subscriptions (user subscription tracking)
  - Platform Stats (analytics and metrics)
  - Password Reset Tokens (recuperação de senha)
  - Diary Entries (diário de trading)
- **Admin System**: ✅ Usuário admin criado (admin@metrika.com.br)
- **Initial Data**: ✅ Planos de assinatura configurados (Starter, Pro, Black)
- **Multi-broker Support**: Data segregated for Crypto, Forex, B3 markets, supporting manual, CSV, and API origins.
- **Production Ready**: Same database used for development and production deployment

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