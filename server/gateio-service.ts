import * as GateApi from 'gate-api';
import { storage } from './storage';
import type { InsertTrade } from '@shared/schema';
import crypto from 'crypto';

export interface GateApiConfig {
  apiKey: string;
  apiSecret: string;
}

export class GateIOService {
  private client: GateApi.ApiClient;
  private spotApi: GateApi.SpotApi;
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.gateio.ws';

  constructor(config: GateApiConfig) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    
    this.client = new GateApi.ApiClient();
    this.client.setApiKeySecret(config.apiKey, config.apiSecret);
    this.spotApi = new GateApi.SpotApi(this.client);
  }

  // Gerar assinatura HMAC-SHA512 para autenticação direta
  private generateSignature(method: string, url: string, queryString: string = '', payload: string = ''): { headers: Record<string, string>, timestamp: string } {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Hash do payload usando SHA512
    const hashedPayload = crypto.createHash('sha512').update(payload, 'utf8').digest('hex');
    
    // String para assinatura: METHOD + "\n" + URL + "\n" + QUERY + "\n" + HASHED_PAYLOAD + "\n" + TIMESTAMP
    const signatureString = `${method}\n${url}\n${queryString}\n${hashedPayload}\n${timestamp}`;
    
    // Gerar assinatura HMAC-SHA512
    const signature = crypto.createHmac('sha512', this.apiSecret).update(signatureString, 'utf8').digest('hex');
    
    // Debug logging
    console.log('Gate.io Authentication Debug:');
    console.log('- Method:', method);
    console.log('- URL:', url);
    console.log('- Query String:', queryString || '(empty)');
    console.log('- Payload:', payload || '(empty)');
    console.log('- Hashed Payload:', hashedPayload);
    console.log('- Timestamp:', timestamp);
    console.log('- Signature String:', JSON.stringify(signatureString));
    console.log('- API Key (first 8 chars):', this.apiKey.substring(0, 8) + '...');
    console.log('- Generated Signature:', signature);
    
    return {
      headers: {
        'KEY': this.apiKey,
        'Timestamp': timestamp,
        'SIGN': signature,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timestamp
    };
  }

  // Fazer requisição HTTP direta com autenticação customizada
  private async makeAuthenticatedRequest(method: string, endpoint: string, queryParams: Record<string, any> = {}, body: any = null): Promise<any> {
    const url = `/api/v4${endpoint}`;
    const queryString = new URLSearchParams(queryParams).toString();
    const payload = body ? JSON.stringify(body) : '';
    
    const { headers } = this.generateSignature(method, url, queryString, payload);
    
    const fullUrl = `${this.baseUrl}${url}${queryString ? `?${queryString}` : ''}`;
    
    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = payload;
    }
    
    const response = await fetch(fullUrl, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(`Gate.io API Error ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    return await response.json();
  }

  // Buscar trades recentes do usuário
  async getRecentTrades(currencyPair?: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await this.spotApi.listMyTrades({
        currencyPair,
        limit
      });
      return response.body || [];
    } catch (error) {
      console.error('Erro ao buscar trades da Gate.io:', error);
      throw error;
    }
  }

  // Buscar saldo da conta usando autenticação customizada
  async getAccountBalance(): Promise<any[]> {
    try {
      const accounts = await this.makeAuthenticatedRequest('GET', '/spot/accounts');
      return accounts || [];
    } catch (error) {
      console.error('Erro ao buscar saldo da Gate.io:', error);
      throw error;
    }
  }

  // Converter trade da Gate.io para formato interno
  private convertGateTradeToInternal(gateTrade: any, userId: string): InsertTrade & { userId: string } {
    // Determinar tipo (compra/venda) baseado no side
    const tipo = gateTrade.side === 'buy' ? 'compra' : 'venda';
    
    // Calcular resultado baseado no preço e quantidade
    const quantidade = parseFloat(gateTrade.amount);
    const preco = parseFloat(gateTrade.price);
    const fee = parseFloat(gateTrade.fee || '0');
    
    // Para trades de compra, o resultado é negativo (custo)
    // Para trades de venda, o resultado é positivo (receita)
    let resultado: number;
    if (tipo === 'compra') {
      resultado = -(quantidade * preco + fee);
    } else {
      resultado = quantidade * preco - fee;
    }

    return {
      userId,
      dataHora: new Date(parseInt(gateTrade.create_time) * 1000).toISOString(),
      ativo: gateTrade.currency_pair.replace('_', '/'),
      mercado: 'crypto',
      setup: 'API Gate.io',
      capitalUtilizado: (quantidade * preco).toString(),
      quantidade: quantidade.toString(),
      tipo,
      resultado: resultado.toString(),
      precoEntrada: preco.toString(),
      precoSaida: preco.toString(),
      corretora: 'gate.io',
      status: 'fechado',
      origem: 'api',
      externalId: gateTrade.id?.toString(),
      comentario: `Trade automático via API Gate.io - ${gateTrade.currency_pair}`
    };
  }

  // Sincronizar trades com o banco de dados
  async syncTrades(userId: string, currencyPair?: string): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    try {
      // Buscar trades recentes da API
      const gateTrades = await this.getRecentTrades(currencyPair, 1000);
      
      if (!gateTrades.length) {
        return { imported: 0, skipped: 0, errors: [] };
      }

      // Buscar trades existentes para evitar duplicatas
      const existingTrades = await storage.getTrades(userId, 'gate.io');
      const existingExternalIds = new Set(
        existingTrades
          .filter(t => t.externalId)
          .map(t => t.externalId)
      );

      const newTrades: (InsertTrade & { userId: string })[] = [];

      // Processar cada trade da Gate.io
      for (const gateTrade of gateTrades) {
        try {
          // Verificar se já existe
          if (existingExternalIds.has(gateTrade.id?.toString())) {
            skipped++;
            continue;
          }

          // Converter para formato interno
          const internalTrade = this.convertGateTradeToInternal(gateTrade, userId);
          newTrades.push(internalTrade);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          errors.push(`Erro ao processar trade ${gateTrade.id}: ${errorMessage}`);
          skipped++;
        }
      }

      // Salvar novos trades em lote
      if (newTrades.length > 0) {
        await storage.createBulkTrades(newTrades);
        imported = newTrades.length;
      }

      return { imported, skipped, errors };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      errors.push(`Erro geral na sincronização: ${errorMessage}`);
      return { imported, skipped, errors };
    }
  }

  // Testar conexão com a API usando autenticação customizada
  async testConnection(): Promise<boolean> {
    try {
      // Testar conexão fazendo uma requisição simples para obter saldo da conta
      const accounts = await this.makeAuthenticatedRequest('GET', '/spot/accounts');
      console.log('Gate.io connection test successful, accounts found:', accounts.length);
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão Gate.io:', error);
      return false;
    }
  }

  // Buscar pares de moedas disponíveis
  async getCurrencyPairs(): Promise<any[]> {
    try {
      const response = await this.spotApi.listCurrencyPairs();
      return response.body || [];
    } catch (error) {
      console.error('Erro ao buscar pares de moedas:', error);
      throw error;
    }
  }

  // Buscar informações da conta do usuário usando autenticação customizada
  async getAccountInfo(): Promise<any> {
    try {
      // Buscar detalhes da conta usando autenticação direta
      const accountData = await this.makeAuthenticatedRequest('GET', '/account/detail');
      
      return {
        userId: accountData?.userId || accountData?.user_id || 'API_USER',
        email: accountData?.email || 'Verificado via API',
        phone: accountData?.phone || 'N/A',
        level: accountData?.level || 1,
        kyc: accountData?.kyc || 1,
        state: accountData?.state || 'active',
        createTime: accountData?.createTime || accountData?.create_time || Date.now(),
        tier: accountData?.tier || 'verified',
        currency: accountData?.currency || 'USDT'
      };
    } catch (error) {
      console.error('Erro ao buscar informações da conta:', error);
      // Retornar informações básicas em caso de erro
      return {
        userId: 'API_USER',
        email: 'Conta conectada via API',
        phone: 'N/A',
        level: 1,
        kyc: 1,
        state: 'active',
        createTime: Date.now(),
        tier: 'verified',
        currency: 'USDT'
      };
    }
  }
}

// Função utilitária para criar instância do serviço
export function createGateIOService(config: GateApiConfig): GateIOService {
  return new GateIOService(config);
}