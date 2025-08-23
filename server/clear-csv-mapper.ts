/**
 * Mapeador específico para CSVs da Clear (corretora brasileira)
 * Lida corretamente com WIN/WDO e outros futuros em pontos
 */

import { InsertTrade } from '@shared/schema';

interface ClearTradeRow {
  ativo: string;
  abertura: string; // Data/hora
  fechamento: string; // Data/hora
  lado: 'C' | 'V'; // Compra ou Venda
  qtd_compra: string;
  qtd_venda: string;
  preco_compra: string; // Em pontos (não reais!)
  preco_venda: string; // Em pontos (não reais!)
  total: string; // Resultado em REAIS (já calculado)
}

/**
 * Converte valor brasileiro para número
 */
function parseRealValue(value: string): number {
  if (!value) return 0;
  
  // Clear usa formato brasileiro: 1.234,56 ou -350,00
  // Remover pontos de milhares e trocar vírgula por ponto decimal
  const cleaned = value.trim()
    .replace(/\./g, '')  // Remove pontos de milhares
    .replace(',', '.');  // Troca vírgula por ponto decimal
  
  return parseFloat(cleaned) || 0;
}

/**
 * Converte data da Clear (DD/MM/AAAA HH:MM:SS)
 */
function parseClearDate(dateStr: string): Date {
  // Formato: 03/06/2025 11:57:00
  const [date, time] = dateStr.split(' ');
  const [day, month, year] = date.split('/');
  const [hour, minute, second] = time?.split(':') || ['12', '00', '00'];
  
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

/**
 * Detecta se CSV é da Clear
 */
export function isClearCSV(header: string): boolean {
  const clearHeaders = [
    'ativo', 'abertura', 'fechamento', 'tempo operação', 'tempo operacao',
    'qtd compra', 'qtd venda', 'lado', 'preço compra', 'preco compra',
    'preço venda', 'preco venda', 'total', 'res. operação', 'res. operacao'
  ];
  
  const normalizedHeader = header.toLowerCase()
    .replace(/[áàâãäå]/g, 'a')
    .replace(/[éèêë]/g, 'e') 
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c');
  
  console.log(`🔍 Verificando Clear CSV - Header: "${normalizedHeader}"`);
  
  const matchCount = clearHeaders.filter(h => normalizedHeader.includes(h)).length;
  const isMatch = matchCount >= 3; // Precisa ter pelo menos 3 campos típicos da Clear
  
  console.log(`🏦 Clear headers encontrados: ${matchCount}/10 - É Clear? ${isMatch}`);
  
  return isMatch;
}

/**
 * Processa linha do CSV da Clear
 */
export function processClearTradeRow(
  row: Record<string, any>, 
  userId: string
): InsertTrade | null {
  
  console.log('🏦 Processando linha Clear:', Object.values(row).slice(0, 5));
  
  // Mapear campos (headers podem variar)
  const ativo = findField(row, ['ativo']);
  const abertura = findField(row, ['abertura']);
  const fechamento = findField(row, ['fechamento']);
  const lado = findField(row, ['lado']);
  const qtdCompra = findField(row, ['qtd_compra', 'qtd compra', 'qtdcompra']);
  const qtdVenda = findField(row, ['qtd_venda', 'qtd venda', 'qtdvenda']);
  const precoCompra = findField(row, ['preco_compra', 'preço compra', 'preco compra']);
  const precoVenda = findField(row, ['preco_venda', 'preço venda', 'preco venda']);
  const resOperacao = findField(row, ['res. operação', 'res. operacao', 'res operacao', 'resultado']);
  const total = findField(row, ['total']); // Total acumulado, não o resultado individual
  
  console.log(`🏦 Clear campos: ativo="${ativo}", abertura="${abertura}", res.operação="${resOperacao}", total="${total}", lado="${lado}"`);
  
  if (!ativo || !abertura || !resOperacao) {
    console.log('❌ Clear: campos obrigatórios ausentes (ativo, abertura, res.operação)');
    return null;
  }
  
  // Usar a data de abertura
  const dataHora = parseClearDate(abertura);
  
  // Quantidade (usar a maior entre compra e venda)
  const qtdCompraNum = parseFloat(qtdCompra || '0');
  const qtdVendaNum = parseFloat(qtdVenda || '0');
  const quantidade = Math.max(qtdCompraNum, qtdVendaNum) || 1;
  
  // Resultado da operação em REAIS (campo Res. Operação, não Total!)
  const resultado = parseRealValue(resOperacao);
  
  // Preços em pontos (precisamos converter para valor real se necessário)
  const precoEntrada = precoCompra ? parseRealValue(precoCompra) : 0;
  const precoSaida = precoVenda ? parseRealValue(precoVenda) : 0;
  
  // Tipo de operação  
  const tipo: 'compra' | 'venda' = lado?.toUpperCase() === 'C' ? 'compra' : 'venda';
  
  console.log(`✅ Clear: ${ativo} ${tipo} ${quantidade} contratos, resultado = R$ ${resultado}`);
  
  return {
    userId,
    corretora: 'b3',
    origem: 'csv',
    mercado: 'b3',
    setup: 'Clear CSV Import',
    dataHora: dataHora.toISOString(),
    ativo: ativo.toUpperCase(),
    tipo,
    quantidade: quantidade.toString(),
    precoEntrada: precoEntrada.toString(),
    precoSaida: precoSaida.toString(),
    capitalUtilizado: (quantidade * Math.max(precoEntrada, precoSaida)).toString(),
    resultado: resultado.toString(),
    emocao: 'neutro',
    comentario: `Clear: ${tipo} ${quantidade} contratos - ${abertura}`
  };
}

/**
 * Busca campo por vários nomes possíveis
 */
function findField(row: Record<string, any>, fieldNames: string[]): string | null {
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase().trim();
    
    if (fieldNames.some(name => normalizedKey.includes(name.toLowerCase()))) {
      return String(value || '').trim();
    }
  }
  return null;
}

/**
 * Processa CSV completo da Clear
 */
export function processClearCSV(
  rows: Record<string, any>[], 
  userId: string
): InsertTrade[] {
  console.log(`🏦 Processando CSV da Clear: ${rows.length} linhas`);
  
  const trades: InsertTrade[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Pular linhas vazias ou cabeçalhos
    if (!row || Object.values(row).every(v => !v)) continue;
    
    try {
      const trade = processClearTradeRow(row, userId);
      if (trade) {
        trades.push(trade);
      }
    } catch (error) {
      console.log(`❌ Erro na linha ${i}:`, error);
    }
  }
  
  console.log(`✅ Clear: ${trades.length} trades processados`);
  
  return trades;
}