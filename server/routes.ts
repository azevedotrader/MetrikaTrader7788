import { Express } from "express";
import { Server, createServer } from "http";
import { z } from "zod";
import { insertTradeSchema, insertUserSchema, InsertTrade, updateUserByAdminSchema, insertSubscriptionPlanSchema } from "@shared/schema";
import { storage } from "./storage";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import { Readable } from "stream";
import jwt from "jsonwebtoken";

// Admin credentials (in production, this should be in environment variables)
const ADMIN_CREDENTIALS = {
  email: 'admin@metrika.com',
  password: 'admin123',
  name: 'Administrador Métrika'
};

const JWT_SECRET = process.env.JWT_SECRET || 'metrika_admin_secret_key_2025';

// Configure multer for file uploads - use disk storage for better compatibility
const upload = multer({ 
  dest: 'uploads/'
});

// Validation helper
function validateAndCleanTrade(trade: any): InsertTrade {
  const safeParseNumeric = (value: any, defaultValue: string = '0'): string => {
    if (!value && value !== 0) return defaultValue;
    // Preserve negative values and handle Brazilian decimal format
    const cleanValue = value.toString()
      .replace(/[^\d.,-]/g, '') // Keep minus, dots, commas
      .replace(',', '.'); // Convert comma to dot
    if (!cleanValue || cleanValue === '-' || cleanValue === '.') return defaultValue;
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? defaultValue : numValue.toString();
  };

  return {
    userId: trade.userId || "1",
    corretora: trade.corretora || 'crypto',
    origem: trade.origem || 'manual',
    mercado: trade.mercado || 'b3',
    setup: trade.setup || 'Manual',
    dataHora: trade.dataHora || new Date().toISOString(),
    ativo: trade.ativo || 'UNKNOWN',
    tipo: trade.tipo || 'compra',
    quantidade: safeParseNumeric(trade.quantidade, '1'),
    capitalUtilizado: safeParseNumeric(trade.capitalUtilizado, '100'),
    precoEntrada: safeParseNumeric(trade.precoEntrada, '1'),
    precoSaida: safeParseNumeric(trade.precoSaida, '1'),
    resultado: safeParseNumeric(trade.resultado, '0'),
    stop: safeParseNumeric(trade.stop, '0'),
    comentario: trade.comentario || ''
  };
}

// Enhanced field detection for CSV imports
function detectFieldMapping(row: any): Record<string, string> {
  const fieldMap: Record<string, string> = {};
  const keys = Object.keys(row);
  
  // Date/time mapping
  const datePatterns = ['date', 'time', 'data', 'hora', 'timestamp', 'created', 'closed', 'datetime'];
  const dateFields = keys.filter(key => 
    datePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (dateFields.length > 0) fieldMap.date = dateFields[0];
  
  // Symbol/asset mapping
  const symbolPatterns = ['symbol', 'pair', 'instrument', 'ativo', 'asset', 'currency', 'ticker'];
  const symbolFields = keys.filter(key => 
    symbolPatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (symbolFields.length > 0) fieldMap.symbol = symbolFields[0];
  
  // Volume/quantity mapping
  const volumePatterns = ['volume', 'amount', 'size', 'quantity', 'quantidade', 'qty'];
  const volumeFields = keys.filter(key => 
    volumePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (volumeFields.length > 0) fieldMap.volume = volumeFields[0];
  
  // Price mapping
  const openPricePatterns = ['open', 'entry', 'price', 'preco', 'fill'];
  const openPriceFields = keys.filter(key => 
    openPricePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (openPriceFields.length > 0) fieldMap.openPrice = openPriceFields[0];
  
  // Profit/loss mapping
  const profitPatterns = ['profit', 'loss', 'pnl', 'resultado', 'gain', 'return'];
  const profitFields = keys.filter(key => 
    profitPatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (profitFields.length > 0) fieldMap.profit = profitFields[0];
  
  // Side/direction mapping
  const sidePatterns = ['side', 'type', 'action', 'direction', 'buy', 'sell'];
  const sideFields = keys.filter(key => 
    sidePatterns.some(pattern => key.toLowerCase().includes(pattern))
  );
  if (sideFields.length > 0) fieldMap.side = sideFields[0];
  
  return fieldMap;
}

// Enhanced B3 CSV processing with proper field parsing
function processCsvRow(row: any, broker: string, userId: string, fieldMap?: Record<string, string>): InsertTrade | null {
  try {
    if (!row || typeof row !== 'object') return null;
    
    const hasAnyData = Object.values(row).some(value => value && value.toString().trim() !== '');
    if (!hasAnyData) return null;
    
    // Skip only clear header rows (not data rows)
    const firstValue = Object.values(row)[0]?.toString() || '';
    // Only skip obvious header rows, not data rows
    if (firstValue.startsWith('Conta:') || firstValue.startsWith('Titular:') || 
        firstValue.startsWith('Data de') || firstValue === 'Ativo' || 
        firstValue.includes('Relatório') || firstValue.includes('Período')) {
      return null;
    }
    
    console.log('Processando linha CSV:', row);
    
    // B3 CSV structure detection - check for B3 specific patterns
    const keys = Object.keys(row);
    const values = Object.values(row);
    const firstKey = keys[0] || '';
    // Check if first value contains asset symbols (WINM25, WINQ25, etc.)
    const hasAssetSymbol = values.some(v => {
      const str = v?.toString() || '';
      return /^(WIN[A-Z]?\d{2}|PETR\d|VALE\d|ITUB\d|[A-Z]{4}\d{2})$/.test(str);
    });
    const hasAccountInfo = firstKey.includes('Conta:') || hasAssetSymbol;
    const isB3Format = hasAccountInfo || keys.some(key => key.includes('Ativo') || key.includes('Abertura') || key.includes('Fechamento'));
    
    if (isB3Format) {
      console.log('Detectado formato B3, processando...', Object.keys(row));
      
      // B3 format processing - handle the actual CSV structure from the logs
      // The CSV appears to use the first column for asset names and numbered columns
      const ativo = row[keys[0]] || 'UNKNOWN'; // First column has asset names
      const abertura = row['_1'] || row[keys[1]] || ''; // Second column is date/time
      const fechamento = row['_2'] || row[keys[2]] || '';
      const lado = row['_6'] || row[keys[6]] || 'C'; // Column 7 is side (C/V)
      const qtdCompra = row['_4'] || row[keys[4]] || '0'; // Column 5 is buy quantity
      const qtdVenda = row['_5'] || row[keys[5]] || '0'; // Column 6 is sell quantity
      const precoCompra = row['_7'] || row[keys[7]] || '0'; // Column 8 is buy price
      const precoVenda = row['_8'] || row[keys[8]] || '0'; // Column 9 is sell price
      const resOperacao = row['_13'] || row[keys[13]] || '0'; // Column 14 is result (Res. Operação)
      
      console.log('Dados extraídos da linha:', {
        ativo,
        abertura,
        lado,
        qtdCompra,
        qtdVenda,
        resOperacao
      });
      
      // Parse date from abertura
      let tradeDate = new Date();
      if (abertura) {
        const dateMatch = abertura.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (dateMatch) {
          tradeDate = new Date(`${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`);
        }
      }
      
      if (isNaN(tradeDate.getTime())) {
        tradeDate = new Date();
      }
      
      // Clean and parse numeric values (Brazilian format: 1.234.567,89)
      const cleanNumber = (value: string): number => {
        if (!value) return 0;
        const str = value.toString().trim();
        
        // Handle Brazilian format: remove dots (thousands) and convert comma to dot (decimal)
        // Examples: "1.500,00" -> "1500.00", "-630,00" -> "-630.00"
        let cleaned = str
          .replace(/[^\d.,-]/g, '') // Keep only digits, dots, commas, minus
          .replace(/(\d)\.(\d{3})/g, '$1$2') // Remove dots used as thousands separators
          .replace(',', '.'); // Convert comma to dot for decimal
        
        const result = parseFloat(cleaned) || 0;
        if (str !== '0' && str !== '') {
          console.log(`cleanNumber('${value}') -> '${cleaned}' -> ${result}`);
        }
        return result;
      };
      
      const quantidade = lado === 'C' ? cleanNumber(qtdCompra) : cleanNumber(qtdVenda);
      const precoEntrada = lado === 'C' ? cleanNumber(precoCompra) : cleanNumber(precoVenda);
      const precoSaida = lado === 'C' ? cleanNumber(precoVenda) : cleanNumber(precoCompra);
      const resultado = cleanNumber(resOperacao);
      
      console.log('Validação dos dados:', {
        quantidade,
        ativo,
        precoEntrada,
        resultado,
        isValidQuantity: quantidade > 0,
        isValidAsset: ativo && ativo !== 'UNKNOWN' && !ativo.includes('Conta:') && !ativo.includes('Total')
      });
      
      // Be more permissive with data validation
      if (quantidade <= 0 || !ativo || ativo === 'UNKNOWN' || ativo.includes('Conta:') || ativo.includes('Total')) {
        console.log('❌ Linha rejeitada: dados insuficientes');
        return null;
      }
      
      console.log('✅ Linha aceita para processamento');
      
      const trade = {
        userId,
        corretora: 'b3' as const,
        origem: 'csv' as const,
        mercado: 'b3' as const,
        setup: 'CSV Import',
        dataHora: tradeDate.toISOString(),
        ativo: ativo.toString().toUpperCase(),
        tipo: lado === 'C' ? 'compra' : 'venda',
        quantidade: quantidade.toString(),
        capitalUtilizado: (quantidade * precoEntrada).toString(),
        precoEntrada: precoEntrada.toString(),
        precoSaida: precoSaida.toString(),
        resultado: resultado.toString(),
        stop: '0',
        comentario: `CSV Import - ${ativo}`
      } as InsertTrade;
      
      console.log('Trade B3 criado:', {
        ativo: trade.ativo,
        data: trade.dataHora,
        tipo: trade.tipo,
        quantidade: trade.quantidade,
        resultado: trade.resultado,
        resOperacaoOriginal: resOperacao,
        resultadoLimpo: resultado
      });
      
      return validateAndCleanTrade(trade);
    }
    
    // Fallback to generic processing for other formats
    const rowValues = Object.values(row);
    
    // Date detection
    let dateValue = rowValues.find(val => /\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4}/.test(val?.toString() || ''));
    
    let tradeDate = new Date();
    if (dateValue) {
      const dateStr = dateValue.toString();
      if (/\d{2}[-\/]\d{2}[-\/]\d{4}/.test(dateStr)) {
        const parts = dateStr.split(/[-\/]/);
        tradeDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else if (/\d{4}[-\/]\d{2}[-\/]\d{2}/.test(dateStr)) {
        tradeDate = new Date(dateStr);
      }
    }
    
    if (isNaN(tradeDate.getTime())) {
      tradeDate = new Date();
    }
    
    // Symbol detection
    let symbol = rowValues.find(val => /^[A-Z]{3,6}$|^[A-Z]+\d*$/.test(val?.toString() || '')) || 'UNKNOWN';
    
    // Type detection
    let type = rowValues.find(val => /^(buy|sell|compra|venda|C|V)$/i.test(val?.toString() || '')) || 'buy';
    
    // Quantity detection
    let quantity = parseFloat(rowValues.find(val => {
      const num = parseFloat(val?.toString()?.replace(/[^\d.-]/g, '') || '0');
      return !isNaN(num) && num > 0 && num <= 10000;
    })?.toString() || '1') || 1;
    
    // Price detection
    let openPrice = parseFloat(rowValues.find(val => {
      const num = parseFloat(val?.toString()?.replace(/[^\d.-]/g, '') || '0');
      return !isNaN(num) && num > 0 && num <= 100000;
    })?.toString() || '1') || 1;
    
    // Profit detection
    let profit = parseFloat(rowValues.find(val => {
      const num = parseFloat(val?.toString()?.replace(/[^\d.-]/g, '') || '0');
      return !isNaN(num) && Math.abs(num) <= 50000;
    })?.toString() || '0') || 0;
    
    // Market detection
    let market = 'b3';
    if (/USD|EUR|GBP|JPY/.test(symbol.toString())) {
      market = 'forex';
    } else if (/BTC|ETH|USDT/.test(symbol.toString())) {
      market = 'crypto';
    }
    
    const trade = {
      userId,
      corretora: market as 'crypto' | 'forex' | 'b3',
      origem: 'csv',
      mercado: market as 'crypto' | 'forex' | 'b3',
      setup: 'CSV Import',
      dataHora: tradeDate.toISOString(),
      ativo: symbol.toString().toUpperCase(),
      tipo: type.toString().toLowerCase().includes('sell') || type.toString().toLowerCase().includes('venda') || type === 'V' ? 'venda' : 'compra',
      quantidade: quantity.toString(),
      capitalUtilizado: (quantity * openPrice).toString(),
      precoEntrada: openPrice.toString(),
      precoSaida: openPrice.toString(),
      resultado: profit.toString(),
      stop: '0',
      comentario: 'CSV Import'
    } as InsertTrade;
    
    return validateAndCleanTrade(trade);
  } catch (error) {
    console.error('Error processing CSV row:', error);
    return null;
  }
}

// CSV parsing function for trades
function parseTradeFromCSVRow(row: any, fieldMap: any): InsertTrade | null {
  try {
    console.log('Processando linha CSV:', row);

    // DATE - try to find a date field
    let dateValue = row[fieldMap.date || ''] ||
                    Object.values(row).find(val => {
                      const str = val?.toString() || '';
                      return /\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(str);
                    }) || new Date().toISOString().split('T')[0];

    let tradeDate = new Date();
    if (typeof dateValue === 'string') {
      if (/\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(dateValue)) {
        const parts = dateValue.split(/[\/\-]/);
        tradeDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else if (/\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(dateValue)) {
        tradeDate = new Date(dateValue);
      }
    }

    if (isNaN(tradeDate.getTime())) {
      tradeDate = new Date();
    }

    // SYMBOL - find trading instrument
    let symbolStr = row[fieldMap.symbol || ''] ||
                    Object.values(row).find(val => {
                      const str = val?.toString() || '';
                      return /^[A-Z]{3,6}$|^[A-Z]+\d*$/.test(str);
                    }) || 'UNKNOWN';

    // TYPE - buy/sell
    let typeStr = row[fieldMap.side || ''] ||
                  Object.values(row).find(val => /^(buy|sell|compra|venda)$/i.test(val?.toString() || '')) ||
                  'buy';

    // QUANTITY
    let quantity = parseFloat(String(row[fieldMap.volume || ''] ||
                   Object.values(row).find(val => {
                     const num = parseFloat(val?.toString()?.replace(/[^\d.-]/g, '') || '0');
                     return !isNaN(num) && num > 0 && num <= 1000000;
                   }) || '1').replace(/[^\d.-]/g, '')) || 1;

    // PRICES
    let openPrice = parseFloat(String(row[fieldMap.openPrice || ''] ||
                    Object.values(row).find(val => {
                      const str = val?.toString() || '';
                      const num = parseFloat(str.replace(/[^\d.-]/g, ''));
                      return !isNaN(num) && num > 0 && num <= 100000;
                    }) || '1').replace(/[^\d.-]/g, '')) || 1;

    let closePrice = parseFloat(String(row[fieldMap.closePrice || ''] ||
                     Object.values(row).find(val => {
                       const str = val?.toString() || '';
                       const num = parseFloat(str.replace(/[^\d.-]/g, ''));
                       return !isNaN(num) && num > 0 && num <= 100000;
                     }) || String(openPrice)).replace(/[^\d.-]/g, '')) || openPrice;

    // PROFIT
    let profit = parseFloat(String(row[fieldMap.profit || ''] ||
                 Object.values(row).find(val => {
                   const str = val?.toString() || '';
                   const num = parseFloat(str.replace(/[^\d.-]/g, ''));
                   return !isNaN(num) && Math.abs(num) <= 50000;
                 }) || '0').replace(/[^\d.-]/g, '')) || 0;

    // STOP LOSS
    let stopLoss = parseFloat(String(row[fieldMap.stopLoss || ''] ||
                   Object.values(row).find(val => {
                     const str = val?.toString() || '';
                     const num = parseFloat(str.replace(/[^\d.-]/g, ''));
                     return !isNaN(num) && Math.abs(num) <= 50000;
                   }) || '0').replace(/[^\d.-]/g, '')) || 0;

    // Calculate R/R ratio
    let rrRatio = 0;
    if (profit !== 0 && stopLoss !== 0) {
      rrRatio = Math.abs(profit) / Math.abs(stopLoss);
    }

    // Detect market
    let detectedMarket = 'B3';
    if (/USD|EUR|GBP|JPY/.test(symbolStr)) {
      detectedMarket = 'Forex';
    } else if (/BTC|ETH|USDT/.test(symbolStr)) {
      detectedMarket = 'Crypto';
    }

    const trade = {
      userId: "1",
      corretora: detectedMarket === 'Forex' ? 'forex' : detectedMarket === 'Crypto' ? 'crypto' : 'b3',
      origem: 'csv',
      mercado: detectedMarket.toLowerCase() as 'crypto' | 'forex' | 'b3',
      setup: 'CSV Import',
      dataHora: tradeDate.toISOString(),
      ativo: symbolStr.toUpperCase(),
      tipo: typeStr.toLowerCase().includes('sell') || typeStr.toLowerCase().includes('venda') ? 'venda' : 'compra',
      quantidade: quantity.toString(),
      capitalUtilizado: (quantity * openPrice).toString(),
      precoEntrada: openPrice.toString(),
      precoSaida: closePrice.toString(),
      resultado: profit.toString(),
      stop: stopLoss.toString(),
      comentario: rrRatio > 0 ? `R/R: 1:${rrRatio.toFixed(2)}` : 'CSV Import'
    };

    console.log('Trade processado:', {
      ativo: trade.ativo,
      dataHora: trade.dataHora.substring(0, 10),
      resultado: trade.resultado,
      stop: trade.stop,
      comentario: trade.comentario
    });

    return validateAndCleanTrade(trade);
  } catch (error) {
    console.error('Erro ao processar linha:', error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<void> {
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

  // Get all trades
  app.get("/api/trades", async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get trades by broker
  app.get("/api/trades/:corretora", async (req, res) => {
    try {
      const { corretora } = req.params;
      const trades = await storage.getTradesByBroker(corretora);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades by broker:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get calendar data
  app.get("/api/calendar", async (req, res) => {
    try {
      const trades = await storage.getAllTrades();
      
      // Group trades by date
      const calendarData = trades.reduce((acc: any, trade) => {
        const date = new Date(trade.dataHora).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            date,
            trades: [],
            totalTrades: 0,
            profit: 0,
            loss: 0,
            avgRR: 0
          };
        }
        
        acc[date].trades.push(trade);
        acc[date].totalTrades++;
        
        const resultado = parseFloat(trade.resultado || "0");
        if (resultado > 0) {
          acc[date].profit += resultado;
        } else {
          acc[date].loss += Math.abs(resultado);
        }
        
        // Calculate average R/R from comments
        const comentario = trade.comentario || "";
        const rrMatch = comentario.match(/R\/R:\s*1:(\d+(?:\.\d+)?)/);
        if (rrMatch) {
          const rr = parseFloat(rrMatch[1]);
          acc[date].avgRR = (acc[date].avgRR + rr) / 2;
        }
        
        return acc;
      }, {});
      
      res.json(Object.values(calendarData));
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Create trade
  app.post("/api/trades", async (req, res) => {
    try {
      const validatedData = insertTradeSchema.parse({
        ...req.body,
        userId: "1", // Mock user ID
        origem: 'manual'
      });

      const trade = await storage.createTrade(validatedData);
      res.status(201).json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // CSV Import
  app.post("/api/trades/import/:corretora", upload.single('file'), async (req, res) => {
    try {
      const { corretora } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      console.log(`Iniciando importação CSV para ${corretora}:`, file.filename);

      const fieldMap = JSON.parse(req.body.fieldMap || '{}');
      const trades: InsertTrade[] = [];
      const errors: string[] = [];

      return new Promise((resolve) => {
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (row) => {
            try {
              const trade = parseTradeFromCSVRow(row, fieldMap);
              if (trade) {
                // Override broker - ensure it's a valid enum value
                if (['crypto', 'forex', 'b3'].includes(corretora)) {
                  trade.corretora = corretora as 'crypto' | 'forex' | 'b3';
                }
                trades.push(trade);
              }
            } catch (error) {
              errors.push(`Erro na linha: ${error}`);
              console.error('Erro ao processar linha:', error);
            }
          })
          .on('end', async () => {
            try {
              console.log(`Processadas ${trades.length} operações válidas`);
              
              if (trades.length === 0) {
                return res.status(400).json({ 
                  message: "Nenhuma operação válida encontrada no arquivo",
                  errors 
                });
              }

              // Bulk insert
              const savedTrades = [];
              let successCount = 0;

              for (const trade of trades) {
                try {
                  const savedTrade = await storage.createTrade(trade);
                  savedTrades.push(savedTrade);
                  successCount++;
                } catch (error) {
                  errors.push(`Erro ao salvar trade: ${error}`);
                  console.error('Erro ao salvar trade:', error);
                }
              }

              // Clean up uploaded file
              fs.unlinkSync(file.path);

              res.status(201).json({
                message: `${successCount} operações importadas com sucesso`,
                imported: successCount,
                errors: errors.length,
                trades: savedTrades.slice(0, 10) // Return first 10 for preview
              });

            } catch (error) {
              console.error("Error saving trades:", error);
              res.status(500).json({ message: "Erro ao salvar operações" });
            }
          })
          .on('error', (error) => {
            console.error("CSV parsing error:", error);
            res.status(500).json({ message: "Erro ao processar arquivo CSV" });
          });
      });

    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update trade
  app.put("/api/trades/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertTradeSchema.partial().parse(req.body);

      const trade = await storage.updateTrade(id, validatedData);
      res.json(trade);
    } catch (error) {
      console.error("Error updating trade:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Delete trade
  app.delete("/api/trades/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTrade(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // CSV Upload endpoint (used by frontend)
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
      const validBrokers = ['forex', 'b3', 'crypto', 'auto'];
      const finalBroker = validBrokers.includes(broker) ? broker : 'auto';

      console.log(`Iniciando importação CSV: ${req.file.originalname} para broker: ${broker}`);

      const results: any[] = [];
      const errors: string[] = [];
      
      // Parse CSV from file with proper encoding handling
      const csvContent = fs.readFileSync(req.file.path, 'latin1');
      const stream = Readable.from(csvContent);
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv({ separator: ';' })) // B3 uses semicolon separator
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
      const validTrades: InsertTrade[] = [];
      
      for (let i = 0; i < results.length; i++) {
        try {
          const row = results[i];
          
          // Skip empty rows
          const hasData = Object.values(row).some(value => value && value.toString().trim() !== '');
          if (!hasData) {
            continue;
          }

          const trade = processCsvRow(row, finalBroker, userId, fieldMap);
          if (trade) {
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
      try {
        await storage.createCsvImport({
          userId,
          broker: finalBroker,
          fileName: req.file.originalname,
          tradesImported: savedTrades.length,
          tradesSkipped: results.length - savedTrades.length,
          status: savedTrades.length > 0 ? 'completed' : 'failed',
          errorMessage: errors.length > 0 ? errors.slice(0, 10).join('; ') : null
        });
      } catch (importError) {
        console.error('Error logging import:', importError);
      }

      // Clean up uploaded file
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }

      res.json({
        message: `Importação concluída: ${savedTrades.length} trades importados`,
        tradesImported: savedTrades.length,
        tradesSkipped: results.length - savedTrades.length,
        totalRows: results.length,
        errors: errors.slice(0, 5),
        fieldMapping: fieldMap
      });

    } catch (error) {
      console.error("CSV upload error:", error);
      res.status(500).json({ message: "Erro ao processar arquivo CSV" });
    }
  });

  // CSV Imports history
  app.get("/api/csv-imports", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string || "1";
      const imports = await storage.getCsvImports(userId);
      res.json(imports);
    } catch (error) {
      console.error("Error fetching CSV imports:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Trades by broker endpoint
  app.get("/api/trades/by-broker", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string || "1";
      const tradesByBroker = await storage.getAllTrades();
      res.json(tradesByBroker);
    } catch (error) {
      console.error("Error fetching trades by broker:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Trading analytics endpoint with proper calculations
  app.get("/api/analytics", async (req, res) => {
    try {
      const userId = req.headers['user-id'] as string || "1";
      const trades = await storage.getAllTrades();
      
      if (trades.length === 0) {
        return res.json({
          totalTrades: 0,
          totalProfit: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          payoffRatio: 0,
          worstTrade: 0,
          bestTrade: 0,
          tradesByDate: {}
        });
      }
      
      // Parse results as numbers
      const results = trades.map(trade => {
        const result = parseFloat(trade.resultado || '0');
        return {
          ...trade,
          resultadoNum: result,
          date: new Date(trade.dataHora).toISOString().split('T')[0]
        };
      });
      
      // Separate wins and losses
      const winningTrades = results.filter(t => t.resultadoNum > 0);
      const losingTrades = results.filter(t => t.resultadoNum < 0);
      
      // Calculate metrics
      const totalProfit = results.reduce((sum, trade) => sum + trade.resultadoNum, 0);
      const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
      
      const avgWin = winningTrades.length > 0 
        ? winningTrades.reduce((sum, trade) => sum + trade.resultadoNum, 0) / winningTrades.length 
        : 0;
      
      const avgLoss = losingTrades.length > 0 
        ? Math.abs(losingTrades.reduce((sum, trade) => sum + trade.resultadoNum, 0) / losingTrades.length)
        : 0;
      
      const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
      
      const worstTrade = results.length > 0 
        ? Math.min(...results.map(t => t.resultadoNum)) 
        : 0;
      
      const bestTrade = results.length > 0 
        ? Math.max(...results.map(t => t.resultadoNum)) 
        : 0;
      
      // Group trades by date
      const tradesByDate = results.reduce((acc, trade) => {
        const date = trade.date;
        if (!acc[date]) {
          acc[date] = {
            trades: 0,
            profit: 0,
            wins: 0,
            losses: 0
          };
        }
        acc[date].trades++;
        acc[date].profit += trade.resultadoNum;
        if (trade.resultadoNum > 0) {
          acc[date].wins++;
        } else if (trade.resultadoNum < 0) {
          acc[date].losses++;
        }
        return acc;
      }, {} as Record<string, any>);
      
      res.json({
        totalTrades: trades.length,
        totalProfit: Math.round(totalProfit * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
        avgWin: Math.round(avgWin * 100) / 100,
        avgLoss: Math.round(avgLoss * 100) / 100,
        payoffRatio: Math.round(payoffRatio * 100) / 100,
        worstTrade: Math.round(worstTrade * 100) / 100,
        bestTrade: Math.round(bestTrade * 100) / 100,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        tradesByDate
      });
      
    } catch (error) {
      console.error("Error calculating analytics:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // AI advice endpoint (placeholder)
  app.get("/api/ai/advice", async (req, res) => {
    try {
      res.json({ advice: "Continue operando com disciplina e seguindo seu plano de trading." });
    } catch (error) {
      console.error("Error fetching AI advice:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ADMIN AUTHENTICATION ROUTES
  
  // Admin login
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const token = jwt.sign(
          { 
            email: ADMIN_CREDENTIALS.email, 
            name: ADMIN_CREDENTIALS.name, 
            role: 'admin' 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({
          token,
          admin: {
            email: ADMIN_CREDENTIALS.email,
            name: ADMIN_CREDENTIALS.name,
            role: 'admin'
          }
        });
      } else {
        res.status(401).json({ message: 'Credenciais inválidas' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  // Admin token verification
  app.get("/api/admin/auth/verify", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token requerido' });
      }
      
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      if (decoded.role === 'admin') {
        res.json({
          email: decoded.email,
          name: decoded.name,
          role: decoded.role
        });
      } else {
        res.status(403).json({ message: 'Acesso negado' });
      }
    } catch (error) {
      res.status(401).json({ message: 'Token inválido' });
    }
  });
  
  // ADMIN PROTECTED ROUTES
  
  // Admin authentication middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Privilégios de administrador requeridos.' });
      }
      req.admin = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };

  // GET /api/admin/users - Listar todos os usuários
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // PUT /api/admin/users/:id - Atualizar usuário
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const updates = updateUserByAdminSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserByAdmin(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao atualizar usuário" 
      });
    }
  });

  // DELETE /api/admin/users/:id - Deletar usuário
  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      await storage.deleteUser(userId);
      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Erro ao deletar usuário" });
    }
  });

  // GET /api/admin/plans - Listar todos os planos
  app.get("/api/admin/plans", requireAdmin, async (req, res) => {
    try {
      const plans = await storage.getAllPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // POST /api/admin/plans - Criar novo plano
  app.post("/api/admin/plans", requireAdmin, async (req, res) => {
    try {
      const planData = insertSubscriptionPlanSchema.parse(req.body);
      const newPlan = await storage.createPlan(planData);
      res.status(201).json(newPlan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao criar plano" 
      });
    }
  });

  // PUT /api/admin/plans/:id - Atualizar plano
  app.put("/api/admin/plans/:id", requireAdmin, async (req, res) => {
    try {
      const planId = req.params.id;
      const updates = insertSubscriptionPlanSchema.partial().parse(req.body);
      
      const updatedPlan = await storage.updatePlan(planId, updates);
      res.json(updatedPlan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao atualizar plano" 
      });
    }
  });

  // DELETE /api/admin/plans/:id - Deletar plano
  app.delete("/api/admin/plans/:id", requireAdmin, async (req, res) => {
    try {
      const planId = req.params.id;
      await storage.deletePlan(planId);
      res.json({ message: "Plano deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Erro ao deletar plano" });
    }
  });

  // GET /api/admin/stats - Estatísticas da plataforma
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      
      // Se não há stats, calcular em tempo real
      if (!stats) {
        const allUsers = await storage.getAllUsers();
        const allTrades = await storage.getAllTrades();
        
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(u => u.isActive).length;
        const freeUsers = allUsers.filter(u => u.planType === 'free').length;
        const premiumUsers = allUsers.filter(u => u.planType === 'premium').length;
        const vipUsers = allUsers.filter(u => u.planType === 'vip').length;
        
        // Calcular receita mensal (exemplo baseado nos planos)
        const monthlyRevenue = (premiumUsers * 97) + (vipUsers * 297);
        
        const calculatedStats = {
          date: new Date(),
          totalUsers,
          activeUsers,
          newUsers: 0, // Seria calculado baseado em registros do mês
          totalTrades: allTrades.length,
          monthlyRevenue,
          freeUsers,
          premiumUsers,
          vipUsers,
        };
        
        res.json(calculatedStats);
      } else {
        res.json(stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // POST /api/admin/stats - Atualizar estatísticas
  app.post("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const statsData = req.body;
      const updatedStats = await storage.updatePlatformStats(statsData);
      res.json(updatedStats);
    } catch (error) {
      console.error("Error updating stats:", error);
      res.status(500).json({ message: "Erro ao atualizar estatísticas" });
    }
  });

  const httpServer = createServer(app);
}