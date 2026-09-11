/**
 * Compara o schema definido no código (shared/schema.ts) com o que existe de
 * fato no banco e imprime o que está faltando.
 *
 * Rodar com:  node dist/check-schema.js
 *
 * Existe porque o banco de produção ficou várias versões atrás do código:
 * bankroll_managements ainda tinha colunas em português de uma geração
 * anterior do app, e diary_images também. Cada uma dessas divergências vira
 * um erro 500 em runtime ("column X does not exist"), então vale conferir
 * todas de uma vez em vez de descobrir uma a uma pelos relatos de usuário.
 */
import { getTableConfig } from "drizzle-orm/pg-core";
import { db } from "./db";
import { sql } from "drizzle-orm";
import * as schema from "@shared/schema";

type Faltante = { tabela: string; coluna: string; tipo: string; notNull: boolean };

async function main() {
  const tabelasDoCodigo = Object.values(schema).filter(
    (v: any) => v && typeof v === "object" && getTableConfigSafe(v)
  );

  const existentes = await db.execute(sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `);

  const porTabela = new Map<string, Set<string>>();
  for (const row of existentes.rows as any[]) {
    const t = String(row.table_name);
    if (!porTabela.has(t)) porTabela.set(t, new Set());
    porTabela.get(t)!.add(String(row.column_name));
  }

  const faltantes: Faltante[] = [];
  const tabelasAusentes: string[] = [];

  for (const tabela of tabelasDoCodigo) {
    const cfg = getTableConfigSafe(tabela);
    if (!cfg) continue;

    const colunasNoBanco = porTabela.get(cfg.name);
    if (!colunasNoBanco) {
      tabelasAusentes.push(cfg.name);
      continue;
    }

    for (const coluna of cfg.columns) {
      if (!colunasNoBanco.has(coluna.name)) {
        faltantes.push({
          tabela: cfg.name,
          coluna: coluna.name,
          tipo: coluna.getSQLType(),
          notNull: coluna.notNull,
        });
      }
    }
  }

  console.log("\n================ DIAGNÓSTICO DE SCHEMA ================\n");

  if (tabelasAusentes.length) {
    console.log("TABELAS QUE NÃO EXISTEM NO BANCO:");
    for (const t of tabelasAusentes) console.log(`  - ${t}`);
    console.log("");
  }

  if (!faltantes.length) {
    console.log("Nenhuma coluna faltando. Banco alinhado com o código.\n");
  } else {
    console.log("COLUNAS FALTANDO:\n");
    let atual = "";
    for (const f of faltantes) {
      if (f.tabela !== atual) {
        atual = f.tabela;
        console.log(`  ${atual}:`);
      }
      console.log(`    - ${f.coluna} (${f.tipo})${f.notNull ? " NOT NULL" : ""}`);
    }

    console.log("\n-------- SQL PARA CORRIGIR --------\n");
    atual = "";
    for (const f of faltantes) {
      if (f.tabela !== atual) {
        atual = f.tabela;
        console.log(`ALTER TABLE ${atual}`);
      }
      // Sempre nullable: a tabela pode ter linhas antigas, e o código
      // preenche esses campos em todo insert.
      console.log(`  ADD COLUMN IF NOT EXISTS ${f.coluna} ${f.tipo},`);
    }
    console.log("  -- remova a última vírgula antes de rodar\n");
  }

  console.log("=======================================================\n");
  process.exit(0);
}

function getTableConfigSafe(t: any) {
  try {
    const cfg = getTableConfig(t);
    return cfg?.name ? cfg : null;
  } catch {
    return null;
  }
}

main().catch((e) => {
  console.error("Erro no diagnóstico:", e);
  process.exit(1);
});
