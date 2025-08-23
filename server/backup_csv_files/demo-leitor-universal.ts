/**
 * Demonstração do Leitor Universal de CSV
 * =======================================
 * 
 * Script para testar e demonstrar todas as funcionalidades do leitor universal
 */

import { lerCSVUniversal, analisarFormatoCSV, testarLeitorUniversal } from './leitor-csv-universal';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demonstra o uso básico do leitor universal
 */
async function exemploBasico() {
  console.log('\n🚀 === EXEMPLO BÁSICO ===');
  console.log('Demonstrando leitura automática de CSV...\n');

  // Exemplo 1: CSV com ponto e vírgula (padrão brasileiro)
  const csvBrasileiro = `Nome;Valor;Data;Resultado
PETR4;25,50;01/01/2025;156,75
VALE3;62,30;02/01/2025;-25,10
WDOZ21;5.510,00;03/01/2025;89,50`;

  const arquivo1 = 'exemplo_brasileiro.csv';
  fs.writeFileSync(arquivo1, csvBrasileiro, 'utf8');

  try {
    console.log('📊 Analisando formato do arquivo brasileiro...');
    const analise = await analisarFormatoCSV(arquivo1);
    console.log(`✅ Detectado: Encoding=${analise.encoding}, Delimitador='${analise.delimitador}', Cabeçalho=${analise.temCabecalho ? 'Sim' : 'Não'}`);
    console.log(`📏 Qualidade da detecção: ${analise.qualidadeDeteccao}%`);

    console.log('\n📖 Lendo arquivo...');
    const resultado = await lerCSVUniversal(arquivo1);
    
    console.log(`\n✅ Sucesso! ${resultado.metadados.totalLinhas} linhas × ${resultado.metadados.totalColunas} colunas`);
    console.log('📋 Primeiras linhas:');
    console.table(resultado.dados.slice(0, 3));

    fs.unlinkSync(arquivo1); // Limpar
  } catch (erro) {
    console.error('❌ Erro:', erro instanceof Error ? erro.message : erro);
  }
}

/**
 * Demonstra detecção automática de delimitadores complexos
 */
async function exemploDelimitadoresComplexos() {
  console.log('\n🎯 === DELIMITADORES COMPLEXOS ===');
  console.log('Testando diferentes delimitadores automaticamente...\n');

  const arquivosTeste = {
    'teste_pipe.csv': 'Símbolo|Preço|Volume|Variação\nPETR4|25.50|1000000|2.5%\nVALE3|62.30|500000|-1.2%',
    'teste_dois_pontos.csv': 'Ativo:Entrada:Saída:Lucro\nWINZ21:141750:142100:350\nWDOZ21:5510:5520:10',
    'teste_asterisco.csv': 'Nome*Idade*Cidade*Profissão\nJoão*30*São Paulo*Trader\nMaria*28*Rio de Janeiro*Analista',
    'teste_espacos.csv': 'Codigo Data Hora Preco Quantidade\nPETR4 01/01/2025 09:30 25.50 1000\nVALE3 01/01/2025 10:15 62.30 2000'
  };

  for (const [nome, conteudo] of Object.entries(arquivosTeste)) {
    try {
      fs.writeFileSync(nome, conteudo, 'utf8');
      
      console.log(`\n📝 Testando: ${nome}`);
      const analise = await analisarFormatoCSV(nome);
      console.log(`   🔍 Delimitador detectado: '${analise.delimitador}'`);
      console.log(`   📊 ${analise.colunas.length} colunas: ${analise.colunas.join(', ')}`);
      
      const resultado = await lerCSVUniversal(nome, { debug: false });
      console.log(`   ✅ ${resultado.dados.length} linhas processadas`);
      
      fs.unlinkSync(nome);
    } catch (erro) {
      console.error(`   ❌ Erro em ${nome}: ${erro instanceof Error ? erro.message : erro}`);
    }
  }
}

/**
 * Demonstra detecção automática de encoding
 */
async function exemploEncodings() {
  console.log('\n🔤 === DETECÇÃO DE ENCODING ===');
  console.log('Testando diferentes codificações automaticamente...\n');

  // Criar arquivo com caracteres especiais
  const textoComAcentos = 'Nome;Descrição;Preço\nAção;Compra de PETR4;R$ 25,50\nOperação;Venda no índice;R$ 1.250,75';
  
  const arquivoUTF8 = 'teste_utf8.csv';
  fs.writeFileSync(arquivoUTF8, textoComAcentos, 'utf8');

  try {
    console.log('📖 Testando arquivo UTF-8 com acentos...');
    const resultado = await lerCSVUniversal(arquivoUTF8);
    
    console.log(`✅ Encoding detectado: ${resultado.metadados.encoding}`);
    console.log('📋 Conteúdo:');
    console.table(resultado.dados);

    fs.unlinkSync(arquivoUTF8);
  } catch (erro) {
    console.error('❌ Erro:', erro instanceof Error ? erro.message : erro);
  }
}

/**
 * Demonstra tratamento de erros e sugestões
 */
async function exemploTratamentoErros() {
  console.log('\n🚨 === TRATAMENTO DE ERROS ===');
  console.log('Demonstrando como a função trata erros e gera sugestões...\n');

  // Teste 1: Arquivo inexistente
  try {
    await lerCSVUniversal('arquivo_inexistente.csv');
  } catch (erro) {
    console.log('📋 Erro esperado - Arquivo inexistente:');
    console.log(erro instanceof Error ? erro.message : erro);
  }

  // Teste 2: Arquivo malformado
  const csvMalformado = 'Cabeçalho sem dados\n\n\n   \n';
  const arquivoMalformado = 'malformado.csv';
  fs.writeFileSync(arquivoMalformado, csvMalformado, 'utf8');

  try {
    const resultado = await lerCSVUniversal(arquivoMalformado);
    console.log(`\n📋 Arquivo malformado processado: ${resultado.dados.length} linhas`);
    if (resultado.metadados.erros.length > 0) {
      console.log('⚠️ Erros encontrados:', resultado.metadados.erros);
    }
  } catch (erro) {
    console.log('\n📋 Erro no arquivo malformado:');
    console.log(erro instanceof Error ? erro.message : erro);
  } finally {
    if (fs.existsSync(arquivoMalformado)) {
      fs.unlinkSync(arquivoMalformado);
    }
  }
}

/**
 * Demonstra configurações avançadas
 */
async function exemploConfiguracaoAvancada() {
  console.log('\n⚙️ === CONFIGURAÇÕES AVANÇADAS ===');
  console.log('Demonstrando uso de configurações personalizadas...\n');

  const csvComplexo = `"Nome do Ativo";"Preço de Entrada";"Preço de Saída";"Resultado Final"
"PETR4 - Petrobras";"R$ 25,50";"R$ 26,10";"R$ 60,00"
"VALE3 - Vale";"R$ 62,30";"R$ 61,80";"-R$ 50,00"
"Linha com erro";"dados";"incompletos"`;

  const arquivoComplexo = 'complexo.csv';
  fs.writeFileSync(arquivoComplexo, csvComplexo, 'utf8');

  try {
    console.log('🔧 Usando configurações personalizadas...');
    const resultado = await lerCSVUniversal(arquivoComplexo, {
      delimitadorForcado: ';',
      encodingForcado: 'utf8',
      tamanhoAmostra: 2048,
      debug: true,
      detectarCabecalho: true
    });

    console.log('\n📊 Resultado com configurações avançadas:');
    console.log(`✅ ${resultado.metadados.totalLinhas} linhas processadas`);
    console.log(`⏱️ Tempo de processamento: ${resultado.metadados.tempoProcessamento}ms`);
    console.table(resultado.dados);

    if (resultado.metadados.erros.length > 0) {
      console.log('\n⚠️ Erros detectados:', resultado.metadados.erros);
    }

    fs.unlinkSync(arquivoComplexo);
  } catch (erro) {
    console.error('❌ Erro:', erro instanceof Error ? erro.message : erro);
  }
}

/**
 * Executa todos os exemplos
 */
async function executarTodosExemplos() {
  console.log('🎉 DEMONSTRAÇÃO COMPLETA DO LEITOR UNIVERSAL DE CSV');
  console.log('==================================================');
  
  try {
    // Exemplos básicos
    await exemploBasico();
    await exemploDelimitadoresComplexos();
    await exemploEncodings();
    await exemploTratamentoErros();
    await exemploConfiguracaoAvancada();
    
    // Teste integrado
    console.log('\n🧪 === TESTE INTEGRADO ===');
    await testarLeitorUniversal();
    
    console.log('\n🎊 DEMONSTRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('=====================================');
    console.log('📚 O leitor universal está pronto para uso.');
    console.log('📋 Características principais:');
    console.log('   • Detecta automaticamente encoding (UTF-8, ISO-8859-1, etc.)');
    console.log('   • Detecta automaticamente delimitador (;, ,, |, \\t, :, -, * e outros)');
    console.log('   • Detecta automaticamente presença de cabeçalho');
    console.log('   • Trata aspas e caracteres especiais');
    console.log('   • Converte números brasileiros (1.234,56) automaticamente');
    console.log('   • Fornece mensagens de erro detalhadas com sugestões');
    console.log('   • Retorna metadados completos sobre o processamento');
    
  } catch (erro) {
    console.error('❌ Erro na demonstração:', erro instanceof Error ? erro.message : erro);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executarTodosExemplos().catch(console.error);
}

// Exportar para uso em outros módulos
export {
  exemploBasico,
  exemploDelimitadoresComplexos,
  exemploEncodings,
  exemploTratamentoErros,
  exemploConfiguracaoAvancada,
  executarTodosExemplos
};