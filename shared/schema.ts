import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: varchar("phone"),
  capitalInicial: decimal("capital_inicial", { precision: 12, scale: 2 }).default("0"),
  metaMensal: decimal("meta_mensal", { precision: 5, scale: 2 }).default("5"),
  perfilRisco: text("perfil_risco").default("moderado"),
  planType: text("plan_type").default("starter"), // "starter", "pro", "black"
  planExpiresAt: timestamp("plan_expires_at"),
  isActive: boolean("is_active").default(true),
  role: text("role").default("user"), // "user", "admin"
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  dataHora: timestamp("data_hora").notNull(),
  ativo: text("ativo").notNull(),
  mercado: text("mercado").notNull(), // "crypto", "forex", "b3"
  setup: text("setup"),
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
  corretora: text("corretora").notNull(), // "crypto", "forex", "b3"
  status: text("status").default("fechado"), // "aberto", "fechado"
  origem: text("origem").default("manual"), // "manual", "csv", "api"
  externalId: text("external_id"), // ID da API externa
  csvImportId: varchar("csv_import_id").references(() => csvImports.id), // Vinculação com CSV importado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para configurações de API das corretoras
export const brokerApiConfigs = pgTable("broker_api_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  broker: text("broker").notNull(), // "crypto", "forex", "b3"
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  isActive: boolean("is_active").default(false),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para histórico de importações CSV
export const csvImports = pgTable("csv_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  broker: text("broker").notNull(),
  fileName: text("file_name").notNull(),
  displayName: text("display_name"), // Nome personalizado para o CSV
  tradesImported: integer("trades_imported").notNull(),
  tradesSkipped: integer("trades_skipped").default(0),
  status: text("status").default("completed"), // "processing", "completed", "failed"
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para planos de assinatura
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Free", "Premium", "VIP"
  type: text("type").notNull().unique(), // "free", "premium", "vip"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("BRL"),
  billingCycle: text("billing_cycle").default("monthly"), // "monthly", "yearly"
  features: text("features").array(), // Array de features disponíveis
  maxTrades: integer("max_trades"), // Limite de trades por mês (null = ilimitado)
  maxCsvImports: integer("max_csv_imports"), // Limite de importações CSV por mês
  hasApiAccess: boolean("has_api_access").default(false),
  hasAdvancedAnalytics: boolean("has_advanced_analytics").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para histórico de pagamentos/assinaturas
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull(), // "active", "cancelled", "expired", "pending"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"), // "pix", "credit_card", "bank_slip"
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para estatísticas da plataforma
export const platformStats = pgTable("platform_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  totalUsers: integer("total_users").notNull(),
  activeUsers: integer("active_users").notNull(),
  newUsers: integer("new_users").notNull(),
  totalTrades: integer("total_trades").notNull(),
  monthlyRevenue: decimal("monthly_revenue", { precision: 12, scale: 2 }).notNull(),
  freeUsers: integer("free_users").notNull(),
  premiumUsers: integer("premium_users").notNull(),
  vipUsers: integer("vip_users").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para entradas do diário de trading
export const diaryEntries = pgTable("diary_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(), // Data específica da entrada
  title: text("title").notNull(),
  content: text("content").notNull(),
  emotion: text("emotion"), // emoção do dia
  trades: integer("trades").default(0), // número de trades do dia
  pnl: decimal("pnl", { precision: 12, scale: 2 }).default("0"), // P&L do dia
  winRate: decimal("win_rate", { precision: 5, scale: 2 }), // taxa de acerto do dia
  lessons: text("lessons"), // lições aprendidas
  improvements: text("improvements"), // melhorias para próximas sessões
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para imagens do diário
export const diaryImages = pgTable("diary_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  diaryEntryId: varchar("diary_entry_id").notNull().references(() => diaryEntries.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(), // Caminho no object storage
  fileSize: integer("file_size").notNull(), // Tamanho do arquivo em bytes
  mimeType: text("mime_type").notNull(), // tipo MIME (image/jpeg, image/png, etc)
  caption: text("caption"), // legenda da imagem
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
  phone: true,
}).extend({
  email: z.string().email("Email deve ser válido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"]
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string().optional(), // Make optional for external use
  dataHora: z.string().min(1, "Data e hora são obrigatórias"),
  ativo: z.string().min(1, "Ativo é obrigatório"),
  mercado: z.enum(["crypto", "forex", "b3"], { message: "Mercado deve ser crypto, forex ou b3" }),
  setup: z.string().optional(),
  // Simplified fields - removed required validations for removed fields
  capitalUtilizado: z.string().optional(),
  quantidade: z.string().optional(), 
  tipo: z.enum(["compra", "venda"], { message: "Tipo deve ser compra ou venda" }),
  stop: z.string().optional(), // Stop Loss (valor de perda)
  alvo: z.string().optional(), // Take Profit
  resultado: z.string().optional(), // Result
  risco: z.string().optional(),
  comentario: z.string().optional(),
  precoEntrada: z.string().optional(),
  precoSaida: z.string().optional(),
  corretora: z.enum(["crypto", "forex", "b3", "auto"], { message: "Corretora deve ser crypto, forex, b3 ou auto" }),
  emocao: z.enum(["confiante", "ansioso", "impulsivo", "calmo", "eufórico", "frustrado", "neutro"], { 
    message: "Emoção deve ser uma das opções disponíveis" 
  }).optional(),
});

// Schema para configuração de API
export const insertBrokerApiConfigSchema = createInsertSchema(brokerApiConfigs).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  broker: z.enum(["crypto", "forex", "b3", "auto"], { message: "Corretora deve ser crypto, forex, b3 ou auto" }),
  apiKey: z.string().min(1, "API Key é obrigatória"),
  apiSecret: z.string().min(1, "API Secret é obrigatório"),
});

// Schema para importação CSV
export const csvImportSchema = z.object({
  broker: z.enum(["crypto", "forex", "b3", "auto"], { message: "Corretora deve ser crypto, forex, b3 ou auto" }),
  file: z.any(), // File object
});

// Schema para atualizar nome do CSV
export const updateCsvImportSchema = z.object({
  displayName: z.string().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;
export type BrokerApiConfig = typeof brokerApiConfigs.$inferSelect;
export type InsertBrokerApiConfig = z.infer<typeof insertBrokerApiConfigSchema>;
export type CsvImport = typeof csvImports.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type PlatformStats = typeof platformStats.$inferSelect;

// Schema para criação de plano
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema para atualização de usuário pelo admin
export const updateUserByAdminSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  planType: z.enum(["starter", "pro", "black"]).optional(),
  isActive: z.boolean().optional(),
  planExpiresAt: z.string().optional(),
});

// Schema para entradas do diário
export const insertDiaryEntrySchema = createInsertSchema(diaryEntries).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().min(1, "Data é obrigatória"),
  title: z.string().min(1, "Título é obrigatório").max(100, "Título deve ter no máximo 100 caracteres"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  emotion: z.enum(["confiante", "ansioso", "impulsivo", "calmo", "eufórico", "frustrado", "neutro"]).optional(),
  trades: z.number().min(0, "Número de trades deve ser positivo").optional(),
  pnl: z.string().optional(),
  winRate: z.string().optional(),
  lessons: z.string().optional(),
  improvements: z.string().optional(),
});

// Schema para imagens do diário
export const insertDiaryImageSchema = createInsertSchema(diaryImages).omit({
  id: true,
  createdAt: true,
}).extend({
  caption: z.string().optional(),
});

// Schema para usuários atualizarem seu próprio perfil
export const updateProfileSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").optional(),
  email: z.string().email("Email deve ser válido").optional(),
  telefone: z.string().optional(),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});

export type UpdateUserByAdmin = z.infer<typeof updateUserByAdminSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UpdateCsvImport = z.infer<typeof updateCsvImportSchema>;
export type InsertDiaryEntry = z.infer<typeof insertDiaryEntrySchema>;
export type DiaryEntry = typeof diaryEntries.$inferSelect;
export type InsertDiaryImage = z.infer<typeof insertDiaryImageSchema>;
export type DiaryImage = typeof diaryImages.$inferSelect;

// Relações do Drizzle ORM
import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many, one }) => ({
  trades: many(trades),
  diaryEntries: many(diaryEntries),
  brokerApiConfigs: many(brokerApiConfigs),
  csvImports: many(csvImports),
  subscriptions: many(subscriptions),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  user: one(users, {
    fields: [trades.userId],
    references: [users.id],
  }),
}));

export const brokerApiConfigsRelations = relations(brokerApiConfigs, ({ one }) => ({
  user: one(users, {
    fields: [brokerApiConfigs.userId],
    references: [users.id],
  }),
}));

export const csvImportsRelations = relations(csvImports, ({ one }) => ({
  user: one(users, {
    fields: [csvImports.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const diaryEntriesRelations = relations(diaryEntries, ({ one, many }) => ({
  user: one(users, {
    fields: [diaryEntries.userId],
    references: [users.id],
  }),
  images: many(diaryImages),
}));

export const diaryImagesRelations = relations(diaryImages, ({ one }) => ({
  diaryEntry: one(diaryEntries, {
    fields: [diaryImages.diaryEntryId],
    references: [diaryEntries.id],
  }),
}));

// Tabela de tokens de recuperação de senha
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
