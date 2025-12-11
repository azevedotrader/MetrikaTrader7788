import { 
  users, 
  trades, 
  brokerApiConfigs, 
  csvImports,
  subscriptionPlans,
  subscriptions,
  platformStats,
  diaryEntries,
  diaryImages,
  passwordResetTokens,
  supportConversations,
  supportMessages,
  questionnaireStates,
  wallets,
  type User, 
  type InsertUser, 
  type Trade, 
  type InsertTrade,
  type BrokerApiConfig,
  type InsertBrokerApiConfig,
  type CsvImport,
  type SubscriptionPlan,
  type Subscription,
  type PlatformStats,
  type UpdateUserByAdmin,
  type UpdateProfile,
  type InsertSubscriptionPlan,
  type DiaryEntry,
  type InsertDiaryEntry,
  type DiaryImage,
  type InsertDiaryImage,
  type PasswordResetToken,
  type SupportConversation,
  type InsertSupportConversation,
  type SupportMessage,
  type InsertSupportMessage,
  type BankrollManagement,
  type InsertBankrollManagement,
  type BankrollSummaryDTO,
  type QuestionnaireState,
  type InsertQuestionnaireState,
  type Wallet,
  type InsertWallet,
  bankrollManagements,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, gte, lte, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  setForceLogout(userId: string): Promise<void>; // Força logout invalidando sessões
  
  // Trade operations - SEMPRE requerem userId para isolamento
  getTrades(userId: string, broker?: string): Promise<Trade[]>;
  getTradesByBroker(broker: string, userId?: string): Promise<Trade[]>;
  getAllTrades(userId?: string): Promise<Trade[]>; // Para admin
  createTrade(insertTrade: InsertTrade): Promise<Trade>;
  createBulkTrades(trades: InsertTrade[]): Promise<Trade[]>;
  updateTrade(id: string, updates: Partial<InsertTrade> & { userId?: string }): Promise<Trade>;
  deleteTrade(id: string, userId?: string): Promise<void>;
  deleteAllTrades(userId: string): Promise<void>;
  
  // Broker API config operations
  getBrokerApiConfig(userId: string, broker: string): Promise<BrokerApiConfig | undefined>;
  getAllBrokerApiConfigs(userId: string): Promise<BrokerApiConfig[]>;
  createOrUpdateBrokerApiConfig(config: InsertBrokerApiConfig & { userId: string }): Promise<BrokerApiConfig>;
  deleteAllBrokerConfigs(userId: string): Promise<void>;
  
  // CSV import operations
  getCsvImports(userId: string): Promise<CsvImport[]>;
  createCsvImport(csvImport: Omit<CsvImport, 'id' | 'createdAt'>): Promise<CsvImport>;
  deleteAllCsvImports(userId: string): Promise<void>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  updateUserByAdmin(id: string, updates: UpdateUserByAdmin): Promise<User>;
  updateProfile(id: string, updates: UpdateProfile): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Subscription plan operations
  getAllPlans(): Promise<SubscriptionPlan[]>;
  createPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updatePlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  deletePlan(id: string): Promise<void>;
  
  // Platform statistics
  getPlatformStats(): Promise<PlatformStats | undefined>;
  updatePlatformStats(stats: Omit<PlatformStats, 'id' | 'createdAt'>): Promise<PlatformStats>;
  
  // User subscriptions
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription>;
  
  // Diary operations
  getDiaryEntries(userId: string): Promise<DiaryEntry[]>;
  getDiaryEntry(id: string, userId: string): Promise<DiaryEntry | undefined>;
  getDiaryEntriesByDate(userId: string, date: string): Promise<DiaryEntry[]>;
  createDiaryEntry(entry: InsertDiaryEntry & { userId: string }): Promise<DiaryEntry>;
  updateDiaryEntry(id: string, updates: Partial<InsertDiaryEntry>, userId: string): Promise<DiaryEntry>;
  deleteDiaryEntry(id: string, userId: string): Promise<void>;
  
  // Diary images operations
  getDiaryImages(diaryEntryId: string): Promise<DiaryImage[]>;
  createDiaryImage(image: InsertDiaryImage): Promise<DiaryImage>;
  deleteDiaryImage(imageId: string, diaryEntryId: string): Promise<void>;
  getDiaryImage(imageId: string): Promise<DiaryImage | undefined>;
  
  // Password reset operations
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, newPassword: string): Promise<void>;

  // Free user limits
  checkFreeUserLimits(userId: string): Promise<{ csvImports: number; manualTrades: number; total: number; limitReached: boolean }>;
  
  // Login tracking
  updateLastLogin(userId: string): Promise<User>;
  
  // Bankroll management operations
  getBankrollManagement(userId: string): Promise<BankrollManagement | undefined>;
  createBankrollManagement(data: InsertBankrollManagement): Promise<BankrollManagement>;
  updateBankrollManagement(userId: string, updates: Partial<InsertBankrollManagement>): Promise<BankrollManagement>;
  deleteBankrollManagement(userId: string): Promise<void>;
  adjustBankrollManagement(userId: string, adjustmentData: { consecutiveWins?: number; consecutiveLosses?: number }): Promise<BankrollManagement>;
  
  // Questionnaire state operations (para fluxo conversacional WhatsApp)
  getQuestionnaireState(userId: string): Promise<QuestionnaireState | undefined>;
  createQuestionnaireState(data: Omit<InsertQuestionnaireState, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionnaireState>;
  updateQuestionnaireState(userId: string, updates: Partial<InsertQuestionnaireState>): Promise<QuestionnaireState>;
  deleteQuestionnaireState(userId: string): Promise<void>;
  
  // Wallet operations (carteiras customizadas)
  getWallets(userId: string): Promise<Wallet[]>;
  getWallet(id: string, userId: string): Promise<Wallet | undefined>;
  createWallet(data: InsertWallet & { userId: string }): Promise<Wallet>;
  updateWallet(id: string, updates: Partial<InsertWallet>, userId: string): Promise<Wallet>;
  deleteWallet(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async setForceLogout(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ forceLogoutAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getTrades(userId: string, broker?: string): Promise<Trade[]> {
    // Isolamento obrigatório por userId
    if (!userId) {
      throw new Error("userId é obrigatório para acessar trades");
    }
    
    if (broker) {
      return await db.select().from(trades).where(
        and(eq(trades.userId, userId), eq(trades.corretora, broker))
      ).orderBy(desc(trades.dataHora));
    }
    
    return await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.dataHora));
  }

  async getTradesByBroker(broker: string, userId?: string): Promise<Trade[]> {
    // Se userId fornecido, filtrar também por usuário
    if (userId) {
      return await db.select().from(trades).where(
        and(eq(trades.corretora, broker), eq(trades.userId, userId))
      ).orderBy(desc(trades.dataHora));
    }
    
    // Sem userId é função admin - retorna todos
    return await db.select().from(trades).where(eq(trades.corretora, broker)).orderBy(desc(trades.dataHora));
  }

  async getAllTrades(userId?: string): Promise<Trade[]> {
    // Se userId fornecido, filtrar por usuário específico
    if (userId) {
      return await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.dataHora));
    }
    
    // Sem userId é função admin - retorna todos
    return await db.select().from(trades).orderBy(desc(trades.dataHora));
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    // Validação obrigatória de userId - não permitir undefined
    if (!insertTrade.userId) {
      throw new Error("userId é obrigatório para isolamento de dados");
    }
    
    // Validar e limitar valores numéricos
    const validateDecimal = (value: string | undefined, max: number, defaultValue: string = "0"): string => {
      if (!value) return defaultValue;
      const num = parseFloat(value);
      if (isNaN(num)) return defaultValue;
      return Math.max(Math.min(num, max), -max).toFixed(num > 1000 ? 2 : 4);
    };
    
    const tradeData: any = {
      ...insertTrade,
      userId: insertTrade.userId, // Ensure userId is string
      dataHora: new Date(insertTrade.dataHora.includes('T') && !insertTrade.dataHora.includes('Z') ? insertTrade.dataHora + ':00.000Z' : insertTrade.dataHora),
      // Limitar valores para evitar erros de precisão
      capitalUtilizado: validateDecimal(insertTrade.capitalUtilizado, 9999999999.99, "0"),
      quantidade: validateDecimal(insertTrade.quantidade, 9999.9999, "1"),
      resultado: validateDecimal(insertTrade.resultado, 9999999999.99, "0"),
      precoEntrada: validateDecimal(insertTrade.precoEntrada, 99999999.9999, "0"),
      precoSaida: validateDecimal(insertTrade.precoSaida, 99999999.9999, "0"),
      stop: validateDecimal(insertTrade.stop, 99999999.9999, "0"),
      alvo: validateDecimal(insertTrade.alvo, 99999999.9999, "0"),
      risco: validateDecimal(insertTrade.risco, 99.99, "0")
    };
    
    console.log(`💾 [${insertTrade.userId}] Criando trade individual: ${insertTrade.ativo}`);
    
    const [trade] = await db
      .insert(trades)
      .values(tradeData)
      .returning();
    return trade;
  }

  async createBulkTrades(tradesData: InsertTrade[], csvImportId?: string): Promise<Trade[]> {
    // Validação de userId em lote - todos os trades devem ter o mesmo userId
    const userIds = Array.from(new Set(tradesData.map(t => t.userId).filter(Boolean)));
    if (userIds.length !== 1) {
      throw new Error("Todos os trades devem ter o mesmo userId válido para isolamento");
    }
    
    const processedTrades = tradesData.map(trade => {
      // Validar e limitar valores numéricos para evitar erros de precisão no banco
      const validateDecimal = (value: string | undefined, max: number, defaultValue: string = "0"): string => {
        if (!value) return defaultValue;
        const num = parseFloat(value);
        if (isNaN(num)) return defaultValue;
        return Math.max(Math.min(num, max), -max).toFixed(num > 1000 ? 2 : 4);
      };
      
      return {
        ...trade,
        userId: trade.userId!,
        dataHora: new Date(trade.dataHora),
        csvImportId, // Adicionar o ID do CSV import
        // Limitar valores para decimal(12,2) - máximo: 9.999.999.999,99
        capitalUtilizado: validateDecimal(trade.capitalUtilizado, 9999999999.99, "0"),
        quantidade: validateDecimal(trade.quantidade, 9999.9999, "1"),
        resultado: validateDecimal(trade.resultado, 9999999999.99, "0"),
        precoEntrada: validateDecimal(trade.precoEntrada, 99999999.9999, "0"),
        precoSaida: validateDecimal(trade.precoSaida, 99999999.9999, "0"),
        stop: validateDecimal(trade.stop, 99999999.9999, "0"),
        alvo: validateDecimal(trade.alvo, 99999999.9999, "0"),
        risco: validateDecimal(trade.risco, 99.99, "0")
      };
    });
    
    console.log(`💾 [${userIds[0]}] Inserindo ${processedTrades.length} trades no banco com isolamento${csvImportId ? ` (CSV: ${csvImportId})` : ''}`);
    
    return await db
      .insert(trades)
      .values(processedTrades)
      .returning();
  }

  async updateTrade(id: string, updates: Partial<InsertTrade> & { userId?: string }): Promise<Trade> {
    // Isolamento: se userId for fornecido, usar para garantir que apenas o usuário correto pode atualizar
    const updateData: any = { ...updates };
    if (updateData.dataHora) {
      updateData.dataHora = new Date(updateData.dataHora);
    }
    updateData.updatedAt = new Date();
    
    let whereCondition;
    if (updates.userId) {
      whereCondition = and(eq(trades.id, id), eq(trades.userId, updates.userId));
    } else {
      whereCondition = eq(trades.id, id);
    }
    
    const [trade] = await db
      .update(trades)
      .set(updateData)
      .where(whereCondition)
      .returning();
    
    if (!trade) {
      throw new Error("Trade não encontrado ou acesso negado");
    }
    
    return trade;
  }

  async deleteTrade(id: string, userId?: string): Promise<void> {
    // Isolamento: se userId for fornecido, usar para garantir que apenas o usuário correto pode deletar
    let whereCondition;
    if (userId) {
      whereCondition = and(eq(trades.id, id), eq(trades.userId, userId));
    } else {
      whereCondition = eq(trades.id, id);
    }
    
    const result = await db.delete(trades).where(whereCondition).returning();
    if (result.length === 0 && userId) {
      throw new Error("Trade não encontrado ou acesso negado");
    }
  }

  async deleteAllTrades(userId: string): Promise<void> {
    await db.delete(trades).where(eq(trades.userId, userId));
  }

  // Broker API config operations
  async getBrokerApiConfig(userId: string, broker: string): Promise<BrokerApiConfig | undefined> {
    const [config] = await db.select().from(brokerApiConfigs).where(
      and(eq(brokerApiConfigs.userId, userId), eq(brokerApiConfigs.broker, broker))
    );
    return config || undefined;
  }

  async getAllBrokerApiConfigs(userId: string): Promise<BrokerApiConfig[]> {
    return await db.select().from(brokerApiConfigs).where(eq(brokerApiConfigs.userId, userId));
  }

  async createOrUpdateBrokerApiConfig(config: InsertBrokerApiConfig & { userId: string }): Promise<BrokerApiConfig> {
    const existing = await this.getBrokerApiConfig(config.userId, config.broker);
    
    if (existing) {
      const [updated] = await db
        .update(brokerApiConfigs)
        .set({ ...config, updatedAt: new Date() })
        .where(and(eq(brokerApiConfigs.userId, config.userId), eq(brokerApiConfigs.broker, config.broker)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(brokerApiConfigs)
        .values(config)
        .returning();
      return created;
    }
  }

  // CSV import operations
  async getCsvImports(userId: string): Promise<CsvImport[]> {
    return await db.select().from(csvImports).where(eq(csvImports.userId, userId)).orderBy(desc(csvImports.createdAt));
  }

  async createCsvImport(csvImport: Omit<CsvImport, 'id' | 'createdAt'>): Promise<CsvImport> {
    const [created] = await db
      .insert(csvImports)
      .values(csvImport)
      .returning();
    return created;
  }

  async deleteAllCsvImports(userId: string): Promise<void> {
    await db.delete(csvImports).where(eq(csvImports.userId, userId));
  }

  async updateCsvImportName(userId: string, csvId: string, displayName: string): Promise<CsvImport | null> {
    const [updated] = await db
      .update(csvImports)
      .set({ displayName })
      .where(and(eq(csvImports.id, csvId), eq(csvImports.userId, userId)))
      .returning();
    return updated || null;
  }

  async updateCsvImportTradesCount(csvId: string, tradesImported: number): Promise<CsvImport | null> {
    const [updated] = await db
      .update(csvImports)
      .set({ tradesImported })
      .where(eq(csvImports.id, csvId))
      .returning();
    return updated || null;
  }

  async deleteCsvImport(userId: string, csvId: string): Promise<boolean> {
    // Primeiro, buscar o CSV import para obter informações
    const csvImport = await db.select().from(csvImports)
      .where(and(eq(csvImports.id, csvId), eq(csvImports.userId, userId)))
      .limit(1);
    
    if (csvImport.length === 0) {
      return false;
    }
    
    const csvInfo = csvImport[0];
    
    // Deletar trades relacionados ao CSV de duas formas:
    // 1. Trades com csvImportId correspondente (novos)
    await db.delete(trades).where(
      and(
        eq(trades.userId, userId), 
        eq(trades.csvImportId, csvId)
      )
    );
    
    // 2. Para compatibilidade: deletar trades antigos baseado na data e origem
    // Deletar trades que foram importados na mesma data do CSV e são de origem 'csv'
    const csvDate = csvInfo.createdAt;
    if (csvDate) {
      const startOfDay = new Date(csvDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(csvDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      await db.delete(trades).where(
        and(
          eq(trades.userId, userId),
          eq(trades.origem, 'csv'),
          gte(trades.createdAt, startOfDay),
          lte(trades.createdAt, endOfDay),
          isNull(trades.csvImportId) // Apenas trades sem csvImportId (antigos)
        )
      );
    }
    
    // Depois, deletar o CSV import
    const result = await db
      .delete(csvImports)
      .where(and(eq(csvImports.id, csvId), eq(csvImports.userId, userId)))
      .returning();
    
    return result.length > 0;
  }

  async deleteAllBrokerConfigs(userId: string): Promise<void> {
    await db.delete(brokerApiConfigs).where(eq(brokerApiConfigs.userId, userId));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserByAdmin(id: string, updates: UpdateUserByAdmin): Promise<User> {
    const updateData: any = { ...updates };
    
    // Se password está sendo atualizado, fazer hash com bcrypt
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
      console.log(`🔐 Senha do usuário ${id} atualizada pelo admin (hash aplicado)`);
    }
    
    // Se planType está sendo atualizado, definir a duração correta baseada no tipo de plano
    if (updates.planType) {
      // Definir duração baseada no tipo de plano
      const getPlanDurationDays = (planType: string): number => {
        switch (planType) {
          case 'monthly': return 30;
          case 'quarterly': return 90;
          case 'annual': return 365;
          case 'free': return 0; // Plano gratuito não tem expiração
          default: return 30;
        }
      };
      
      const durationDays = getPlanDurationDays(updates.planType);
      
      if (updates.planType === 'free') {
        // Plano gratuito: remover data de expiração
        updateData.planExpiresAt = null;
        console.log(`✅ Plano gratuito ativado para usuário ${id}`);
      } else if (!updates.planExpiresAt) {
        // Plano pago sem data explícita: calcular baseado na duração do plano
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        updateData.planExpiresAt = expiresAt;
        console.log(`✅ Plano ${updates.planType} (${durationDays} dias) ativado para usuário ${id} até ${expiresAt.toISOString()}`);
      } else {
        updateData.planExpiresAt = new Date(updates.planExpiresAt);
        console.log(`✅ Plano ${updates.planType} ativado para usuário ${id} até ${updates.planExpiresAt}`);
      }
    } else if (updates.planExpiresAt) {
      // Se apenas planExpiresAt foi fornecido sem planType
      updateData.planExpiresAt = new Date(updates.planExpiresAt);
    }
    
    updateData.updatedAt = new Date();
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error('User not found');
    }
    
    return updatedUser;
  }

  async updateProfile(id: string, updates: UpdateProfile): Promise<User> {
    const updateData: any = {};
    
    if (updates.nome) {
      updateData.name = updates.nome;
    }
    if (updates.email) {
      updateData.email = updates.email;
    }
    if (updates.telefone) {
      updateData.phone = updates.telefone;
    }
    if (updates.whatsappNumber) {
      updateData.whatsappNumber = updates.whatsappNumber;
    }
    if (updates.senha) {
      updateData.password = await bcrypt.hash(updates.senha, 10);
    }
    
    updateData.updatedAt = new Date();
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }
    
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Subscription plan operations
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).orderBy(subscriptionPlans.price);
  }

  async createPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }

  async updatePlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    
    if (!updatedPlan) {
      throw new Error('Plan not found');
    }
    
    return updatedPlan;
  }

  async deletePlan(id: string): Promise<void> {
    await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
  }

  // Platform statistics
  async getPlatformStats(): Promise<PlatformStats | undefined> {
    const [stats] = await db
      .select()
      .from(platformStats)
      .orderBy(desc(platformStats.date))
      .limit(1);
    
    return stats || undefined;
  }

  async updatePlatformStats(stats: Omit<PlatformStats, 'id' | 'createdAt'>): Promise<PlatformStats> {
    const [newStats] = await db.insert(platformStats).values(stats).returning();
    return newStats;
  }

  // User subscriptions
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active')
      ))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    
    return subscription || undefined;
  }

  async createSubscription(subscription: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  // Diary operations
  async getDiaryEntries(userId: string): Promise<DiaryEntry[]> {
    return await db.select().from(diaryEntries)
      .where(eq(diaryEntries.userId, userId))
      .orderBy(desc(diaryEntries.date));
  }

  async getDiaryEntry(id: string, userId: string): Promise<DiaryEntry | undefined> {
    const [entry] = await db.select().from(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)));
    return entry || undefined;
  }

  async getDiaryEntriesByDate(userId: string, date: string): Promise<DiaryEntry[]> {
    // Garantir comparação correta de datas - usar apenas ano, mês e dia
    const [year, month, day] = date.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
    const endDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);
    
    return await db.select().from(diaryEntries)
      .where(and(
        eq(diaryEntries.userId, userId),
        gte(diaryEntries.date, startDate),
        lte(diaryEntries.date, endDate)
      ))
      .orderBy(desc(diaryEntries.date));
  }

  async createDiaryEntry(entry: InsertDiaryEntry & { userId: string }): Promise<DiaryEntry> {
    // Garantir que a data seja tratada corretamente (sem problemas de timezone)
    const dateString = entry.date;
    const [year, month, day] = dateString.split('-');
    const correctedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const [newEntry] = await db
      .insert(diaryEntries)
      .values({
        ...entry,
        date: correctedDate,
        pnl: entry.pnl || "0",
        winRate: entry.winRate || "0",
      })
      .returning();
    return newEntry;
  }

  async updateDiaryEntry(id: string, updates: Partial<InsertDiaryEntry>, userId: string): Promise<DiaryEntry> {
    // Garantir que a data seja tratada corretamente (sem problemas de timezone)
    let correctedDate;
    if (updates.date) {
      const dateString = updates.date;
      const [year, month, day] = dateString.split('-');
      correctedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    const [updatedEntry] = await db
      .update(diaryEntries)
      .set({
        ...updates,
        date: correctedDate,
        updatedAt: new Date(),
      })
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)))
      .returning();
    return updatedEntry;
  }

  async deleteDiaryEntry(id: string, userId: string): Promise<void> {
    await db.delete(diaryEntries)
      .where(and(eq(diaryEntries.id, id), eq(diaryEntries.userId, userId)));
  }

  // Password reset methods
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return resetToken || undefined;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // Diary images operations
  async getDiaryImages(diaryEntryId: string): Promise<DiaryImage[]> {
    return await db.select().from(diaryImages)
      .where(eq(diaryImages.diaryEntryId, diaryEntryId))
      .orderBy(diaryImages.createdAt);
  }

  async createDiaryImage(image: InsertDiaryImage): Promise<DiaryImage> {
    const [newImage] = await db
      .insert(diaryImages)
      .values(image)
      .returning();
    return newImage;
  }

  async deleteDiaryImage(imageId: string, diaryEntryId: string): Promise<void> {
    await db.delete(diaryImages)
      .where(and(
        eq(diaryImages.id, imageId), 
        eq(diaryImages.diaryEntryId, diaryEntryId)
      ));
  }

  async getDiaryImage(imageId: string): Promise<DiaryImage | undefined> {
    const [image] = await db.select().from(diaryImages)
      .where(eq(diaryImages.id, imageId));
    return image || undefined;
  }

  async checkFreeUserLimits(userId: string): Promise<{ csvImports: number; manualTrades: number; total: number; limitReached: boolean }> {
    // Count CSV imports for this user
    const csvImportsResult = await db.select({ count: sql<number>`count(*)` })
      .from(csvImports)
      .where(eq(csvImports.userId, userId));

    // Count manual trades for this user (origin = 'manual')
    const manualTradesResult = await db.select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.origem, 'manual')));

    const csvImportsCount = Number(csvImportsResult[0]?.count || 0);
    const manualTradesCount = Number(manualTradesResult[0]?.count || 0);
    const total = csvImportsCount + manualTradesCount;
    const limitReached = total >= 10;

    return {
      csvImports: csvImportsCount,
      manualTrades: manualTradesCount,
      total,
      limitReached
    };
  }

  // Support Conversations Operations
  async getSupportConversations(userId: string): Promise<SupportConversation[]> {
    return await db.select().from(supportConversations)
      .where(eq(supportConversations.userId, userId))
      .orderBy(supportConversations.lastMessageAt);
  }

  async getAllSupportConversations(): Promise<(SupportConversation & { userName: string | null; userEmail: string | null })[]> {
    const result = await db.select({
      id: supportConversations.id,
      userId: supportConversations.userId,
      subject: supportConversations.subject,
      category: supportConversations.category,
      priority: supportConversations.priority,
      status: supportConversations.status,
      lastMessageAt: supportConversations.lastMessageAt,
      lastMessageByAdmin: supportConversations.lastMessageByAdmin,
      createdAt: supportConversations.createdAt,
      updatedAt: supportConversations.updatedAt,
      userName: users.name,
      userEmail: users.email
    })
    .from(supportConversations)
    .leftJoin(users, eq(supportConversations.userId, users.id))
    .orderBy(supportConversations.lastMessageAt);
    
    return result;
  }

  async getSupportConversation(id: string): Promise<SupportConversation | undefined> {
    const [conversation] = await db.select().from(supportConversations)
      .where(eq(supportConversations.id, id));
    return conversation || undefined;
  }

  async createSupportConversation(conversation: InsertSupportConversation): Promise<SupportConversation> {
    const [newConversation] = await db
      .insert(supportConversations)
      .values({
        ...conversation,
        lastMessageAt: new Date(),
        createdAt: new Date()
      })
      .returning();
    return newConversation;
  }

  async updateSupportConversationStatus(id: string, status: string): Promise<void> {
    await db
      .update(supportConversations)
      .set({ status })
      .where(eq(supportConversations.id, id));
  }

  async getSupportMessages(conversationId: string): Promise<SupportMessage[]> {
    return await db.select().from(supportMessages)
      .where(eq(supportMessages.conversationId, conversationId))
      .orderBy(supportMessages.createdAt);
  }

  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const [newMessage] = await db
      .insert(supportMessages)
      .values({
        ...message,
        createdAt: new Date()
      })
      .returning();

    // Update conversation's last message timestamp
    await db
      .update(supportConversations)
      .set({ 
        lastMessageAt: new Date(),
        lastMessageByAdmin: message.isFromAdmin || false
      })
      .where(eq(supportConversations.id, message.conversationId));

    return newMessage;
  }

  async updateLastLogin(userId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }
    
    return updatedUser;
  }

  // Bankroll management operations
  async getBankrollManagement(userId: string): Promise<BankrollManagement | undefined> {
    const [bankroll] = await db
      .select()
      .from(bankrollManagements)
      .where(eq(bankrollManagements.userId, userId));
    
    if (!bankroll) {
      return undefined;
    }

    // SANITIZAR dados ao retornar para proteger contra dados legacy malformados
    const { sanitizePartialAnswers, sanitizeCustomMetrics } = await import('./questionnaire-sanitizer');
    
    // Sanitizar questionnaireAnswers
    const sanitizedAnswers = bankroll.questionnaireAnswers 
      ? sanitizePartialAnswers(bankroll.questionnaireAnswers)
      : bankroll.questionnaireAnswers;
    
    // Sanitizar custom metrics
    const customMetrics = sanitizeCustomMetrics(
      bankroll.customWinRate,
      bankroll.customRiskReward
    );

    return {
      ...bankroll,
      questionnaireAnswers: sanitizedAnswers,
      customWinRate: customMetrics.customWinRate,
      customRiskReward: customMetrics.customRiskReward,
    };
  }

  async createBankrollManagement(data: InsertBankrollManagement): Promise<BankrollManagement> {
    // Delete existing bankroll if any (unique constraint)
    await db
      .delete(bankrollManagements)
      .where(eq(bankrollManagements.userId, data.userId));

    // SANITIZAR questionnaireAnswers antes de persistir
    const { sanitizePartialAnswers } = await import('./questionnaire-sanitizer');
    const sanitizedAnswers = data.questionnaireAnswers 
      ? sanitizePartialAnswers(data.questionnaireAnswers)
      : data.questionnaireAnswers;

    const [newBankroll] = await db
      .insert(bankrollManagements)
      .values({
        ...data,
        questionnaireAnswers: sanitizedAnswers,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return newBankroll;
  }

  async updateBankrollManagement(userId: string, updates: Partial<InsertBankrollManagement>): Promise<BankrollManagement> {
    // SANITIZAR questionnaireAnswers e customMetrics antes de atualizar
    const { sanitizePartialAnswers, sanitizeCustomMetrics } = await import('./questionnaire-sanitizer');
    
    const sanitizedQuestionnaireAnswers = updates.questionnaireAnswers 
      ? sanitizePartialAnswers(updates.questionnaireAnswers)
      : updates.questionnaireAnswers;
    
    const customMetrics = updates.customWinRate !== undefined || updates.customRiskReward !== undefined
      ? sanitizeCustomMetrics(updates.customWinRate, updates.customRiskReward)
      : { customWinRate: updates.customWinRate, customRiskReward: updates.customRiskReward };

    // MONTAR objeto de update com valores sanitizados LAST (para evitar spread reintroduzir valores taint)
    const sanitizedUpdates = {
      ...updates,
      // Sobrescrever com valores sanitizados ao final
      questionnaireAnswers: sanitizedQuestionnaireAnswers,
      customWinRate: customMetrics.customWinRate,
      customRiskReward: customMetrics.customRiskReward,
      updatedAt: new Date()
    };

    const [updated] = await db
      .update(bankrollManagements)
      .set(sanitizedUpdates)
      .where(eq(bankrollManagements.userId, userId))
      .returning();
    
    if (!updated) {
      throw new Error('Bankroll management não encontrado');
    }
    
    return updated;
  }

  async deleteBankrollManagement(userId: string): Promise<void> {
    await db
      .delete(bankrollManagements)
      .where(eq(bankrollManagements.userId, userId));
  }

  async adjustBankrollManagement(
    userId: string, 
    adjustmentData: { consecutiveWins?: number; consecutiveLosses?: number }
  ): Promise<BankrollManagement> {
    const current = await this.getBankrollManagement(userId);
    if (!current) {
      throw new Error('Bankroll management não encontrado');
    }

    // Calculate new consecutive values (default to 0 if null)
    const consecutiveWins = adjustmentData.consecutiveWins ?? current.consecutiveWins ?? 0;
    const consecutiveLosses = adjustmentData.consecutiveLosses ?? current.consecutiveLosses ?? 0;

    // Parse decimal values to numbers for calculations
    let riskPerTrade = parseFloat(current.riskPerTrade);
    let dailyProfitTarget = parseFloat(current.dailyProfitTarget);
    let shouldAdjust = false;

    // Apply adjustment rules
    if (consecutiveLosses >= 3) {
      // Reduce risk by 20% after 3 consecutive losses
      riskPerTrade = riskPerTrade * 0.8;
      shouldAdjust = true;
      console.log(`🔻 Reduzindo risco em 20% após ${consecutiveLosses} perdas consecutivas`);
    } else if (consecutiveWins >= 3) {
      // Increase target by 10% after 3 consecutive wins
      dailyProfitTarget = dailyProfitTarget * 1.1;
      shouldAdjust = true;
      console.log(`📈 Aumentando meta diária em 10% após ${consecutiveWins} ganhos consecutivos`);
    }

    // Update if adjustment was made
    if (shouldAdjust || adjustmentData.consecutiveWins !== undefined || adjustmentData.consecutiveLosses !== undefined) {
      // Recalcular projeções e meta final com novos valores
      const { buildProjection, calculateTargetBalance } = await import('./bankroll-helpers');
      const bankrollValue = parseFloat(current.bankrollValue);
      const projectedGrowth = buildProjection(bankrollValue, dailyProfitTarget, current.horizonDays);
      const targetBalance = calculateTargetBalance(bankrollValue, dailyProfitTarget, current.horizonDays);

      const [updated] = await db
        .update(bankrollManagements)
        .set({
          riskPerTrade: riskPerTrade.toFixed(4),
          dailyProfitTarget: dailyProfitTarget.toFixed(4),
          projectedGrowth,
          targetBalance: targetBalance.toFixed(2),
          consecutiveWins,
          consecutiveLosses,
          lastAdjustmentAt: shouldAdjust ? new Date() : current.lastAdjustmentAt,
          updatedAt: new Date()
        })
        .where(eq(bankrollManagements.userId, userId))
        .returning();

      if (!updated) {
        throw new Error('Falha ao atualizar bankroll management');
      }

      return updated;
    }

    return current;
  }

  // Questionnaire state operations
  async getQuestionnaireState(userId: string): Promise<QuestionnaireState | undefined> {
    const [state] = await db
      .select()
      .from(questionnaireStates)
      .where(eq(questionnaireStates.userId, userId));
    
    if (!state) {
      return undefined;
    }

    // SANITIZAR partialAnswers ao retornar para proteger contra dados legacy malformados
    const { sanitizePartialAnswers } = await import('./questionnaire-sanitizer');
    const sanitizedAnswers = state.partialAnswers 
      ? sanitizePartialAnswers(state.partialAnswers)
      : state.partialAnswers;

    return {
      ...state,
      partialAnswers: sanitizedAnswers,
    };
  }

  async createQuestionnaireState(data: Omit<InsertQuestionnaireState, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionnaireState> {
    // Delete existing state if any (unique constraint on userId)
    await db
      .delete(questionnaireStates)
      .where(eq(questionnaireStates.userId, data.userId));

    // SANITIZAR partialAnswers antes de persistir
    const { sanitizePartialAnswers } = await import('./questionnaire-sanitizer');
    const sanitizedAnswers = data.partialAnswers 
      ? sanitizePartialAnswers(data.partialAnswers)
      : data.partialAnswers;

    const [newState] = await db
      .insert(questionnaireStates)
      .values({
        ...data,
        partialAnswers: sanitizedAnswers,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newState) {
      throw new Error('Falha ao criar questionnaire state');
    }

    return newState;
  }

  async updateQuestionnaireState(userId: string, updates: Partial<InsertQuestionnaireState>): Promise<QuestionnaireState> {
    // SANITIZAR partialAnswers antes de atualizar
    const { sanitizePartialAnswers } = await import('./questionnaire-sanitizer');
    const sanitizedAnswers = updates.partialAnswers 
      ? sanitizePartialAnswers(updates.partialAnswers)
      : updates.partialAnswers;

    const [updated] = await db
      .update(questionnaireStates)
      .set({
        ...updates,
        partialAnswers: sanitizedAnswers,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(questionnaireStates.userId, userId))
      .returning();

    if (!updated) {
      throw new Error('Questionnaire state não encontrado');
    }

    return updated;
  }

  async deleteQuestionnaireState(userId: string): Promise<void> {
    await db
      .delete(questionnaireStates)
      .where(eq(questionnaireStates.userId, userId));
  }

  // Wallet operations (carteiras customizadas)
  async getWallets(userId: string): Promise<Wallet[]> {
    return await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .orderBy(desc(wallets.createdAt));
  }

  async getWallet(id: string, userId: string): Promise<Wallet | undefined> {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)));
    return wallet || undefined;
  }

  async createWallet(data: InsertWallet & { userId: string }): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!wallet) {
      throw new Error('Falha ao criar carteira');
    }

    return wallet;
  }

  async updateWallet(id: string, updates: Partial<InsertWallet>, userId: string): Promise<Wallet> {
    const [wallet] = await db
      .update(wallets)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();

    if (!wallet) {
      throw new Error('Carteira não encontrada');
    }

    return wallet;
  }

  async deleteWallet(id: string, userId: string): Promise<void> {
    await db
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
