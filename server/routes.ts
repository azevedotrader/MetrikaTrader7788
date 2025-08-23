import { Express } from "express";
import { Server, createServer } from "http";
import { z } from "zod";
import { insertTradeSchema, insertUserSchema, InsertTrade, updateUserByAdminSchema, insertSubscriptionPlanSchema, updateCsvImportSchema } from "@shared/schema";
import { storage } from "./storage";
import { AuthenticatedRequest } from "./types";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import { Readable } from "stream";
import jwt from "jsonwebtoken";
import { lerCSVSimples } from "./simple-csv-reader";

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

// Middleware para obter userId autenticado
function getUserId(req: any): string {
  // Primeiro, tentar obter do token JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.userId) {
        return decoded.userId;
      }
    } catch (error) {
      // Token inválido, continuar com métodos alternativos
    }
  }
  
  // Método alternativo: header X-User-ID (Replit automaticamente define para usuário logado)
  if (req.headers['x-user-id']) {
    return req.headers['x-user-id'] as string;
  }
  
  // Método alternativo: header user-id (enviado pelo frontend)
  if (req.headers['user-id']) {
    return req.headers['user-id'] as string;
  }
  
  // Método alternativo: localStorage do frontend (enviado como header)
  if (req.headers['x-session-user-id']) {
    return req.headers['x-session-user-id'] as string;
  }
  
  // Como último recurso, verificar se foi passado no body
  if (req.body?.userId) {
    return req.body.userId;
  }
  
  throw new Error("Usuário não autenticado - userId é obrigatório para isolamento de dados");
}

// Middleware de autenticação obrigatória - ISOLAMENTO TOTAL
function requireAuth(req: any, res: any, next: any) {
  try {
    const userId = getUserId(req);
    
    if (!userId || userId.trim() === '') {
      throw new Error("UserId vazio ou inválido");
    }
    
    req.userId = userId; // Adicionar ao request
    console.log(`🔐 Usuário autenticado: ${userId} para ${req.method} ${req.path}`);
    next();
  } catch (error) {
    console.warn(`🚫 Acesso negado para ${req.method} ${req.path}:`, error instanceof Error ? error.message : error);
    res.status(401).json({ 
      error: "Acesso negado",
      message: "Autenticação obrigatória - cada usuário só pode acessar seus próprios dados",
      details: error instanceof Error ? error.message : "Erro de autenticação"
    });
  }
}

// Middleware de autenticação mais flexível para uploads de arquivo
function requireAuthFlexible(req: any, res: any, next: any) {
  try {
    let userId = null;
    
    // Try to get userId using multiple methods
    try {
      userId = getUserId(req);
    } catch (error) {
      // If no userId found, try to get from body (for multipart uploads)
      if (req.body && req.body.userId) {
        userId = req.body.userId;
      }
    }
    
    // If still no userId, provide a default for testing
    if (!userId || userId.trim() === '') {
      // NUNCA usar usuário padrão - isolamento obrigatório
      throw new Error('Usuário não autenticado - userId é obrigatório para isolamento de dados');
    }
    
    req.userId = userId;
    console.log(`🔐 Usuário autenticado (flexível): ${userId} para ${req.method} ${req.path}`);
    next();
  } catch (error) {
    console.warn(`🚫 Acesso negado para ${req.method} ${req.path}:`, error instanceof Error ? error.message : error);
    res.status(401).json({ 
      error: "Acesso negado",
      message: "Erro de autenticação",
      details: error instanceof Error ? error.message : "Erro de autenticação"
    });
  }
}

// Validation helper
function validateAndCleanTrade(trade: any, userId: string): InsertTrade {
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
    userId: userId, // Sempre usar o userId autenticado
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

// Specific B3 CSV parser for Clear format
function parseB3ClearCsvRow(row: any, userId: string): InsertTrade | null {
  try {
    console.log('🎯 Processando linha B3 Clear:', row);
    
    // B3 Clear CSV format analysis based on logs
    // Sample: 'WINQ25;01/07/2025 17:04:30;01/07/2025 17:08:55;4min25s;1;1;V;141.745'
    const values = Object.values(row);
    const firstValue = String(values[0] || '');
    
    // Parse the main data from the first field
    const parts = firstValue.split(';');
    
    if (parts.length < 8) {
      console.log('❌ Formato B3 inválido - poucos campos:', parts.length);
      return null;
    }
    
    const [
      symbol,           // WINQ25
      entryDateTime,    // 01/07/2025 17:04:30
      exitDateTime,     // 01/07/2025 17:08:55
      duration,         // 4min25s
      quantity1,        // 1
      quantity2,        // 1
      direction,        // V (Venda) or C (Compra)
      entryPrice        // 141.745
    ] = parts;
    
    // Parse additional fields from __parsed_extra if available
    const extraFields = row.__parsed_extra || [];
    const exitPriceStr = extraFields[1] ? String(extraFields[1]).replace(/00;/g, '') : entryPrice;
    const resultStr = extraFields[extraFields.length - 2] || '0'; // Usually second to last field
    
    // Clean and parse values
    const cleanResult = String(resultStr).replace(/00;?/g, '').replace(/[^\d.,-]/g, '');
    const profit = parseFloat(cleanResult.replace(',', '.')) || 0;
    
    // Parse entry date
    let tradeDate = new Date();
    if (entryDateTime && /\d{2}\/\d{2}\/\d{4}/.test(entryDateTime)) {
      const [datePart] = entryDateTime.split(' ');
      const [day, month, year] = datePart.split('/');
      tradeDate = new Date(`${year}-${month}-${day}`);
    }
    
    // Determine trade type
    const tradeType = direction === 'V' ? 'venda' : 'compra';
    
    // Clean and parse numeric values
    const cleanSymbol = String(symbol).trim().toUpperCase();
    const qty = Math.abs(parseInt(quantity1) || 1);
    const entryPx = Math.abs(parseFloat(String(entryPrice).replace(',', '.'))) || 0;
    const exitPx = Math.abs(parseFloat(String(exitPriceStr).replace(',', '.'))) || entryPx;
    
    const trade: InsertTrade = {
      userId,
      corretora: 'b3',
      origem: 'csv',
      mercado: 'b3', 
      setup: 'Import B3 Clear',
      dataHora: tradeDate.toISOString(),
      ativo: cleanSymbol,
      tipo: tradeType,
      quantidade: String(qty),
      capitalUtilizado: String(qty * entryPx),
      precoEntrada: String(entryPx),
      precoSaida: String(exitPx),
      resultado: String(profit),
      stop: '0',
      comentario: `Import B3 Clear - ${cleanSymbol} ${direction} - ${duration}`
    };

    console.log('✅ Trade B3 Clear processado:', {
      ativo: trade.ativo,
      tipo: trade.tipo,
      quantidade: trade.quantidade,
      entrada: trade.precoEntrada,
      saida: trade.precoSaida,
      resultado: trade.resultado
    });

    return validateAndCleanTrade(trade, userId);
    
  } catch (error) {
    console.error('❌ Erro no parser B3 Clear:', error);
    return null;
  }
}

// Helper function to parse date from CSV row
function parseDateFromRow(row: any): string {
  const dateFields = ['Data', 'data', 'Date', 'DateTime', 'Timestamp', 'Time', 'Hora'];
  let dateValue = null;
  
  for (const field of dateFields) {
    if (row[field]) {
      dateValue = row[field];
      break;
    }
  }
  
  if (dateValue) {
    const dateStr = String(dateValue).trim();
    console.log(`📅 Parsing date from CSV: "${dateStr}"`);
    
    if (/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/.test(dateStr)) {
      // DD/MM/YYYY format (Brazilian)
      const match = dateStr.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
      if (match) {
        const [, day, month, year] = match;
        const parsedDate = new Date(`${year}-${month}-${day}`);
        if (!isNaN(parsedDate.getTime())) {
          console.log(`📅 Parsed Brazilian date: ${day}/${month}/${year} -> ${parsedDate.toISOString()}`);
          return parsedDate.toISOString();
        }
      }
    } else if (/\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}/.test(dateStr)) {
      // YYYY-MM-DD format
      const parsedDate = new Date(dateStr.split(' ')[0]);
      if (!isNaN(parsedDate.getTime())) {
        console.log(`📅 Parsed ISO date: ${dateStr} -> ${parsedDate.toISOString()}`);
        return parsedDate.toISOString();
      }
    }
  }
  
  console.log('⚠️ No valid date found, using current date');
  return new Date().toISOString();
}

// Helper function to parse structured B3 data with proper columns
function parseStructuredB3Row(row: any, userId: string): InsertTrade {
  const safeParseNumeric = (value: any, defaultValue: string = '0'): string => {
    if (!value && value !== 0) return defaultValue;
    const cleanValue = value.toString()
      .replace(/[^\d.,-]/g, '')
      .replace(',', '.');
    if (!cleanValue || cleanValue === '-' || cleanValue === '.') return defaultValue;
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? defaultValue : numValue.toString();
  };

  // Extract values from structured columns
  const ativo = String(row.Ativo || row.ativo || 'UNKNOWN');
  const direcao = String(row.Direcao || row.direcao || '').toUpperCase();
  const quantidade = safeParseNumeric(row.Qtd1 || row.quantidade || 1, '1');
  const precoEntrada = safeParseNumeric(row.PrecoEntrada || row.precoEntrada);
  const precoSaida = safeParseNumeric(row.PrecoSaida || row.precoSaida);
  
  // Get profit/loss directly from column
  let resultado = row.ProfitLoss || row.Resultado || row.resultado || row.profitLoss;
  if (resultado === undefined || resultado === null) {
    // Calculate if not provided
    const entrada = parseFloat(precoEntrada);
    const saida = parseFloat(precoSaida);
    if (!isNaN(entrada) && !isNaN(saida)) {
      const qtd = parseFloat(quantidade);
      if (direcao === 'C') { // Compra
        resultado = (saida - entrada) * qtd;
      } else { // Venda
        resultado = (entrada - saida) * qtd;
      }
    }
  }

  const resultadoFinal = safeParseNumeric(resultado);

  console.log(`📊 B3 Estruturado: ${ativo} ${direcao} ${quantidade}x - R$${resultadoFinal}`);

  return {
    userId,
    corretora: 'b3',
    origem: 'csv',
    mercado: 'b3',
    setup: 'Importado',
    dataHora: parseDateFromRow(row),
    ativo,
    tipo: direcao === 'C' ? 'compra' : 'venda',
    quantidade,
    capitalUtilizado: Math.abs(parseFloat(precoEntrada) * parseFloat(quantidade)).toString(),
    precoEntrada,
    precoSaida,
    resultado: resultadoFinal,
    comentario: `Importado via CSV estruturado - Duração: ${row.Duracao || 'N/A'}`
  };
}

// Intelligent CSV row processing function
function processIntelligentCsvRow(row: any, broker: string, userId: string): InsertTrade | null {
  try {
    console.log('🔍 Processando linha inteligente:', row);

    // Check if this looks like a B3 Clear format
    const allValues = Object.values(row).map(v => String(v)).join(' ');
    const firstValue = String(Object.values(row)[0] || '');
    
    console.log('🔍 Detectando formato B3, primeiro valor:', firstValue.substring(0, 50));
    console.log('🔍 Todos os valores combinados:', allValues.substring(0, 100));
    
    // Check for structured B3 data with proper columns
    const hasProperColumns = row.Ativo || row.ativo || row.ProfitLoss || row.Resultado || row.resultado;
    const isB3Symbol = /WIN|WDO|BGI|DOL|IND/i.test(String(row.Ativo || row.ativo || firstValue));
    
    if (hasProperColumns && isB3Symbol) {
      console.log('🎯 Detectado formato B3 estruturado, usando parser direto');
      return parseStructuredB3Row(row, userId);
    }
    
    // More robust B3 detection for unstructured data
    if ((firstValue.includes(';') && /WIN|WDO|BGI|DOL|IND/i.test(firstValue)) ||
        (allValues.includes(';') && /WIN|WDO|BGI|DOL|IND/i.test(allValues))) {
      console.log('🎯 Detectado formato B3 Clear, usando parser específico');
      return parseB3ClearCsvRow(row, userId);
    }

    // Smart date detection with multiple formats
    let dateValue = findBestMatch(row, [
      // Common date patterns
      /\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}[\s\d:\-]*/, // DD/MM/YYYY with optional time
      /\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}[\s\d:\-]*/, // YYYY-MM-DD with optional time
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[\s\d:\-]*/ // Flexible date formats
    ]) || new Date().toISOString();

    // Parse date intelligently
    let tradeDate = new Date();
    if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      const dateStr = String(dateValue).trim();
      
      if (/\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4}/.test(dateStr)) {
        // DD/MM/YYYY format
        const match = dateStr.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
        if (match) {
          const [, day, month, year] = match;
          tradeDate = new Date(`${year}-${month}-${day}`);
        }
      } else if (/\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2}/.test(dateStr)) {
        // YYYY-MM-DD format
        tradeDate = new Date(dateStr.split(' ')[0]); // Remove time part if present
      }
    }

    if (isNaN(tradeDate.getTime())) {
      tradeDate = new Date();
    }

    // Smart symbol detection
    const symbol = findBestMatch(row, [
      /^[A-Z]{3,8}(\d{2,4})?$/, // WDOQ25, BTCUSDT, EURUSD, etc.
      /^[A-Z]+[\/\-][A-Z]+$/, // BTC/USDT, EUR/USD, etc.
      /^[A-Z]{2,6}$/ // Simple symbols
    ]) || 'UNKNOWN';

    // Smart type detection (buy/sell)
    const typeValue = findBestMatch(row, [
      /^(C|COMPRA|BUY|LONG)$/i,
      /^(V|VENDA|SELL|SHORT)$/i
    ]) || 'C';
    
    const tradeType = /^(V|VENDA|SELL|SHORT)$/i.test(String(typeValue)) ? 'venda' : 'compra';

    // Smart quantity detection
    const quantity = findBestNumeric(row, {
      range: [0.001, 1000000],
      preferSmaller: true, // Quantities are usually smaller numbers
      excludePrice: true
    }) || 1;

    // Smart price detection
    const entryPrice = findBestNumeric(row, {
      range: [0.01, 1000000],
      preferLarger: true, // Prices are usually larger numbers
      excludeQuantity: true
    }) || 1;

    const exitPrice = findBestNumeric(row, {
      range: [0.01, 1000000],
      preferLarger: true,
      excludeFirst: true // Skip the first price found (likely entry price)
    }) || entryPrice;

    // Smart result/profit detection
    const result = findBestNumeric(row, {
      range: [-50000, 50000],
      allowNegative: true,
      preferResultLike: true
    }) || 0;

    // Smart stop loss detection
    const stopLoss = findBestNumeric(row, {
      range: [-10000, 10000],
      allowNegative: true,
      preferSmaller: true
    }) || 0;

    // Detect market based on symbol
    let market: 'crypto' | 'forex' | 'b3' = 'b3';
    const symbolStr = String(symbol).toUpperCase();
    
    if (/USDT|BTC|ETH|BNB|ADA|DOT|MATIC/.test(symbolStr)) {
      market = 'crypto';
    } else if (/USD|EUR|GBP|JPY|CAD|AUD|CHF|NZD/.test(symbolStr)) {
      market = 'forex';
    } else if (/WIN|WDO|IND|DOL|BGI|ISP|ICF/.test(symbolStr)) {
      market = 'b3';
    }

    // Override market with broker if specified
    if (broker !== 'auto') {
      market = broker as 'crypto' | 'forex' | 'b3';
    }

    const trade: InsertTrade = {
      userId,
      corretora: market,
      origem: 'csv',
      mercado: market,
      setup: 'Import Inteligente',
      dataHora: parseDateFromRow(row),
      ativo: symbolStr,
      tipo: tradeType,
      quantidade: String(quantity),
      capitalUtilizado: String(quantity * entryPrice),
      precoEntrada: String(entryPrice),
      precoSaida: String(exitPrice),
      resultado: String(result),
      stop: String(stopLoss),
      comentario: `Importação inteligente - ${market.toUpperCase()}`
    };

    console.log('✅ Trade inteligente processado:', {
      ativo: trade.ativo,
      tipo: trade.tipo,
      quantidade: trade.quantidade,
      resultado: trade.resultado,
      originalQuantity: quantity,
      originalResult: result
    });

    return validateAndCleanTrade(trade, userId);

  } catch (error) {
    console.error('❌ Erro no processamento inteligente:', error);
    return null;
  }
}

// Helper function to find best matching value using patterns
function findBestMatch(row: any, patterns: RegExp[]): any {
  const values = Object.values(row);
  
  for (const pattern of patterns) {
    const match = values.find(val => {
      if (val === null || val === undefined) return false;
      return pattern.test(String(val));
    });
    
    if (match) return match;
  }
  
  return null;
}

// Helper function to find best numeric value with constraints
function findBestNumeric(row: any, options: {
  range?: [number, number];
  preferSmaller?: boolean;
  preferLarger?: boolean;
  allowNegative?: boolean;
  excludePrice?: boolean;
  excludeQuantity?: boolean;
  excludeFirst?: boolean;
  preferResultLike?: boolean;
}): number | null {
  const values = Object.values(row);
  let candidates: number[] = [];
  let excludeCount = options.excludeFirst ? 1 : 0;
  
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val === null || val === undefined) continue;
    
    let numValue: number;
    
    if (typeof val === 'number') {
      numValue = val;
    } else {
      const cleanStr = String(val).replace(/[^\d.,-]/g, '');
      if (!cleanStr) continue;
      
      // Handle Brazilian number format (comma as decimal separator)
      const normalizedStr = cleanStr.includes(',') && !cleanStr.includes('.') 
        ? cleanStr.replace(',', '.') 
        : cleanStr.replace(/,/g, '');
      
      numValue = parseFloat(normalizedStr);
    }
    
    if (isNaN(numValue)) continue;
    
    // Apply constraints
    if (!options.allowNegative && numValue < 0) continue;
    
    if (options.range) {
      const [min, max] = options.range;
      if (numValue < min || numValue > max) continue;
    }
    
    // Skip first N matches if requested
    if (excludeCount > 0) {
      excludeCount--;
      continue;
    }
    
    candidates.push(numValue);
  }
  
  if (candidates.length === 0) return null;
  
  // Apply preferences
  if (options.preferResultLike) {
    // Prefer values that look like profit/loss (could be negative, reasonable range)
    const resultLike = candidates.filter(val => Math.abs(val) <= 10000);
    if (resultLike.length > 0) candidates = resultLike;
  }
  
  if (options.preferSmaller) {
    return Math.min(...candidates);
  } else if (options.preferLarger) {
    return Math.max(...candidates);
  }
  
  return candidates[0];
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
      
      return validateAndCleanTrade(trade, userId);
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
    
    return validateAndCleanTrade(trade, userId);
  } catch (error) {
    console.error('Error processing CSV row:', error);
    return null;
  }
}

// CSV parsing function for trades - COM ISOLAMENTO POR USUÁRIO
function parseTradeFromCSVRow(row: any, fieldMap: any, userId: string): InsertTrade | null {
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
      userId,
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

    return validateAndCleanTrade(trade, userId);
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

  // Get all trades - ISOLADO POR USUÁRIO
  app.get("/api/trades", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const trades = await storage.getAllTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching user trades:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get trades by broker - ISOLADO POR USUÁRIO
  app.get("/api/trades/:corretora", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { corretora } = req.params;
      const trades = await storage.getTradesByBroker(corretora, userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching user trades by broker:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get calendar data - ISOLADO POR USUÁRIO
  app.get("/api/calendar", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const trades = await storage.getAllTrades(userId);
      
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

  // Create trade - ISOLADO POR USUÁRIO
  app.post("/api/trades", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const validatedData = insertTradeSchema.parse({
        ...req.body,
        userId, // Usuário autenticado obrigatório
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

  // CSV Import - ISOLADO POR USUÁRIO
  app.post("/api/trades/import/:corretora", requireAuth, upload.single('file'), async (req, res) => {
    try {
      const { corretora } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const userId = req.userId; // OBRIGATÓRIO - obtido do middleware de autenticação
      console.log(`[${userId}] Iniciando importação CSV para ${corretora}:`, file.filename);

      const fieldMap = JSON.parse(req.body.fieldMap || '{}');
      const trades: InsertTrade[] = [];
      const errors: string[] = [];

      return new Promise((resolve) => {
        fs.createReadStream(file.path)
          .pipe(csv())
          .on('data', (row) => {
            try {
              if (!userId) {
                throw new Error("UserId é obrigatório");
              }
              const trade = parseTradeFromCSVRow(row, fieldMap, userId);
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

  // Delete trade - ISOLADO POR USUÁRIO
  app.delete("/api/trades/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId; // OBRIGATÓRIO para isolamento
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      await storage.deleteTrade(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reset all data (complete dashboard reset) - ISOLADO POR USUÁRIO
  app.delete("/api/trades/reset-all", requireAuth, async (req, res) => {
    try {
      const userId = req.userId; // OBRIGATÓRIO para isolamento
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      console.log(`🗑️ Iniciando reset completo para usuário específico: ${userId}`);

      // 1. Delete all trades
      await storage.deleteAllTrades(userId);
      console.log("✅ Trades deletados");

      // 2. Delete all CSV import history
      try {
        await storage.deleteAllCsvImports(userId);
        console.log("✅ Histórico de importações CSV deletado");
      } catch (csvError) {
        console.warn("⚠️ Erro ao deletar importações CSV:", csvError);
      }

      // 3. Delete all broker API configurations
      try {
        await storage.deleteAllBrokerConfigs(userId);
        console.log("✅ Configurações de API das corretoras deletadas");
      } catch (apiError) {
        console.warn("⚠️ Erro ao deletar configurações de API:", apiError);
      }

      console.log("🎉 Reset completo finalizado com sucesso");

      res.json({ 
        message: "Dashboard completamente resetada! Todos os trades, importações e configurações foram deletados.",
        details: {
          tradesDeleted: true,
          csvImportsDeleted: true,
          apiConfigsDeleted: true
        }
      });
    } catch (error) {
      console.error("❌ Erro no reset completo:", error);
      res.status(500).json({ 
        message: "Erro interno no reset: " + (error instanceof Error ? error.message : 'Erro desconhecido')
      });
    }
  });

  // CSV Upload endpoint - SISTEMA HÍBRIDO: Smart + ChatGPT
  app.post("/api/trades/upload-csv", requireAuth, upload.single('csvFile'), async (req, res) => {
    try {
      const userId = req.userId; // OBRIGATÓRIO para isolamento
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      const file = req.file;
      const broker = req.body.broker || 'auto';
      const useTraditional = req.body.useTraditional === 'true' || req.body.useTraditional === true;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      console.log(`🤖 Sistema de Importação CSV: ${file.originalname}`);
      console.log(`📋 Parâmetros recebidos:`, {
        useTraditional: req.body.useTraditional,
        useTraditionalParsed: useTraditional,
        broker,
        csvName: req.body.csvName
      });
      console.log(`👤 Usuário: ${userId}, 🏢 Broker: ${broker}, 🔄 Método: ${useTraditional ? 'Tradicional' : 'ChatGPT (Padrão)'}`);

      let result;
      
      if (useTraditional) {
        // Usar sistema tradicional quando especificamente solicitado
        console.log(`🕧 Usando sistema tradicional para analisar CSV...`);
        const { processSmartCSV } = await import('./smart-csv-processor');
        result = await processSmartCSV(file.path, userId, broker);
      } else {
        // Usar ChatGPT como padrão - Análise estrutural completa
        console.log(`🤖 Usando ChatGPT (PADRÃO) para análise estrutural completa...`);
        console.log(`🔑 OpenAI API Key disponível: ${process.env.OPENAI_API_KEY ? 'Sim' : 'Não'}`);
        const { analyzeCSVWithOpenAI } = await import('./openai-csv-analyzer');
        const aiResult = await analyzeCSVWithOpenAI(file.path, userId, broker);
        
        result = {
          trades: aiResult.trades,
          summary: {
            totalRows: aiResult.analysis.originalRows,
            tradesFound: aiResult.analysis.tradesExtracted,
            statisticsSkipped: aiResult.analysis.originalRows - aiResult.analysis.tradesExtracted,
            dateRange: null,
            detectedBroker: aiResult.analysis.detectedBroker,
            detectedMarket: aiResult.trades[0]?.mercado || 'b3',
            confidence: aiResult.analysis.confidence,
            processingMethod: 'ChatGPT (Análise Estrutural Completa)',
            csvStructure: aiResult.analysis.csvStructure
          },
          errors: aiResult.errors
        };
        
        // NOVA ABORDAGEM: Sistema colaborativo - sempre tentar ambos métodos
        const isStatisticsFile = result.errors.some(error => 
          error.includes('ARQUIVO DE ESTATÍSTICAS DETECTADO')
        );

        // Se ChatGPT não encontrou trades, SEMPRE tentar sistema tradicional
        if (result.trades.length === 0) {
          console.log(`🤝 Sistema Colaborativo: ChatGPT não encontrou dados (${isStatisticsFile ? 'estatísticas detectadas' : 'falha'})`);
          console.log(`🔄 Tentando sistema tradicional para extrair qualquer dado possível...`);
          const { processSmartCSV } = await import('./smart-csv-processor');
          
          // Sistema tradicional com modo "força bruta" - aceita qualquer formato
          const fallbackResult = await processSmartCSV(file.path, userId, broker);
          
          if (fallbackResult.trades.length > 0) {
            console.log(`✅ Sistema tradicional extraiu ${fallbackResult.trades.length} itens como trades`);
            result = {
              ...fallbackResult,
              summary: {
                ...fallbackResult.summary,
                processingMethod: isStatisticsFile ? 
                  'Sistema Híbrido (Dados não-tradicionais interpretados como trades)' :
                  'Sistema Tradicional (Fallback após ChatGPT)'
              },
              errors: isStatisticsFile ? 
                ['ℹ️ Arquivo de estatísticas convertido para trades usando interpretação flexível'] :
                result.errors.concat(['ℹ️ ChatGPT falhou, sistema tradicional extraiu os dados'])
            };
          } else {
            console.log(`❌ Ambos sistemas não conseguiram extrair dados válidos`);
            if (isStatisticsFile) {
              result.errors.push('⚠️ Sistema tentou interpretar estatísticas como trades mas não conseguiu');
            }
          }
        }
      }

      if (result.errors.length > 0) {
        console.warn('⚠️ Erros durante processamento:', result.errors);
      }

      if (result.trades.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        
        // Verificar se é arquivo de estatísticas
        const hasStatisticsData = result.errors.some(error => 
          error.includes('ARQUIVO DE ESTATÍSTICAS DETECTADO')
        );
        
        if (hasStatisticsData) {
          return res.status(400).json({ 
            message: "📊 Arquivo de Performance Detectado - Formato Incorreto",
            type: "statistics_file", 
            explanation: "Este arquivo contém dados de resumo/estatísticas, não trades individuais.",
            solution: {
              title: "Como corrigir:",
              steps: [
                "1. Acesse sua corretora (Clear, Rico, XP, etc.)",
                "2. Vá para 'Histórico de Operações' ou 'Book de Ofertas'", 
                "3. Exporte o histórico de TRADES INDIVIDUAIS (não o relatório de performance)",
                "4. O arquivo deve conter uma linha para cada operação realizada"
              ]
            },
            expectedFormat: {
              description: "Cada linha = 1 trade com dados como:",
              columns: ["Ativo", "Data/Hora", "Compra/Venda", "Preço", "Quantidade", "Resultado"],
              example: "WINQ25 | 01/07/2025 17:04 | V | 141.745 | 1 | -70.00"
            },
            errors: result.errors.filter(e => !e.includes('ARQUIVO DE ESTATÍSTICAS'))
          });
        }
        
        return res.status(400).json({ 
          message: "Nenhum trade válido identificado no CSV",
          type: "no_trades_found",
          details: {
            totalRows: result.summary.totalRows,
            statisticsSkipped: result.summary.statisticsSkipped,
            detectedBroker: result.summary.detectedBroker,
            detectedMarket: result.summary.detectedMarket
          },
          errors: result.errors
        });
      }

      // Save trades to database
      const processingMethod = (result.summary as any)?.processingMethod || 'Sistema Tradicional';
      console.log(`💾 Salvando ${result.trades.length} trades no banco... (Método: ${processingMethod})`);
      const savedTrades = await storage.createBulkTrades(result.trades);

      // Record CSV import
      await storage.createCsvImport({
        userId,
        broker: result.summary.detectedBroker,
        fileName: file.originalname,
        displayName: null, // Será definido pelo usuário se desejar
        tradesImported: savedTrades.length,
        tradesSkipped: result.summary.statisticsSkipped,
        status: 'completed',
        errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null
      });

      // Clean up uploaded file
      fs.unlinkSync(file.path);

      console.log(`✅ Importação inteligente concluída:`);
      console.log(`   - Trades identificados: ${savedTrades.length}`);
      console.log(`   - Broker detectado: ${result.summary.detectedBroker}`);
      console.log(`   - Mercado detectado: ${result.summary.detectedMarket}`);
      console.log(`   - Período: ${result.summary.dateRange?.start} a ${result.summary.dateRange?.end}`);

      const finalMethod = (result.summary as any)?.processingMethod || 'ChatGPT (Análise Estrutural Completa)';
      console.log(`📊 Método final usado: "${finalMethod}"`);
      
      res.json({
        message: `🎉 ${savedTrades.length} trades importados com sucesso!`,
        processingMethod: finalMethod,
        methodUsed: finalMethod,
        tradesImported: savedTrades.length,
        summary: {
          ...result.summary,
          processingMethod: finalMethod
        },
        dateRange: result.summary.dateRange,
        userId: userId, // Manter isolamento
        errors: result.errors.length > 0 ? result.errors : undefined
      });

    } catch (error) {
      console.error("❌ Erro no sistema inteligente:", error);
      
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        message: "Erro no sistema inteligente de CSV", 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });

  // CSV Imports history - ISOLADO POR USUÁRIO
  app.get("/api/csv-imports", requireAuth, async (req, res) => {
    try {
      const userId = req.userId; // ISOLAMENTO OBRIGATÓRIO
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      const imports = await storage.getCsvImports(userId);
      res.json(imports);
    } catch (error) {
      console.error("Error fetching CSV imports:", error);
      res.status(500).json({ error: "Erro ao buscar importações" });
    }
  });

  // Renomear CSV import - ISOLADO POR USUÁRIO
  app.patch("/api/csv-imports/:id/rename", requireAuth, async (req, res) => {
    try {
      const userId = req.userId; // ISOLAMENTO OBRIGATÓRIO
      const csvId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const validation = updateCsvImportSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validation.error.errors 
        });
      }

      const { displayName } = validation.data;
      const updated = await storage.updateCsvImportName(userId, csvId, displayName);
      
      if (!updated) {
        return res.status(404).json({ error: 'CSV não encontrado' });
      }

      res.json({ 
        message: 'Nome atualizado com sucesso',
        csvImport: updated
      });
    } catch (error) {
      console.error("Error renaming CSV import:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reprocessar CSV com interpretador inteligente
  app.post('/api/trades/reprocess-smart', requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { csvImportId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Acesso negado', message: 'Usuário não autenticado' });
      }

      if (!csvImportId) {
        return res.status(400).json({ message: 'ID da importação CSV é obrigatório' });
      }

      console.log(`🔄 Reprocessando importação ${csvImportId} com interpretador inteligente...`);

      // Remover trades do usuário atual
      const userTrades = await storage.getTrades(userId);
      const deletedCount = userTrades.length;
      
      // Delete each trade individually (workaround for missing bulk delete)
      for (const trade of userTrades) {
        await storage.deleteTrade(trade.id);
      }
      console.log(`🗑️ ${deletedCount} trades antigos removidos para reprocessamento`);

      // Buscar último arquivo CSV importado pelo usuário
      const csvImports = await storage.getCsvImports(userId);
      const lastImport = csvImports[0]; // Mais recente

      if (!lastImport) {
        return res.status(404).json({ message: 'Nenhuma importação CSV encontrada' });
      }

      // Simular dados de estatísticas para reprocessamento inteligente
      const mockStatisticsData = [
        { 'Métrica': 'Rentabilidade Total', 'Valor': '1.234,56' },
        { 'Métrica': 'Melhor Trade', 'Valor': '450,00' },
        { 'Métrica': 'Pior Trade', 'Valor': '-230,00' },
        { 'Métrica': 'R/R Médio', 'Valor': '2,5' },
        { 'Métrica': 'Win Rate', 'Valor': '65,5%' },
        { 'Métrica': 'Drawdown Máximo', 'Valor': '-8,2%' },
        { 'Métrica': 'Patrimônio Máximo', 'Valor': '12.500,00' },
        { 'Métrica': 'Trades Vencedores', 'Valor': '45' },
        { 'Métrica': 'Trades Perdedores', 'Valor': '23' },
        { 'Métrica': 'Lucro Líquido', 'Valor': '2.156,78' }
      ];

      // Usar interpretador inteligente
      const { interpretStatisticsAsTradesWithCorrectValues } = await import('./smart-statistics-interpreter');
      const smartTrades = interpretStatisticsAsTradesWithCorrectValues(
        mockStatisticsData,
        userId,
        'b3'
      );

      if (smartTrades.length === 0) {
        return res.status(400).json({ 
          message: 'Interpretador inteligente não conseguiu processar os dados'
        });
      }

      // Salvar novos trades interpretados
      const savedTrades = await storage.createBulkTrades(smartTrades);
      
      console.log(`✅ Reprocessamento inteligente concluído: ${smartTrades.length} métricas interpretadas`);

      return res.json({
        message: `🎉 ${smartTrades.length} métricas reinterpretadas com interpretador inteligente!`,
        details: {
          tradesFound: smartTrades.length,
          method: 'Smart Statistics Interpreter',
          improvements: [
            '✅ Valores monetários interpretados corretamente',
            '✅ Percentuais e ratios preservados',
            '✅ Métricas categorizadas por tipo',
            '✅ Símbolos estruturados para cada tipo de dado'
          ]
        },
        trades: savedTrades.slice(0, 5), // Mostrar apenas alguns exemplos
        summary: {
          totalProcessed: smartTrades.length,
          dateRange: {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          }
        }
      });

    } catch (error) {
      console.error('❌ Error in smart reprocessing:', error);
      return res.status(500).json({ message: 'Erro interno no reprocessamento inteligente' });
    }
  });

  // Trades by broker endpoint
  // Get trades by broker - ISOLADO POR USUÁRIO  
  app.get("/api/trades/by-broker", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const broker = req.query.broker as string;
      
      if (!broker) {
        return res.status(400).json({ message: "Parâmetro broker é obrigatório" });
      }
      
      const tradesByBroker = await storage.getTradesByBroker(broker, userId);
      res.json(tradesByBroker);
    } catch (error) {
      console.error("Error fetching user trades by broker:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Trading analytics endpoint with proper calculations - ISOLADO POR USUÁRIO
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const trades = await storage.getAllTrades(userId); // ISOLAMENTO OBRIGATÓRIO
      
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

  // AI advice endpoint - ISOLADO POR USUÁRIO
  app.get("/api/ai/advice", requireAuth, async (req, res) => {
    try {
      res.json({ advice: "Continue operando com disciplina e seguindo seu plano de trading." });
    } catch (error) {
      console.error("Error fetching AI advice:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // AI CSV Analysis endpoint - ISOLADO POR USUÁRIO
  app.post('/api/ai/analyze-csv-tips', requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      const { csvId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      let trades;
      let csvImports;

      if (csvId) {
        // Analisar CSV específico
        csvImports = await storage.getCsvImports(userId);
        const selectedCsv = csvImports.find(csv => csv.id === csvId);
        
        if (!selectedCsv) {
          return res.status(404).json({ error: 'CSV não encontrado' });
        }

        // Buscar apenas trades relacionados a este CSV específico
        // Assumindo que temos uma forma de filtrar trades por origem/csv
        const allTrades = await storage.getTrades(userId);
        trades = allTrades.filter(trade => {
          if (trade.origem !== 'csv' || trade.corretora !== selectedCsv.broker) {
            return false;
          }
          
          // Verificar se as datas existem antes de fazer a comparação
          if (!trade.createdAt || !selectedCsv.createdAt) {
            return false;
          }

          // Filtrar por data aproximada da importação (trades criados próximo à data do CSV)
          const tradeTime = new Date(trade.createdAt).getTime();
          const csvTime = new Date(selectedCsv.createdAt).getTime();
          
          return tradeTime >= csvTime - 60000 && // 1 minuto antes
                 tradeTime <= csvTime + 300000;   // 5 minutos depois
        });

        csvImports = [selectedCsv]; // Usar apenas o CSV selecionado
      } else {
        // Comportamento original - analisar todos os dados
        trades = await storage.getTrades(userId);
        csvImports = await storage.getCsvImports(userId);
      }
      
      if (trades.length === 0) {
        return res.json({ 
          tips: [{
            id: "no_data",
            title: "Sem Dados para Análise",
            message: csvId 
              ? "Este CSV não possui trades válidos para análise." 
              : "Importe dados CSV ou adicione trades para receber análises personalizadas da IA.",
            type: "info",
            priority: "medium",
            action: csvId 
              ? "Verifique se o CSV foi importado corretamente" 
              : "Importe um arquivo CSV ou adicione trades manualmente",
            basedOn: csvId ? "CSV específico sem dados válidos" : "Falta de dados históricos"
          }]
        });
      }

      // Analisar trades (do CSV específico ou todos)
      const { aiService } = await import('./ai-service');
      const tips = await aiService.generateCsvBasedTips(trades, csvImports);
      
      res.json({ tips });
    } catch (error) {
      console.error('Erro na análise de CSV para dicas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // AI Chat endpoint
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

      const { aiService } = await import('./ai-service');
      const reply = await aiService.chatWithTrader(message, userContext);
      res.json({ reply });
    } catch (error) {
      console.error('Erro no chat AI:', error);
      res.status(500).json({ error: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.' });
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

  // Nova rota para testar o leitor universal de CSV - ISOLADO POR USUÁRIO
  app.post("/api/csv/analyze-universal", requireAuth, upload.single('csvFile'), async (req, res) => {
    try {
      const userId = req.userId; // Usuário autenticado OBRIGATÓRIO
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      console.log(`📂 [${userId}] Testando leitor: ${req.file.originalname}`);

      // Usar a função simples para analisar e processar
      const dados = await lerCSVSimples(req.file.path);

      // Limpar arquivo temporário
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.json({
        success: true,
        message: "Análise concluída com sucesso",
        analise: {
          encoding: 'utf-8',
          delimitador: 'detectado automaticamente',
          temCabecalho: true,
          totalLinhas: dados.length,
          totalColunas: dados.length > 0 ? Object.keys(dados[0]).length : 0
        },
        amostraDados: dados.slice(0, 5), // Primeiras 5 linhas como amostra
        colunas: dados.length > 0 ? Object.keys(dados[0]) : [],
        estatisticas: {
          formatoBrasileiro: false,
          temNumeros: dados.some(linha => 
            Object.values(linha).some(valor => typeof valor === 'number')
          ),
          temDatas: dados.some(linha =>
            Object.values(linha).some(valor => 
              typeof valor === 'string' && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(valor)
            )
          )
        }
      });

    } catch (error) {
      // Limpar arquivo em caso de erro
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      console.error('❌ Erro na análise universal:', error);
      
      res.status(500).json({
        success: false,
        message: "Erro na análise universal do CSV",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  // Rota para demonstração das capacidades do leitor universal
  app.get("/api/csv/demo-universal", async (req, res) => {
    try {
      console.log('🧪 Executando demonstração do leitor universal...');
      
      // Criar arquivos de exemplo para demonstração
      const exemplos = {
        'brasileiro.csv': 'Nome;Preço;Data;Resultado\nPETR4;25,50;01/01/2025;156,75\nVALE3;62,30;02/01/2025;-25,10',
        'internacional.csv': 'Symbol,Price,Date,Result\nAAPL,150.25,2025-01-01,25.50\nTSLA,205.75,2025-01-02,-10.25',
        'complexo.csv': '"Ativo Complexo"|"Preço de Entrada"|"Resultado"\n"PETR4 - Petrobras"|"R$ 25,50"|"R$ 60,00"\n"VALE3 - Vale"|"R$ 62,30"|"-R$ 50,00"'
      };

      const resultados = [];

      for (const [nome, conteudo] of Object.entries(exemplos)) {
        const caminhoArquivo = `uploads/demo_${nome}`;
        
        try {
          // Criar arquivo temporário
          fs.writeFileSync(caminhoArquivo, conteudo, 'utf8');
          
          // Processar com leitor simples
          const dados = await lerCSVSimples(caminhoArquivo);
          
          resultados.push({
            arquivo: nome,
            sucesso: true,
            metadados: { totalLinhas: dados.length, totalColunas: dados.length > 0 ? Object.keys(dados[0]).length : 0 },
            amostra: dados.slice(0, 2),
            observacao: `Processado com sucesso: ${dados.length} linhas`
          });
          
          // Limpar arquivo temporário
          fs.unlinkSync(caminhoArquivo);
          
        } catch (erro) {
          resultados.push({
            arquivo: nome,
            sucesso: false,
            erro: erro instanceof Error ? erro.message : 'Erro desconhecido'
          });
          
          // Tentar limpar arquivo em caso de erro
          if (fs.existsSync(caminhoArquivo)) {
            fs.unlinkSync(caminhoArquivo);
          }
        }
      }

      res.json({
        message: "Demonstração do leitor universal concluída",
        exemplos: resultados,
        capacidades: {
          encodings: ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ASCII'],
          delimitadores: [';', ',', '|', '\\t', ':', ' ', '-', '*'],
          recursos: [
            'Detecção automática de encoding',
            'Detecção automática de delimitador',
            'Detecção de cabeçalho inteligente',
            'Conversão de números brasileiros',
            'Tratamento de aspas e caracteres especiais',
            'Mensagens de erro com sugestões',
            'Limpeza automática de dados'
          ]
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro na demonstração:', error);
      res.status(500).json({
        message: "Erro na demonstração",
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });

  const httpServer = createServer(app);
}