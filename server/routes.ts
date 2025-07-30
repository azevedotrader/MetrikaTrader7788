import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", async (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // User registration
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      // Create user (remove confirmPassword from data)
      const { confirmPassword, ...userData } = validatedData;
      const user = await storage.createUser(userData);

      // Remove password from response
      const { password, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Remove password from response
      const { password: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get user trades
  app.get("/api/trades", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const trades = await storage.getTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Get trades error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Create trade
  app.post("/api/trades", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const validatedData = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade({ ...validatedData, userId });
      res.status(201).json(trade);
    } catch (error) {
      console.error("Create trade error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
