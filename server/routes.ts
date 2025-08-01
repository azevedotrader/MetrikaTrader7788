import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema, insertBrokerApiConfigSchema, csvImportSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
// Removed Gate.io service import - now only CSV imports

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

// Function to intelligently detect and map CSV fields
function detectFieldMapping(row: any): Record<string, string> {
  const fieldMap: Record<string, string> = {};
  const keys = Object.keys(row);
  
  console.log('CSV Headers encontrados:', keys);
  
  // Date/Time mapping
  const dateFields = keys.filter(key => 
    key.toLowerCase().includes('date') || 
    key.toLowerCase().includes('time') || 
    key.toLowerCase().includes('data') ||
    key.toLowerCase().includes('hora') ||
    key.toLowerCase().includes('created') ||
    key.toLowerCase().includes('closed')
  );
  if (dateFields.length > 0) fieldMap.date = dateFields[0];
  
  // Symbol/Asset mapping
  const symbolFields = keys.filter(key => 
    key.toLowerCase().includes('symbol') || 
    key.toLowerCase().includes('pair') ||
    key.toLowerCase().includes('instrument') ||
    key.toLowerCase().includes('ativo') ||
    key.toLowerCase().includes('asset')
  );
  if (symbolFields.length > 0) fieldMap.symbol = symbolFields[0];
  
  // Volume/Amount mapping
  const volumeFields = keys.filter(key => 
    key.toLowerCase().includes('volume') || 
    key.toLowerCase().includes('amount') ||
    key.toLowerCase().includes('size') ||
    key.toLowerCase().includes('quantity') ||
    key.toLowerCase().includes('quantidade')
  );
  if (volumeFields.length > 0) fieldMap.volume = volumeFields[0];
  
  // Price mapping (prefer open price for entry)
  const openPriceFields = keys.filter(key => 
    key.toLowerCase().includes('open') ||
    key.toLowerCase().includes('price') ||
    key.toLowerCase().includes('preco')
  );
  if (openPriceFields.length > 0) fieldMap.openPrice = openPriceFields[0];
  
  // Close price mapping
  const closePriceFields = keys.filter(key => 
    key.toLowerCase().includes('close') ||
    key.toLowerCase().includes('exit')
  );
  if (closePriceFields.length > 0) fieldMap.closePrice = closePriceFields[0];
  
  // Profit/Loss mapping
  const profitFields = keys.filter(key => 
    key.toLowerCase().includes('profit') || 
    key.toLowerCase().includes('loss') ||
    key.toLowerCase().includes('pnl') ||
    key.toLowerCase().includes('resultado') ||
    key.toLowerCase().includes('gain')
  );
  if (profitFields.length > 0) fieldMap.profit = profitFields[0];
  
  // Side/Type mapping
  const sideFields = keys.filter(key => 
    key.toLowerCase().includes('side') || 
    key.toLowerCase().includes('type') ||
    key.toLowerCase().includes('action') ||
    key.toLowerCase().includes('buy') ||
    key.toLowerCase().includes('sell')
  );
  if (sideFields.length > 0) fieldMap.side = sideFields[0];
  
  console.log('Campo mapping detectado:', fieldMap);
  return fieldMap;
}

// Function to process CSV rows based on detected field mapping
function processCsvRow(row: any, broker: string, userId: string, fieldMap?: Record<string, string>): any | null {
  try {
    // Basic validation
    if (!row || typeof row !== 'object') return null;
    
    // Auto-detect fields if not provided
    if (!fieldMap) {
      fieldMap = detectFieldMapping(row);
    }

    // Common processing for all brokers
    let trade: any = {
      userId,
      corretora: broker,
      origem: 'csv',
      mercado: broker === 'forex' ? 'forex' : broker === 'b3' ? 'b3' : 'crypto',
      setup: 'CSV Import'
    };

    // Map detected fields to trade object
    trade.dataHora = row[fieldMap.date || ''] || 
                     row['Date'] || row['Time'] || row['Created Time'] || row['Closed Time'] ||
                     new Date().toISOString();
    
    trade.ativo = row[fieldMap.symbol || ''] || 
                  row['Symbol'] || row['Instrument'] || row['Currency Pair'] ||
                  '';
    
    trade.quantidade = row[fieldMap.volume || ''] || 
                       row['Volume'] || row['Amount'] || row['Size'] ||
                       '1';
    
    trade.capitalUtilizado = row[fieldMap.volume || ''] || 
                             row['Volume'] || row['Amount'] || row['Nominal'] ||
                             '100';
    
    trade.precoEntrada = row[fieldMap.openPrice || ''] || 
                         row['Open Price'] || row['Price'] || row['Entry Price'] ||
                         '';
    
    trade.precoSaida = row[fieldMap.closePrice || ''] || 
                       row['Close Price'] || row['Exit Price'] ||
                       trade.precoEntrada; // fallback to entry price
    
    trade.resultado = row[fieldMap.profit || ''] || 
                      row['Profit'] || row['PnL'] || row['Net P&L'] ||
                      '';
    
    // Determine trade type (buy/sell)
    const sideValue = row[fieldMap.side || ''] || row['Side'] || row['Action'] || 'buy';
    trade.tipo = sideValue.toLowerCase().includes('sell') || sideValue.toLowerCase().includes('short') ? 'venda' : 'compra';

    // Validate that we have minimum required fields
    if (!trade.ativo) {
      throw new Error('Símbolo/Ativo não encontrado');
    }
    
    if (!trade.dataHora) {
      throw new Error('Data/Hora não encontrada');
    }

    // Convert string dates to proper format
    if (typeof trade.dataHora === 'string') {
      const parsedDate = new Date(trade.dataHora);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Formato de data inválido');
      }
      trade.dataHora = parsedDate.toISOString();
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
      if (!broker || !['forex', 'b3', 'crypto'].includes(broker)) {
        return res.status(400).json({ message: "Corretora inválida ou não especificada" });
      }

      console.log(`Iniciando importação CSV: ${req.file.originalname} para broker: ${broker}`);

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

      console.log(`CSV parsed: ${results.length} rows encontradas`);

      // Detect field mapping from first row
      let fieldMap: Record<string, string> = {};
      if (results.length > 0) {
        fieldMap = detectFieldMapping(results[0]);
      }

      // Process and validate trades
      const validTrades: any[] = [];
      
      for (let i = 0; i < results.length; i++) {
        try {
          const row = results[i];
          
          // Skip empty rows
          const hasData = Object.values(row).some(value => value && value.toString().trim() !== '');
          if (!hasData) {
            continue;
          }

          const trade = processCsvRow(row, broker, userId, fieldMap);
          if (trade) {
            console.log(`Linha ${i + 1} processada:`, {
              ativo: trade.ativo,
              dataHora: trade.dataHora,
              tipo: trade.tipo,
              quantidade: trade.quantidade
            });
            validTrades.push(trade);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          console.error(`Erro na linha ${i + 2}:`, errorMessage);
          errors.push(`Linha ${i + 2}: ${errorMessage}`);
        }
      }

      console.log(`Trades válidos processados: ${validTrades.length}`);

      // Save valid trades
      let savedTrades: any[] = [];
      if (validTrades.length > 0) {
        try {
          savedTrades = await storage.createBulkTrades(validTrades);
          console.log(`Trades salvos no banco: ${savedTrades.length}`);
        } catch (dbError) {
          console.error('Erro ao salvar trades:', dbError);
          errors.push('Erro ao salvar trades no banco de dados');
        }
      }

      // Log import
      await storage.createCsvImport({
        userId,
        broker,
        fileName: req.file.originalname,
        tradesImported: savedTrades.length,
        tradesSkipped: results.length - savedTrades.length,
        status: savedTrades.length > 0 ? 'completed' : 'failed',
        errorMessage: errors.length > 0 ? errors.slice(0, 10).join('; ') : null // Limit error message length
      });

      res.json({
        message: `Importação concluída: ${savedTrades.length} trades importados`,
        tradesImported: savedTrades.length,
        tradesSkipped: results.length - savedTrades.length,
        totalRows: results.length,
        errors: errors.slice(0, 5), // Only show first 5 errors in response
        fieldMapping: fieldMap
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

  // CSV Preview endpoint for debugging
  app.post("/api/csv-preview", upload.single('csvFile'), async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Arquivo CSV é obrigatório" });
      }

      const results: any[] = [];
      const stream = Readable.from(req.file.buffer.toString());
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => {
            if (results.length < 5) { // Only take first 5 rows for preview
              results.push(data);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Detect field mapping
      let fieldMap = {};
      let headers: string[] = [];
      if (results.length > 0) {
        headers = Object.keys(results[0]);
        fieldMap = detectFieldMapping(results[0]);
      }

      res.json({
        headers,
        fieldMapping: fieldMap,
        sampleRows: results,
        totalColumns: headers.length,
        fileName: req.file.originalname
      });

    } catch (error) {
      console.error("CSV preview error:", error);
      res.status(500).json({ message: "Erro ao analisar arquivo CSV" });
    }
  });

  // Removed Gate.io API integration - now only CSV imports

  // Removed Gate.io API testing - now only CSV imports

  // Removed Gate.io currency pairs endpoint - now only CSV imports

  const httpServer = createServer(app);
  return httpServer;
}
