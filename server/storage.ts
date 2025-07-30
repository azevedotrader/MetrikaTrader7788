import { users, trades, type User, type InsertUser, type Trade, type InsertTrade } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: Omit<InsertUser, 'confirmPassword'>): Promise<User>;
  
  // Trade operations
  getTrades(userId: string): Promise<Trade[]>;
  createTrade(insertTrade: InsertTrade & { userId: string }): Promise<Trade>;
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

  async getTrades(userId: string): Promise<Trade[]> {
    return await db.select().from(trades).where(eq(trades.userId, userId));
  }

  async createTrade(insertTrade: InsertTrade & { userId: string }): Promise<Trade> {
    const tradeData = {
      ...insertTrade,
      dataHora: new Date(insertTrade.dataHora)
    };
    
    const [trade] = await db
      .insert(trades)
      .values(tradeData)
      .returning();
    return trade;
  }
}

export const storage = new DatabaseStorage();
