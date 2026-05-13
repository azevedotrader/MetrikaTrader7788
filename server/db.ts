import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url || url.trim() === '') {
    console.error('\n⚠️  DATABASE_URL environment variable is not set!');
    throw new Error(
      "DATABASE_URL must be set.",
    );
  }

  return url;
}

let _db: ReturnType<typeof drizzle> | null = null;

function initDb() {
  if (_db) return _db;

  const url = getDatabaseUrl();
  const pool = new Pool({ connectionString: url, ssl: false });
  _db = drizzle(pool, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const instance = initDb();
    return (instance as any)[prop];
  }
});
