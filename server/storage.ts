import { 
  users, 
  trades, 
  brokerApiConfigs, 
  csvImports,
  type User, 
  type InsertUser, 
  type Trade, 
  type InsertTrade,
  type BrokerApiConfig,
  type InsertBrokerApiConfig,
  type CsvImport
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User>;
  
  // Trade operations
  getTrades(userId: string, broker?: string): Promise<Trade[]>;
  getTradesByBroker(userId: string): Promise<{ [broker: string]: Trade[] }>;
  getAllTrades(userId: string): Promise<Trade[]>;
  createTrade(insertTrade: InsertTrade & { userId: string }): Promise<Trade>;
  createBulkTrades(trades: (InsertTrade & { userId: string })[]): Promise<Trade[]>;
  
  // Broker API config operations
  getBrokerApiConfig(userId: string, broker: string): Promise<BrokerApiConfig | undefined>;
  getAllBrokerApiConfigs(userId: string): Promise<BrokerApiConfig[]>;
  createOrUpdateBrokerApiConfig(config: InsertBrokerApiConfig & { userId: string }): Promise<BrokerApiConfig>;
  
  // CSV import operations
  getCsvImports(userId: string): Promise<CsvImport[]>;
  createCsvImport(csvImport: Omit<CsvImport, 'id' | 'createdAt'>): Promise<CsvImport>;
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
    if (broker) {
      return await db.select().from(trades).where(
        and(eq(trades.userId, userId), eq(trades.corretora, broker))
      ).orderBy(desc(trades.dataHora));
    }
    return await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.dataHora));
  }

  async getTradesByBroker(userId: string): Promise<{ [broker: string]: Trade[] }> {
    const allTrades = await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.dataHora));
    
    const tradesByBroker: { [broker: string]: Trade[] } = {};
    allTrades.forEach(trade => {
      if (!tradesByBroker[trade.corretora]) {
        tradesByBroker[trade.corretora] = [];
      }
      tradesByBroker[trade.corretora].push(trade);
    });
    
    return tradesByBroker;
  }

  async getAllTrades(userId: string): Promise<Trade[]> {
    return await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.dataHora));
  }

  async createTrade(insertTrade: InsertTrade & { userId: string }): Promise<Trade> {
    const tradeData = {
      ...insertTrade,
      dataHora: new Date(insertTrade.dataHora),
      // Ensure required fields have default values
      capitalUtilizado: insertTrade.capitalUtilizado || "0",
      quantidade: insertTrade.quantidade || "1"
    };
    
    const [trade] = await db
      .insert(trades)
      .values(tradeData)
      .returning();
    return trade;
  }

  async createBulkTrades(tradesData: (InsertTrade & { userId: string })[]): Promise<Trade[]> {
    const processedTrades = tradesData.map(trade => ({
      ...trade,
      dataHora: new Date(trade.dataHora),
      // Ensure required fields have default values
      capitalUtilizado: trade.capitalUtilizado || "0",
      quantidade: trade.quantidade || "1"
    }));
    
    return await db
      .insert(trades)
      .values(processedTrades)
      .returning();
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
}

export const storage = new DatabaseStorage();
