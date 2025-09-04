import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import fs from "fs";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Função para obter DATABASE_URL seguindo as práticas do Replit
function getDatabaseUrl(): string {
  // No deploy, Replit armazena DATABASE_URL em /tmp/replitdb
  try {
    const replitDbPath = '/tmp/replitdb';
    if (fs.existsSync(replitDbPath)) {
      const dbUrl = fs.readFileSync(replitDbPath, 'utf8').trim();
      if (dbUrl) {
        console.log('🗄️ Usando DATABASE_URL do arquivo de deploy:', replitDbPath);
        return dbUrl;
      }
    }
  } catch (error) {
    console.log('⚠️ Não foi possível ler /tmp/replitdb, usando variável de ambiente');
  }
  
  // Fallback para variável de ambiente (desenvolvimento)
  if (process.env.DATABASE_URL) {
    console.log('🗄️ Usando DATABASE_URL da variável de ambiente');
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const databaseUrl = getDatabaseUrl();
export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });