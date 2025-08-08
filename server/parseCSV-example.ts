import { parseCSV, parseCSVFile, previewCSV } from './parseCSV';

/**
 * Exemplos de uso da função parseCSV
 */

// Exemplo 1: Parse de conteúdo CSV diretamente
function exemploConteudoDireto() {
  console.log('\n=== EXEMPLO 1: Conteúdo direto ===');
  
  const csvContent = `
Nome;Idade;Cidade;Salário
João Silva;30;São Paulo;5000.50
Maria Santos;25;Rio de Janeiro;4200.00
Pedro Costa;35;Belo Horizonte;6000.75
`;

  const resultado = parseCSV(csvContent);
  
  console.log('Dados parseados:', JSON.stringify(resultado.data, null, 2));
  console.log('Metadata:', resultado.meta);
}

// Exemplo 2: Parse de arquivo CSV
function exemploArquivo() {
  console.log('\n=== EXEMPLO 2: Arquivo CSV ===');
  
  // Supondo que existe um arquivo trades.csv
  const arquivoPath = './trades.csv';
  
  try {
    const resultado = parseCSVFile(arquivoPath);
    
    console.log(`Arquivo processado: ${resultado.meta.totalRows} linhas, ${resultado.meta.totalColumns} colunas`);
    console.log(`Delimitador: ${resultado.meta.delimiter}`);
    console.log(`Codificação: ${resultado.meta.encoding}`);
    console.log(`Tem cabeçalho: ${resultado.meta.hasHeader}`);
    
    if (resultado.meta.errors.length > 0) {
      console.log('Erros encontrados:', resultado.meta.errors);
    }
    
    // Mostrar primeiros registros
    console.log('Primeiros 3 registros:', resultado.data.slice(0, 3));
    
  } catch (error) {
    console.log('Arquivo não encontrado ou erro de leitura');
  }
}

// Exemplo 3: CSV com diferentes formatos
function exemploFormatosBrasil() {
  console.log('\n=== EXEMPLO 3: Formatos brasileiros ===');
  
  const csvBrasil = `
Data,Ativo,Tipo,Quantidade,Preço,Total
01/07/2025,PETR4,C,"1.000","25,50","R$ 25.500,00"
02/07/2025,VALE3,V,500,"85,75","R$ 42.875,00"
03/07/2025,ITUB4,C,"2.000","32,10","R$ 64.200,00"
`;

  const resultado = parseCSV(csvBrasil);
  
  console.log('Dados com formato brasileiro:', JSON.stringify(resultado.data, null, 2));
}

// Exemplo 4: CSV complexo com problemas
function exemploCSVProblematico() {
  console.log('\n=== EXEMPLO 4: CSV com problemas ===');
  
  const csvProblema = `
"Nome do Cliente";"Data Nascimento";Telefone;E-mail;"Valor Compra"

"João da Silva Santos";"15/03/1990";(11) 99999-9999;joao@email.com;"R$ 1.500,75"

"Maria, das Dores";"22/07/1985";(21) 88888-8888;"maria@email.com";"R$ 2.350,00"


"Pedro ""Pedrinho"" Costa";"01/12/1995";;"pedro@email.com";"R$ 890,25"
`;

  const resultado = parseCSV(csvProblema);
  
  console.log('Dados processados:', JSON.stringify(resultado.data, null, 2));
  console.log('Metadados:', resultado.meta);
}

// Exemplo 5: Uso do preview
function exemploPreview() {
  console.log('\n=== EXEMPLO 5: Preview de dados ===');
  
  const csvGrande = `
ID;Nome;Departamento;Salario;Data_Admissao
1;Ana Silva;TI;8000.00;2020-01-15
2;Carlos Santos;RH;6500.00;2019-03-22
3;Fernanda Lima;Vendas;7200.00;2021-07-10
4;Roberto Costa;TI;9500.00;2018-11-05
5;Juliana Ferreira;Marketing;7800.00;2020-09-18
6;Paulo Oliveira;Vendas;6800.00;2022-02-14
`;

  previewCSV(csvGrande, 3);
}

// Exemplo 6: Opções personalizadas
function exemploOpcoes() {
  console.log('\n=== EXEMPLO 6: Opções personalizadas ===');
  
  const csvSemHeader = `
João;30;São Paulo
Maria;25;Rio de Janeiro
Pedro;35;Belo Horizonte
`;

  // Forçar que não há header
  const resultado = parseCSV(csvSemHeader, {
    hasHeader: false,
    delimiter: ';'
  });
  
  console.log('Array de arrays (sem header):', resultado.data);
  
  // Agora forçar header
  const comHeader = parseCSV(csvSemHeader, {
    hasHeader: true,
    delimiter: ';'
  });
  
  console.log('Com header forçado:', comHeader.data);
}

// Executar exemplos
if (require.main === module) {
  exemploConteudoDireto();
  exemploArquivo();
  exemploFormatosBrasil();
  exemploCSVProblematico();
  exemploPreview();
  exemploOpcoes();
}

export {
  exemploConteudoDireto,
  exemploArquivo,
  exemploFormatosBrasil,
  exemploCSVProblematico,
  exemploPreview,
  exemploOpcoes
};