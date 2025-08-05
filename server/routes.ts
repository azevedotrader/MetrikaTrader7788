import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTradeSchema, insertBrokerApiConfigSchema, csvImportSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";
import { aiService } from "./ai-service";
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

// Universal CSV field detection - works with any broker format
function detectFieldMapping(row: any): Record<string, string> {
  const fieldMap: Record<string, string> = {};
  const keys = Object.keys(row);
  
  console.log('CSV Headers encontrados:', keys);
  
  // Enhanced date/time mapping - covers most broker formats
  const datePatterns = [
    'date', 'time', 'data', 'hora', 'timestamp', 'created', 'closed', 'open', 'entry', 'exit',
    'datetime', 'opentime', 'closetime', 'execution', 'settle', 'trade_time', 'order_time'
  ];
  const dateFields = keys.filter(key => 
    datePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (dateFields.length > 0) fieldMap.date = dateFields[0];
  
  // Enhanced symbol/asset mapping - covers various naming conventions
  const symbolPatterns = [
    'symbol', 'pair', 'instrument', 'ativo', 'asset', 'currency', 'ticker', 'security',
    'market', 'product', 'commodity', 'stock', 'forex', 'crypto', 'coin', 'token'
  ];
  const symbolFields = keys.filter(key => 
    symbolPatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (symbolFields.length > 0) fieldMap.symbol = symbolFields[0];
  
  // Enhanced volume/quantity mapping
  const volumePatterns = [
    'volume', 'amount', 'size', 'quantity', 'quantidade', 'qty', 'units', 'shares',
    'lots', 'contracts', 'nominal', 'position', 'trade_size'
  ];
  const volumeFields = keys.filter(key => 
    volumePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (volumeFields.length > 0) fieldMap.volume = volumeFields[0];
  
  // Enhanced price mapping - entry price
  const openPricePatterns = [
    'open', 'entry', 'price', 'preco', 'fill', 'execution', 'rate', 'level',
    'open_price', 'entry_price', 'fill_price', 'avg_price', 'average'
  ];
  const openPriceFields = keys.filter(key => 
    openPricePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (openPriceFields.length > 0) fieldMap.openPrice = openPriceFields[0];
  
  // Enhanced close price mapping
  const closePricePatterns = [
    'close', 'exit', 'close_price', 'exit_price', 'final'
  ];
  const closePriceFields = keys.filter(key => 
    closePricePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (closePriceFields.length > 0) fieldMap.closePrice = closePriceFields[0];
  
  // Enhanced profit/loss mapping
  const profitPatterns = [
    'profit', 'loss', 'pnl', 'p&l', 'resultado', 'gain', 'return', 'net',
    'gross', 'realized', 'unrealized', 'commission', 'fee', 'swap'
  ];
  const profitFields = keys.filter(key => 
    profitPatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (profitFields.length > 0) fieldMap.profit = profitFields[0];
  
  // Enhanced side/direction mapping
  const sidePatterns = [
    'side', 'type', 'action', 'direction', 'buy', 'sell', 'long', 'short',
    'order_type', 'trade_type', 'position_type'
  ];
  const sideFields = keys.filter(key => 
    sidePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (sideFields.length > 0) fieldMap.side = sideFields[0];
  
  // Additional common fields detection
  
  // Comment/Description mapping
  const commentPatterns = ['comment', 'description', 'note', 'memo', 'remark'];
  const commentFields = keys.filter(key => 
    commentPatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (commentFields.length > 0) fieldMap.comment = commentFields[0];
  
  // Commission/Fee mapping
  const feePatterns = ['commission', 'fee', 'spread', 'cost', 'charge'];
  const feeFields = keys.filter(key => 
    feePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (feeFields.length > 0) fieldMap.fee = feeFields[0];
  
  // Account/ID mapping
  const accountPatterns = ['account', 'id', 'ticket', 'order', 'position', 'deal'];
  const accountFields = keys.filter(key => 
    accountPatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (accountFields.length > 0) fieldMap.account = accountFields[0];
  
  console.log('Campo mapping detectado:', fieldMap);
  return fieldMap;
}

// Function to validate and clean trade data before database insertion
function validateAndCleanTrade(trade: any): any {
  // Clean numeric fields to ensure they're valid for database
  const numericFields = ['quantidade', 'capitalUtilizado', 'precoEntrada', 'precoSaida', 'resultado', 'stop', 'alvo', 'risco'];
  
  numericFields.forEach(field => {
    let value = trade[field];
    
    // Handle undefined, null, or empty string cases
    if (value === undefined || value === null || value === '') {
      if (field === 'quantidade' || field === 'capitalUtilizado') {
        trade[field] = '1'; // Default for required fields
      } else {
        trade[field] = null; // Optional fields can be null - remove from object
        delete trade[field];
      }
      return;
    }
    
    // Convert to string and clean
    value = value.toString();
    
    // Remove non-numeric characters except dots and minus signs
    value = value.replace(/[^\d.-]/g, '');
    
    // Handle edge cases after cleaning
    if (value === '' || value === '-' || value === '.' || value === '-.') {
      if (field === 'quantidade' || field === 'capitalUtilizado') {
        trade[field] = '1';
      } else {
        delete trade[field]; // Remove optional empty fields
      }
      return;
    }
    
    // Validate that it's a proper number
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      if (field === 'quantidade' || field === 'capitalUtilizado') {
        trade[field] = '1';
      } else {
        delete trade[field]; // Remove invalid optional fields
      }
    } else {
      // Ensure positive values for quantity and capital
      if ((field === 'quantidade' || field === 'capitalUtilizado') && numValue <= 0) {
        trade[field] = '1';
      } else {
        trade[field] = numValue.toString();
      }
    }
  });
  
  // Final validation for required fields
  if (!trade.quantidade || parseFloat(trade.quantidade) <= 0) {
    trade.quantidade = '1';
  }
  
  if (!trade.capitalUtilizado || parseFloat(trade.capitalUtilizado) <= 0) {
    trade.capitalUtilizado = trade.quantidade;
  }
  
  // Calcular resultado automaticamente se não estiver definido mas tiver preços
  if ((!trade.resultado || parseFloat(trade.resultado) === 0) && 
      trade.precoEntrada && trade.precoSaida && 
      parseFloat(trade.precoEntrada) > 0 && parseFloat(trade.precoSaida) > 0) {
    
    const precoEntrada = parseFloat(trade.precoEntrada);
    const precoSaida = parseFloat(trade.precoSaida);
    const quantidade = parseFloat(trade.quantidade || '1');
    
    let resultado = 0;
    
    // Calcular resultado baseado no tipo de trade
    if (trade.tipo === 'compra') {
      // Compra: lucro quando preço de saída > preço de entrada
      resultado = (precoSaida - precoEntrada) * quantidade;
    } else {
      // Venda: lucro quando preço de entrada > preço de saída
      resultado = (precoEntrada - precoSaida) * quantidade;
    }
    
    trade.resultado = resultado.toString();
  }

  console.log('Dados limpos para o banco:', {
    quantidade: trade.quantidade,
    capitalUtilizado: trade.capitalUtilizado,
    precoEntrada: trade.precoEntrada || 'null',
    precoSaida: trade.precoSaida || 'null',
    resultado: trade.resultado || 'null'
  });
  
  return trade;
}

// Robust CSV row processing - works with any broker format
function processCsvRow(row: any, broker: string, userId: string, fieldMap?: Record<string, string>): any | null {
  try {
    // Basic validation
    if (!row || typeof row !== 'object') return null;
    
    // Skip completely empty rows or problematic rows
    const hasAnyData = Object.values(row).some(value => value && value.toString().trim() !== '');
    if (!hasAnyData) return null;
    
    // Skip rows that look like headers or account info
    const rowText = Object.values(row).join(' ').toLowerCase();
    if (rowText.includes('conta:') || rowText.includes('field') || rowText.includes('campo') || 
        rowText.includes('header') || rowText.includes('_1') || rowText.includes('_2')) {
      return null;
    }
    
    // Auto-detect fields if not provided
    if (!fieldMap) {
      fieldMap = detectFieldMapping(row);
    }

    console.log('Processando linha:', Object.keys(row).slice(0, 5), '...');

    // Auto-detect market type based on content
    let detectedMarket = 'forex'; // default
    
    // Check symbol patterns to determine market
    const allText = Object.values(row).join(' ').toUpperCase();
    if (allText.includes('BTC') || allText.includes('ETH') || allText.includes('USDT') || 
        allText.includes('CRYPTO') || allText.match(/[A-Z]+\/USDT|[A-Z]+\/BTC/)) {
      detectedMarket = 'crypto';
    } else if (allText.includes('PETR') || allText.includes('VALE') || allText.includes('ITUB') ||
               allText.includes('WIN') || allText.includes('WDO') || allText.match(/[A-Z]{4}\d{2}/)) {
      detectedMarket = 'b3';
    } else if (allText.match(/[A-Z]{6}|EUR\/USD|GBP\/USD|USD\/JPY/)) {
      detectedMarket = 'forex';
    }

    // Common processing for all brokers
    let trade: any = {
      userId,
      corretora: broker === 'auto' ? detectedMarket : broker,
      origem: 'csv',
      mercado: detectedMarket,
      setup: 'CSV Import'
    };

    // Intelligent field mapping with fallbacks
    
    // DATE/TIME - try multiple approaches
    let dateValue = row[fieldMap.date || ''] || 
                    Object.values(row).find(val => val && /\d{4}[-\/]\d{2}[-\/]\d{2}/.test(val.toString())) ||
                    Object.values(row).find(val => val && /\d{2}[-\/]\d{2}[-\/]\d{4}/.test(val.toString())) ||
                    new Date().toISOString();
    
    // SYMBOL/ASSET - find the most likely candidate
    let symbolValue = row[fieldMap.symbol || ''] ||
                      Object.values(row).find(val => val && val.toString().match(/^[A-Z]{3,6}$/)) || // Currency pairs like EURUSD
                      Object.values(row).find(val => val && val.toString().includes('/')) || // Pairs like EUR/USD
                      Object.values(row).find(val => val && val.toString().match(/^[A-Z]+\d*$/)) || // Stocks like AAPL, ES1!
                      'UNKNOWN';
    
    // Helper function to safely parse numeric values with range validation
    const safeParseNumeric = (value: any, defaultValue: string = '0', maxValue: number = 1000000): string => {
      if (!value) return defaultValue;
      
      let cleanValue = value.toString().replace(/[^\d.-]/g, '');
      if (!cleanValue || cleanValue === '-' || cleanValue === '.') return defaultValue;
      
      const numValue = parseFloat(cleanValue);
      if (isNaN(numValue)) return defaultValue;
      
      // Validate range to prevent overflow
      if (Math.abs(numValue) > maxValue) return defaultValue;
      
      return numValue.toString();
    };

    // VOLUME/QUANTITY - find reasonable numeric values
    let volumeValue = safeParseNumeric(
      row[fieldMap.volume || ''] || 
      Object.values(row).find(val => {
        const num = parseFloat(val?.toString()?.replace(/[^\d.-]/g, '') || '0');
        return !isNaN(num) && num > 0 && num <= 1000000; // Reasonable volume range
      }),
      '1',
      1000000
    );
    
    // PRICE - find reasonable price values (not dates or huge numbers)
    let priceValue = safeParseNumeric(
      row[fieldMap.openPrice || ''] ||
      Object.values(row).find(val => {
        const str = val?.toString() || '';
        const num = parseFloat(str.replace(/[^\d.-]/g, ''));
        // Exclude dates and extreme values
        return !isNaN(num) && num >= 0 && num <= 100000 && !str.includes('/') && str.length < 15;
      }),
      '0',
      100000
    );
    
    // CLOSE PRICE - similar to open price
    let closePriceValue = safeParseNumeric(
      row[fieldMap.closePrice || ''] ||
      Object.values(row).find(val => {
        const str = val?.toString() || '';
        const num = parseFloat(str.replace(/[^\d.-]/g, ''));
        return !isNaN(num) && num >= 0 && num <= 100000 && !str.includes('/') && str.length < 15;
      }),
      priceValue, // Default to open price
      100000
    );
    
    // PROFIT/LOSS - find reasonable profit values
    let profitValue = safeParseNumeric(
      row[fieldMap.profit || ''] ||
      Object.values(row).find(val => {
        const str = val?.toString() || '';
        const num = parseFloat(str.replace(/[^\d.-]/g, ''));
        return !isNaN(num) && Math.abs(num) <= 50000 && !str.includes('/'); // Reasonable profit range
      }),
      '0',
      50000
    );

    // STOP LOSS - find stop loss values for R/R calculation
    let stopLossValue = safeParseNumeric(
      row[fieldMap.stopLoss || ''] ||
      Object.values(row).find(val => {
        const str = val?.toString() || '';
        const num = parseFloat(str.replace(/[^\d.-]/g, ''));
        return !isNaN(num) && Math.abs(num) <= 50000 && !str.includes('/');
      }),
      '0',
      50000
    );

    // Calculate Risk/Reward Ratio if we have profit and stop loss
    let riskRewardRatio = '0';
    if (parseFloat(profitValue) !== 0 && parseFloat(stopLossValue) !== 0) {
      const profit = Math.abs(parseFloat(profitValue));
      const stopLoss = Math.abs(parseFloat(stopLossValue));
      if (stopLoss > 0) {
        riskRewardRatio = (profit / stopLoss).toFixed(2);
      }
    }
    
    // SIDE/TYPE - detect buy/sell
    let sideValue = row[fieldMap.side || ''] ||
                    Object.values(row).find(val => val && /^(buy|sell|long|short|compra|venda)$/i.test(val.toString())) ||
                    'buy';

    // Assign values with intelligent defaults and ensure all numeric fields are clean
    trade.dataHora = dateValue;
    trade.ativo = symbolValue.toString().toUpperCase().replace(/[^\w\/]/g, ''); // Clean symbol
    trade.quantidade = volumeValue;
    trade.capitalUtilizado = volumeValue; // Use volume as capital
    trade.precoEntrada = priceValue;
    trade.precoSaida = closePriceValue;
    trade.resultado = profitValue;
    trade.stop = stopLossValue; // Store stop loss
    trade.comentario = `R/R: ${riskRewardRatio}`; // Store R/R in comments
    
    // Additional cleaning for optional numeric fields
    if (row[fieldMap.fee]) {
      let feeValue = row[fieldMap.fee].toString().replace(/[^\d.-]/g, '') || '0';
      if (!isNaN(parseFloat(feeValue))) {
        trade.stop = feeValue; // Store fee in stop field for now
      }
    }
    
    // Determine trade type with intelligent detection
    const sideStr = sideValue.toString().toLowerCase();
    trade.tipo = (sideStr.includes('sell') || sideStr.includes('short') || sideStr.includes('venda')) ? 'venda' : 'compra';

    // Add additional fields if available
    if (fieldMap.comment && row[fieldMap.comment]) {
      trade.comentario = row[fieldMap.comment].toString();
    }

    // Only require that we have SOME data - be very permissive
    if (!trade.ativo || trade.ativo === 'UNKNOWN') {
      // Try to extract symbol from any field that looks like a trading instrument
      const allValues = Object.values(row).join(' ');
      const symbolMatch = allValues.match(/([A-Z]{6}|[A-Z]{3}\/[A-Z]{3}|[A-Z]+\d+)/);
      if (symbolMatch) {
        trade.ativo = symbolMatch[1];
      } else {
        throw new Error('Não foi possível identificar o ativo/símbolo');
      }
    }

    // Convert and validate date
    if (typeof trade.dataHora === 'string') {
      // Try multiple date formats
      let parsedDate = new Date(trade.dataHora);
      
      if (isNaN(parsedDate.getTime())) {
        // Try DD/MM/YYYY format
        const parts = trade.dataHora.split(/[-\/]/);
        if (parts.length === 3) {
          parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }
      
      if (isNaN(parsedDate.getTime())) {
        // Use current date as fallback
        parsedDate = new Date();
      }
      
      trade.dataHora = parsedDate.toISOString();
    }

    // Final validation and cleaning before returning
    trade = validateAndCleanTrade(trade);

    console.log('Trade processado:', {
      ativo: trade.ativo,
      dataHora: trade.dataHora.substring(0, 10),
      tipo: trade.tipo,
      quantidade: trade.quantidade,
      capitalUtilizado: trade.capitalUtilizado,
      precoEntrada: trade.precoEntrada
    });

    return trade;
  } catch (error) {
    console.error('Erro ao processar linha:', error);
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

  // Get calendar trading data with R/R calculations
  app.get("/api/trades/calendar", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const allTrades = await storage.getAllTrades(userId);
      
      // Group trades by date and calculate daily statistics
      const calendarData = allTrades.reduce((acc: any, trade) => {
        const date = new Date(trade.dataHora).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            date,
            trades: [],
            totalPnL: 0,
            totalTrades: 0,
            winningTrades: 0,
            avgRR: 0
          };
        }
        
        const pnl = parseFloat(trade.resultado) || 0;
        const rrMatch = trade.comentario?.match(/R\/R:\s*(\d+\.?\d*)/);
        const rr = rrMatch ? parseFloat(rrMatch[1]) : 0;
        
        acc[date].trades.push({
          ...trade,
          rr: rr
        });
        acc[date].totalPnL += pnl;
        acc[date].totalTrades += 1;
        if (pnl > 0) acc[date].winningTrades += 1;
        
        return acc;
      }, {});
      
      // Calculate averages and format data
      const formattedData = Object.values(calendarData).map((day: any) => {
        const totalRR = day.trades.reduce((sum: number, trade: any) => sum + trade.rr, 0);
        return {
          ...day,
          avgRR: day.totalTrades > 0 ? (totalRR / day.totalTrades).toFixed(2) : '0.00',
          winRate: day.totalTrades > 0 ? (day.winningTrades / day.totalTrades * 100).toFixed(1) : '0.0'
        };
      });
      
      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      res.status(500).json({ message: "Erro ao buscar dados do calendário" });
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
      
      // Apply the same data cleaning that we use for CSV imports
      const cleanedData = validateAndCleanTrade({ ...validatedData, userId });
      
      console.log('Trade manual sendo criado:', {
        ativo: cleanedData.ativo,
        quantidade: cleanedData.quantidade,
        capitalUtilizado: cleanedData.capitalUtilizado,
        precoEntrada: cleanedData.precoEntrada
      });
      
      const trade = await storage.createTrade(cleanedData);
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

      const { broker = 'auto' } = req.body;
      // Auto-detect broker type or use provided value
      const validBrokers = ['forex', 'b3', 'crypto', 'auto'];
      const finalBroker = validBrokers.includes(broker) ? broker : 'auto';

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

  // AI Routes
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Mensagem é obrigatória' });
      }

      // Get user context for personalized responses
      const userId = req.headers['user-id'] as string;
      let userContext = undefined;
      
      if (userId) {
        const user = await storage.getUser(userId);
        const trades = await storage.getTrades(userId);
        
        if (user) {
          userContext = {
            perfilRisco: user.perfilRisco,
            capitalInicial: user.capitalInicial,
            metaMensal: user.metaMensal,
            tradesCount: trades.length
          };
        }
      }

      const reply = await aiService.chatWithTrader(message, userContext);
      res.json({ reply });
    } catch (error) {
      console.error('Erro no chat AI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/ai/advice', async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      
      if (!userId) {
        return res.json([]);
      }

      const userProfile = await storage.getUser(userId);
      const trades = await storage.getTrades(userId);
      
      if (!userProfile) {
        return res.json([]);
      }

      const recentTrades = trades.slice(-10); // Últimos 10 trades

      const advice = await aiService.generateTradingAdvice(userProfile, recentTrades);
      res.json(advice);
    } catch (error) {
      console.error('Erro ao gerar conselhos AI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/ai/analyze-trade', async (req, res) => {
    try {
      const tradeData = req.body;
      
      if (!tradeData.ativo || !tradeData.mercado) {
        return res.status(400).json({ error: 'Dados do trade incompletos' });
      }

      const analysis = await aiService.analyzeUserTrade(tradeData);
      res.json(analysis);
    } catch (error) {
      console.error('Erro na análise de trade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/ai/market-insight/:asset', async (req, res) => {
    try {
      const { asset } = req.params;
      
      if (!asset) {
        return res.status(400).json({ error: 'Ativo é obrigatório' });
      }

      const insight = await aiService.generateMarketInsight(asset);
      res.json(insight);
    } catch (error) {
      console.error('Erro no insight de mercado:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/ai/analyze-performance', async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const trades = await storage.getTrades(userId);
      
      if (trades.length === 0) {
        return res.json({
          summary: 'Nenhum trade encontrado para análise.',
          insights: ['Comece registrando seus trades para receber análises.'],
          recommendations: ['Use o formulário para adicionar seu primeiro trade.']
        });
      }

      const analysis = await aiService.analyzeTradingPerformance(trades);
      res.json(analysis);
    } catch (error) {
      console.error('Erro na análise de performance:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Analisar CSV e gerar dicas automáticas
  app.post('/api/ai/analyze-csv-tips', async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const trades = await storage.getTrades(userId);
      const csvImports = await storage.getCsvImports(userId);
      
      if (trades.length === 0) {
        return res.json({ tips: [] });
      }

      // Analisar trades recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTrades = trades.filter(trade => 
        new Date(trade.dataHora) > thirtyDaysAgo
      );

      const tips = await aiService.generateCsvBasedTips(recentTrades, csvImports);
      res.json({ tips });
    } catch (error) {
      console.error('Erro na análise de CSV para dicas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
