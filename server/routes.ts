import { Express } from "express";
import { Server } from "http";
import { z } from "zod";
import { insertTradeSchema, insertUserSchema, InsertTrade } from "@shared/schema";
import { storage } from "./storage";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import { Readable } from "stream";

// Configure multer for file uploads - use disk storage for better compatibility
const upload = multer({ 
  dest: 'uploads/'
});

// Validation helper
function validateAndCleanTrade(trade: any): InsertTrade {
  const safeParseNumeric = (value: any, defaultValue: string = '0'): string => {
    if (!value) return defaultValue;
    const cleanValue = value.toString().replace(/[^\d.-]/g, '');
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

// Smart CSV row processing
function processCsvRow(row: any, broker: string, userId: string, fieldMap?: Record<string, string>): InsertTrade | null {
  try {
    if (!row || typeof row !== 'object') return null;
    
    const hasAnyData = Object.values(row).some(value => value && value.toString().trim() !== '');
    if (!hasAnyData) return null;
    
    // Extract data using field mapping or smart detection
    const values = Object.values(row);
    const keys = Object.keys(row);
    
    // Date detection
    let dateValue = fieldMap?.date ? row[fieldMap.date] : 
      values.find(val => /\d{4}[-\/]\d{2}[-\/]\d{2}|\d{2}[-\/]\d{2}[-\/]\d{4}/.test(val?.toString() || ''));
    
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
    let symbol = fieldMap?.symbol ? row[fieldMap.symbol] : 
      values.find(val => /^[A-Z]{3,6}$|^[A-Z]+\d*$/.test(val?.toString() || '')) || 'UNKNOWN';
    
    // Type detection
    let type = fieldMap?.side ? row[fieldMap.side] : 
      values.find(val => /^(buy|sell|compra|venda)$/i.test(val?.toString() || '')) || 'buy';
    
    // Quantity detection
    let quantity = fieldMap?.volume ? parseFloat(row[fieldMap.volume]) : 
      parseFloat(values.find(val => {
        const num = parseFloat(val?.toString()?.replace(/[^\d.-]/g, '') || '0');
        return !isNaN(num) && num > 0 && num <= 10000;
      })?.toString() || '1') || 1;
    
    // Price detection
    let openPrice = fieldMap?.openPrice ? parseFloat(row[fieldMap.openPrice]) : 
      parseFloat(values.find(val => {
        const num = parseFloat(val?.toString()?.replace(/[^\d.-]/g, '') || '0');
        return !isNaN(num) && num > 0 && num <= 100000;
      })?.toString() || '1') || 1;
    
    // Profit detection
    let profit = fieldMap?.profit ? parseFloat(row[fieldMap.profit]) : 
      parseFloat(values.find(val => {
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
      tipo: type.toString().toLowerCase().includes('sell') || type.toString().toLowerCase().includes('venda') ? 'venda' : 'compra',
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
      
      // Parse CSV from file
      const stream = fs.createReadStream(req.file.path);
      
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
      const tradesByBroker = await storage.getTradesByBroker("");
      res.json(tradesByBroker);
    } catch (error) {
      console.error("Error fetching trades by broker:", error);
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

  // Routes registered successfully
}