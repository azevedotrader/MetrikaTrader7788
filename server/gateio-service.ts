import * as GateApi from 'gate-api';
import { storage } from './storage';
import type { InsertTrade } from '@shared/schema';

export interface GateApiConfig {
  apiKey: string;
  apiSecret: string;
}

export class GateIOService {
  private client: GateApi.ApiClient;
  private spotApi: GateApi.SpotApi;

  constructor(config: GateApiConfig) {
    this.client = new GateApi.ApiClient();
    this.client.setApiKeySecret(config.apiKey, config.apiSecret);
    this.spotApi = new GateApi.SpotApi(this.client);
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

  // Buscar saldo da conta
  async getAccountBalance(): Promise<any[]> {
    try {
      const response = await this.spotApi.listSpotAccounts({});
      return response.body || [];
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

  // Testar conexão com a API
  async testConnection(): Promise<boolean> {
    try {
      await this.spotApi.listSpotAccounts({});
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

  // Buscar informações da conta do usuário
  async getAccountInfo(): Promise<any> {
    try {
      // Criar instância da API de conta
      const accountApi = new GateApi.AccountApi(this.client);
      
      // Buscar detalhes da conta
      const accountResponse = await accountApi.getAccountDetail();
      const accountData = accountResponse.body as any;
      
      return {
        userId: accountData?.userId || accountData?.user_id || '',
        email: accountData?.email || 'N/A',
        phone: accountData?.phone || 'N/A',
        level: accountData?.level || 0,
        kyc: accountData?.kyc || 0,
        state: accountData?.state || 'active',
        createTime: accountData?.createTime || accountData?.create_time || 0,
        tier: accountData?.tier || 'normal',
        currency: accountData?.currency || 'USDT'
      };
    } catch (error) {
      console.error('Erro ao buscar informações da conta:', error);
      // Retornar informações básicas em caso de erro
      return {
        userId: 'N/A',
        email: 'Não disponível via API',
        phone: 'N/A',
        level: 0,
        kyc: 0,
        state: 'conectado',
        createTime: 0,
        tier: 'verificado',
        currency: 'USDT'
      };
    }
  }
}

// Função utilitária para criar instância do serviço
export function createGateIOService(config: GateApiConfig): GateIOService {
  return new GateIOService(config);
}