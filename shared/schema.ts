import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer } from "drizzle-orm/pg-core";
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
  dataHora: timestamp("data_hora").notNull(),
  ativo: text("ativo").notNull(),
  mercado: text("mercado").notNull(), // "crypto", "forex", "b3"
  setup: text("setup").notNull(),
  capitalUtilizado: decimal("capital_utilizado", { precision: 12, scale: 2 }).notNull(),
  stop: decimal("stop", { precision: 12, scale: 4 }),
  alvo: decimal("alvo", { precision: 12, scale: 4 }),
  resultado: decimal("resultado", { precision: 12, scale: 2 }),
  quantidade: decimal("quantidade", { precision: 12, scale: 4 }).notNull(),
  risco: decimal("risco", { precision: 5, scale: 2 }), // % do capital
  tipo: text("tipo").notNull(), // "compra" ou "venda"
  comentario: text("comentario"),
  emocao: text("emocao"), // "confiante", "ansioso", "impulsivo", etc.
  precoEntrada: decimal("preco_entrada", { precision: 12, scale: 4 }),
  precoSaida: decimal("preco_saida", { precision: 12, scale: 4 }),
  corretora: text("corretora"), // "tickmill", "clear", "gate.io"
  status: text("status").default("fechado"), // "aberto", "fechado"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dataHora: z.string().min(1, "Data e hora são obrigatórias"),
  ativo: z.string().min(1, "Ativo é obrigatório"),
  mercado: z.enum(["crypto", "forex", "b3"], { message: "Mercado deve ser crypto, forex ou b3" }),
  setup: z.string().min(1, "Setup é obrigatório"),
  capitalUtilizado: z.string().min(1, "Capital utilizado é obrigatório"),
  quantidade: z.string().min(1, "Quantidade é obrigatória"),
  tipo: z.enum(["compra", "venda"], { message: "Tipo deve ser compra ou venda" }),
  stop: z.string().optional(),
  alvo: z.string().optional(),
  resultado: z.string().optional(),
  risco: z.string().optional(),
  comentario: z.string().optional(),
  precoEntrada: z.string().optional(),
  precoSaida: z.string().optional(),
  corretora: z.string().optional(),
  emocao: z.enum(["confiante", "ansioso", "impulsivo", "calmo", "eufórico", "frustrado", "neutro"], { 
    message: "Emoção deve ser uma das opções disponíveis" 
  }).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
