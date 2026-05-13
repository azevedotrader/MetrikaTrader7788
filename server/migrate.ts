import { db } from './db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT,
        phone VARCHAR,
        whatsapp_number VARCHAR,
        google_id TEXT,
        profile_photo TEXT,
        capital_inicial DECIMAL(12,2) DEFAULT 0,
        meta_mensal DECIMAL(5,2) DEFAULT 5,
        perfil_risco TEXT DEFAULT 'moderado',
        plan_type TEXT DEFAULT 'free',
        plan_expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        role TEXT DEFAULT 'user',
        last_login_at TIMESTAMP,
        force_logout_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS wallets (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#8B5CF6',
        icon TEXT DEFAULT 'wallet',
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Patch: add is_default column if table was created before this migration
      ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
      -- Patch: remove old columns that are no longer in the schema (safe - ignore errors)
      ALTER TABLE wallets DROP COLUMN IF EXISTS currency;
      ALTER TABLE wallets DROP COLUMN IF EXISTS initial_balance;
      ALTER TABLE wallets DROP COLUMN IF EXISTS is_active;

      CREATE TABLE IF NOT EXISTS csv_imports (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        broker TEXT NOT NULL,
        file_name TEXT NOT NULL,
        display_name TEXT,
        trades_imported INTEGER NOT NULL,
        trades_skipped INTEGER DEFAULT 0,
        status TEXT DEFAULT 'completed',
        error_message TEXT,
        wallet_id VARCHAR,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS trades (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        data_hora TIMESTAMP NOT NULL,
        ativo TEXT NOT NULL,
        mercado TEXT NOT NULL,
        setup TEXT,
        capital_utilizado DECIMAL(12,2) NOT NULL,
        stop DECIMAL(12,4),
        alvo DECIMAL(12,4),
        resultado DECIMAL(12,2),
        quantidade DECIMAL(12,4) NOT NULL,
        risco DECIMAL(5,2),
        tipo TEXT NOT NULL,
        comentario TEXT,
        emocao TEXT,
        preco_entrada DECIMAL(12,4),
        preco_saida DECIMAL(12,4),
        corretora TEXT NOT NULL,
        status TEXT DEFAULT 'fechado',
        origem TEXT DEFAULT 'manual',
        external_id TEXT,
        csv_import_id VARCHAR REFERENCES csv_imports(id),
        wallet_id VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS broker_api_configs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        broker TEXT NOT NULL,
        api_key TEXT,
        api_secret TEXT,
        is_active BOOLEAN DEFAULT false,
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscription_plans (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        type TEXT NOT NULL UNIQUE,
        price DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'BRL',
        billing_cycle TEXT DEFAULT 'monthly',
        features TEXT[],
        max_trades INTEGER,
        max_csv_imports INTEGER,
        has_api_access BOOLEAN DEFAULT false,
        has_advanced_analytics BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        plan_id VARCHAR NOT NULL REFERENCES subscription_plans(id),
        status TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        payment_method TEXT,
        transaction_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS platform_stats (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        date TIMESTAMP NOT NULL,
        total_users INTEGER NOT NULL,
        active_users INTEGER NOT NULL,
        new_users INTEGER NOT NULL,
        total_trades INTEGER NOT NULL,
        monthly_revenue DECIMAL(12,2) NOT NULL,
        free_users INTEGER NOT NULL,
        premium_users INTEGER NOT NULL,
        vip_users INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS diary_entries (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        title TEXT,
        content TEXT,
        mood TEXT,
        trade_id VARCHAR REFERENCES trades(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS diary_images (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        diary_entry_id VARCHAR NOT NULL REFERENCES diary_entries(id),
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_conversations (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        subject TEXT,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS support_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id VARCHAR NOT NULL REFERENCES support_conversations(id),
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR REFERENCES users(id),
        phone VARCHAR,
        direction TEXT NOT NULL,
        content TEXT,
        status TEXT DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS questionnaire_states (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        step INTEGER DEFAULT 0,
        answers JSONB,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bankroll_managements (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        capital DECIMAL(12,2),
        risco_por_trade DECIMAL(5,2),
        meta_diaria DECIMAL(5,2),
        meta_mensal DECIMAL(5,2),
        max_drawdown DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database migrations completed successfully');
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
  }

  // Seed admin user if not exists
  try {
    const existing = await db.execute(sql`SELECT id FROM users WHERE email = 'admin@metrika.com.br' LIMIT 1`);
    if (!existing.rows.length) {
      const hashed = await bcrypt.hash('Metrika@2024!', 10);
      await db.execute(sql`
        INSERT INTO users (id, name, email, password, role, plan_type, is_active)
        VALUES (gen_random_uuid(), 'Administrador', 'admin@metrika.com.br', ${hashed}, 'admin', 'free', true)
      `);
      console.log('✅ Admin user created: admin@metrika.com.br');
    }
  } catch (e: any) {
    console.error('❌ Admin seed error:', e.message);
  }
}
