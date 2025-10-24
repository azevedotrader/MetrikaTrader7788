import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

// Use HTTP fetch instead of WebSocket for better stability in serverless environments
neonConfig.fetchConnectionCache = true;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  
  if (!url || url.trim() === '') {
    console.error('\n⚠️  DATABASE_URL environment variable is not set!');
    console.error('This usually means:');
    console.error('1. The database secrets are not loaded into the environment');
    console.error('2. The Replit environment needs to be restarted');
    console.error('3. Or the database was provisioned but secrets were not exported\n');
    throw new Error(
      "DATABASE_URL must be set. The database is provisioned but the environment variable is not accessible.",
    );
  }
  
  return url;
}

let _db: ReturnType<typeof drizzle> | null = null;

function initDb() {
  if (_db) return _db;
  
  const url = getDatabaseUrl();
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const instance = initDb();
    return (instance as any)[prop];
  }
});