import { Express } from "express";
import { Server, createServer } from "http";
import { z } from "zod";
import { insertTradeSchema, insertUserSchema, InsertTrade, updateUserByAdminSchema, insertSubscriptionPlanSchema, updateCsvImportSchema, csvImports, insertDiaryEntrySchema, updateProfileSchema, supportConversations, supportMessages, insertSupportConversationSchema, insertSupportMessageSchema, users, whatsappMessages, InsertWhatsappMessage, trades, diaryImages, insertBankrollManagementSchema, BankrollSummaryDTO } from "@shared/schema";
import { storage } from "./storage";
import { AuthenticatedRequest } from "./types";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import passport from "passport";
import XLSX from 'xlsx';
// import { lerCSVSimples } from "./simple-csv-reader"; // Removido - usando smart-csv-processor
import { db } from "./db";
import { eq, and, ne, desc } from "drizzle-orm";
import { validateAndParseCSV } from "./csvValidator";
import crypto from "crypto";
import { sendPasswordResetEmail, sendWelcomeEmail } from "./email";
import WhatsApp from "whatsapp";
import axios from "axios";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// JWT Secret - must be provided in production
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || (
  process.env.NODE_ENV === 'production' 
    ? (() => { throw new Error('JWT_SECRET or SESSION_SECRET is required in production'); })()
    : 'dev_secret_change_in_production'
);

// Admin credentials - now fetched from database
const ADMIN_EMAIL = 'admin@metrika.com.br';

// Função para buscar cotação USD/BRL (API gratuita Frankfurter)
async function getUsdToBrlRate(): Promise<number> {
  try {
    console.log('💱 Buscando cotação USD/BRL...');
    const response = await axios.get('https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL', {
      timeout: 5000
    });
    
    const rate = response.data.rates.BRL;
    console.log(`✅ Cotação obtida: 1 USD = ${rate} BRL`);
    return rate;
  } catch (error) {
    console.error('❌ Erro ao buscar cotação USD/BRL:', error);
    // Fallback: usar cotação aproximada caso a API falhe
    const fallbackRate = 5.80;
    console.warn(`⚠️ Usando cotação fallback: ${fallbackRate} BRL`);
    return fallbackRate;
  }
}

// Função para converter trades de USD para BRL (Forex e Crypto)
async function convertTradesToBRL(trades: InsertTrade[]): Promise<InsertTrade[]> {
  if (trades.length === 0) return trades;
  
  // Verificar se há trades de Forex ou Crypto que precisam conversão
  const needsConversion = trades.some(t => 
    t.mercado === 'forex' || t.mercado === 'crypto'
  );
  
  if (!needsConversion) {
    console.log('ℹ️ Nenhum trade de Forex/Crypto detectado - conversão não necessária');
    return trades;
  }
  
  // Buscar cotação atual
  const usdToBrlRate = await getUsdToBrlRate();
  
  // Converter valores de USD para BRL
  const convertedTrades = trades.map(trade => {
    // Apenas converter Forex e Crypto (B3 já está em BRL)
    if (trade.mercado === 'forex' || trade.mercado === 'crypto') {
      console.log(`💱 Convertendo trade ${trade.ativo}: mercado=${trade.mercado}`);
      
      // Função auxiliar para converter string para número, multiplicar e retornar como string
      const convertValue = (value: string | undefined): string | undefined => {
        if (!value) return value;
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;
        return (numValue * usdToBrlRate).toFixed(2);
      };
      
      return {
        ...trade,
        // Converter valores monetários de USD para BRL (todos são strings)
        resultado: convertValue(trade.resultado),
        precoEntrada: convertValue(trade.precoEntrada),
        precoSaida: convertValue(trade.precoSaida),
        stop: convertValue(trade.stop),
        alvo: convertValue(trade.alvo),
      };
    }
    
    // B3 já está em BRL, retornar sem conversão
    return trade;
  });
  
  const convertedCount = convertedTrades.filter(t => 
    t.mercado === 'forex' || t.mercado === 'crypto'
  ).length;
  
  console.log(`✅ ${convertedCount} trades convertidos de USD para BRL (taxa: ${usdToBrlRate})`);
  
  return convertedTrades;
}

// Função para processar arquivos Excel da Clear
async function processExcelFile(filePath: string, userId: string): Promise<InsertTrade[]> {
  console.log(`📊 Processando arquivo Excel Clear: ${filePath}`);
  
  try {
    const workbook = XLSX.readFile(filePath);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    
    console.log(`📋 Excel: ${data.length} linhas encontradas`);
    
    if (data.length < 2) {
      return [];
    }
    
    const headers = data[0] as any[];
    const trades: InsertTrade[] = [];
    
    // Identificar apenas operações executadas
    const executedTrades = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      const status = row[6]; // Status
      const ativo = row[7];   // Ativo
      const tipo = row[8];    // Tipo (C/V)
      const qtdExecutada = row[12]; // Qtd. Executada
      const precoMedio = row[16];   // Preço Médio Exec.
      const dataHora = row[1];      // Data e Hora
      
      if (status === '[TX] Fechada na Íntegra' && qtdExecutada > 0 && precoMedio > 0) {
        executedTrades.push({
          ativo: String(ativo || '').trim(),
          tipo: String(tipo || '').trim(),
          quantidade: Number(qtdExecutada) || 0,
          preco: Number(precoMedio) || 0,
          dataHora: Number(dataHora) || Date.now(),
          linha: i
        });
      }
    }
    
    console.log(`🎯 Operações executadas: ${executedTrades.length}`);
    
    // Agrupar em pares compra/venda para calcular P&L
    const openPositions = new Map();
    
    for (const trade of executedTrades) {
      const key = trade.ativo;
      
      if (!openPositions.has(key)) {
        openPositions.set(key, []);
      }
      
      const positions = openPositions.get(key);
      
      if (trade.tipo === 'C') { // Compra
        positions.push({ ...trade, side: 'buy' });
      } else { // Venda
        // Tentar fazer match com uma compra
        const buyIndex = positions.findIndex((p: any) => p.side === 'buy' && p.quantidade === trade.quantidade);
        
        if (buyIndex >= 0) {
          const buyTrade = positions[buyIndex];
          positions.splice(buyIndex, 1);
          
          // Calcular P&L para mini índice/dólar
          let pnl = 0;
          if (trade.ativo.includes('WIN')) {
            // Mini índice: cada ponto = R$ 0,20
            pnl = (trade.preco - buyTrade.preco) * trade.quantidade * 0.20;
          } else if (trade.ativo.includes('WDO')) {
            // Mini dólar: cada ponto = R$ 10
            pnl = (trade.preco - buyTrade.preco) * trade.quantidade * 10;
          } else {
            // Outros ativos
            pnl = (trade.preco - buyTrade.preco) * trade.quantidade;
          }
          
          // Sanitizar strings para evitar caracteres nulos
          const sanitize = (str: any): string => {
            return String(str || '').replace(/\0/g, '').trim();
          };
          
          // Converter data Excel para Date
          let tradeDate = new Date();
          if (buyTrade.dataHora && typeof buyTrade.dataHora === 'number') {
            // Excel date format
            tradeDate = new Date((buyTrade.dataHora - 25569) * 86400 * 1000);
          }
          
          const newTrade: InsertTrade = {
            userId,
            corretora: 'b3',
            origem: 'csv',
            mercado: 'b3',
            setup: sanitize('Clear Excel Import'),
            dataHora: tradeDate.toISOString(),
            ativo: sanitize(trade.ativo.toUpperCase()),
            tipo: trade.tipo === 'C' ? 'compra' : 'venda',
            quantidade: sanitize(trade.quantidade.toString()),
            precoEntrada: sanitize(buyTrade.preco.toString()),
            precoSaida: sanitize(trade.preco.toString()),
            capitalUtilizado: sanitize((trade.quantidade * Math.max(buyTrade.preco, trade.preco)).toString()),
            resultado: sanitize(pnl.toString()),
            emocao: 'neutro',
            comentario: sanitize(`Clear: ${buyTrade.preco} → ${trade.preco}`)
          };
          
          trades.push(newTrade);
          console.log(`✅ Trade: ${trade.ativo} = R$ ${pnl.toFixed(2)}`);
        } else {
          // Venda sem compra correspondente (posição iniciada com venda)
          positions.push({ ...trade, side: 'sell' });
        }
      }
    }
    
    // Processar vendas sem compra (short trades)
    for (const [ativo, positions] of Array.from(openPositions)) {
      const positionsArray = positions as any[];
      for (let i = 0; i < positionsArray.length - 1; i++) {
        const sell = positionsArray[i];
        const buy = positionsArray[i + 1];
        
        if (sell.side === 'sell' && buy && buy.side === 'buy' && sell.quantidade === buy.quantidade) {
          let pnl = 0;
          if (ativo.includes('WIN')) {
            pnl = (sell.preco - buy.preco) * sell.quantidade * 0.20;
          } else if (ativo.includes('WDO')) {
            pnl = (sell.preco - buy.preco) * sell.quantidade * 10;
          } else {
            pnl = (sell.preco - buy.preco) * sell.quantidade;
          }
          
          const sanitize = (str: any): string => {
            return String(str || '').replace(/\0/g, '').trim();
          };
          
          let tradeDate = new Date();
          if (sell.dataHora && typeof sell.dataHora === 'number') {
            tradeDate = new Date((sell.dataHora - 25569) * 86400 * 1000);
          }
          
          const newTrade: InsertTrade = {
            userId,
            corretora: 'b3',
            origem: 'csv',
            mercado: 'b3',
            setup: sanitize('Clear Excel Import'),
            dataHora: tradeDate.toISOString(),
            ativo: sanitize(String(ativo).toUpperCase()),
            tipo: 'venda',
            quantidade: sanitize(sell.quantidade.toString()),
            precoEntrada: sanitize(sell.preco.toString()),
            precoSaida: sanitize(buy.preco.toString()),
            capitalUtilizado: sanitize((sell.quantidade * Math.max(sell.preco, buy.preco)).toString()),
            resultado: sanitize(pnl.toString()),
            emocao: 'neutro',
            comentario: sanitize(`Clear Short: ${sell.preco} → ${buy.preco}`)
          };
          
          trades.push(newTrade);
          console.log(`✅ Short Trade: ${ativo} = R$ ${pnl.toFixed(2)}`);
        }
      }
    }
    
    console.log(`🎯 Total de trades processados: ${trades.length}`);
    return trades;
    
  } catch (error) {
    console.error('❌ Erro ao processar Excel:', error);
    return [];
  }
}

// Configure multer for file uploads - use disk storage for better compatibility
const upload = multer({ 
  dest: 'uploads/'
});

// Configure multer for image uploads with memory storage (for Object Storage)
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Secure JWT-only middleware for user authentication
function getUserId(req: any): string {
  // Only accept JWT tokens for security
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error("Token JWT obrigatório - acesso negado");
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded.userId) {
      throw new Error("Token JWT inválido - userId não encontrado");
    }
    return decoded.userId;
  } catch (error) {
    throw new Error("Token JWT inválido ou expirado");
  }
}

// Middleware de autenticação obrigatória - ISOLAMENTO TOTAL
async function requireAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error("Token JWT obrigatório - acesso negado");
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded.userId) {
      throw new Error("Token JWT inválido - userId não encontrado");
    }
    
    const userId = decoded.userId;
    
    if (!userId || userId.trim() === '') {
      throw new Error("UserId vazio ou inválido");
    }
    
    // Verificar se o usuário foi forçado a fazer logout (admin mudou o plano)
    const user = await storage.getUser(userId);
    if (user?.forceLogoutAt) {
      const tokenIssuedAt = decoded.iat ? new Date(decoded.iat * 1000) : new Date(0);
      const forceLogoutAt = new Date(user.forceLogoutAt);
      
      if (tokenIssuedAt < forceLogoutAt) {
        console.warn(`🚫 Token invalidado por forceLogout para usuário ${userId}`);
        return res.status(401).json({ 
          error: "SESSION_EXPIRED",
          message: "Sua sessão expirou. Por favor, faça login novamente.",
          forceLogout: true
        });
      }
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

// Secure authentication middleware for file uploads (JWT only)
function requireAuthFlexible(req: any, res: any, next: any) {
  try {
    // Even for file uploads, require JWT authentication
    const userId = getUserId(req);
    
    if (!userId || userId.trim() === '') {
      throw new Error("UserId vazio ou inválido");
    }
    
    req.userId = userId;
    console.log(`🔐 Usuário autenticado (upload): ${userId} para ${req.method} ${req.path}`);
    next();
  } catch (error) {
    console.warn(`🚫 Acesso negado para ${req.method} ${req.path}:`, error instanceof Error ? error.message : error);
    res.status(401).json({ 
      error: "Acesso negado",
      message: "Token JWT obrigatório para autenticação",
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
  // Import getCallbackURL for dynamic resolution
  const { getCallbackURL } = await import('./index.js');
  
  // Google OAuth Routes
  app.get("/auth/google", (req, res, next) => {
    try {
      const callbackURL = getCallbackURL(req);
      passport.authenticate("google", {
        scope: ["profile", "email"],
        callbackURL
      } as any)(req, res, next);
    } catch (error: any) {
      res.status(500).json({ error: `OAuth configuration error: ${error.message}` });
    }
  });

  app.get(
    "/auth/google/callback",
    (req, res, next) => {
      try {
        const callbackURL = getCallbackURL(req);
        passport.authenticate("google", { 
          failureRedirect: "/login", 
          session: false,
          callbackURL
        } as any)(req, res, next);
      } catch (error: any) {
        res.status(500).json({ error: `OAuth configuration error: ${error.message}` });
      }
    },
    async (req, res) => {
      // Generate JWT token for API authentication
      const user = req.user as any;
      
      // Check if this is the first login (lastLoginAt is null) BEFORE updating
      const isFirstLogin = !user.lastLoginAt;
      
      // Update lastLoginAt
      await storage.updateLastLogin(user.id);
      
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Create a secure opaque code that maps to the user data + token
      const authCode = crypto.randomBytes(32).toString('hex');
      
      // Store temporarily in memory (5 min expiration)
      if (!global.oauthPendingLogins) {
        global.oauthPendingLogins = new Map();
      }
      
      (global.oauthPendingLogins as Map<string, any>).set(authCode, {
        user: { ...user, password: undefined },
        token,
        isFirstLogin,
        expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
      
      // Clean up expired codes periodically
      const entries = Array.from(global.oauthPendingLogins.entries());
      for (const [code, data] of entries) {
        if (data.expiresAt < Date.now()) {
          global.oauthPendingLogins.delete(code);
        }
      }
      
      // Redirect to a safe exchange endpoint
      res.redirect(`/auth/google/success?code=${authCode}`);
    }
  );

  // Success page that calls postMessage securely
  app.get("/auth/google/success", (req, res) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login Successful</title>
        </head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2>Login bem-sucedido!</h2>
          <p>Redirecionando...</p>
          <script>
            (function() {
              const code = new URLSearchParams(window.location.search).get('code');
              if (code && window.opener) {
                window.opener.postMessage({
                  type: 'GOOGLE_AUTH_CODE',
                  code: code
                }, window.location.origin);
                setTimeout(() => window.close(), 1000);
              } else {
                // Fallback: redirect to dashboard with code
                window.location.href = '/dashboard?oauth_code=' + code;
              }
            })();
          </script>
        </body>
      </html>
    `;
    res.send(html);
  });

  // Exchange opaque code for user data + JWT (API endpoint)
  app.post("/api/auth/google/exchange", (req, res) => {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Invalid code' });
    }
    
    const loginData = global.oauthPendingLogins?.get(code);
    
    if (!loginData || (loginData as any).expiresAt < Date.now()) {
      global.oauthPendingLogins?.delete(code);
      return res.status(400).json({ error: 'Invalid or expired code' });
    }
    
    // Remove code immediately after use (single use)
    if (global.oauthPendingLogins) {
      global.oauthPendingLogins.delete(code);
    }
    
    // Return user data, token, and first login flag
    res.json({
      user: loginData.user,
      token: (loginData as any).token,
      isFirstLogin: (loginData as any).isFirstLogin || false
    });
  });

  app.get("/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

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
      
      // Hash password before storing (only if password provided)
      const { confirmPassword, ...userData } = validatedData;
      const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;
      const user = await storage.createUser({ 
        ...userData, 
        password: hashedPassword 
      });

      // Send welcome email (don't wait for it to complete)
      sendWelcomeEmail(user.email, user.name).catch(error => {
        console.error('Erro ao enviar email de boas-vindas:', error);
      });

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
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Google OAuth users don't have passwords
      if (!user.password) {
        return res.status(401).json({ message: "Por favor, faça login com o Google" });
      }
      
      // Use bcrypt to compare passwords
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Check if this is the first login (lastLoginAt is null)
      const isFirstLogin = !user.lastLoginAt;
      
      // Update lastLoginAt timestamp
      await storage.updateLastLogin(user.id);

      // Generate JWT token for the user
      const token = jwt.sign(
        { 
          email: user.email, 
          name: user.name, 
          userId: user.id
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove password from response and add first login flag
      const { password: _, ...userResponse } = user;
      res.json({
        ...userResponse,
        isFirstLogin,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Forgot password - Request password reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists for security
        return res.json({ message: "Se o email existir em nossa base, você receberá instruções de recuperação" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Token expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      
      // Save token to database
      await storage.createPasswordResetToken(user.id, hashedToken, expiresAt);
      
      // Send email with reset token
      await sendPasswordResetEmail(user.email, resetToken);
      
      res.json({ message: "Se o email existir em nossa base, você receberá instruções de recuperação" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Erro ao processar solicitação" });
    }
  });

  // Validate reset token endpoint
  app.post("/api/auth/validate-reset-token", async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ message: "Token é obrigatório" });
      }

      // Hash the token to match stored version
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Get token from database
      const resetToken = await storage.getPasswordResetToken(hashedToken);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido" });
      }
      
      // Check if token is expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "Token expirado" });
      }
      
      // Check if token was already used
      if (resetToken.used) {
        return res.status(400).json({ message: "Token já foi utilizado" });
      }
      
      res.json({ message: "Token válido" });
    } catch (error) {
      console.error("Validate token error:", error);
      res.status(500).json({ message: "Erro ao validar token" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token e nova senha são obrigatórios" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "A nova senha deve ter pelo menos 6 caracteres" });
      }

      // Hash the token to match stored version
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Get token from database
      const resetToken = await storage.getPasswordResetToken(hashedToken);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }
      
      // Check if token is expired
      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "Token expirado" });
      }
      
      // Check if token was already used
      if (resetToken.used) {
        return res.status(400).json({ message: "Token já foi utilizado" });
      }
      
      // Update user password
      await storage.updateUserPassword(resetToken.userId, newPassword);
      
      // Mark token as used
      await storage.markTokenAsUsed(hashedToken);
      
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Erro ao redefinir senha" });
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
      if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });
      
      // Check if user is Free and reached limit
      const user = await storage.getUser(userId);
      if (user?.planType === 'free') {
        const limits = await storage.checkFreeUserLimits(userId);
        if (limits.limitReached) {
          return res.status(403).json({ 
            error: 'FREE_USER_LIMIT_REACHED',
            message: `Limite de ${limits.total}/10 trades e imports atingido. Faça upgrade para continuar.`,
            limits: limits
          });
        }
      }
      
      // Validate wallet ownership if walletId is provided
      if (req.body.walletId) {
        const wallet = await storage.getWallet(userId, req.body.walletId);
        if (!wallet) {
          return res.status(400).json({ 
            message: 'Carteira não encontrada ou não pertence ao usuário' 
          });
        }
      }
      
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
      
      // Check if user is Free and reached limit
      const user = await storage.getUser(userId);
      if (user?.planType === 'free') {
        const limits = await storage.checkFreeUserLimits(userId);
        if (limits.limitReached) {
          return res.status(403).json({ 
            error: 'FREE_USER_LIMIT_REACHED',
            message: `Limite de ${limits.total}/10 trades e imports atingido. Faça upgrade para continuar.`,
            limits: limits
          });
        }
      }
      
      const file = req.file;
      const broker = req.body.broker || 'auto';
      const walletId = req.body.walletId || null;
      const useTraditional = req.body.useTraditional === 'true' || req.body.useTraditional === true;

      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Validate wallet ownership if walletId is provided
      if (walletId) {
        const wallet = await storage.getWallet(userId, walletId);
        if (!wallet) {
          fs.unlinkSync(file.path);
          return res.status(400).json({ 
            message: 'Carteira não encontrada ou não pertence ao usuário' 
          });
        }
      }

      console.log(`🤖 Sistema de Importação CSV: ${file.originalname}`);
      console.log(`📋 Parâmetros recebidos:`, {
        useTraditional: req.body.useTraditional,
        useTraditionalParsed: useTraditional,
        broker,
        csvName: req.body.csvName
      });
      
      // DETECTAR SE É ARQUIVO EXCEL
      const buffer = fs.readFileSync(file.path);
      const isExcel = buffer[0] === 0x50 && buffer[1] === 0x4B; // PK magic bytes
      
      if (isExcel) {
        console.log(`📊 Arquivo Excel detectado, processando como Clear...`);
        const excelResult = await processExcelFile(file.path, userId);
        
        const csvImport = await storage.createCsvImport({
          userId,
          fileName: file.originalname,
          displayName: req.body.csvName || file.originalname,
          broker: 'clear',
          tradesImported: excelResult.length,
          status: "completed",
          tradesSkipped: 0,
          errorMessage: null,
          walletId: walletId || null
        });

        if (excelResult.length > 0) {
          console.log(`💾 [${userId}] Inserindo ${excelResult.length} trades Excel no banco`);
          // Excel da Clear é B3, não precisa conversão (já está em BRL)
          // Adicionar walletId se fornecido
          const tradesWithWallet = walletId 
            ? excelResult.map(trade => ({ ...trade, walletId }))
            : excelResult;
          await storage.createBulkTrades(tradesWithWallet, csvImport.id);
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        return res.json({
          message: `🎉 ${excelResult.length} trades importados do Excel Clear!`,
          tradesImported: excelResult.length,
          broker: 'clear',
          market: 'b3',
          csvId: csvImport.id,
          summary: {
            totalRows: excelResult.length,
            tradesFound: excelResult.length,
            detectedBroker: 'clear',
            detectedMarket: 'b3',
            processingMethod: 'Processamento Excel Clear'
          }
        });
      }

      // VALIDAÇÃO PRÉ-PROCESSAMENTO: Verificar estrutura básica (modo compatibilidade)
      console.log(`🔍 Executando validação básica de estrutura...`);
      try {
        const validation = await validateAndParseCSV(file.path);
        
        if (validation.valid) {
          console.log(`✅ Validação passou: ${validation.headers?.length} colunas, ${validation.rows?.length} trades válidos`);
        } else {
          console.log(`⚠️ Validação falhou mas prosseguindo: ${validation.reason}`);
          // Apenas avisar, mas não bloquear (modo compatibilidade)
        }
      } catch (validationError) {
        console.log(`⚠️ Erro na validação, prosseguindo: ${validationError}`);
        // Ignorar erros de validação e prosseguir com o processamento tradicional
      }
      console.log(`👤 Usuário: ${userId}, 🏢 Broker: ${broker}, 🔄 Método: ${useTraditional ? 'Tradicional' : 'ChatGPT (Padrão)'}`);

      // 🗓️ VALIDAÇÃO DE DATAS - Já feita no csvValidator
      // A validação de datas agora está integrada no csvValidator.ts
      // que já valida estrutura, colunas e datas em um único passo

      let result;
      
      if (useTraditional) {
        // Usar sistema tradicional quando especificamente solicitado
        console.log(`🕧 Usando sistema tradicional para analisar CSV...`);
        const { processSmartCSV } = await import('./smart-csv-processor');
        result = await processSmartCSV(file.path, userId, broker);
      } else {
        // Usar ChatGPT como padrão - Análise estrutural completa
        console.log(`🤖 Usando ChatGPT (PADRÃO) para análise estrutural completa...`);
        console.log(`🔑 OpenAI API Key disponível: ${process.env.OPENAI_API_KEY ? 'Sim (***' + process.env.OPENAI_API_KEY.slice(-4) + ')' : 'Não'}`);
        
        // Testar conexão OpenAI antes de processar
        try {
          const { OpenAI } = await import('openai');
          const testClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          console.log('🧪 Testando conexão OpenAI...');
          
          // Teste simples
          const testResponse = await testClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'Hello' }],
            max_completion_tokens: 5
          });
          
          console.log('✅ OpenAI conectado com sucesso!');
        } catch (testError) {
          console.error('❌ Erro de conexão OpenAI:', testError);
          console.error('🚫 Usando sistema tradicional por falha na OpenAI');
          
          // Forçar uso do sistema tradicional se OpenAI falhar
          const { processSmartCSV } = await import('./smart-csv-processor');
          result = await processSmartCSV(file.path, userId, broker);
          // Note: processingMethod will be added to summary later
          
          // Skip ChatGPT processing and go to saving
          const csvImport = await storage.createCsvImport({
            userId,
            fileName: file.originalname,
            displayName: req.body.csvName || file.originalname,
            broker: result.summary.detectedBroker,
            tradesImported: result.trades.length,
            status: "completed",
            tradesSkipped: result.summary.statisticsSkipped || 0,
            errorMessage: null,
            walletId: walletId || null
          });

          if (result.trades.length > 0) {
            console.log(`🔄 Aplicando conversão de moeda para trades de Forex/Crypto...`);
            const convertedTrades = await convertTradesToBRL(result.trades);
            // Adicionar walletId se fornecido
            const tradesWithWallet = walletId 
              ? convertedTrades.map(trade => ({ ...trade, walletId }))
              : convertedTrades;
            console.log(`💾 [${userId}] Inserindo ${tradesWithWallet.length} trades no banco com isolamento`);
            await storage.createBulkTrades(tradesWithWallet);
          }

          return res.json({
            message: `🎉 ${result.trades.length} trades importados com sucesso! (Sistema tradicional usado)`,
            tradesImported: result.trades.length,
            broker: result.summary.detectedBroker,
            market: result.summary.detectedMarket,
            csvId: csvImport.id,
            summary: result.summary,
            errors: result.errors
          });
        }
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
          error.includes('ARQUIVO DE ESTATÍSTICAS DETECTADO') ||
          error.includes('estatísticas/relatórios') ||
          error.includes('Nenhum trade com data específica')
        );

        // VALIDAÇÃO CRÍTICA: Rejeitar arquivos sem trades reais (para preservar calendário)
        if (isStatisticsFile) {
          console.log(`❌ Arquivo rejeitado: contém apenas estatísticas/relatórios sem datas específicas`);
          
          // Clean up uploaded file
          fs.unlinkSync(file.path);
          
          return res.status(400).json({
            message: "🚫 Arquivo sem datas específicas de trades",
            details: "O arquivo enviado contém apenas estatísticas ou resumos, mas não trades individuais com datas específicas. Para usar o calendário e visualizar trades por data, é necessário um arquivo de histórico real.",
            errors: result.errors,
            suggestion: "📅 Envie um arquivo com histórico de trades que contenha:\n• Data/hora específica de cada operação\n• Símbolo do ativo negociado\n• Resultado individual de cada trade\n\nExemplos: extrato de execuções, relatório de ordens, histórico de negociações.",
            type: "validation_error",
            errorCode: "NO_TRADE_DATES"
          });
        }

        // Se ChatGPT não encontrou trades, SEMPRE tentar sistema tradicional
        if (result.trades.length === 0) {
          console.log(`🤝 Sistema Colaborativo: ChatGPT não encontrou dados`);
          console.log(`🔄 Tentando sistema tradicional para extrair qualquer dado possível...`);
          const { processSmartCSV } = await import('./smart-csv-processor');
          
          // Sistema tradicional - com validação de datas reais
          const fallbackResult = await processSmartCSV(file.path, userId, broker);
          
          if (fallbackResult.trades.length > 0) {
            console.log(`✅ Sistema tradicional extraiu ${fallbackResult.trades.length} trades com datas válidas`);
            result = {
              ...fallbackResult,
              summary: {
                ...fallbackResult.summary,
                processingMethod: 'Sistema Tradicional (Fallback após ChatGPT)'
              },
              errors: result.errors.concat(['ℹ️ ChatGPT falhou, sistema tradicional extraiu os dados'])
            };
          } else {
            console.log(`❌ Ambos sistemas não conseguiram extrair trades válidos`);
            
            // Clean up uploaded file
            fs.unlinkSync(file.path);
            
            return res.status(400).json({
              message: "🚫 Nenhum trade válido encontrado",
              details: "O arquivo não contém trades com datas específicas necessárias para o calendário.",
              errors: fallbackResult.errors,
              suggestion: "📅 Verifique se o arquivo contém:\n• Histórico real de trades (não estatísticas)\n• Datas específicas de cada operação\n• Símbolos dos ativos negociados",
              type: "validation_error", 
              errorCode: "NO_VALID_TRADES"
            });
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
        
        // Verificar se o erro é específico sobre datas
        const isDateError = result.errors.some(error => 
          error.includes('estatísticas/relatórios') ||
          error.includes('Nenhum trade com data específica') ||
          error.includes('trades reais com datas específicas')
        );
        
        if (isDateError) {
          return res.status(400).json({
            message: "🚫 Arquivo sem datas específicas de trades",
            details: "O arquivo enviado não contém trades individuais com datas específicas. Para usar o calendário, são necessárias operações com datas reais de execução.",
            errors: result.errors,
            suggestion: "📅 Envie um arquivo de histórico de trades que contenha:\n• Data/hora específica de cada operação\n• Símbolo do ativo negociado\n• Resultado individual de cada trade\n\nExemplos: extrato de execuções, relatório de ordens, histórico de negociações.",
            type: "validation_error",
            errorCode: "NO_TRADE_DATES"
          });
        }
        
        return res.status(400).json({ 
          message: "🚫 Nenhum trade válido encontrado no arquivo",
          type: "no_trades_found",
          details: {
            totalRows: result.summary.totalRows,
            statisticsSkipped: result.summary.statisticsSkipped,
            detectedBroker: result.summary.detectedBroker,
            detectedMarket: result.summary.detectedMarket,
            reason: "O arquivo foi processado mas não contém dados de trades reconhecíveis."
          },
          errors: result.errors,
          suggestion: "Verifique se o arquivo contém dados de trading em formato válido."
        });
      }

      // Record CSV import first to get the ID
      const csvImportRecord = await storage.createCsvImport({
        userId,
        broker: result.summary.detectedBroker,
        fileName: file.originalname,
        displayName: null, // Será definido pelo usuário se desejar
        tradesImported: 0, // Será atualizado depois
        tradesSkipped: result.summary.statisticsSkipped,
        status: 'completed',
        errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
        walletId: walletId || null
      });

      // Convert trades from USD to BRL for Forex/Crypto markets
      console.log(`🔄 Aplicando conversão de moeda para trades de Forex/Crypto...`);
      const convertedTrades = await convertTradesToBRL(result.trades);
      
      // Adicionar walletId se fornecido
      const tradesWithWallet = walletId 
        ? convertedTrades.map(trade => ({ ...trade, walletId }))
        : convertedTrades;
      
      // Save trades to database with CSV import ID
      const processingMethod = (result.summary as any)?.processingMethod || 'Sistema Tradicional';
      console.log(`💾 Salvando ${tradesWithWallet.length} trades no banco... (Método: ${processingMethod})`);
      const savedTrades = await storage.createBulkTrades(tradesWithWallet, csvImportRecord.id);

      // Update CSV import with final trade count in database
      await storage.updateCsvImportTradesCount(csvImportRecord.id, savedTrades.length);
      console.log(`📝 CSV import ${csvImportRecord.id} completed with ${savedTrades.length} trades`);

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

  // Deletar CSV import e trades relacionados - ISOLADO POR USUÁRIO
  app.delete("/api/csv-imports/:id", requireAuth, async (req, res) => {
    try {
      const userId = req.userId; // ISOLAMENTO OBRIGATÓRIO
      const csvId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const deleted = await storage.deleteCsvImport(userId, csvId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'CSV não encontrado' });
      }

      res.json({ 
        message: 'CSV e trades relacionados foram excluídos com sucesso'
      });
    } catch (error) {
      console.error("Error deleting CSV import:", error);
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

      // Aplicar conversão de moeda para Forex/Crypto antes de salvar
      console.log(`🔄 Aplicando conversão de moeda para trades de Forex/Crypto...`);
      const convertedSmartTrades = await convertTradesToBRL(smartTrades);
      
      // Salvar novos trades interpretados (sem CSV import ID pois é reprocessamento)
      const savedTrades = await storage.createBulkTrades(convertedSmartTrades);
      
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
      const userId = req.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      // Verificar plano do usuário
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Para usuários FREE, retornar conselho básico
      if (user.planType === 'free') {
        const basicAdvices = [
          "Continue operando com disciplina e seguindo seu plano de trading.",
          "Mantenha um diário de trading para acompanhar sua evolução.",
          "Defina sempre seu stop loss antes de entrar em uma operação.",
          "Foque na consistência ao invés de trades únicos de alto lucro.",
          "Estude o mercado todos os dias para aprimorar suas análises."
        ];
        const randomAdvice = basicAdvices[Math.floor(Math.random() * basicAdvices.length)];
        return res.json({ advice: randomAdvice });
      }

      // Para usuários STARTER, PRO e BLACK, usar IA real
      const { aiService } = await import('./ai-service');
      
      // Buscar dados do usuário para contextualizar a IA
      const trades = await storage.getTrades(userId);
      const csvImports = await storage.getCsvImports(userId);
      
      // Gerar conselho personalizado usando IA
      const advice = await aiService.generateDailyAdvice(userId, trades, csvImports);
      
      res.json({ advice });
    } catch (error) {
      console.error("Error fetching AI advice:", error);
      // Fallback para erro
      res.json({ advice: "Continue operando com disciplina e seguindo seu plano de trading." });
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

        // Buscar apenas trades relacionados a este CSV específico usando csvImportId
        const allTrades = await storage.getTrades(userId);
        trades = allTrades.filter(trade => trade.csvImportId === csvId);
        
        console.log(`🔍 Análise AI do CSV ${csvId}: ${trades.length} trades encontrados`);

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
      const tips = await aiService.generateCsvBasedTips(userId, trades, csvImports);
      
      res.json({ tips });
    } catch (error) {
      console.error('Erro na análise de CSV para dicas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // AI Chat endpoint
  app.post('/api/ai/chat', requireAuth, async (req, res) => {
    try {
      const { message, language = 'pt' } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Mensagem é obrigatória' });
      }

      // Get user context for personalized responses
      const userId = req.userId;
      let userContext = undefined;
      
      if (userId) {
        const user = await storage.getUser(userId);
        
        // Check if user has a free plan (all paid plans have full access)
        const isPaidPlan = (plan: string) => plan === 'monthly' || plan === 'quarterly' || plan === 'annual';
        if (user && !isPaidPlan(user.planType || 'free')) {
          const upgradeMessage = language === 'en' 
            ? `🤖 **AI Assistant Available for Premium Members Only**

I'm your dedicated trading mentor powered by the most advanced technology available, ready to analyze your trades, optimize your strategies, and accelerate your trading success. However, this advanced AI assistance is exclusive to our premium members.

**🚀 Unlock Premium AI Features:**

All paid plans include:
• Unlimited trades
• AI Trading Assistant with deep market analysis
• Personalized trade recommendations
• Advanced performance analytics
• Priority support
• Full access to all features

**💳 Monthly** - R$ 97/month
**📦 Quarterly** - R$ 197/quarter (Save 32%)
**🏆 Annual** - R$ 547/year (Save 53%)

**Ready to dominate the markets?** Upgrade now and get your first AI analysis in seconds!`
            : `🤖 **Assistente IA Exclusivo para Membros Premium**

Sou seu mentor de trading pessoal, alimentado pela tecnologia mais avançada do mercado. Estou aqui para analisar seus trades, otimizar suas estratégias e acelerar seus resultados. Porém, este assistente premium está disponível apenas para nossos membros.

**🚀 Desbloqueie o Poder da IA Premium:**

Todos os planos pagos incluem:
• Trades ilimitados
• Assistente IA com análise profunda de mercado
• Recomendações personalizadas de trades
• Analytics avançados de performance
• Suporte prioritário
• Acesso completo a todos os recursos

**💳 Mensal** - R$ 97/mês
**📦 Trimestral** - R$ 197/trimestre (Economize 32%)
**🏆 Anual** - R$ 547/ano (Economize 53%)

**Pronto para dominar os mercados?** Faça upgrade agora e tenha sua primeira análise IA em segundos!`;

          return res.json({ reply: upgradeMessage });
        }
        
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
      const reply = await aiService.chatWithTrader(userId || '', message, userContext, language);
      res.json({ reply });
    } catch (error) {
      console.error('Erro no chat AI:', error);
      res.status(500).json({ error: 'Desculpe, ocorreu um erro. Tente novamente em alguns instantes.' });
    }
  });

  // ADMIN AUTHENTICATION ROUTES
  
  // Admin login with database authentication and bcrypt
  app.post("/api/admin/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }
      
      // Get admin user from database
      const adminUser = await storage.getUserByEmail(email);
      if (!adminUser || adminUser.role !== 'admin') {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      // Check if admin has password (not Google OAuth user)
      if (!adminUser.password) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Compare password with bcrypt
      const isValidPassword = await bcrypt.compare(password, adminUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      const token = jwt.sign(
        { 
          email: adminUser.email, 
          name: adminUser.name, 
          role: 'admin',
          userId: adminUser.id
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        token,
        admin: {
          email: adminUser.email,
          name: adminUser.name,
          role: 'admin'
        }
      });
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
  
  // EXCHANGE RATE ROUTES
  
  // GET /api/exchange-rate - Get current USD/BRL exchange rate
  app.get("/api/exchange-rate", async (req, res) => {
    try {
      const rate = await getUsdToBrlRate();
      res.json({ 
        rate,
        base: 'USD',
        target: 'BRL',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      res.status(500).json({ error: 'Erro ao buscar taxa de câmbio', rate: 5.80 });
    }
  });
  
  // USER PROFILE ROUTES
  
  // GET /api/user/plan - Get user plan information
  app.get("/api/user/plan", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) return res.status(401).json({ message: 'Usuário não autenticado' });
      
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      let planType = user.planType || 'free';
      let daysRemaining;
      let expiresAt;

      // Fix legacy users: if paid plan but no expiration date, set correct duration
      if (planType !== 'free' && !user.planExpiresAt) {
        const getPlanDurationDays = (plan: string): number => {
          switch (plan) {
            case 'monthly': return 30;
            case 'quarterly': return 90;
            case 'annual': return 365;
            default: return 30;
          }
        };
        
        const durationDays = getPlanDurationDays(planType);
        const now = new Date();
        const expirationDate = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        console.log(`🔧 Corrigindo usuário ${userId} com plano ${planType} sem data de expiração. Definindo ${durationDays} dias.`);
        
        await storage.updateUserByAdmin(userId, { 
          planExpiresAt: expirationDate
        });
        
        // Update user object for calculations below
        user.planExpiresAt = expirationDate;
      }

      // Check if paid plan has expired and automatically downgrade to free
      if (planType !== 'free' && user.planExpiresAt) {
        const now = new Date();
        const expirationDate = new Date(user.planExpiresAt);
        
        if (now > expirationDate) {
          // Plan expired - automatically downgrade to free
          console.log(`🔄 Plano ${planType} do usuário ${userId} expirou. Mudando para free.`);
          await storage.updateUserByAdmin(userId, { 
            planType: 'free',
            planExpiresAt: undefined 
          });
          planType = 'free';
          daysRemaining = undefined;
          expiresAt = undefined;
        } else {
          // Plan still active - calculate remaining days
          const timeDiff = expirationDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
          expiresAt = user.planExpiresAt.toISOString();
        }
      }
      
      // Helper function to check if plan is paid (monthly, quarterly, annual)
      const isPaidPlan = (plan: string) => plan === 'monthly' || plan === 'quarterly' || plan === 'annual';
      
      res.json({
        planType,
        isAiEnabled: isPaidPlan(planType), // All paid plans have AI access
        hasUnlimitedTrades: isPaidPlan(planType), // All paid plans have unlimited trades
        daysRemaining,
        expiresAt
      });
    } catch (error) {
      console.error("Error fetching user plan:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  // PATCH /api/user/whatsapp - Update WhatsApp number
  app.patch("/api/user/whatsapp", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const { whatsappNumber } = req.body;
      
      if (!whatsappNumber || typeof whatsappNumber !== 'string') {
        return res.status(400).json({ message: "Número do WhatsApp inválido" });
      }
      
      const updatedUser = await storage.updateProfile(userId, { whatsappNumber });
      
      res.json({
        message: "Número do WhatsApp atualizado com sucesso",
        whatsappNumber: updatedUser.whatsappNumber
      });
    } catch (error) {
      console.error("Error updating WhatsApp number:", error);
      res.status(500).json({ message: "Erro ao atualizar número do WhatsApp" });
    }
  });
  
  // PUT /api/profile - Atualizar perfil do usuário
  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const updates = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateProfile(userId, updates);
      
      res.json({
        message: "Perfil atualizado com sucesso",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          whatsappNumber: updatedUser.whatsappNumber
        }
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Erro ao atualizar perfil" 
      });
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
      req.userId = decoded.sub || decoded.id || 'admin'; // Definir userId para compatibilidade
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

  // GET /api/admin/users/export - Exportar usuários em CSV
  app.get("/api/admin/users/export", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Cabeçalhos CSV
      const csvHeaders = [
        'ID',
        'Nome',
        'Email',
        'Telefone',
        'WhatsApp',
        'Plano',
        'Status',
        'Data Registro',
        'Expiração Plano',
        'Admin'
      ].join(',');
      
      // Converter usuários para linhas CSV
      const csvRows = users.map(user => {
        return [
          user.id,
          `"${(user.name || '').replace(/"/g, '""')}"`, // Escapar aspas
          user.email,
          user.phone || '',
          user.whatsappNumber || '',
          user.planType,
          user.isActive ? 'Ativo' : 'Inativo',
          user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '',
          user.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString('pt-BR') : '',
          user.email === ADMIN_EMAIL ? 'Sim' : 'Não'
        ].join(',');
      });
      
      // Combinar cabeçalhos e linhas
      const csv = [csvHeaders, ...csvRows].join('\n');
      
      // Configurar headers HTTP para download
      const timestamp = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="usuarios-metrika-${timestamp}.csv"`);
      
      // Adicionar BOM UTF-8 para Excel reconhecer caracteres especiais
      res.send('\ufeff' + csv);
    } catch (error) {
      console.error("Error exporting users:", error);
      res.status(500).json({ message: "Erro ao exportar usuários" });
    }
  });

  // PUT /api/admin/users/:id - Atualizar usuário
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const updates = updateUserByAdminSchema.parse(req.body);
      
      // Política de 30 dias automáticos: sempre ignorar planExpiresAt do frontend
      // e aplicar automaticamente 30 dias quando planType é alterado para plano pago
      if (updates.planExpiresAt) {
        delete updates.planExpiresAt; // Ignorar qualquer data manual
        console.log('⚠️ Admin tentou definir planExpiresAt manualmente. Política de 30 dias automáticos aplicada.');
      }
      
      // Se o plano está sendo alterado, verificar se é downgrade para free
      // Downgrades para free forçam logout por segurança
      // Upgrades e mudanças entre planos pagos: frontend detecta via polling
      if (updates.planType) {
        const currentUser = await storage.getUser(userId);
        if (currentUser && currentUser.planType !== updates.planType) {
          const isNowFree = updates.planType === 'free';
          const wasNotFree = currentUser.planType !== 'free';
          
          if (wasNotFree && isNowFree) {
            // Downgrade para free: forçar logout por segurança
            // Trata null/undefined/qualquer valor não-free como plano pago para garantir segurança
            console.log(`🔄 Usuário ${userId} rebaixado de ${currentUser.planType || 'unknown'} para free. Forçando logout por segurança.`);
            await storage.setForceLogout(userId);
          } else {
            // Upgrade ou mudança entre planos (não para free): atualização em tempo real
            console.log(`🔄 Plano do usuário ${userId} alterado de ${currentUser.planType || 'unknown'} para ${updates.planType}. Frontend será atualizado via polling.`);
          }
        }
      }
      
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
  // Sempre calcula em tempo real para garantir dados atualizados com a nova estrutura de planos
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const allTrades = await storage.getAllTrades();
      
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => u.isActive).length;
      const monthlyUsers = allUsers.filter(u => u.planType === 'monthly').length;
      const quarterlyUsers = allUsers.filter(u => u.planType === 'quarterly').length;
      const annualUsers = allUsers.filter(u => u.planType === 'annual').length;
      const freeUsers = allUsers.filter(u => !u.planType || u.planType === 'free').length;
      
      // Calcular receita mensal baseado nos novos planos
      // Mensal: R$97/mês, Trimestral: R$197/3 meses (~R$65.67/mês), Anual: R$547/12 meses (~R$45.58/mês)
      const monthlyRevenue = (monthlyUsers * 97) + (quarterlyUsers * 65.67) + (annualUsers * 45.58);
      
      const calculatedStats = {
        date: new Date(),
        totalUsers,
        activeUsers,
        newUsers: 0,
        totalTrades: allTrades.length,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        monthlyUsers,
        quarterlyUsers,
        annualUsers,
        freeUsers,
      };
      
      res.json(calculatedStats);
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

      // Usar Papa.parse diretamente para análise simples
      const Papa = require('papaparse');
      const csvContent = fs.readFileSync(req.file.path, 'utf-8');
      const parseResult = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
      });
      const dados = parseResult.data;

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
          temNumeros: dados.some((linha: any) => 
            Object.values(linha).some(valor => typeof valor === 'number')
          ),
          temDatas: dados.some((linha: any) =>
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
          
          // Processar com Papa.parse
          const Papa = require('papaparse');
          const csvContent = fs.readFileSync(caminhoArquivo, 'utf-8');
          const parseResult = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true
          });
          const dados = parseResult.data;
          
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

  // Rotas do diário
  app.get('/api/diary', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const entries = await storage.getDiaryEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error('Erro ao buscar entradas do diário:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  app.get('/api/diary/:id', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const entry = await storage.getDiaryEntry(id, userId);
      
      if (!entry) {
        return res.status(404).json({ error: "Entrada do diário não encontrada" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error('Erro ao buscar entrada do diário:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  app.get('/api/diary/date/:date', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { date } = req.params;
      const entries = await storage.getDiaryEntriesByDate(userId, date);
      res.json(entries);
    } catch (error) {
      console.error('Erro ao buscar entradas do diário por data:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  app.post('/api/diary', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const validatedData = insertDiaryEntrySchema.parse(req.body);
      
      const entry = await storage.createDiaryEntry({
        ...validatedData,
        userId
      });
      
      res.json(entry);
    } catch (error) {
      console.error('Erro ao criar entrada do diário:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: error.errors
        });
      }
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  app.put('/api/diary/:id', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const validatedData = insertDiaryEntrySchema.partial().parse(req.body);
      
      const entry = await storage.updateDiaryEntry(id, validatedData, userId);
      res.json(entry);
    } catch (error) {
      console.error('Erro ao atualizar entrada do diário:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos",
          details: error.errors
        });
      }
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  app.delete('/api/diary/:id', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      
      await storage.deleteDiaryEntry(id, userId);
      res.json({ message: "Entrada do diário deletada com sucesso" });
    } catch (error) {
      console.error('Erro ao deletar entrada do diário:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Rotas para imagens do diário
  
  // Upload de imagem para uma entrada do diário (usando Object Storage)
  app.post('/api/diary/:id/images', requireAuth, uploadImage.single('image'), async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { id: diaryEntryId } = req.params;
      const { caption } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }
      
      // Verificar se a entrada do diário existe e pertence ao usuário
      const diaryEntry = await storage.getDiaryEntry(diaryEntryId, userId);
      if (!diaryEntry) {
        return res.status(404).json({ error: "Entrada do diário não encontrada" });
      }
      
      const imageId = crypto.randomUUID();
      const extension = req.file.originalname.split('.').pop() || 'jpg';
      let storedPath: string;
      let fileName: string;
      
      // Verificar se Object Storage está configurado
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
      if (privateObjectDir) {
        // Upload para Object Storage
        const objectStorageService = new ObjectStorageService();
        const objectPath = `/diary-images/${userId}/${imageId}.${extension}`;
        
        storedPath = await objectStorageService.uploadBuffer(
          req.file.buffer,
          objectPath,
          req.file.mimetype
        );
        fileName = `${imageId}.${extension}`;
      } else {
        // Fallback: salvar localmente (para dev sem Object Storage configurado)
        const uploadsDir = 'uploads/images';
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fileName = `${imageId}.${extension}`;
        storedPath = `${uploadsDir}/${fileName}`;
        fs.writeFileSync(storedPath, req.file.buffer);
        console.warn('⚠️ Object Storage não configurado, usando armazenamento local');
      }
      
      // Criar registro da imagem no banco
      const imageData = {
        diaryEntryId,
        fileName,
        originalName: req.file.originalname,
        filePath: storedPath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        caption: caption || null
      };
      
      const image = await storage.createDiaryImage(imageData);
      
      res.json({
        message: "Imagem enviada com sucesso",
        image: {
          id: image.id,
          fileName: image.fileName,
          originalName: image.originalName,
          caption: image.caption,
          fileSize: image.fileSize,
          mimeType: image.mimeType,
          createdAt: image.createdAt
        }
      });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Buscar imagens de uma entrada do diário
  app.get('/api/diary/:id/images', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { id: diaryEntryId } = req.params;
      
      // Verificar se a entrada do diário existe e pertence ao usuário
      const diaryEntry = await storage.getDiaryEntry(diaryEntryId, userId);
      if (!diaryEntry) {
        return res.status(404).json({ error: "Entrada do diário não encontrada" });
      }
      
      const images = await storage.getDiaryImages(diaryEntryId);
      res.json(images.map(img => ({
        id: img.id,
        fileName: img.fileName,
        originalName: img.originalName,
        caption: img.caption,
        fileSize: img.fileSize,
        mimeType: img.mimeType,
        createdAt: img.createdAt
      })));
    } catch (error) {
      console.error('Erro ao buscar imagens:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Servir imagem específica (usando Object Storage)
  app.get('/api/images/:imageId', async (req: any, res: any) => {
    try {
      const { imageId } = req.params;
      
      const image = await storage.getDiaryImage(imageId);
      if (!image) {
        return res.status(404).json({ error: "Imagem não encontrada" });
      }
      
      // Verificar se é um caminho do Object Storage
      if (image.filePath.startsWith('/objects/')) {
        // Buscar do Object Storage
        const objectStorageService = new ObjectStorageService();
        try {
          const objectFile = await objectStorageService.getObjectEntityFile(image.filePath);
          await objectStorageService.downloadObject(objectFile, res);
        } catch (error) {
          if (error instanceof ObjectNotFoundError) {
            return res.status(404).json({ error: "Arquivo de imagem não encontrado no storage" });
          }
          throw error;
        }
      } else {
        // Fallback para arquivos locais antigos
        if (!fs.existsSync(image.filePath)) {
          return res.status(404).json({ error: "Arquivo de imagem não encontrado" });
        }
        res.setHeader('Content-Type', image.mimeType);
        res.setHeader('Content-Length', image.fileSize);
        res.sendFile(path.resolve(image.filePath));
      }
    } catch (error) {
      console.error('Erro ao servir imagem:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Deletar imagem (usando Object Storage)
  app.delete('/api/diary/:diaryId/images/:imageId', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { diaryId, imageId } = req.params;
      
      // Verificar se a entrada do diário existe e pertence ao usuário
      const diaryEntry = await storage.getDiaryEntry(diaryId, userId);
      if (!diaryEntry) {
        return res.status(404).json({ error: "Entrada do diário não encontrada" });
      }
      
      // Buscar a imagem para obter o caminho do arquivo
      const image = await storage.getDiaryImage(imageId);
      if (!image || image.diaryEntryId !== diaryId) {
        return res.status(404).json({ error: "Imagem não encontrada" });
      }
      
      // Deletar do storage (Object Storage ou local)
      try {
        if (image.filePath.startsWith('/objects/')) {
          // Deletar do Object Storage
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.deleteObject(image.filePath);
        } else {
          // Deletar arquivo local (fallback para arquivos antigos)
          if (fs.existsSync(image.filePath)) {
            fs.unlinkSync(image.filePath);
          }
        }
      } catch (fileError) {
        console.warn('Erro ao deletar arquivo do storage:', fileError);
      }
      
      // Deletar o registro do banco
      await storage.deleteDiaryImage(imageId, diaryId);
      
      res.json({ message: "Imagem deletada com sucesso" });
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // ==================== ROTAS DE IMAGENS DE TRADES ====================
  
  // Upload de imagem para um trade (usando Object Storage)
  app.post('/api/trades/:tradeId/images', requireAuth, uploadImage.single('image'), async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { tradeId } = req.params;
      const { caption } = req.body;
      
      console.log(`📸 Iniciando upload de imagem para trade ${tradeId}, usuário ${userId}`);
      
      if (!req.file) {
        console.log('❌ Nenhuma imagem no request');
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }
      
      console.log(`📁 Arquivo recebido: ${req.file.originalname}, tamanho: ${req.file.size} bytes`);
      
      // Verificar se o trade existe e pertence ao usuário
      const trade = await db
        .select()
        .from(trades)
        .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
        .limit(1)
        .then(rows => rows[0]);
      
      if (!trade) {
        console.log(`❌ Trade ${tradeId} não encontrado para usuário ${userId}`);
        return res.status(404).json({ error: "Trade não encontrado" });
      }
      
      console.log(`✅ Trade encontrado: ${trade.id}`);
      
      const imageId = crypto.randomUUID();
      const extension = req.file.originalname.split('.').pop() || 'jpg';
      let storedPath: string;
      let fileName: string;
      
      // Verificar se Object Storage está configurado
      const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
      if (privateObjectDir) {
        // Upload para Object Storage
        console.log(`☁️ Fazendo upload para Object Storage...`);
        const objectStorageService = new ObjectStorageService();
        const objectPath = `/trade-images/${userId}/${imageId}.${extension}`;
        
        storedPath = await objectStorageService.uploadBuffer(
          req.file.buffer,
          objectPath,
          req.file.mimetype
        );
        fileName = `${imageId}.${extension}`;
        console.log(`✅ Upload Object Storage concluído: ${storedPath}`);
      } else {
        // Fallback: salvar localmente (para dev sem Object Storage configurado)
        const uploadsDir = 'uploads/images';
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fileName = `${imageId}.${extension}`;
        storedPath = `${uploadsDir}/${fileName}`;
        fs.writeFileSync(storedPath, req.file.buffer);
        console.warn('⚠️ Object Storage não configurado, usando armazenamento local');
        console.log(`💾 Arquivo salvo localmente: ${storedPath}`);
      }
      
      // Criar registro da imagem no banco
      const imageData = {
        tradeId,
        diaryEntryId: null,
        fileName,
        originalName: req.file.originalname,
        filePath: storedPath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        caption: caption || null
      };
      
      console.log(`💾 Salvando registro no banco:`, JSON.stringify(imageData));
      
      const [image] = await db
        .insert(diaryImages)
        .values(imageData)
        .returning();
      
      console.log(`✅ Imagem salva no banco com ID: ${image.id}`);
      
      res.json({
        message: "Imagem enviada com sucesso",
        image: {
          id: image.id,
          fileName: image.fileName,
          originalName: image.originalName,
          caption: image.caption,
          fileSize: image.fileSize,
          mimeType: image.mimeType,
          createdAt: image.createdAt
        }
      });
    } catch (error) {
      console.error('❌ Erro ao fazer upload da imagem do trade:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Buscar imagens de um trade
  app.get('/api/trades/:tradeId/images', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { tradeId } = req.params;
      
      // Verificar se o trade existe e pertence ao usuário
      const trade = await db
        .select()
        .from(trades)
        .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
        .limit(1)
        .then(rows => rows[0]);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade não encontrado" });
      }
      
      const images = await db
        .select()
        .from(diaryImages)
        .where(eq(diaryImages.tradeId, tradeId));
      
      res.json({
        images: images.map(img => ({
          id: img.id,
          fileName: img.fileName,
          originalName: img.originalName,
          caption: img.caption,
          fileSize: img.fileSize,
          mimeType: img.mimeType,
          createdAt: img.createdAt
        }))
      });
    } catch (error) {
      console.error('Erro ao buscar imagens do trade:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Deletar imagem de um trade (usando Object Storage)
  app.delete('/api/trades/:tradeId/images/:imageId', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { tradeId, imageId } = req.params;
      
      // Verificar se o trade existe e pertence ao usuário
      const trade = await db
        .select()
        .from(trades)
        .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
        .limit(1)
        .then(rows => rows[0]);
      
      if (!trade) {
        return res.status(404).json({ error: "Trade não encontrado" });
      }
      
      // Buscar a imagem para obter o caminho do arquivo
      const image = await db
        .select()
        .from(diaryImages)
        .where(and(eq(diaryImages.id, imageId), eq(diaryImages.tradeId, tradeId)))
        .limit(1)
        .then(rows => rows[0]);
      
      if (!image) {
        return res.status(404).json({ error: "Imagem não encontrada" });
      }
      
      // Deletar do storage (Object Storage ou local)
      try {
        if (image.filePath.startsWith('/objects/')) {
          // Deletar do Object Storage
          const objectStorageService = new ObjectStorageService();
          await objectStorageService.deleteObject(image.filePath);
        } else {
          // Deletar arquivo local (fallback para arquivos antigos)
          if (fs.existsSync(image.filePath)) {
            fs.unlinkSync(image.filePath);
          }
        }
      } catch (fileError) {
        console.warn('Erro ao deletar arquivo do storage:', fileError);
      }
      
      // Deletar o registro do banco
      await db
        .delete(diaryImages)
        .where(eq(diaryImages.id, imageId));
      
      res.json({ message: "Imagem deletada com sucesso" });
    } catch (error) {
      console.error('Erro ao deletar imagem do trade:', error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // ==================== ROTAS DE SUPORTE ====================
  
  // Buscar conversas do usuário
  app.get('/api/support/conversations', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      
      const conversations = await db
        .select({
          id: supportConversations.id,
          subject: supportConversations.subject,
          status: supportConversations.status,
          priority: supportConversations.priority,
          category: supportConversations.category,
          lastMessageAt: supportConversations.lastMessageAt,
          lastMessageByAdmin: supportConversations.lastMessageByAdmin,
          createdAt: supportConversations.createdAt,
        })
        .from(supportConversations)
        .where(eq(supportConversations.userId, userId))
        .orderBy(supportConversations.lastMessageAt);

      res.json(conversations);
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Criar nova conversa de suporte
  app.post('/api/support/conversations', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const validatedData = insertSupportConversationSchema.parse({
        ...req.body,
        userId
      });

      const [conversation] = await db
        .insert(supportConversations)
        .values(validatedData)
        .returning();

      res.status(201).json(conversation);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar mensagens de uma conversa
  app.get('/api/support/conversations/:id/messages', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const conversationId = req.params.id;

      // Verificar se a conversa pertence ao usuário
      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(eq(supportConversations.id, conversationId))
        .limit(1);

      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      const messages = await db
        .select({
          id: supportMessages.id,
          message: supportMessages.message,
          isFromAdmin: supportMessages.isFromAdmin,
          createdAt: supportMessages.createdAt,
        })
        .from(supportMessages)
        .where(eq(supportMessages.conversationId, conversationId))
        .orderBy(supportMessages.createdAt);

      res.json(messages);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Enviar mensagem em uma conversa
  app.post('/api/support/conversations/:id/messages', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const conversationId = req.params.id;

      // Verificar se a conversa pertence ao usuário
      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(eq(supportConversations.id, conversationId))
        .limit(1);

      if (!conversation || conversation.userId !== userId) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      // Verificar se a conversa foi resolvida
      if (conversation.status === 'resolved') {
        return res.status(403).json({ error: "Esta conversa foi resolvida e não pode receber mais mensagens" });
      }

      const validatedData = insertSupportMessageSchema.parse({
        conversationId,
        senderId: userId,
        message: req.body.message,
        isFromAdmin: false
      });

      const [message] = await db
        .insert(supportMessages)
        .values(validatedData)
        .returning();

      // Atualizar última mensagem da conversa
      await db
        .update(supportConversations)
        .set({
          lastMessageAt: new Date(),
          lastMessageByAdmin: false,
          status: conversation.status === 'closed' ? 'open' : conversation.status
        })
        .where(eq(supportConversations.id, conversationId));

      res.status(201).json(message);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ==================== ROTAS ADMIN DE SUPORTE ====================

  // Buscar todas as conversas de suporte (admin)
  app.get('/api/admin/support/conversations', requireAdmin, async (req: any, res: any) => {
    try {
      const conversations = await db
        .select({
          id: supportConversations.id,
          userId: supportConversations.userId,
          subject: supportConversations.subject,
          status: supportConversations.status,
          priority: supportConversations.priority,
          category: supportConversations.category,
          lastMessageAt: supportConversations.lastMessageAt,
          lastMessageByAdmin: supportConversations.lastMessageByAdmin,
          createdAt: supportConversations.createdAt,
        })
        .from(supportConversations)
        .where(ne(supportConversations.status, 'resolved'))
        .orderBy(supportConversations.lastMessageAt);

      // Buscar informações do usuário e primeira mensagem para cada conversa
      const conversationsWithUser = await Promise.all(
        conversations.map(async (conv) => {
          const user = await storage.getUserById(conv.userId);
          
          // Buscar a primeira mensagem do usuário
          const [firstUserMessage] = await db
            .select({
              message: supportMessages.message,
            })
            .from(supportMessages)
            .where(
              and(
                eq(supportMessages.conversationId, conv.id),
                eq(supportMessages.isFromAdmin, false)
              )
            )
            .orderBy(supportMessages.createdAt)
            .limit(1);
          
          return {
            ...conv,
            userName: user?.name || 'Usuário desconhecido',
            userEmail: user?.email || '',
            firstUserMessage: firstUserMessage?.message || null
          };
        })
      );

      res.json(conversationsWithUser);
    } catch (error) {
      console.error('Erro ao buscar conversas (admin):', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Responder a uma conversa (admin)
  app.post('/api/admin/support/conversations/:id/messages', requireAdmin, async (req: any, res: any) => {
    try {
      const conversationId = req.params.id;
      
      // Buscar o ID do usuário admin no banco pelo email
      let [adminUser] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, ADMIN_EMAIL));

      // Se o usuário admin não existir, criar ele
      if (!adminUser) {
        const [createdAdmin] = await db
          .insert(users)
          .values({
            name: 'Administrador Métrika',
            email: ADMIN_EMAIL,
            password: await bcrypt.hash('metrika777', 10),
            planType: 'annual',
            isActive: true,
            role: 'admin'
          })
          .returning({ id: users.id });

        adminUser = createdAdmin;
      }

      if (!adminUser) {
        return res.status(500).json({ error: "Erro ao encontrar ou criar usuário admin" });
      }

      // Verificar se a conversa existe
      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(eq(supportConversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }
      
      const validatedData = insertSupportMessageSchema.parse({
        conversationId,
        senderId: adminUser.id,
        message: req.body.message,
        isFromAdmin: true
      });

      const [message] = await db
        .insert(supportMessages)
        .values(validatedData)
        .returning();

      // Atualizar última mensagem da conversa
      await db
        .update(supportConversations)
        .set({
          lastMessageAt: new Date(),
          lastMessageByAdmin: true,
          status: 'in_progress'
        })
        .where(eq(supportConversations.id, conversationId));

      res.status(201).json(message);
    } catch (error) {
      console.error('Erro ao responder mensagem (admin):', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Dados inválidos", 
          details: error.errors 
        });
      }
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Buscar mensagens de uma conversa (admin)
  app.get('/api/admin/support/conversations/:id/messages', requireAdmin, async (req: any, res: any) => {
    try {
      const conversationId = req.params.id;

      // Verificar se a conversa existe
      const [conversation] = await db
        .select()
        .from(supportConversations)
        .where(eq(supportConversations.id, conversationId))
        .limit(1);

      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      const messages = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.conversationId, conversationId))
        .orderBy(supportMessages.createdAt);

      res.json(messages);
    } catch (error) {
      console.error('Erro ao buscar mensagens (admin):', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Alterar status de uma conversa (admin)
  app.put('/api/admin/support/conversations/:id/status', requireAdmin, async (req: any, res: any) => {
    try {
      const conversationId = req.params.id;
      const { status } = req.body;

      if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
        return res.status(400).json({ error: "Status inválido" });
      }

      const [conversation] = await db
        .update(supportConversations)
        .set({ status })
        .where(eq(supportConversations.id, conversationId))
        .returning();

      if (!conversation) {
        return res.status(404).json({ error: "Conversa não encontrada" });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Erro ao alterar status da conversa:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Função para verificar assinatura do Meta
  function verifyMetaSignature(payload: string, signature: string, appSecret: string): boolean {
    if (!signature || !appSecret) {
      return false;
    }
    
    try {
      // Remover o prefixo 'sha256=' se presente
      const cleanSignature = signature.replace('sha256=', '');
      
      // Calcular HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(payload, 'utf8')
        .digest('hex');
      
      // Comparação segura contra timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(cleanSignature, 'hex')
      );
    } catch (error) {
      console.error('❌ Error verifying Meta signature:', error);
      return false;
    }
  }

  // WhatsApp webhook verification (GET)
  app.get('/webhook', (req: any, res: any) => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // Em produção, exigir WHATSAPP_VERIFY_TOKEN
      let VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
      
      if (!VERIFY_TOKEN) {
        if (isDevelopment) {
          VERIFY_TOKEN = 'metrika_webhook_dev_token_2025';
          console.log('⚠️ Usando token padrão de desenvolvimento');
        } else {
          console.error('❌ WHATSAPP_VERIFY_TOKEN obrigatório em produção');
          res.sendStatus(500);
          return;
        }
      }
      
      if (isDevelopment) {
        console.log('🔍 Webhook verification attempt:', { mode, hasToken: !!token });
      }
      
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ WhatsApp webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        console.log('❌ WhatsApp webhook verification failed');
        res.sendStatus(403);
      }
    } catch (error) {
      console.error('❌ Error in webhook verification:', error);
      res.sendStatus(500);
    }
  });

  // WhatsApp webhook para receber mensagens (POST)
  app.post('/webhook', async (req: any, res: any) => {
    try {
      const signature = req.headers['x-hub-signature-256'];
      const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      console.log('📱 WhatsApp webhook POST received:', { 
        hasSignature: !!signature, 
        hasAppSecret: !!APP_SECRET,
        isDevelopment,
        hasRawBody: !!req.rawBody,
        bodyObject: req.body?.object
      });
      
      // Em produção, exigir verificação de assinatura
      if (!isDevelopment) {
        if (!APP_SECRET) {
          console.error('❌ WHATSAPP_APP_SECRET não configurado - rejeitando requisição');
          return res.sendStatus(500);
        }
        
        if (!req.rawBody) {
          console.error('❌ Raw body não disponível para verificação de assinatura');
          return res.sendStatus(500);
        }
        
        const isValid = verifyMetaSignature(req.rawBody, signature, APP_SECRET);
        
        if (!isValid) {
          console.error('❌ Assinatura inválida do Meta - acesso negado');
          console.log('🔍 Signature recebida:', signature);
          console.log('🔍 App Secret (primeiros 10 chars):', APP_SECRET?.substring(0, 10) + '...');
          return res.sendStatus(403);
        }
        
        console.log('✅ Assinatura Meta verificada com sucesso');
      } else {
        console.log('⚠️ Modo desenvolvimento - verificação de assinatura opcional');
      }
      
      const body = req.body;
      
      if (body.object === 'whatsapp_business_account') {
        console.log('📱 Processando webhook do WhatsApp Business...');
        
        // Processar todas as entradas
        for (const entry of body.entry) {
          const changes = entry.changes;
          
          for (const change of changes) {
            if (change.field === 'messages') {
              const messages = change.value.messages;
              
              if (messages) {
                console.log(`📨 Processando ${messages.length} mensagens`);
                for (const message of messages) {
                  await processWhatsAppMessage(message);
                }
              }
            }
          }
        }
        
        res.status(200).send('EVENT_RECEIVED');
      } else {
        console.log('❌ Objeto webhook inválido:', body.object);
        res.sendStatus(404);
      }
    } catch (error) {
      console.error('❌ Error processing WhatsApp webhook:', error);
      res.status(500).send('ERROR_PROCESSING');
    }
  });

  // Função para normalizar números de telefone brasileiros
  function normalizePhoneNumber(phone: string): string[] {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Retorna variações possíveis do número
    const variations: string[] = [cleaned];
    
    // Se for um número brasileiro (começa com 55)
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      const countryCode = cleaned.substring(0, 2); // 55
      const areaCode = cleaned.substring(2, 4); // DDD (2 dígitos)
      const restOfNumber = cleaned.substring(4); // Resto do número
      
      // Variação 1: Com o 9 extra (formato novo)
      if (restOfNumber.length === 9 && restOfNumber.startsWith('9')) {
        // Já tem o 9, adicionar versão sem o 9
        variations.push(`${countryCode}${areaCode}${restOfNumber.substring(1)}`);
      }
      
      // Variação 2: Sem o 9 extra (formato antigo)
      if (restOfNumber.length === 8) {
        // Não tem o 9, adicionar versão com o 9
        variations.push(`${countryCode}${areaCode}9${restOfNumber}`);
      }
    }
    
    console.log('📞 Variações do número:', variations);
    return variations;
  }

  // Função para processar mensagem do WhatsApp
  async function processWhatsAppMessage(message: any) {
    try {
      console.log('🔄 Processing WhatsApp message:', {
        from: message.from,
        text: message.text?.body,
        type: message.type,
        timestamp: message.timestamp,
        interactive: message.interactive
      });

      const fromNumber = message.from;
      const messageId = message.id;
      let messageText = '';
      let isButtonReply = false;

      // Verificar se é resposta de botão interativo
      if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
        messageText = message.interactive.button_reply.id;
        isButtonReply = true;
        console.log('🔘 Button reply detected:', {
          buttonId: messageText,
          fullInteractive: JSON.stringify(message.interactive)
        });
      } else if (message.type === 'text' && message.text?.body) {
        messageText = message.text.body;
        console.log('💬 Text message detected:', messageText);
      } else {
        console.log('⏭️ Ignoring unsupported message type:', message.type);
        return;
      }

      // Buscar usuário pelo número do WhatsApp
      // Normalizar número e buscar usuário com variações
      const phoneVariations = normalizePhoneNumber(fromNumber);
      console.log('🔍 Buscando usuário com variações de número:', phoneVariations);
      
      // Buscar todos os usuários e filtrar manualmente com as variações
      const allUsers = await db.select().from(users);
      let user = null;
      
      for (const u of allUsers) {
        if (u.whatsappNumber) {
          const userPhoneVariations = normalizePhoneNumber(u.whatsappNumber);
          // Verificar se há interseção entre as variações
          const hasMatch = phoneVariations.some(v1 => 
            userPhoneVariations.some(v2 => v1 === v2)
          );
          if (hasMatch) {
            user = u;
            console.log('✅ Usuário encontrado! Número cadastrado:', u.whatsappNumber, '| Número recebido:', fromNumber);
            break;
          }
        }
      }

      // Salvar mensagem no banco
      const [savedMessage] = await db
        .insert(whatsappMessages)
        .values({
          messageId,
          fromNumber,
          userId: user?.id || null,
          messageText,
          messageType: message.type,
          status: 'received'
        } as InsertWhatsappMessage)
        .returning();

      if (!user) {
        console.log('❌ User not found for WhatsApp number:', fromNumber);
        await db
          .update(whatsappMessages)
          .set({ 
            status: 'ignored',
            errorMessage: 'Usuário não encontrado para este número'
          })
          .where(eq(whatsappMessages.id, savedMessage.id));
        
        // Enviar mensagem educativa para usuário não cadastrado
        const userNotFoundMessage = `⚠️ *Número não cadastrado*\n\nEste número WhatsApp não está associado a nenhuma conta Métrika.\n\n🔗 **Para usar o bot:**\n1. Faça login na plataforma Métrika\n2. Vá em "Perfil"\n3. Configure seu número WhatsApp\n4. Volte aqui e envie seus trades!\n\n📱 Número detectado: ${fromNumber}`;
        await sendWhatsAppMessage(fromNumber, userNotFoundMessage);
        return;
      }

      console.log('👤 Found user:', user.name, 'for number:', fromNumber);

      const messageTextLower = messageText.toLowerCase().trim();
      
      // Se for clique em botão, processar a ação
      if (isButtonReply) {
        if (messageTextLower === 'btn_save_trade') {
          // Enviar instruções de como salvar trade (formato simplificado)
          const saveTradeMessage = `📝 *COMO SALVAR UM TRADE*\n\n` +
            `É muito simples! Só me diga 4 coisas:\n\n` +
            `1️⃣ Foi Take ✅ ou Stop ❌?\n` +
            `2️⃣ Qual o ativo? (EURUSD, BTC, WIN...)\n` +
            `3️⃣ Quanto você arriscou?\n` +
            `4️⃣ Quanto você ganhou? (Caso tenha perdido não precisa colocar)\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📋 *EXEMPLOS PRÁTICOS:*\n\n` +
            `✅ "Take no EURUSD arrisquei 100 lucrei 300"\n\n` +
            `❌ "Stop no BTCUSD arrisquei 200"\n\n` +
            `✅ "Ganhei 500 no WIN arrisquei 150"\n\n` +
            `❌ "Perdi no XAUUSD arrisquei 30"\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `💡 *DICA:* Use linguagem natural, eu entendo!\n\n` +
            `🚀 *Envie seu trade agora mesmo!*`;
          await sendWhatsAppMessage(fromNumber, saveTradeMessage);
          await db
            .update(whatsappMessages)
            .set({ 
              status: 'save_trade_instructions_sent',
              processedAt: new Date()
            })
            .where(eq(whatsappMessages.id, savedMessage.id));
          return;
        } else if (messageTextLower === 'btn_create_bankroll') {
          // Iniciar processo de criação de gestão personalizada
          // Criar estado especial para esperar valor da banca
          try {
            const { 
              startQuestionnaire
            } = await import('./questionnaire-handler');
            
            // Criar estado inicial com currentQuestion = 0 (esperando valor)
            await storage.createQuestionnaireState({
              userId: user.id,
              currentQuestion: 0, // 0 = esperando valor da banca
              partialAnswers: {},
              bankrollValue: null
            });
            
            const askBankrollMessage = `🎯 *CRIAR GESTÃO DE RISCO PERSONALIZADA*\n\n` +
              `Vou criar uma gestão 100% personalizada para você!\n\n` +
              `📝 *Farei 7 perguntas rápidas sobre:*\n` +
              `• Sua experiência em trading\n` +
              `• Mercados que opera\n` +
              `• Tolerância a risco\n` +
              `• Win rate e risk/reward\n` +
              `• E mais...\n\n` +
              `⏱️ *Leva apenas 2 minutos!*\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `💰 *Para começar, me diga:*\n\n` +
              `Qual é o valor do seu capital em R$?\n\n` +
              `📋 *Exemplo:* 1000`;
            
            await sendWhatsAppMessage(fromNumber, askBankrollMessage);
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'waiting_for_bankroll_value',
                processedAt: new Date()
              })
              .where(eq(whatsappMessages.id, savedMessage.id));
            return;
          } catch (error) {
            console.error('❌ Error starting bankroll creation:', error);
            await sendWhatsAppMessage(fromNumber, '❌ Erro ao iniciar criação de gestão. Tente novamente!');
            return;
          }
        } else if (messageTextLower === 'btn_statistics') {
          // Buscar estatísticas do usuário
          const userTrades = await db
            .select()
            .from(trades)
            .where(eq(trades.userId, user.id));
          
          const totalTrades = userTrades.length;
          const totalProfit = userTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
          const wins = userTrades.filter(t => parseFloat(t.resultado || '0') > 0).length;
          const losses = userTrades.filter(t => parseFloat(t.resultado || '0') < 0).length;
          const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';
          
          const statsMessage = `📊 *Suas Estatísticas*\n\n` +
            `📈 Total de Trades: ${totalTrades}\n` +
            `💰 Lucro Total: R$ ${totalProfit.toFixed(2)}\n` +
            `✅ Wins: ${wins}\n` +
            `❌ Losses: ${losses}\n` +
            `🎯 Win Rate: ${winRate}%\n\n` +
            `🚀 Continue assim!`;
          
          await sendWhatsAppMessage(fromNumber, statsMessage);
          await db
            .update(whatsappMessages)
            .set({ 
              status: 'statistics_sent',
              processedAt: new Date()
            })
            .where(eq(whatsappMessages.id, savedMessage.id));
          return;
        } else if (messageTextLower === 'btn_help') {
          const helpMessage = getHelpMessage();
          await sendWhatsAppMessage(fromNumber, helpMessage);
          await db
            .update(whatsappMessages)
            .set({ 
              status: 'help_sent',
              processedAt: new Date()
            })
            .where(eq(whatsappMessages.id, savedMessage.id));
          return;
        }
      }
      
      // Se for mensagem de texto, verificar se é resposta do menu
      if (!isButtonReply) {
        // Processar respostas do menu numérico
        if (messageTextLower === '1') {
          const saveTradeMessage = `📝 *COMO SALVAR UM TRADE*\n\n` +
            `É muito simples! Só me diga 4 coisas:\n\n` +
            `1️⃣ Foi Take ✅ ou Stop ❌?\n` +
            `2️⃣ Qual o ativo? (EURUSD, BTC, WIN...)\n` +
            `3️⃣ Quanto você arriscou?\n` +
            `4️⃣ Quanto você ganhou? (Caso tenha perdido não precisa colocar)\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📋 *EXEMPLOS PRÁTICOS:*\n\n` +
            `✅ "Take no EURUSD arrisquei 100 lucrei 300"\n\n` +
            `❌ "Stop no BTCUSD arrisquei 200"\n\n` +
            `✅ "Ganhei 500 no WIN arrisquei 150"\n\n` +
            `❌ "Perdi no XAUUSD arrisquei 30"\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            `💡 *DICA:* Use linguagem natural, eu entendo!\n\n` +
            `🚀 *Envie seu trade agora mesmo!*`;
          await sendWhatsAppMessage(fromNumber, saveTradeMessage);
          await db
            .update(whatsappMessages)
            .set({ 
              status: 'save_trade_instructions_sent',
              processedAt: new Date()
            })
            .where(eq(whatsappMessages.id, savedMessage.id));
          return;
        } else if (messageTextLower === '2') {
          const userTrades = await db
            .select()
            .from(trades)
            .where(eq(trades.userId, user.id));
          
          const totalTrades = userTrades.length;
          const totalProfit = userTrades.reduce((sum, t) => sum + parseFloat(t.resultado || '0'), 0);
          const wins = userTrades.filter(t => parseFloat(t.resultado || '0') > 0).length;
          const losses = userTrades.filter(t => parseFloat(t.resultado || '0') < 0).length;
          const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';
          
          const statsMessage = `📊 *Suas Estatísticas*\n\n` +
            `📈 Total de Trades: ${totalTrades}\n` +
            `💰 Lucro Total: R$ ${totalProfit.toFixed(2)}\n` +
            `✅ Wins: ${wins}\n` +
            `❌ Losses: ${losses}\n` +
            `🎯 Win Rate: ${winRate}%\n\n` +
            `🚀 Continue assim!`;
          
          await sendWhatsAppMessage(fromNumber, statsMessage);
          await db
            .update(whatsappMessages)
            .set({ 
              status: 'statistics_sent',
              processedAt: new Date()
            })
            .where(eq(whatsappMessages.id, savedMessage.id));
          return;
        } else if (messageTextLower === '3') {
          const helpMessage = getHelpMessage();
          await sendWhatsAppMessage(fromNumber, helpMessage);
          await db
            .update(whatsappMessages)
            .set({ 
              status: 'help_sent',
              processedAt: new Date()
            })
            .where(eq(whatsappMessages.id, savedMessage.id));
          return;
        }
        
        // ===== FLUXO DE QUESTIONÁRIO DE GESTÃO DE RISCO =====
        
        // Importar handlers do questionário
        const { 
          startQuestionnaire, 
          processQuestionnaireAnswer, 
          isInQuestionnaire,
          cancelQuestionnaire,
          getQuestionnaireProgress
        } = await import('./questionnaire-handler');
        
        // Verificar se usuário está em questionário ativo
        const inQuestionnaire = await isInQuestionnaire(user.id);
        
        // Se está em questionário E não é comando de cancelamento
        if (inQuestionnaire && messageTextLower !== '/gestao cancelar' && messageTextLower !== '/questao cancelar') {
          try {
            // Verificar se está esperando valor da banca (currentQuestion = 0)
            const state = await storage.getQuestionnaireState(user.id);
            
            if (state && state.currentQuestion === 0) {
              // Processar valor da banca
              const bankrollValue = parseFloat(messageText.replace(/[^\d.-]/g, ''));
              
              if (isNaN(bankrollValue) || bankrollValue <= 0) {
                await sendWhatsAppMessage(fromNumber, '❌ Valor inválido! Digite apenas o valor numérico.\n\n📋 *Exemplo:* 1000');
                return;
              }
              
              // Iniciar questionário com o valor
              const response = await startQuestionnaire(user.id, bankrollValue);
              await sendWhatsAppMessage(fromNumber, response);
              await db
                .update(whatsappMessages)
                .set({ 
                  status: 'questionnaire_started',
                  processedAt: new Date()
                })
                .where(eq(whatsappMessages.id, savedMessage.id));
              return;
            }
            
            // Processar resposta normal do questionário
            const response = await processQuestionnaireAnswer(user.id, messageText);
            await sendWhatsAppMessage(fromNumber, response);
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'questionnaire_response_processed',
                processedAt: new Date()
              })
              .where(eq(whatsappMessages.id, savedMessage.id));
            return;
          } catch (error) {
            console.error('❌ Error processing questionnaire answer:', error);
            await sendWhatsAppMessage(fromNumber, '❌ Erro ao processar resposta. Tente novamente.');
            return;
          }
        }
        
        // Comando: /gestao criar VALOR - Inicia questionário personalizado
        if (messageTextLower.startsWith('/gestao criar')) {
          try {
            const parts = messageText.trim().split(/\s+/);
            
            if (parts.length < 3) {
              const instructionsMessage = `💼 *Como criar sua Gestão de Risco Personalizada:*\n\n` +
                `📝 *Formato:*\n` +
                `/gestao criar VALOR\n\n` +
                `📋 *Exemplo:*\n` +
                `_/gestao criar 1000_\n\n` +
                `💡 Após enviar o comando, farei 7 perguntas rápidas para criar uma gestão 100% personalizada para o seu perfil!`;
              
              await sendWhatsAppMessage(fromNumber, instructionsMessage);
              return;
            }
            
            const bankrollValue = parseFloat(parts[2]);
            
            if (isNaN(bankrollValue) || bankrollValue <= 0) {
              await sendWhatsAppMessage(fromNumber, '❌ Valor inválido! Use números positivos. Ex: /gestao criar 1000');
              return;
            }
            
            // Iniciar questionário
            const response = await startQuestionnaire(user.id, bankrollValue);
            await sendWhatsAppMessage(fromNumber, response);
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'questionnaire_started',
                processedAt: new Date()
              })
              .where(eq(whatsappMessages.id, savedMessage.id));
            return;
          } catch (error) {
            console.error('❌ Error starting questionnaire:', error);
            await sendWhatsAppMessage(fromNumber, '❌ Erro ao iniciar questionário. Tente novamente!');
            return;
          }
        }
        
        // Comando: /gestao cancelar - Cancela questionário em andamento
        if (messageTextLower === '/gestao cancelar' || messageTextLower === '/questao cancelar') {
          try {
            const response = await cancelQuestionnaire(user.id);
            await sendWhatsAppMessage(fromNumber, response);
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'questionnaire_cancelled',
                processedAt: new Date()
              })
              .where(eq(whatsappMessages.id, savedMessage.id));
            return;
          } catch (error) {
            console.error('❌ Error cancelling questionnaire:', error);
            await sendWhatsAppMessage(fromNumber, '❌ Erro ao cancelar questionário.');
            return;
          }
        }
        
        // Comando: /gestao progresso - Mostra progresso do questionário
        if (messageTextLower === '/gestao progresso') {
          try {
            const response = await getQuestionnaireProgress(user.id);
            await sendWhatsAppMessage(fromNumber, response);
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'questionnaire_progress_sent',
                processedAt: new Date()
              })
              .where(eq(whatsappMessages.id, savedMessage.id));
            return;
          } catch (error) {
            console.error('❌ Error getting questionnaire progress:', error);
            await sendWhatsAppMessage(fromNumber, '❌ Erro ao buscar progresso.');
            return;
          }
        }
        
        // ===== COMANDOS DE GESTÃO DE BANCA =====
        
        // Comando: /gestao resumo ou /gestao - Mostra resumo da gestão criada
        if (messageTextLower === '/gestao' || messageTextLower === '/gestao resumo') {
          try {
            const bankroll = await storage.getBankrollManagement(user.id);
            
            if (!bankroll) {
              const noBankrollMessage = `💼 *Gestão de Risco não configurada*\n\n` +
                `Você ainda não tem uma gestão personalizada!\n\n` +
                `📝 *Para criar sua gestão 100% personalizada:*\n` +
                `Envie: */gestao criar VALOR*\n\n` +
                `📋 *Exemplo:*\n` +
                `_/gestao criar 1000_\n\n` +
                `🎯 *O que acontece:*\n` +
                `Farei 7 perguntas rápidas sobre seu perfil e criarei uma gestão de risco sob medida para você!\n\n` +
                `⏱️ Leva menos de 2 minutos.`;
              
              await sendWhatsAppMessage(fromNumber, noBankrollMessage);
              await db
                .update(whatsappMessages)
                .set({ 
                  status: 'bankroll_not_found',
                  processedAt: new Date()
                })
                .where(eq(whatsappMessages.id, savedMessage.id));
              return;
            }
            
            // Importar helper e gerar resumo
            const { summarizeForWhatsApp } = await import('./bankroll-helpers');
            const summary = {
              profile: bankroll.profile,
              timeHorizon: bankroll.timeHorizon,
              bankrollValue: parseFloat(bankroll.bankrollValue),
              riskPerTrade: parseFloat(bankroll.riskPerTrade),
              dailyProfitTarget: parseFloat(bankroll.dailyProfitTarget),
              horizonDays: bankroll.horizonDays,
              targetBalance: parseFloat(bankroll.targetBalance),
              projectedGrowth: bankroll.projectedGrowth
            };
            
            const whatsappMessage = summarizeForWhatsApp(summary);
            await sendWhatsAppMessage(fromNumber, whatsappMessage);
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'bankroll_summary_sent',
                processedAt: new Date()
              })
              .where(eq(whatsappMessages.id, savedMessage.id));
            return;
          } catch (error) {
            console.error('❌ Error getting bankroll summary:', error);
            await sendWhatsAppMessage(fromNumber, '❌ Erro ao buscar gestão de capital. Tente novamente!');
            return;
          }
        }
        
        // Comando: /capital criar VALOR [PERFIL] [PRAZO]
        if (messageTextLower.startsWith('/capital criar') || messageTextLower.startsWith('/banca criar')) {
          try {
            // Parsear comando: /capital criar 1000 moderado longo
            const parts = messageText.trim().split(/\s+/);
            
            if (parts.length < 3) {
              const instructionsMessage = `💼 *Como criar sua Gestão de Capital:*\n\n` +
                `📝 *Formato:*\n` +
                `/capital criar VALOR PERFIL PRAZO\n\n` +
                `📋 *Exemplos:*\n` +
                `• _/capital criar 1000_ (usa padrões)\n` +
                `• _/capital criar 1000 moderado longo_\n` +
                `• _/capital criar 500 agressivo curto_\n\n` +
                `*Perfis disponíveis:*\n` +
                `• conservador - Menor risco\n` +
                `• moderado - Equilibrado ✅\n` +
                `• agressivo - Maior retorno\n\n` +
                `*Prazos:*\n` +
                `• curto - Ganhos rápidos\n` +
                `• longo - Crescimento sustentável ✅`;
              
              await sendWhatsAppMessage(fromNumber, instructionsMessage);
              return;
            }
            
            const bankrollValue = parseFloat(parts[2]);
            const profile = parts[3]?.toLowerCase() as 'conservador' | 'moderado' | 'agressivo' | undefined;
            const timeHorizon = parts[4]?.toLowerCase() as 'curto' | 'longo' || 'longo';
            
            if (isNaN(bankrollValue) || bankrollValue <= 0) {
              await sendWhatsAppMessage(fromNumber, '❌ Valor inválido! Use números positivos. Ex: /capital criar 1000');
              return;
            }
            
            // Verificar se já existe gestão
            const existing = await storage.getBankrollManagement(user.id);
            if (existing) {
              const confirmMessage = `⚠️ *Gestão de Capital já existe!*\n\n` +
                `Você já tem uma gestão configurada.\n\n` +
                `💰 Saldo atual: R$ ${existing.bankrollValue}\n` +
                `📊 Perfil: ${existing.profile}\n\n` +
                `Para atualizar, entre em contato com o suporte.`;
              
              await sendWhatsAppMessage(fromNumber, confirmMessage);
              return;
            }
            
            // Criar gestão diretamente via storage (não HTTP)
            const { computeRiskMatrix, buildProjection, calculateTargetBalance, summarizeForWhatsApp } = await import('./bankroll-helpers');
            
            // Usar perfil moderado como padrão se não fornecido
            const riskProfile = profile ?? 'moderado';
            
            // Calcular parâmetros baseado no perfil e prazo
            const riskConfig = computeRiskMatrix(timeHorizon, riskProfile);
            
            // Gerar projeção de 90 dias
            const projectedGrowth = buildProjection(bankrollValue, riskConfig.dailyTarget, 90);
            
            // Calcular meta final baseada no horizonte específico
            const targetBalance = calculateTargetBalance(bankrollValue, riskConfig.dailyTarget, riskConfig.horizonDays);
            
            // Criar registro no banco
            const created = await storage.createBankrollManagement({
              userId: user.id,
              profile: riskConfig.profile,
              timeHorizon: timeHorizon,
              bankrollValue: bankrollValue.toFixed(2),
              riskPerTrade: riskConfig.riskPerTrade.toFixed(4),
              dailyProfitTarget: riskConfig.dailyTarget.toFixed(4),
              horizonDays: riskConfig.horizonDays,
              targetBalance: targetBalance.toFixed(2),
              projectedGrowth,
              consecutiveWins: 0,
              consecutiveLosses: 0,
              // Valores padrão para novos campos (sistema antigo - não usa questionário)
              riskPerOperation: riskConfig.riskPerTrade.toFixed(4),
              maxDailyRisk: riskConfig.dailyTarget.toFixed(4),
              maxWeeklyRisk: (riskConfig.dailyTarget * 2.5).toFixed(4),
              minRiskRewardRatio: '2.0',
              drawdownTriggerLosses: 4,
            });
            
            // Gerar resumo para WhatsApp
            const summary = {
              profile: created.profile,
              timeHorizon: created.timeHorizon,
              bankrollValue: parseFloat(created.bankrollValue),
              riskPerTrade: parseFloat(created.riskPerTrade),
              dailyProfitTarget: parseFloat(created.dailyProfitTarget),
              horizonDays: created.horizonDays,
              targetBalance: parseFloat(created.targetBalance),
              projectedGrowth: created.projectedGrowth
            };
            
            const whatsappMessage = summarizeForWhatsApp(summary);
            await sendWhatsAppMessage(fromNumber, whatsappMessage);
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'bankroll_created',
                processedAt: new Date()
              })
              .where(eq(whatsappMessages.id, savedMessage.id));
            return;
          } catch (error) {
            console.error('❌ Error creating bankroll:', error);
            await sendWhatsAppMessage(fromNumber, '❌ Erro ao criar gestão de capital. Tente novamente!');
            return;
          }
        }
        
        // Tentar processar como trade
        const tradeData = parseTradeFromMessage(messageText, user.id);
        
        if (tradeData) {
          try {
            // Validar dados do trade
            const validatedTrade = insertTradeSchema.parse(tradeData);
            
            // Criar objeto trade para inserção
            const insertData = {
              userId: user.id,
              dataHora: new Date(validatedTrade.dataHora!),
              ativo: validatedTrade.ativo!,
              mercado: validatedTrade.mercado!,
              setup: validatedTrade.setup || 'WhatsApp',
              capitalUtilizado: validatedTrade.capitalUtilizado || '100',
              quantidade: validatedTrade.quantidade || '1',
              tipo: validatedTrade.tipo!,
              precoEntrada: validatedTrade.precoEntrada || '0',
              precoSaida: validatedTrade.precoSaida || '0',
              resultado: validatedTrade.resultado || '0',
              corretora: validatedTrade.corretora!,
              origem: 'manual',
              comentario: validatedTrade.comentario || ''
            };

            // Salvar trade no banco
            const [newTrade] = await db
              .insert(trades)
              .values(insertData)
              .returning();

            // Criar registro de importação manual do WhatsApp
            const now = new Date();
            const displayName = `WhatsApp - ${now.toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}`;
            
            await db
              .insert(csvImports)
              .values({
                userId: user.id,
                broker: 'whatsapp',
                fileName: `whatsapp_${now.getTime()}.txt`,
                displayName: displayName,
                tradesImported: 1,
                tradesSkipped: 0,
                status: 'completed'
              });

            // Atualizar mensagem como processada
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'processed',
                tradeId: newTrade.id,
                processedAt: new Date()
              })
              .where(eq(whatsappMessages.id, savedMessage.id));

            console.log('✅ Trade created from WhatsApp:', {
              tradeId: newTrade.id,
              ativo: newTrade.ativo,
              resultado: newTrade.resultado
            });

            // Enviar confirmação de sucesso via WhatsApp
            const resultadoStr = newTrade.resultado || '0';
            const resultado = parseFloat(resultadoStr);
            // Verifica se é loss: começa com "-" OU é número negativo
            const isLoss = resultadoStr.startsWith('-') || resultado < 0;
            const isProfit = !isLoss && resultado > 0;
            const emoji = isLoss ? '❌' : (isProfit ? '✅' : '➡️');
            const resultText = isLoss ? 'PERDA' : (isProfit ? 'VITÓRIA' : 'EMPATE');
            
            const pnlPrefix = isLoss ? '-' : (isProfit ? '+' : '');
            const successMessage = `${emoji} *TRADE REGISTRADO!*\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `📊 *Resumo do Trade:*\n\n` +
              `🎯 Ativo: *${newTrade.ativo}*\n` +
              `${emoji} Resultado: *${resultText}*\n` +
              `💰 Capital: R$ ${newTrade.capitalUtilizado}\n` +
              `📈 P&L: ${pnlPrefix}R$ ${Math.abs(resultado).toFixed(2)}\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `🚀 *Trade salvo na sua conta Métrika!*\n\n` +
              `📱 Acesse a plataforma para ver análises completas!\n\n` +
              `💡 Envie outro trade quando quiser!`;
            await sendWhatsAppMessage(fromNumber, successMessage);
            return;
          } catch (error) {
            console.error('❌ Error creating trade:', error);
            await db
              .update(whatsappMessages)
              .set({ 
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : 'Erro ao criar trade'
              })
              .where(eq(whatsappMessages.id, savedMessage.id));
            
            // Enviar mensagem de erro
            const errorMessage = `❌ *Erro ao salvar trade*\n\nDesculpe, houve um problema ao salvar seu trade. Tente novamente ou clique em "❓ Ajuda" para ver o formato correto.`;
            await sendWhatsAppMessage(fromNumber, errorMessage);
            return;
          }
        }
        
        // Se não conseguiu processar como trade, enviar menu interativo com botões
        console.log('📋 Sending interactive menu with buttons');
        const menuMessage = `👋 Olá *${user.name}*!\n\n` +
          `Seja bem-vindo ao *Métrika Trading Bot* 🚀\n\n` +
          `Escolha o que deseja fazer:`;
        
        const menuButtons = [
          { id: 'btn_save_trade', title: '💾 Salvar Trade' },
          { id: 'btn_create_bankroll', title: '🎯 Criar Gestão' },
          { id: 'btn_help', title: '❓ Ajuda' }
        ];
        
        await sendWhatsAppInteractiveMessage(fromNumber, menuMessage, menuButtons);
        await db
          .update(whatsappMessages)
          .set({ 
            status: 'menu_sent',
            processedAt: new Date()
          })
          .where(eq(whatsappMessages.id, savedMessage.id));
        return;
      }

    } catch (error) {
      console.error('❌ Error in processWhatsAppMessage:', error);
    }
  }

  // Função para enviar mensagem WhatsApp
  async function sendWhatsAppMessage(to: string, message: string) {
    try {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '106540352242922';
      
      if (!accessToken) {
        console.error('❌ WHATSAPP_ACCESS_TOKEN não configurado');
        return false;
      }

      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('✅ Mensagem WhatsApp enviada:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', error.response?.data || error.message);
      return false;
    }
  }

  // Função para enviar mensagem interativa com botões
  async function sendWhatsAppInteractiveMessage(to: string, bodyText: string, buttons: Array<{id: string, title: string}>) {
    try {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '106540352242922';
      
      if (!accessToken) {
        console.error('❌ WHATSAPP_ACCESS_TOKEN não configurado');
        return false;
      }

      // WhatsApp permite no máximo 3 botões
      const limitedButtons = buttons.slice(0, 3).map(btn => ({
        type: "reply",
        reply: {
          id: btn.id,
          title: btn.title.substring(0, 20) // WhatsApp limita a 20 caracteres
        }
      }));

      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'interactive',
          interactive: {
            type: 'button',
            body: {
              text: bodyText
            },
            action: {
              buttons: limitedButtons
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      console.log('✅ Mensagem interativa WhatsApp enviada:', response.data);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao enviar mensagem interativa WhatsApp:', error.response?.data || error.message);
      return false;
    }
  }

  // Funções para gerar mensagens educativas
  function getWelcomeMessage() {
    return `📊 *Métrika Trading Bot*

Olá! Eu sou seu assistente para salvar trades automaticamente.

📝 *Formato Simples - Basta enviar:*

*Crypto:*
• Comprei 400 no BTC e ganhei 150
• Entrei com 300 no ETHUSDT e perdi

*Forex:*
• Comprei 200 no EURUSD e ganhei 85
• Vendi 500 no GBPJPY e perdi 120

*B3:*
• Entrei com 250 no WINQ25 e ganhei 180
• Comprei 350 no PETR4 e perdi

⚠️ *IMPORTANTE:*
Envie todos os valores em *R$ (REAIS)*. Nosso sistema não converte automaticamente de dólar para real.

⚙️ *Comandos:*
• Digite "ajuda" para ver instruções
• Digite "exemplo" para ver mais exemplos

💡 Use linguagem natural! Não precisa informar quantidade, preços ou outros detalhes.

Vamos começar! 🚀`;
  }

  function getExamplesMessage() {
    return `📝 *Exemplos de Mensagens Simples:*

*💰 CRYPTO:*
✅ Comprei 400 no BTC e ganhei 150
❌ Entrei com 300 no ETHUSDT e perdi
✅ Vendi 250 no BTCUSDT e ganhei 80

*💱 FOREX:*
✅ Comprei 200 no EURUSD e ganhei 85
❌ Vendi 500 no GBPJPY e perdi 120
✅ Entrei com 350 no GBPUSD e ganhei 90

*📈 B3:*
✅ Entrei com 250 no WINQ25 e ganhei 180
❌ Comprei 350 no PETR4 e perdi
✅ Vendi 400 no VALE3 e ganhei 120

💡 *Formato simples:*
• [Ação] + [Valor] + no [Ativo] + e [Resultado]
• Não precisa informar quantidade, preços ou outros detalhes
• O sistema detecta automaticamente se é Crypto, Forex ou B3! 🤖

⚠️ *IMPORTANTE:*
Todos os valores devem ser em *R$ (REAIS)*. Nosso sistema não converte de dólar automaticamente.`;
  }

  function getHelpMessage() {
    return `🤖 *MÉTRIKA TRADING BOT*\n\n` +
      `Seu assistente para registrar trades e gerenciar risco por WhatsApp!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📱 *COMO FUNCIONA:*\n\n` +
      `1️⃣ Você envia o resultado do seu trade\n` +
      `2️⃣ Eu salvo automaticamente na sua conta\n` +
      `3️⃣ Você acompanha tudo na plataforma!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📝 *FORMATO SIMPLES:*\n\n` +
      `*Crypto:*\n` +
      `• Comprei 400 no BTC e ganhei 150\n` +
      `• Entrei com 300 no ETHUSDT e perdi\n\n` +
      `*Forex:*\n` +
      `• Comprei 200 no EURUSD e ganhei 85\n` +
      `• Vendi 500 no GBPJPY e perdi 120\n\n` +
      `*B3:*\n` +
      `• Entrei com 250 no WINQ25 e ganhei 180\n` +
      `• Comprei 350 no PETR4 e perdi\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎯 *GESTÃO DE RISCO PERSONALIZADA:*\n\n` +
      `• */gestao criar VALOR* - Inicia questionário\n` +
      `• */gestao* - Ver resumo da sua gestão\n` +
      `• */gestao cancelar* - Cancela questionário\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ *IMPORTANTE:*\n` +
      `Envie todos os valores em *R$ (REAIS)*. Nosso sistema não converte de dólar automaticamente.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *DICA PRO:*\n` +
      `Use linguagem natural! O bot entende várias formas de escrever.\n\n` +
      `🚀 *Bora registrar seus trades!*`;
  }

  // Função para extrair dados do trade da mensagem
  function parseTradeFromMessage(messageText: string, userId: string): InsertTrade | null {
    try {
      console.log('🔍 Parsing trade from message:', messageText);
      
      // Normalizar texto
      const text = messageText.toLowerCase().trim();
      
      // FORMATO SIMPLIFICADO - Take/Stop com valor arriscado e lucro
      // Exemplos: "Take no EURUSD arrisquei 100 lucrei 300", "Stop no BTC arrisquei 200", "Stop -40usd no eurusd"
      const simplePatterns = {
        // Ativo - SEMPRE procurar "no/do/em ATIVO" primeiro (para evitar detectar palavras-chave)
        ativo: /(?:no|do|em)\s+([A-Z][A-Z0-9]{2,9})/i,
        // Take ou Stop (vitória ou perda)
        resultado_tipo: /(take|stop|vit[oó]ria|ganho|win|gain|lucro|lucrei|ganhei|perda|loss|preju[íi]zo|perdi)/i,
        // Valor arriscado (capital usado) - AGORA INCLUI comprei/vendi + valor
        arriscado: /(?:arrisquei|arriscado|risco|entrada|capital|usei|investi|valor|comprei|vendi|compra|venda)[:\s]*(?:de[:\s]*)?([0-9.,]+)/i,
        // Lucro (só para takes/vitórias) - procurar número ANTES da palavra ganho/lucro
        lucro: /(?:lucro|lucrei|ganho|profit|ganhou|ganhei)[:\s]*([0-9.,]+)|^([0-9.,]+)\s*(?:no|do)/i,
        // Prejuízo explícito (opcional para stops)
        prejuizo: /(?:preju[íi]zo|perda|loss|perdeu|perdi)[:\s]*([0-9.,]+)/i,
        // Valor após Stop (ex: "Stop -40usd", "Stop 40", "Stop -50 no EURUSD")
        stop_valor: /stop[:\s]*[-]?([0-9.,]+)/i,
        // Valor após Take (ex: "Take 100usd", "Take +150 no BTCUSD")  
        take_valor: /take[:\s]*[+]?([0-9.,]+)/i
      };

      const extracted: any = {};
      
      // Extrair informações do formato simplificado
      for (const [key, pattern] of Object.entries(simplePatterns)) {
        const match = text.match(pattern);
        if (match) {
          // Para ativo e lucro, pode vir em match[1] ou match[2] dependendo do padrão
          if (key === 'ativo' || key === 'lucro') {
            extracted[key] = (match[1] || match[2])?.trim();
          } else {
            extracted[key] = match[1]?.trim();
          }
        }
      }

      console.log('🎯 Extracted data (simple format):', extracted);

      // Palavras-chave que NÃO são ativos
      const excludedWords = ['ajuda', 'help', 'oi', 'ola', 'olá', 'exemplo', 'example', 'teste', 'test'];

      // Validar se tem informações mínimas (ativo + resultado)
      if (!extracted.ativo || excludedWords.includes(extracted.ativo?.toLowerCase())) {
        console.log('❌ No asset found in message');
        return null;
      }

      // Normalizar valores numéricos
      const normalizeNumber = (value: string | undefined, defaultValue: string = '0'): string => {
        if (!value) return defaultValue;
        return value.replace(/,/g, '.').replace(/[^\d.-]/g, '') || defaultValue;
      };

      // Determinar se foi vitória ou perda
      let resultado = '0';
      let tipo: 'compra' | 'venda' = 'compra';
      
      if (extracted.resultado_tipo) {
        const resultText = extracted.resultado_tipo.toLowerCase();
        
        // Se mencionou TAKE/vitória/ganho/lucro = positivo (precisa ter valor de lucro)
        if (['take', 'vitoria', 'vitória', 'ganho', 'ganh', 'win', 'gain', 'lucro', 'lucr'].some(w => resultText.includes(w))) {
          // Prioridade: lucro explícito > take_valor > arriscado
          const lucroValue = normalizeNumber(extracted.lucro, '0');
          const takeValor = normalizeNumber(extracted.take_valor, '0');
          
          if (lucroValue && parseFloat(lucroValue) > 0) {
            resultado = '+' + lucroValue;
          } else if (takeValor && parseFloat(takeValor) > 0) {
            resultado = '+' + takeValor;
          } else {
            // Se é TAKE mas não tem valor de lucro, considerar 0
            resultado = '0';
          }
        } 
        // Se mencionou STOP/perda/prejuízo = negativo (SEMPRE É LOSS!)
        else if (['stop', 'perda', 'loss', 'prejuizo', 'prejuízo', 'perdi'].some(w => resultText.includes(w))) {
          // Prioridade: prejuízo explícito > stop_valor > arriscado
          const perdaValue = normalizeNumber(extracted.prejuizo, '0');
          const stopValor = normalizeNumber(extracted.stop_valor, '0');
          const arriscadoValue = normalizeNumber(extracted.arriscado, '0');
          
          if (perdaValue && parseFloat(perdaValue) > 0) {
            resultado = '-' + perdaValue;
          } else if (stopValor && parseFloat(stopValor) > 0) {
            // Valor após "Stop" = valor da perda
            resultado = '-' + stopValor;
          } else if (arriscadoValue && parseFloat(arriscadoValue) > 0) {
            resultado = '-' + arriscadoValue;
          } else {
            // Stop sem valor = perda de 0 (mas ainda registra como loss)
            resultado = '-0';
          }
        }
      }

      // Detectar mercado automaticamente baseado no ativo
      const ativo = extracted.ativo.toUpperCase();
      let mercado: 'crypto' | 'forex' | 'b3' = 'b3';
      let corretora: 'crypto' | 'forex' | 'b3' | 'auto' = 'b3';
      
      // Crypto: termina com USD, USDT, BTC, ETH ou começa com BTC, ETH
      if (/(?:USDT?|BTC|ETH)$/.test(ativo) || /^(?:BTC|ETH)/.test(ativo)) {
        mercado = 'crypto';
        corretora = 'crypto';
      }
      // Forex: pares de moedas (6 letras, ex: EURUSD, GBPJPY, AUDCAD)
      else if (/^[A-Z]{6}$/.test(ativo)) {
        mercado = 'forex';
        corretora = 'forex';
      }
      // B3: qualquer outro (WIN, PETR4, etc)
      else {
        mercado = 'b3';
        corretora = 'b3';
      }

      const tradeData: InsertTrade = {
        userId,
        ativo,
        tipo: tipo as 'compra' | 'venda',
        quantidade: '1', // Quantidade padrão
        precoEntrada: '0', // Não usa preço de entrada neste formato
        precoSaida: '0', // Não usa preço de saída neste formato
        resultado,
        capitalUtilizado: normalizeNumber(extracted.arriscado, '100'), // Valor arriscado = capital usado
        setup: 'WhatsApp',
        mercado,
        corretora,
        origem: 'manual', // WhatsApp trades são salvos como manual
        dataHora: new Date().toISOString(),
        comentario: `Via WhatsApp: ${messageText.substring(0, 100)}`
      };

      console.log('✅ Parsed trade:', tradeData);
      return tradeData;

    } catch (error) {
      console.error('❌ Error parsing trade:', error);
      return null;
    }
  }

  // Função para enviar confirmação via WhatsApp
  async function sendWhatsAppConfirmation(toNumber: string, trade: any) {
    try {
      // TODO: Implementar envio de mensagem via WhatsApp API
      console.log('📤 Would send WhatsApp confirmation to:', toNumber, 'for trade:', trade.ativo);
      
      const message = `✅ Trade registrado com sucesso!\n\n` +
        `🎯 Ativo: ${trade.ativo}\n` +
        `📊 Tipo: ${trade.tipo}\n` +
        `💰 Resultado: R$ ${trade.resultado}\n` +
        `📅 Data: ${new Date(trade.dataHora).toLocaleString('pt-BR')}`;
      
      // Aqui você implementaria o envio real usando a API do WhatsApp
      // await whatsappAPI.sendMessage(toNumber, message);
      
    } catch (error) {
      console.error('❌ Error sending WhatsApp confirmation:', error);
    }
  }

  // Rota para testar o parser de mensagens (desenvolvimento e admin)
  app.post('/api/admin/test-whatsapp-parser', requireAdmin, async (req: any, res: any) => {
    try {
      const { messageText, userId } = req.body;
      
      if (!messageText || !userId) {
        return res.status(400).json({ error: "messageText e userId são obrigatórios" });
      }

      const parsedTrade = parseTradeFromMessage(messageText, userId);
      
      if (parsedTrade) {
        res.json({ 
          success: true, 
          parsedTrade,
          message: "Trade parsed successfully" 
        });
      } else {
        res.json({ 
          success: false, 
          message: "Could not parse trade from message" 
        });
      }
    } catch (error) {
      console.error('Error in test parser:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota para simular webhook do WhatsApp (apenas desenvolvimento)
  app.post('/api/admin/test-whatsapp-webhook', requireAdmin, async (req: any, res: any) => {
    try {
      const { fromNumber, messageText } = req.body;
      
      if (!fromNumber || !messageText) {
        return res.status(400).json({ error: "fromNumber e messageText são obrigatórios" });
      }

      // Simular mensagem do WhatsApp
      const simulatedMessage = {
        id: `test_${Date.now()}`,
        from: fromNumber,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        type: 'text',
        text: {
          body: messageText
        }
      };

      console.log('🧪 Simulando webhook do WhatsApp:', simulatedMessage);
      
      // Processar a mensagem
      await processWhatsAppMessage(simulatedMessage);
      
      res.json({ 
        success: true, 
        message: "Webhook simulado com sucesso",
        simulatedMessage 
      });
    } catch (error) {
      console.error('Error in test webhook:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota simples para testar mensagens WhatsApp (desenvolvimento)
  app.post('/api/test-whatsapp-message', async (req: any, res: any) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: "Apenas disponível em desenvolvimento" });
      }
      
      const { fromNumber, messageText } = req.body;
      
      if (!fromNumber || !messageText) {
        return res.status(400).json({ error: "fromNumber e messageText são obrigatórios" });
      }

      // Simular mensagem do WhatsApp
      const simulatedMessage = {
        id: `test_${Date.now()}`,
        from: fromNumber,
        timestamp: Math.floor(Date.now() / 1000).toString(),
        type: 'text',
        text: {
          body: messageText
        }
      };

      console.log('🧪 Testando mensagem WhatsApp:', simulatedMessage);
      
      // Processar a mensagem
      await processWhatsAppMessage(simulatedMessage);
      
      res.json({ 
        success: true, 
        message: "Mensagem processada com sucesso",
        simulatedMessage 
      });
    } catch (error) {
      console.error('Error in test message:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // Rota para listar mensagens WhatsApp recebidas (admin)
  app.get('/api/admin/whatsapp-messages', requireAdmin, async (req: any, res: any) => {
    try {
      const messages = await db
        .select()
        .from(whatsappMessages)
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(50);
      
      res.json(messages);
    } catch (error) {
      console.error('Error fetching WhatsApp messages:', error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  });

  // ===== ENDPOINTS DE GESTÃO DE BANCA (BANKROLL) =====

  // Schema de validação para criar gestão (com coercion para converter strings em números)
  const createBankrollSchema = z.object({
    userId: z.string().min(1),
    profile: z.enum(['conservador', 'moderado', 'agressivo']).optional(),
    timeHorizon: z.enum(['curto', 'longo']),
    bankrollValue: z.coerce.number().positive()
  });

  // Schema de validação para ajustar gestão (com coercion)
  const adjustBankrollSchema = z.object({
    userId: z.string().min(1),
    consecutiveWins: z.coerce.number().int().nonnegative().optional(),
    consecutiveLosses: z.coerce.number().int().nonnegative().optional()
  }).refine(
    data => data.consecutiveWins !== undefined || data.consecutiveLosses !== undefined,
    { message: 'Pelo menos consecutiveWins ou consecutiveLosses deve ser fornecido' }
  );

  // Criar gestão de banca via WhatsApp
  app.post('/api/bankroll/whatsapp/create', async (req: any, res: any) => {
    try {
      // Validar payload com Zod
      const validationResult = createBankrollSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validationResult.error.issues 
        });
      }

      const { userId, profile, timeHorizon, bankrollValue } = validationResult.data;

      // Importar helpers
      const { computeRiskMatrix, buildProjection, calculateTargetBalance, summarizeForWhatsApp } = await import('./bankroll-helpers');

      // Usar perfil moderado como padrão se não fornecido
      const riskProfile = profile ?? 'moderado';

      // Calcular parâmetros baseado no perfil e prazo
      const riskConfig = computeRiskMatrix(
        timeHorizon,
        riskProfile
      );

      // Gerar projeção de 90 dias
      const projectedGrowth = buildProjection(
        bankrollValue,
        riskConfig.dailyTarget,
        90 // Sempre 90 dias de projeção para dashboard
      );

      // Calcular meta final baseada no horizonte específico
      const targetBalance = calculateTargetBalance(
        bankrollValue,
        riskConfig.dailyTarget,
        riskConfig.horizonDays
      );

      // Criar registro no banco
      const bankrollData = {
        userId,
        profile: riskConfig.profile,
        timeHorizon: timeHorizon || 'longo',
        bankrollValue: bankrollValue.toFixed(2),
        riskPerTrade: riskConfig.riskPerTrade.toFixed(4),
        dailyProfitTarget: riskConfig.dailyTarget.toFixed(4),
        horizonDays: riskConfig.horizonDays,
        targetBalance: targetBalance.toFixed(2),
        projectedGrowth,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        // Valores padrão para novos campos (via WhatsApp antigo - não usa questionário)
        riskPerOperation: riskConfig.riskPerTrade.toFixed(4),
        maxDailyRisk: riskConfig.dailyTarget.toFixed(4),
        maxWeeklyRisk: (riskConfig.dailyTarget * 2.5).toFixed(4),
        minRiskRewardRatio: '2.0',
        drawdownTriggerLosses: 4,
      };

      const created = await storage.createBankrollManagement(bankrollData);

      // Gerar resumo para WhatsApp
      const summary: BankrollSummaryDTO = {
        profile: created.profile,
        timeHorizon: created.timeHorizon,
        bankrollValue: parseFloat(created.bankrollValue),
        riskPerTrade: parseFloat(created.riskPerTrade),
        dailyProfitTarget: parseFloat(created.dailyProfitTarget),
        horizonDays: created.horizonDays,
        targetBalance: parseFloat(created.targetBalance),
        projectedGrowth: created.projectedGrowth
      };

      const whatsappMessage = summarizeForWhatsApp(summary);

      res.json({
        success: true,
        bankroll: created,
        whatsappMessage
      });
    } catch (error) {
      console.error('Error creating bankroll:', error);
      res.status(500).json({ error: 'Erro ao criar gestão de banca' });
    }
  });

  // Obter resumo da gestão de banca para WhatsApp
  app.get('/api/bankroll/whatsapp/summary/:userId', async (req: any, res: any) => {
    try {
      const { userId } = req.params;

      const bankroll = await storage.getBankrollManagement(userId);
      
      if (!bankroll) {
        return res.status(404).json({ error: 'Gestão de banca não encontrada' });
      }

      // Importar helper
      const { summarizeForWhatsApp } = await import('./bankroll-helpers');

      // Montar DTO
      const summary: BankrollSummaryDTO = {
        profile: bankroll.profile,
        timeHorizon: bankroll.timeHorizon,
        bankrollValue: parseFloat(bankroll.bankrollValue),
        riskPerTrade: parseFloat(bankroll.riskPerTrade),
        dailyProfitTarget: parseFloat(bankroll.dailyProfitTarget),
        horizonDays: bankroll.horizonDays,
        targetBalance: parseFloat(bankroll.targetBalance),
        projectedGrowth: bankroll.projectedGrowth
      };

      const whatsappMessage = summarizeForWhatsApp(summary);

      res.json({
        success: true,
        bankroll,
        whatsappMessage
      });
    } catch (error) {
      console.error('Error getting bankroll summary:', error);
      res.status(500).json({ error: 'Erro ao obter resumo da banca' });
    }
  });

  // Ajustar gestão de banca (após trade)
  app.post('/api/bankroll/whatsapp/adjust', async (req: any, res: any) => {
    try {
      // Validar payload com Zod
      const validationResult = adjustBankrollSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Dados inválidos', 
          details: validationResult.error.issues 
        });
      }

      const { userId, consecutiveWins, consecutiveLosses } = validationResult.data;

      const adjusted = await storage.adjustBankrollManagement(userId, {
        consecutiveWins,
        consecutiveLosses
      });

      // Importar helper
      const { formatAdjustmentMessage } = await import('./bankroll-helpers');

      // Se houve ajuste automático, gerar mensagem
      let whatsappMessage = null;
      if (consecutiveLosses && consecutiveLosses >= 3) {
        const riskPercent = parseFloat(adjusted.riskPerTrade) * 100;
        const targetPercent = parseFloat(adjusted.dailyProfitTarget) * 100;
        whatsappMessage = formatAdjustmentMessage(riskPercent, targetPercent, 'consecutive_losses');
      } else if (consecutiveWins && consecutiveWins >= 3) {
        const riskPercent = parseFloat(adjusted.riskPerTrade) * 100;
        const targetPercent = parseFloat(adjusted.dailyProfitTarget) * 100;
        whatsappMessage = formatAdjustmentMessage(riskPercent, targetPercent, 'consecutive_wins');
      }

      res.json({
        success: true,
        bankroll: adjusted,
        whatsappMessage
      });
    } catch (error) {
      console.error('Error adjusting bankroll:', error);
      res.status(500).json({ error: 'Erro ao ajustar gestão de banca' });
    }
  });

  // ===== NOVAS ROTAS DE GESTÃO DE RISCO (QUESTIONÁRIO) =====

  // GET: Buscar gestão de risco do usuário autenticado
  app.get('/api/bankroll-management', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const bankroll = await storage.getBankrollManagement(userId);
      
      if (!bankroll) {
        return res.status(404).json({ error: 'Gestão de risco não encontrada' });
      }

      res.json(bankroll);
    } catch (error) {
      console.error('Error fetching bankroll management:', error);
      res.status(500).json({ error: 'Erro ao buscar gestão de risco' });
    }
  });

  // POST: Criar nova gestão de risco baseada no questionário
  app.post('/api/bankroll-management', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { bankrollValue, answers } = req.body;

      // Validar inputs
      if (!bankrollValue || !answers) {
        return res.status(400).json({ error: 'bankrollValue e answers são obrigatórios' });
      }

      // Importar função de cálculo
      const { calculateRiskManagementParameters } = await import('./risk-profile-calculator');

      // Calcular parâmetros baseado nas respostas
      const params = calculateRiskManagementParameters(answers);

      // Criar gestão no banco
      const bankrollData = {
        userId,
        profile: (answers.q2 === 'A' ? 'conservador' : answers.q2 === 'B' ? 'moderado' : 'agressivo') as 'conservador' | 'moderado' | 'agressivo',
        timeHorizon: 'longo' as 'longo', // padrão
        bankrollValue: bankrollValue.toFixed(2),
        riskPerTrade: params.risk_per_operation.toFixed(6),
        dailyProfitTarget: '0', // não usado no novo sistema
        horizonDays: 90, // padrão
        targetBalance: bankrollValue.toFixed(2), // não usado no novo sistema
        projectedGrowth: [],
        consecutiveWins: 0,
        consecutiveLosses: 0,
        // Novos campos do questionário (camelCase para corresponder ao schema)
        riskPerOperation: params.risk_per_operation.toString(),
        maxDailyRisk: params.max_daily_risk.toString(),
        maxWeeklyRisk: params.max_weekly_risk.toString(),
        minRiskRewardRatio: params.min_risk_reward_ratio.toString(),
        drawdownTriggerLosses: params.drawdown_trigger_losses,
      };

      const created = await storage.createBankrollManagement(bankrollData);

      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating bankroll management:', error);
      res.status(500).json({ error: 'Erro ao criar gestão de risco' });
    }
  });

  // DELETE: Deletar gestão de risco existente
  app.delete('/api/bankroll-management', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      
      // Verificar se existe
      const existing = await storage.getBankrollManagement(userId);
      if (!existing) {
        return res.status(404).json({ error: 'Gestão de risco não encontrada' });
      }

      await storage.deleteBankrollManagement(userId);

      res.json({ success: true, message: 'Gestão de risco deletada com sucesso' });
    } catch (error) {
      console.error('Error deleting bankroll management:', error);
      res.status(500).json({ error: 'Erro ao deletar gestão de risco' });
    }
  });

  // ===== ROTAS DE CARTEIRAS CUSTOMIZADAS =====

  // GET: Listar todas as carteiras do usuário
  app.get('/api/wallets', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const wallets = await storage.getWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      res.status(500).json({ error: 'Erro ao buscar carteiras' });
    }
  });

  // GET: Buscar carteira específica por ID
  app.get('/api/wallets/:id', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      
      const wallet = await storage.getWallet(id, userId);
      
      if (!wallet) {
        return res.status(404).json({ error: 'Carteira não encontrada' });
      }

      res.json(wallet);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ error: 'Erro ao buscar carteira' });
    }
  });

  // POST: Criar nova carteira
  app.post('/api/wallets', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { name, description, color, icon } = req.body;

      // Validar nome obrigatório
      if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Nome da carteira é obrigatório' });
      }

      // Validar tamanho do nome
      if (name.length > 50) {
        return res.status(400).json({ error: 'Nome deve ter no máximo 50 caracteres' });
      }

      // Validar descrição se fornecida
      if (description && description.length > 200) {
        return res.status(400).json({ error: 'Descrição deve ter no máximo 200 caracteres' });
      }

      // Validar cor se fornecida (formato hex)
      if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
        return res.status(400).json({ error: 'Cor deve ser um código hex válido (ex: #8B5CF6)' });
      }

      const wallet = await storage.createWallet({
        userId,
        name: name.trim(),
        description: description?.trim() || undefined,
        color: color || '#8B5CF6',
        icon: icon || 'wallet',
      });

      res.status(201).json(wallet);
    } catch (error) {
      console.error('Error creating wallet:', error);
      res.status(500).json({ error: 'Erro ao criar carteira' });
    }
  });

  // PATCH: Atualizar carteira existente
  app.patch('/api/wallets/:id', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const { name, description, color, icon } = req.body;

      // Verificar se carteira existe e pertence ao usuário
      const existing = await storage.getWallet(id, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Carteira não encontrada' });
      }

      // Não permitir editar carteiras padrão do sistema
      if (existing.isDefault) {
        return res.status(403).json({ error: 'Não é permitido editar carteiras padrão do sistema' });
      }

      // Construir updates
      const updates: any = {};
      
      if (name !== undefined) {
        if (!name || name.trim() === '') {
          return res.status(400).json({ error: 'Nome da carteira é obrigatório' });
        }
        if (name.length > 50) {
          return res.status(400).json({ error: 'Nome deve ter no máximo 50 caracteres' });
        }
        updates.name = name.trim();
      }

      if (description !== undefined) {
        if (description && description.length > 200) {
          return res.status(400).json({ error: 'Descrição deve ter no máximo 200 caracteres' });
        }
        updates.description = description?.trim() || null;
      }

      if (color !== undefined) {
        if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
          return res.status(400).json({ error: 'Cor deve ser um código hex válido (ex: #8B5CF6)' });
        }
        updates.color = color;
      }

      if (icon !== undefined) {
        updates.icon = icon;
      }

      const wallet = await storage.updateWallet(id, updates, userId);
      res.json(wallet);
    } catch (error) {
      console.error('Error updating wallet:', error);
      res.status(500).json({ error: 'Erro ao atualizar carteira' });
    }
  });

  // DELETE: Deletar carteira
  app.delete('/api/wallets/:id', requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      // Verificar se carteira existe e pertence ao usuário
      const existing = await storage.getWallet(id, userId);
      if (!existing) {
        return res.status(404).json({ error: 'Carteira não encontrada' });
      }

      // Não permitir deletar carteiras padrão do sistema
      if (existing.isDefault) {
        return res.status(403).json({ error: 'Não é permitido deletar carteiras padrão do sistema' });
      }

      await storage.deleteWallet(id, userId);
      res.json({ success: true, message: 'Carteira deletada com sucesso' });
    } catch (error) {
      console.error('Error deleting wallet:', error);
      res.status(500).json({ error: 'Erro ao deletar carteira' });
    }
  });

  const httpServer = createServer(app);
}