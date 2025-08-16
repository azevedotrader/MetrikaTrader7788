import { 
  users, 
  trades, 
  brokerApiConfigs, 
  csvImports,
  subscriptionPlans,
  subscriptions,
  platformStats,
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
  type InsertSubscriptionPlan,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
      dataHora: new Date(insertTrade.dataHora),
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

  async createBulkTrades(tradesData: InsertTrade[]): Promise<Trade[]> {
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
    
    console.log(`💾 [${userIds[0]}] Inserindo ${processedTrades.length} trades no banco com isolamento`);
    
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

  async deleteAllBrokerConfigs(userId: string): Promise<void> {
    await db.delete(brokerApiConfigs).where(eq(brokerApiConfigs.userId, userId));
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserByAdmin(id: string, updates: UpdateUserByAdmin): Promise<User> {
    const updateData: any = { ...updates };
    if (updates.planExpiresAt) {
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
}

export const storage = new DatabaseStorage();
