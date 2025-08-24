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
 * Converte valor brasileiro ou decimal para número
 * Detecta automaticamente o formato (brasileiro vs decimal)
 */
function parseRealValue(value: string): number {
  if (!value) return 0;
  
  // Remover R$ e espaços primeiro
  let cleaned = value.trim()
    .replace(/R\$/g, '') // Remove símbolo de Real
    .replace(/\s+/g, '') // Remove espaços
    .trim();
  
  // Detectar formato:
  // Formato brasileiro: usa vírgula como decimal (1.234,56)
  // Formato decimal: usa ponto como decimal (1234.56)
  
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  
  if (hasComma && hasDot) {
    // Tem ambos: verificar qual é o separador decimal
    const lastCommaPos = cleaned.lastIndexOf(',');
    const lastDotPos = cleaned.lastIndexOf('.');
    
    if (lastCommaPos > lastDotPos) {
      // Vírgula vem depois do ponto: formato brasileiro (1.234,56)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Ponto vem depois da vírgula: formato americano (1,234.56)
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    // Só tem vírgula: assumir formato brasileiro
    cleaned = cleaned.replace(',', '.');
  }
  // Se só tem ponto ou nenhum, já está no formato correto
  
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
  const abertura = findField(row, ['abertura']); // Data+hora de abertura
  const fechamento = findField(row, ['fechamento']); // Data+hora de fechamento
  const lado = findField(row, ['lado']);
  const qtdCompra = findField(row, ['qtd compra', 'qtd_compra', 'qtdcompra']);
  const qtdVenda = findField(row, ['qtd venda', 'qtd_venda', 'qtdvenda']);
  const quantidade = findField(row, ['qnt.', 'qnt', 'quantidade']);
  const precoCompra = findField(row, ['preço compra', 'preco compra', 'preco_compra']);
  const precoVenda = findField(row, ['preço venda', 'preco venda', 'preco_venda']);
  
  // Buscar o campo Res. Operação com diferentes variações - PRIORIDADE TOTAL
  const resOperacao = findField(row, ['res. operação', 'res operação', 'res.operação', 'resoperação', 'res. operac']);
  const resultadoField = findField(row, ['resultado']); 
  const total = findField(row, ['total']); // Total acumulado - USAR APENAS COMO ÚLTIMA OPÇÃO
  
  // Usar abertura ou fechamento para data/hora
  const dataHoraStr = abertura || fechamento || '';
  
  console.log(`🏦 Clear campos: ativo="${ativo}", abertura="${abertura}", res.operação="${resOperacao}", resultado="${resultadoField}", total="${total}", lado="${lado}"`);
  
  // Validação rigorosa: deve ter ativo e pelo menos um campo de resultado válido
  if (!ativo || (!resOperacao && !resultadoField && !total)) {
    console.log('❌ Clear: campos obrigatórios ausentes (ativo, resultado)');
    return null;
  }
  
  // Usar a data e hora do campo abertura/fechamento
  let dataHora: Date;
  if (dataHoraStr && dataHoraStr.includes('/')) {
    dataHora = parseClearDate(dataHoraStr);
  } else {
    dataHora = new Date(); // Data atual se não conseguir parsear
  }
  
  // Quantidade (usar o campo Qnt. ou a maior entre compra e venda)
  const qtdCampo = parseFloat(quantidade || '0');
  const qtdCompraNum = parseFloat(qtdCompra || '0');
  const qtdVendaNum = parseFloat(qtdVenda || '0');
  const qtdFinal = qtdCampo || Math.max(qtdCompraNum, qtdVendaNum) || 1;
  
  // PRIORIDADE CORRETA: Res. Operação > Resultado > Total (apenas como última opção)
  let resultado: number;
  let fonteCampo: string;
  
  if (resOperacao) {
    resultado = parseRealValue(resOperacao);
    fonteCampo = "Res. Operação";
  } else if (resultadoField) {
    resultado = parseRealValue(resultadoField);
    fonteCampo = "Resultado";
  } else if (total) {
    resultado = parseRealValue(total);
    fonteCampo = "Total (acumulado)";
    console.log('⚠️ ATENÇÃO: Usando campo Total (pode ser valor acumulado)');
  } else {
    resultado = 0;
    fonteCampo = "valor padrão (0)";
  }
  
  console.log(`💰 Resultado extraído: R$ ${resultado.toFixed(2)} (fonte: ${fonteCampo})`);
  
  // Preços em pontos (precisamos converter para valor real se necessário)
  const precoEntrada = precoCompra ? parseRealValue(precoCompra) : 0;
  const precoSaida = precoVenda ? parseRealValue(precoVenda) : 0;
  
  // Tipo de operação  
  const tipo: 'compra' | 'venda' = lado?.toUpperCase() === 'C' ? 'compra' : 'venda';
  
  console.log(`✅ Clear: ${ativo} ${tipo} ${qtdFinal} contratos, resultado = R$ ${resultado.toFixed(2)} (${fonteCampo})`);
  
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
    comentario: `Clear: ${tipo} ${qtdFinal} contratos - ${dataHoraStr || 'sem data'}`
  };
}

/**
 * Busca campo por vários nomes possíveis
 */
function findField(row: Record<string, any>, fieldNames: string[]): string | null {
  // Debug: mostrar todas as chaves disponíveis no primeiro campo procurado
  if (fieldNames[0] === 'ativo') {
    console.log('🔍 Chaves disponíveis:', Object.keys(row));
  }
  
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Normalizar espaços múltiplos
    
    for (const fieldName of fieldNames) {
      const normalizedFieldName = fieldName.toLowerCase().trim();
      
      // Comparação exata ou parcial
      if (normalizedKey === normalizedFieldName || normalizedKey.includes(normalizedFieldName)) {
        return String(value || '').trim();
      }
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
  
  // Primeiro, processar todos os trades e coletar com valor acumulado
  const tradesComAcumulado: Array<{trade: InsertTrade, totalAcumulado: number}> = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Pular linhas vazias ou cabeçalhos
    if (!row || Object.values(row).every(v => !v)) continue;
    
    try {
      const trade = processClearTradeRow(row, userId);
      if (trade) {
        const totalAcumulado = parseFloat(trade.resultado || '0');
        tradesComAcumulado.push({ trade, totalAcumulado });
      }
    } catch (error) {
      console.log(`❌ Erro na linha ${i}:`, error);
    }
  }
  
  // Ordenar trades por data para garantir sequência correta
  tradesComAcumulado.sort((a, b) => {
    const dataA = new Date(a.trade.dataHora).getTime();
    const dataB = new Date(b.trade.dataHora).getTime();
    return dataA - dataB;
  });
  
  // Calcular resultados individuais
  const trades: InsertTrade[] = [];
  let previousTotal = 0;
  
  for (let i = 0; i < tradesComAcumulado.length; i++) {
    const { trade, totalAcumulado } = tradesComAcumulado[i];
    
    // Calcular resultado individual (diferença do acumulado)
    let resultadoIndividual: number;
    if (i === 0) {
      // Primeiro trade: usar o valor total como resultado individual
      resultadoIndividual = totalAcumulado;
    } else {
      // Trades subsequentes: calcular a diferença
      resultadoIndividual = totalAcumulado - previousTotal;
    }
    
    // Atualizar o trade com o resultado individual
    trade.resultado = resultadoIndividual.toString();
    
    console.log(`💰 Trade ${i + 1} (${trade.ativo}): Total acumulado = R$ ${totalAcumulado.toFixed(2)}, Resultado individual = R$ ${resultadoIndividual.toFixed(2)}`);
    
    // Salvar o total atual para o próximo cálculo
    previousTotal = totalAcumulado;
    
    trades.push(trade);
  }
  
  console.log(`✅ Clear: ${trades.length} trades processados com resultados individuais calculados`);
  console.log(`📊 Resultado total final: R$ ${previousTotal.toFixed(2)}`);
  
  return trades;
}