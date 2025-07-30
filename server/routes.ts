import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema, insertBrokerApiConfigSchema, csvImportSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'));
    }
  }
});

// Function to process CSV rows based on broker format
function processCsvRow(row: any, broker: string, userId: string): any | null {
  try {
    // Basic validation
    if (!row || typeof row !== 'object') return null;

    // Common processing for all brokers - adapt field mapping as needed
    let trade: any = {
      userId,
      corretora: broker,
      origem: 'csv'
    };

    // Map fields based on broker-specific CSV format
    switch (broker) {
      case 'tickmill':
        trade = {
          ...trade,
          dataHora: row['Date'] || row['Data'] || '',
          ativo: row['Symbol'] || row['Ativo'] || '',
          mercado: 'forex',
          setup: row['Setup'] || 'CSV Import',
          capitalUtilizado: row['Volume'] || row['Capital'] || '0',
          quantidade: row['Volume'] || row['Quantidade'] || '0',
          tipo: (row['Type'] || row['Tipo'] || '').toLowerCase() === 'sell' ? 'venda' : 'compra',
          precoEntrada: row['Open Price'] || row['Preco Entrada'] || '',
          precoSaida: row['Close Price'] || row['Preco Saida'] || '',
          resultado: row['Profit'] || row['Resultado'] || ''
        };
        break;

      case 'clear':
        trade = {
          ...trade,
          dataHora: row['Data'] || row['Date'] || '',
          ativo: row['Codigo'] || row['Symbol'] || '',
          mercado: 'b3',
          setup: row['Setup'] || 'CSV Import',
          capitalUtilizado: row['Valor'] || row['Capital'] || '0',
          quantidade: row['Qtd'] || row['Quantidade'] || '0',
          tipo: (row['C/V'] || row['Tipo'] || '').toLowerCase() === 'v' ? 'venda' : 'compra',
          precoEntrada: row['Preco'] || row['Preco Entrada'] || '',
          resultado: row['Resultado'] || ''
        };
        break;

      case 'gate.io':
        trade = {
          ...trade,
          dataHora: row['Time'] || row['Data'] || '',
          ativo: row['Currency Pair'] || row['Par'] || '',
          mercado: 'crypto',
          setup: row['Setup'] || 'CSV Import',
          capitalUtilizado: row['Amount'] || row['Capital'] || '0',
          quantidade: row['Amount'] || row['Quantidade'] || '0',
          tipo: (row['Side'] || row['Tipo'] || '').toLowerCase() === 'sell' ? 'venda' : 'compra',
          precoEntrada: row['Price'] || row['Preco'] || '',
          resultado: row['Fee'] ? `-${row['Fee']}` : ''
        };
        break;

      default:
        return null;
    }

    // Validate required fields
    if (!trade.dataHora || !trade.ativo || !trade.capitalUtilizado || !trade.quantidade) {
      throw new Error('Campos obrigatórios não encontrados');
    }

    return trade;
  } catch (error) {
    throw error;
  }
}

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

  // Get user trades (all or by broker)
  app.get("/api/trades", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const broker = req.query.broker as string;
      const trades = await storage.getTrades(userId, broker);
      res.json(trades);
    } catch (error) {
      console.error("Get trades error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get trades grouped by broker
  app.get("/api/trades/by-broker", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const tradesByBroker = await storage.getTradesByBroker(userId);
      res.json(tradesByBroker);
    } catch (error) {
      console.error("Get trades by broker error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get consolidated trades from all brokers
  app.get("/api/trades/consolidated", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const allTrades = await storage.getAllTrades(userId);
      res.json(allTrades);
    } catch (error) {
      console.error("Get consolidated trades error:", error);
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

  // Upload CSV file
  app.post("/api/trades/upload-csv", upload.single('csvFile'), async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Arquivo CSV é obrigatório" });
      }

      const { broker } = req.body;
      if (!broker || !['tickmill', 'clear', 'gate.io'].includes(broker)) {
        return res.status(400).json({ message: "Corretora inválida ou não especificada" });
      }

      const results: any[] = [];
      const errors: string[] = [];
      
      // Parse CSV
      const stream = Readable.from(req.file.buffer.toString());
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', resolve)
          .on('error', reject);
      });

      // Process and validate trades
      const validTrades: any[] = [];
      
      for (let i = 0; i < results.length; i++) {
        try {
          const row = results[i];
          const trade = processCsvRow(row, broker, userId);
          if (trade) {
            validTrades.push(trade);
          }
        } catch (error) {
          errors.push(`Linha ${i + 2}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      // Save valid trades
      let savedTrades: any[] = [];
      if (validTrades.length > 0) {
        savedTrades = await storage.createBulkTrades(validTrades);
      }

      // Log import
      await storage.createCsvImport({
        userId,
        broker,
        fileName: req.file.originalname,
        tradesImported: savedTrades.length,
        tradesSkipped: results.length - savedTrades.length,
        status: errors.length > 0 ? 'completed' : 'completed',
        errorMessage: errors.length > 0 ? errors.join('; ') : null
      });

      res.json({
        message: "Importação concluída",
        tradesImported: savedTrades.length,
        tradesSkipped: results.length - savedTrades.length,
        errors: errors
      });

    } catch (error) {
      console.error("CSV upload error:", error);
      res.status(500).json({ message: "Erro ao processar arquivo CSV" });
    }
  });

  // Broker API configurations
  app.get("/api/broker-configs", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const configs = await storage.getAllBrokerApiConfigs(userId);
      // Remove sensitive data
      const safeConfigs = configs.map(config => ({
        ...config,
        apiKey: config.apiKey ? '***' : null,
        apiSecret: config.apiSecret ? '***' : null
      }));
      
      res.json(safeConfigs);
    } catch (error) {
      console.error("Get broker configs error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/broker-configs", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const validatedData = insertBrokerApiConfigSchema.parse(req.body);
      const config = await storage.createOrUpdateBrokerApiConfig({ ...validatedData, userId });
      
      // Remove sensitive data from response
      const safeConfig = {
        ...config,
        apiKey: config.apiKey ? '***' : null,
        apiSecret: config.apiSecret ? '***' : null
      };
      
      res.status(201).json(safeConfig);
    } catch (error) {
      console.error("Create/update broker config error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get CSV import history
  app.get("/api/csv-imports", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const imports = await storage.getCsvImports(userId);
      res.json(imports);
    } catch (error) {
      console.error("Get CSV imports error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Sync trades from Gate.io API
  app.post("/api/sync/gate-io", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const config = await storage.getBrokerApiConfig(userId, 'gate.io');
      if (!config || !config.isActive) {
        return res.status(400).json({ message: "Configuração da API Gate.io não encontrada ou inativa" });
      }

      // TODO: Implement Gate.io API integration
      // For now, return a placeholder response
      res.json({
        message: "Sincronização com Gate.io será implementada em breve",
        tradesImported: 0
      });
    } catch (error) {
      console.error("Gate.io sync error:", error);
      res.status(500).json({ message: "Erro na sincronização com Gate.io" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
