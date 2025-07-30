import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  capitalInicial: decimal("capital_inicial", { precision: 12, scale: 2 }).default("0"),
  metaMensal: decimal("meta_mensal", { precision: 5, scale: 2 }).default("5"),
  perfilRisco: text("perfil_risco").default("moderado"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  ativo: text("ativo").notNull(),
  tipo: text("tipo").notNull(), // "compra" ou "venda"
  quantidade: decimal("quantidade", { precision: 12, scale: 2 }).notNull(),
  precoEntrada: decimal("preco_entrada", { precision: 12, scale: 4 }).notNull(),
  precoSaida: decimal("preco_saida", { precision: 12, scale: 4 }),
  setup: text("setup"),
  observacoes: text("observacoes"),
  resultado: decimal("resultado", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
}).extend({
  email: z.string().email("Email deve ser válido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"]
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  ativo: true,
  tipo: true,
  quantidade: true,
  precoEntrada: true,
  precoSaida: true,
  setup: true,
  observacoes: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
