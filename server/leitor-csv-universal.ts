/**
 * Leitor Universal de CSV - Versão em Português
 * =============================================
 * 
 * Função para ler qualquer arquivo CSV, independentemente do:
 * - Delimitador (;, ,, |, \t, :, -, * e outros)
 * - Encoding (UTF-8, ISO-8859-1, Windows-1252, etc.)
 * - Aspas e caracteres de escape
 * - Quebras de linha dentro de células
 * 
 * Integrado ao sistema Métrika para análise de trading
 */

import * as fs from 'fs';
import * as path from 'path';
import * as chardet from 'chardet';
import * as iconv from 'iconv-lite';
import Papa from 'papaparse';

/**
 * Configurações para leitura universal de CSV
 */
export interface ConfiguracaoCSVUniversal {
  /** Forçar delimitador específico */
  delimitadorForcado?: string;
  /** Forçar encoding específico */
  encodingForcado?: string;
  /** Tamanho da amostra para detecção (bytes) */
  tamanhoAmostra?: number;
  /** Exibir logs detalhados */
  debug?: boolean;
  /** Detectar cabeçalho automaticamente */
  detectarCabecalho?: boolean;
}

/**
 * Resultado da leitura universal
 */
export interface ResultadoCSVUniversal {
  /** Dados processados como array de objetos */
  dados: any[];
  /** Informações sobre a detecção automática */
  metadados: {
    encoding: string;
    delimitador: string;
    temCabecalho: boolean;
    totalLinhas: number;
    totalColunas: number;
    tamanhoArquivo: number;
    erros: string[];
    avisos: string[];
    tempoProcessamento: number;
  };
}

/**
 * Análise de formato de CSV
 */
export interface AnaliseFormatoCSV {
  encoding: string;
  delimitador: string;
  temCabecalho: boolean;
  linhasEstimadas: number;
  colunas: string[];
  tamanhoArquivo: number;
  amostra: string;
  qualidadeDeteccao: number; // 0-100%
}

/**
 * FUNÇÃO PRINCIPAL - Lê qualquer arquivo CSV universalmente
 * 
 * @param caminhoArquivo - Caminho para o arquivo CSV
 * @param configuracao - Configurações opcionais
 * @returns Promise com dados e metadados do CSV
 */
export async function lerCSVUniversal(
  caminhoArquivo: string,
  configuracao: ConfiguracaoCSVUniversal = {}
): Promise<ResultadoCSVUniversal> {
  const inicioTempo = Date.now();
  
  const {
    delimitadorForcado,
    encodingForcado,
    tamanhoAmostra = 10240,
    debug = true,
    detectarCabecalho = true
  } = configuracao;

  if (debug) {
    console.log(`📂 Iniciando leitura universal: ${path.basename(caminhoArquivo)}`);
  }

  // 1. Validações iniciais
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
  }

  const estatisticasArquivo = fs.statSync(caminhoArquivo);
  const tamanhoArquivo = estatisticasArquivo.size;

  if (tamanhoArquivo === 0) {
    throw new Error('❌ Arquivo CSV está vazio');
  }

  if (debug) {
    console.log(`📏 Tamanho: ${formatarTamanho(tamanhoArquivo)}`);
  }

  try {
    // 2. Detectar encoding do arquivo
    const encoding = await detectarEncoding(caminhoArquivo, encodingForcado, tamanhoAmostra, debug);

    // 3. Ler amostra para análise de formato
    const conteudoAmostra = await lerAmostra(caminhoArquivo, encoding, tamanhoAmostra);

    // 4. Detectar delimitador automaticamente
    const delimitador = detectarDelimitador(conteudoAmostra, delimitadorForcado, debug);

    // 5. Detectar se possui cabeçalho
    const temCabecalho = detectarCabecalho ? 
      detectarPresencaCabecalho(conteudoAmostra, delimitador, debug) : false;

    // 6. Ler arquivo completo
    const conteudoCompleto = await lerArquivoCompleto(caminhoArquivo, encoding);

    // 7. Processar dados com PapaParse
    const resultadoProcessamento = await processarComPapaParse(
      conteudoCompleto,
      delimitador,
      temCabecalho,
      debug
    );

    // 8. Limpar e validar dados
    const dadosLimpos = limparDadosCSV(resultadoProcessamento.data, debug);

    // 9. Calcular estatísticas finais
    const totalLinhas = dadosLimpos.length;
    const totalColunas = totalLinhas > 0 ? Object.keys(dadosLimpos[0] || {}).length : 0;
    const tempoProcessamento = Date.now() - inicioTempo;

    const resultado: ResultadoCSVUniversal = {
      dados: dadosLimpos,
      metadados: {
        encoding,
        delimitador,
        temCabecalho,
        totalLinhas,
        totalColunas,
        tamanhoArquivo,
        erros: extrairErros(resultadoProcessamento.errors || []),
        avisos: [],
        tempoProcessamento
      }
    };

    if (debug) {
      console.log(`✅ Processamento concluído em ${tempoProcessamento}ms`);
      console.log(`📊 Resultado: ${totalLinhas.toLocaleString('pt-BR')} linhas × ${totalColunas} colunas`);
      console.log(`🔤 Encoding: ${encoding}`);
      console.log(`📋 Delimitador: '${delimitador === '\t' ? 'TAB' : delimitador}'`);
      console.log(`🏷️ Cabeçalho: ${temCabecalho ? 'Sim' : 'Não'}`);
      
      if (totalLinhas > 0) {
        const colunas = Object.keys(dadosLimpos[0]).slice(0, 5);
        console.log(`📝 Colunas: ${colunas.join(', ')}${totalColunas > 5 ? '...' : ''}`);
      }
    }

    return resultado;

  } catch (erro) {
    const mensagemErro = erro instanceof Error ? erro.message : 'Erro desconhecido';
    const sugestoes = gerarSugestoesErro(mensagemErro, caminhoArquivo);
    
    throw new Error(
      `Falha ao processar CSV: ${mensagemErro}${sugestoes.length > 0 ? 
        '\n\n💡 Sugestões para correção:\n' + sugestoes.map(s => `• ${s}`).join('\n') : ''
      }`
    );
  }
}

/**
 * Detecta encoding do arquivo automaticamente
 */
async function detectarEncoding(
  caminhoArquivo: string,
  encodingForcado?: string,
  tamanhoAmostra: number = 10240,
  debug: boolean = true
): Promise<string> {
  if (encodingForcado) {
    if (debug) {
      console.log(`🔤 Encoding forçado: ${encodingForcado}`);
    }
    return encodingForcado;
  }

  // Ler amostra binária
  const buffer = fs.readFileSync(caminhoArquivo);
  const amostra = buffer.slice(0, tamanhoAmostra);

  // Usar chardet para detecção automática
  const detectado = chardet.detect(amostra);
  let encoding = detectado || 'utf8';
  
  // Normalizar nomes de encoding para iconv-lite
  const mapeamentoEncoding: Record<string, string> = {
    'utf-8': 'utf8',
    'utf8': 'utf8',
    'iso-8859-1': 'iso88591',
    'iso88591': 'iso88591',
    'latin1': 'latin1',
    'windows-1252': 'windows1252',
    'cp1252': 'cp1252',
    'ascii': 'ascii'
  };

  const encodingNormalizado = mapeamentoEncoding[encoding.toLowerCase()] || 'utf8';

  // Testar se o encoding funciona
  try {
    iconv.decode(amostra, encodingNormalizado);
    
    if (debug) {
      console.log(`🔤 Encoding detectado: ${encodingNormalizado}`);
    }
    
    return encodingNormalizado;
  } catch (erro) {
    // Fallback para utf8
    if (debug) {
      console.log(`🔤 Fallback para UTF-8 (erro com ${encoding})`);
    }
    return 'utf8';
  }
}

/**
 * Lê amostra do arquivo para análise
 */
async function lerAmostra(
  caminhoArquivo: string,
  encoding: string,
  tamanhoAmostra: number
): Promise<string> {
  const buffer = fs.readFileSync(caminhoArquivo);
  const amostra = buffer.slice(0, tamanhoAmostra);
  
  try {
    return iconv.decode(amostra, encoding);
  } catch (erro) {
    // Fallback para UTF-8 com substituição de caracteres
    return iconv.decode(amostra, 'utf8');
  }
}

/**
 * Lê arquivo completo
 */
async function lerArquivoCompleto(caminhoArquivo: string, encoding: string): Promise<string> {
  const buffer = fs.readFileSync(caminhoArquivo);
  
  try {
    let conteudo = iconv.decode(buffer, encoding);
    
    // Remover BOM (Byte Order Mark) se presente
    if (conteudo.charCodeAt(0) === 0xFEFF) {
      conteudo = conteudo.slice(1);
    }
    
    // Normalizar quebras de linha
    conteudo = conteudo.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Remover caracteres de controle problemáticos
    conteudo = conteudo.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return conteudo;
  } catch (erro) {
    // Fallback final
    return buffer.toString('utf8');
  }
}

/**
 * Detecta delimitador mais provável
 */
function detectarDelimitador(
  conteudo: string,
  delimitadorForcado?: string,
  debug: boolean = true
): string {
  if (delimitadorForcado) {
    if (debug) {
      console.log(`📋 Delimitador forçado: '${delimitadorForcado}'`);
    }
    return delimitadorForcado;
  }

  // Lista abrangente de delimitadores possíveis
  const delimitadores = [';', ',', '\t', '|', ':', ' ', '-', '*', '~', '^', '#', '.'];
  
  const linhas = conteudo.split('\n').slice(0, 15).filter(linha => linha.trim());
  
  if (linhas.length === 0) {
    return ','; // Padrão
  }

  let melhorDelimitador = ',';
  let maiorPontuacao = 0;

  for (const delimitador of delimitadores) {
    let pontuacao = 0;
    const contagensColunas: number[] = [];

    for (const linha of linhas) {
      if (linha.includes(delimitador)) {
        const partes = linha.split(delimitador);
        const numeroColunas = partes.length;
        contagensColunas.push(numeroColunas);
        
        // Pontuar baseado no número de colunas
        if (numeroColunas > 1) {
          pontuacao += numeroColunas;
        }
      }
    }

    if (contagensColunas.length === 0) continue;

    // Calcular consistência entre linhas
    const mediaColunas = contagensColunas.reduce((a, b) => a + b, 0) / contagensColunas.length;
    const consistencia = contagensColunas.filter(count => 
      Math.abs(count - mediaColunas) <= 1
    ).length / contagensColunas.length;

    pontuacao *= consistencia;

    // Bonificar delimitadores mais comuns para dados brasileiros
    if (delimitador === ';') {
      pontuacao *= 1.8; // Muito comum no Brasil
    } else if (delimitador === ',') {
      pontuacao *= 1.5;
    } else if (delimitador === '\t') {
      pontuacao *= 1.3;
    } else if (delimitador === '|') {
      pontuacao *= 1.2;
    }

    // Penalizar espaços se houver muitas colunas
    if (delimitador === ' ' && mediaColunas > 8) {
      pontuacao *= 0.4;
    }

    // Penalizar delimitadores que aparecem dentro de possíveis valores
    if (delimitador === '.' && mediaColunas > 10) {
      pontuacao *= 0.3; // Provável que seja decimal
    }

    if (pontuacao > maiorPontuacao && mediaColunas > 1) {
      maiorPontuacao = pontuacao;
      melhorDelimitador = delimitador;
    }
  }

  if (debug) {
    const nomeDelimitador = melhorDelimitador === '\t' ? 'TAB' : melhorDelimitador;
    console.log(`📋 Delimitador detectado: '${nomeDelimitador}' (pontuação: ${maiorPontuacao.toFixed(1)})`);
  }

  return melhorDelimitador;
}

/**
 * Detecta presença de cabeçalho
 */
function detectarPresencaCabecalho(
  conteudo: string,
  delimitador: string,
  debug: boolean = true
): boolean {
  const linhas = conteudo.split('\n').filter(linha => linha.trim());
  
  if (linhas.length < 2) {
    return false;
  }

  const primeiraLinha = linhas[0].split(delimitador);
  const segundaLinha = linhas[1].split(delimitador);

  // Se número de colunas muito diferente, provavelmente não há cabeçalho
  if (Math.abs(primeiraLinha.length - segundaLinha.length) > 2) {
    return false;
  }

  let pontuacaoCabecalho = 0;
  let pontuacaoDados = 0;

  // Analisar primeira linha (potencial cabeçalho)
  primeiraLinha.forEach(celula => {
    const limpo = celula.trim().replace(/['"]/g, '');
    
    // Características típicas de cabeçalho
    if (/^[a-zA-ZÀ-ÿ_][a-zA-ZÀ-ÿ0-9_\s\-]*$/.test(limpo)) {
      pontuacaoCabecalho += 2;
    }
    
    if (!/^\d+([.,]\d+)*$/.test(limpo) && limpo.length > 0) {
      pontuacaoCabecalho += 1;
    }
    
    // Palavras comuns em cabeçalhos brasileiros
    const cabecalhosComuns = [
      'data', 'nome', 'valor', 'preco', 'preço', 'quantidade', 'total',
      'ativo', 'tipo', 'resultado', 'id', 'codigo', 'código', 'descricao', 'descrição',
      'simbolo', 'símbolo', 'operacao', 'operação', 'lucro', 'perda',
      'date', 'name', 'value', 'price', 'amount', 'symbol', 'trade'
    ];
    
    if (cabecalhosComuns.some(palavra => limpo.toLowerCase().includes(palavra))) {
      pontuacaoCabecalho += 4;
    }
    
    // Tamanho apropriado para cabeçalho
    if (limpo.length > 2 && limpo.length < 50) {
      pontuacaoCabecalho += 1;
    }
  });

  // Analisar segunda linha (potenciais dados)
  segundaLinha.forEach(celula => {
    const limpo = celula.trim().replace(/['"]/g, '');
    
    // Características típicas de dados
    if (/^\d+([.,]\d+)*$/.test(limpo)) {
      pontuacaoDados += 2; // Números
    }
    
    if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(limpo)) {
      pontuacaoDados += 3; // Datas
    }
    
    if (/^[A-Z]{3,6}\d*$/.test(limpo)) {
      pontuacaoDados += 2; // Códigos de ativos (ex: PETR4, WDOZ21)
    }
  });

  const temCabecalho = pontuacaoCabecalho > pontuacaoDados && 
                      pontuacaoCabecalho > primeiraLinha.length * 0.3;

  if (debug) {
    console.log(`🏷️ Cabeçalho: ${temCabecalho ? 'Sim' : 'Não'} (cabeçalho: ${pontuacaoCabecalho}, dados: ${pontuacaoDados})`);
  }

  return temCabecalho;
}

/**
 * Processa conteúdo com PapaParse
 */
async function processarComPapaParse(
  conteudo: string,
  delimitador: string,
  temCabecalho: boolean,
  debug: boolean
): Promise<any> {
  return new Promise((resolve, reject) => {
    Papa.parse(conteudo, {
      delimiter: delimitador,
      header: temCabecalho,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // Manter como strings para controle manual
      transform: (valor: string) => {
        if (typeof valor !== 'string') return valor;
        
        // Limpar valor
        let valorLimpo = valor.trim();
        
        // Remover aspas externas desnecessárias
        if ((valorLimpo.startsWith('"') && valorLimpo.endsWith('"')) ||
            (valorLimpo.startsWith("'") && valorLimpo.endsWith("'"))) {
          valorLimpo = valorLimpo.slice(1, -1);
        }

        // Tratar valores vazios/nulos
        if (valorLimpo === '' || 
            valorLimpo.toLowerCase() === 'null' ||
            valorLimpo.toLowerCase() === 'undefined' ||
            valorLimpo.toLowerCase() === 'n/a') {
          return null;
        }

        return valorLimpo;
      },
      transformHeader: (cabecalho: string, indice: number) => {
        if (!cabecalho || cabecalho.trim() === '') {
          return `coluna_${indice + 1}`;
        }
        
        // Limpar e normalizar nome do cabeçalho
        return cabecalho
          .trim()
          .replace(/[^\w\sÀ-ÿ\-_]/g, '') // Manter acentos
          .replace(/\s+/g, '_')
          .toLowerCase();
      },
      complete: (resultados: any) => {
        resolve(resultados);
      },
      error: (erro: any) => {
        reject(new Error(`Erro no parsing PapaParse: ${erro.message || 'Erro desconhecido'}`));
      }
    });
  });
}

/**
 * Limpa dados do CSV removendo linhas inválidas
 */
function limparDadosCSV(dados: any[], debug: boolean): any[] {
  if (!Array.isArray(dados) || dados.length === 0) {
    return [];
  }

  const tamanhoOriginal = dados.length;

  // Filtrar linhas válidas
  const dadosLimpos = dados.filter(linha => {
    if (!linha || typeof linha !== 'object') return false;
    
    // Verificar se tem pelo menos um valor não vazio/nulo
    return Object.values(linha).some(valor => 
      valor !== null && 
      valor !== undefined && 
      valor !== '' && 
      String(valor).trim() !== ''
    );
  });

  // Converter números brasileiros quando possível
  dadosLimpos.forEach(linha => {
    Object.keys(linha).forEach(chave => {
      const valor = linha[chave];
      if (typeof valor === 'string') {
        // Tentar converter números brasileiros (1.234,56)
        if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(valor)) {
          const numeroAmericano = valor.replace(/\./g, '').replace(',', '.');
          const numeroConvertido = parseFloat(numeroAmericano);
          if (!isNaN(numeroConvertido)) {
            linha[chave] = numeroConvertido;
          }
        }
        // Tentar converter números americanos (1,234.56)
        else if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(valor)) {
          const numeroLimpo = valor.replace(/,/g, '');
          const numeroConvertido = parseFloat(numeroLimpo);
          if (!isNaN(numeroConvertido)) {
            linha[chave] = numeroConvertido;
          }
        }
      }
    });
  });

  if (debug && dadosLimpos.length !== tamanhoOriginal) {
    console.log(`🧹 Limpeza: ${tamanhoOriginal} → ${dadosLimpos.length} linhas válidas`);
  }

  return dadosLimpos;
}

/**
 * Extrai erros do resultado do PapaParse
 */
function extrairErros(errors: any[]): string[] {
  if (!Array.isArray(errors)) return [];
  
  return errors
    .filter((erro: any) => erro.type !== 'Quotes') // Ignorar avisos de aspas
    .map((erro: any) => {
      const linha = typeof erro.row === 'number' ? erro.row + 1 : 'desconhecida';
      return `Linha ${linha}: ${erro.message || 'Erro desconhecido'}`;
    });
}

/**
 * Gera sugestões de correção baseadas no erro
 */
function gerarSugestoesErro(erro: string, caminhoArquivo: string): string[] {
  const sugestoes: string[] = [];

  const erroLower = erro.toLowerCase();

  if (erroLower.includes('encoding') || erroLower.includes('decode') || erroLower.includes('codificação')) {
    sugestoes.push("Tente forçar o encoding: { encodingForcado: 'utf8' } ou 'iso88591'");
    sugestoes.push("Verifique se o arquivo não está corrompido");
    sugestoes.push("Salve o arquivo novamente como UTF-8");
  }

  if (erroLower.includes('delimiter') || erroLower.includes('delimitador') || erroLower.includes('separator')) {
    sugestoes.push("Especifique o delimitador: { delimitadorForcado: ';' } ou ','");
    sugestoes.push("Verifique a estrutura do arquivo - todas as linhas devem ter o mesmo delimitador");
    sugestoes.push("Abra o arquivo em um editor de texto para verificar o formato");
  }

  if (erroLower.includes('empty') || erroLower.includes('vazio')) {
    sugestoes.push("Confirme que o arquivo contém dados");
    sugestoes.push("Verifique se há pelo menos uma linha de dados após o cabeçalho");
    sugestoes.push("Remova linhas em branco do início do arquivo");
  }

  if (erroLower.includes('not found') || erroLower.includes('não encontrado')) {
    sugestoes.push("Confirme o caminho completo do arquivo");
    sugestoes.push("Verifique se o arquivo existe no local especificado");
    sugestoes.push("Use barras normais (/) no caminho, mesmo no Windows");
  }

  if (erroLower.includes('permission') || erroLower.includes('permissão')) {
    sugestoes.push("Verifique as permissões de acesso ao arquivo");
    sugestoes.push("Feche o arquivo se estiver aberto em outro programa (Excel, etc.)");
  }

  // Verificar tamanho do arquivo
  try {
    const stats = fs.statSync(caminhoArquivo);
    if (stats.size > 50 * 1024 * 1024) { // > 50MB
      sugestoes.push("Arquivo grande - considere dividir em partes menores");
      sugestoes.push("Use um tamanho de amostra maior: { tamanhoAmostra: 50000 }");
    }
  } catch {
    // Arquivo pode não existir
  }

  return sugestoes;
}

/**
 * Formata tamanho de arquivo para exibição
 */
function formatarTamanho(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Analisa formato do CSV sem processar completamente
 */
export async function analisarFormatoCSV(caminhoArquivo: string): Promise<AnaliseFormatoCSV> {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
  }

  const stats = fs.statSync(caminhoArquivo);
  const tamanhoArquivo = stats.size;
  
  // Detectar encoding
  const encoding = await detectarEncoding(caminhoArquivo, undefined, 10240, false);
  
  // Ler amostra
  const amostra = await lerAmostra(caminhoArquivo, encoding, 10240);
  
  // Detectar delimitador
  const delimitador = detectarDelimitador(amostra, undefined, false);
  
  // Detectar cabeçalho
  const temCabecalho = detectarPresencaCabecalho(amostra, delimitador, false);
  
  // Estimar linhas
  const linhas = amostra.split('\n').filter(linha => linha.trim());
  const linhasEstimadas = Math.ceil((tamanhoArquivo / amostra.length) * linhas.length);
  
  // Extrair colunas
  const primeiraLinha = linhas[0] || '';
  const colunas = primeiraLinha.split(delimitador).map((col, index) => {
    if (temCabecalho) {
      return col.trim().replace(/['"]/g, '') || `coluna_${index + 1}`;
    }
    return `coluna_${index + 1}`;
  });

  // Calcular qualidade da detecção
  let qualidadeDeteccao = 50; // Base
  if (encoding !== 'utf8') qualidadeDeteccao += 10;
  if (delimitador === ';' || delimitador === ',') qualidadeDeteccao += 15;
  if (temCabecalho) qualidadeDeteccao += 15;
  if (colunas.length > 1) qualidadeDeteccao += 10;
  qualidadeDeteccao = Math.min(100, qualidadeDeteccao);

  return {
    encoding,
    delimitador: delimitador === '\t' ? 'TAB' : delimitador,
    temCabecalho,
    linhasEstimadas,
    colunas,
    tamanhoArquivo,
    amostra: amostra.substring(0, 300) + (amostra.length > 300 ? '...' : ''),
    qualidadeDeteccao
  };
}

/**
 * Função de teste para demonstração
 */
export async function testarLeitorUniversal(): Promise<void> {
  console.log('🧪 Testando Leitor Universal de CSV...\n');

  const arquivosTeste = {
    'teste_ponto_virgula.csv': 'Nome;Idade;Cidade\nJoão;30;São Paulo\nMaria;25;"Rio de Janeiro"\nPedro;35;Brasília',
    'teste_virgula.csv': 'Name,Age,City\nJohn,30,"New York"\nMary,25,"Los Angeles"',
    'teste_tab.csv': 'Nome\tIdade\tCidade\nJoão\t30\tSão Paulo\nMaria\t25\tRio de Janeiro',
    'teste_pipe.csv': 'Nome|Valor|Data\nPETR4|25.50|01/01/2025\nVALE3|62.30|02/01/2025'
  };

  for (const [nomeArquivo, conteudo] of Object.entries(arquivosTeste)) {
    try {
      // Criar arquivo de teste
      fs.writeFileSync(nomeArquivo, conteudo, 'utf8');

      console.log(`📝 Testando: ${nomeArquivo}`);
      console.log('-'.repeat(60));

      // Analisar formato primeiro
      const analise = await analisarFormatoCSV(nomeArquivo);
      console.log('📊 Análise:', JSON.stringify(analise, null, 2));

      // Processar arquivo
      const resultado = await lerCSVUniversal(nomeArquivo, { debug: false });
      
      console.log('\n📋 Dados processados:');
      console.table(resultado.dados);

      console.log(`\nℹ️ Metadados: ${JSON.stringify(resultado.metadados, null, 2)}\n`);

      // Limpar arquivo de teste
      fs.unlinkSync(nomeArquivo);

    } catch (erro) {
      console.error(`❌ Erro em ${nomeArquivo}:`, erro instanceof Error ? erro.message : erro);
    }
  }

  console.log('✅ Teste concluído!');
}

// Exportar função principal
export default lerCSVUniversal;