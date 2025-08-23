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
  
  // Clear usa formato brasileiro: R$ 1.234,56 ou -R$ 350,00
  // Remover R$, pontos de milhares e trocar vírgula por ponto decimal
  const cleaned = value.trim()
    .replace(/R\$/g, '') // Remove símbolo de Real (global)
    .replace(/\./g, '')  // Remove pontos de milhares
    .replace(',', '.')   // Troca vírgula por ponto decimal
    .replace(/\s+/g, '') // Remove todos os espaços
    .trim();             // Remove espaços extras
  
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
    'ativo', 'abertura', 'fechamento', 'tempo operac', // 'tempo operação' sem acentos
    'qtd compra', 'qtd venda', 'lado', 'preco compra', // 'preço' sem acentos  
    'preco venda', 'total', 'res. operac', 'res. intervalo', // 'operação' sem acentos
    'tet', 'medio' // Campos adicionais da Clear
  ];
  
  const normalizedHeader = header.toLowerCase()
    .replace(/[áàâãäå]/g, 'a')
    .replace(/[éèêë]/g, 'e') 
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/ã/g, 'a');
  
  console.log(`🔍 Verificando Clear CSV - Header normalizado: "${normalizedHeader.substring(0, 100)}..."`);
  
  const matchCount = clearHeaders.filter(h => normalizedHeader.includes(h)).length;
  const isMatch = matchCount >= 5; // Precisa ter pelo menos 5 campos típicos da Clear
  
  console.log(`🏦 Clear headers encontrados: ${matchCount}/${clearHeaders.length} - É Clear? ${isMatch}`);
  
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
  
  // Mapear campos (headers podem variar, incluindo acentos)
  const ativo = findField(row, ['ativo']);
  const abertura = findField(row, ['abertura']);
  const fechamento = findField(row, ['fechamento']);
  const data = findField(row, ['data']); // Campo de data
  const hora = findField(row, ['hora execução', 'hora execucao', 'hora']);
  const lado = findField(row, ['lado']);
  const qtdCompra = findField(row, ['qtd compra', 'qtd_compra', 'qtdcompra']);
  const qtdVenda = findField(row, ['qtd venda', 'qtd_venda', 'qtdvenda']);
  const quantidade = findField(row, ['qnt.', 'qnt', 'quantidade']);
  const precoCompra = findField(row, ['preço compra', 'preco compra', 'preco_compra']);
  const precoVenda = findField(row, ['preço venda', 'preco venda', 'preco_venda']);
  const resOperacao = findField(row, ['res. operação', 'res. operacao', 'res operacao', 'res operação', 'resultado']);
  const total = findField(row, ['total']); // Total acumulado, não o resultado individual
  
  console.log(`🏦 Clear campos: ativo="${ativo}", data="${data}", hora="${hora}", res.operação="${resOperacao}", total="${total}", lado="${lado}"`);
  
  if (!ativo || !resOperacao) {
    console.log('❌ Clear: campos obrigatórios ausentes (ativo, res.operação)');
    return null;
  }
  
  // Usar a data e hora dos campos corretos
  const dataStr = data || '01/01/2025'; // Data padrão se não tiver
  const horaStr = hora || '00:00:00'; // Hora padrão se não tiver
  const dataHora = parseClearDate(`${dataStr} ${horaStr}`);
  
  // Quantidade (usar o campo Qnt. ou a maior entre compra e venda)
  const qtdCampo = parseFloat(quantidade || '0');
  const qtdCompraNum = parseFloat(qtdCompra || '0');
  const qtdVendaNum = parseFloat(qtdVenda || '0');
  const qtdFinal = qtdCampo || Math.max(qtdCompraNum, qtdVendaNum) || 1;
  
  // Resultado da operação em REAIS (campo Res. Operação, não Total!)
  const resultado = parseRealValue(resOperacao);
  
  // Preços em pontos (precisamos converter para valor real se necessário)
  const precoEntrada = precoCompra ? parseRealValue(precoCompra) : 0;
  const precoSaida = precoVenda ? parseRealValue(precoVenda) : 0;
  
  // Tipo de operação  
  const tipo: 'compra' | 'venda' = lado?.toUpperCase() === 'C' ? 'compra' : 'venda';
  
  console.log(`✅ Clear: ${ativo} ${tipo} ${qtdFinal} contratos, resultado = R$ ${resultado}`);
  
  return {
    userId,
    corretora: 'b3',
    origem: 'csv',
    mercado: 'b3',
    setup: 'Clear CSV Import',
    dataHora: dataHora.toISOString(),
    ativo: ativo.toUpperCase(),
    tipo,
    quantidade: qtdFinal.toString(),
    precoEntrada: precoEntrada.toString(),
    precoSaida: precoSaida.toString(),
    capitalUtilizado: (qtdFinal * Math.max(precoEntrada, precoSaida)).toString(),
    resultado: resultado.toString(),
    emocao: 'neutro',
    comentario: `Clear: ${tipo} ${qtdFinal} contratos - ${data || 'sem data'}`
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