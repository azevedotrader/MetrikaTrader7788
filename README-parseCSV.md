# 📊 parseCSV - Função Universal para Parsing de CSV

## Visão Geral

A função `parseCSV` é uma solução robusta e inteligente para leitura de arquivos CSV em TypeScript/Node.js. Ela detecta automaticamente formato, codificação, delimitadores e estrutura do arquivo, garantindo máxima compatibilidade.

## ✨ Principais Funcionalidades

### 🔍 Detecção Automática Completa
- **Delimitadores**: `;`, `,`, `\t`, `|`, `:`, espaço
- **Codificação**: UTF-8, ISO-8859-1, Windows-1252 e outras
- **Cabeçalho**: Identifica automaticamente se existe header
- **Quebras de linha**: `\r\n`, `\n`, `\r`
- **BOM**: Remove automaticamente Byte Order Mark

### 🧹 Limpeza Inteligente
- Remove caracteres invisíveis e de controle
- Normaliza quebras de linha
- Filtra linhas vazias
- Limpa valores com aspas desnecessárias
- Trata valores nulos/vazios

### 📈 Processamento Robusto
- Usa PapaParse para parsing confiável
- Tratamento de erros detalhado
- Relatórios de metadados completos
- Suporte a arquivos grandes

## 🚀 Como Usar

### Instalação

```bash
npm install papaparse chardet iconv-lite
npm install -D @types/papaparse
```

### Uso Básico

```typescript
import { parseCSV } from './parseCSV';

// Parse de conteúdo direto
const csvContent = `
Nome;Idade;Cidade
João;30;São Paulo
Maria;25;Rio de Janeiro
`;

const resultado = parseCSV(csvContent);
console.log(resultado.data); // Array de objetos
console.log(resultado.meta); // Metadados detalhados
```

### Parse de Arquivo

```typescript
import { parseCSVFile } from './parseCSV';

const resultado = parseCSVFile('./dados.csv');
console.log(`Processadas ${resultado.meta.totalRows} linhas`);
```

### Opções Personalizadas

```typescript
const resultado = parseCSV(csvContent, {
  delimiter: ';',        // Forçar delimitador
  encoding: 'utf8',      // Forçar codificação
  hasHeader: true,       // Forçar presença de header
  sampleSize: 20         // Tamanho da amostra para detecção
});
```

### Preview Rápido

```typescript
import { previewCSV } from './parseCSV';

previewCSV('./arquivo.csv', 5); // Mostra primeiras 5 linhas
```

## 📋 Estrutura de Retorno

```typescript
interface ParseCSVResult {
  data: any[];           // Dados parseados
  meta: {
    delimiter: string;    // Delimitador detectado
    encoding: string;     // Codificação detectada  
    hasHeader: boolean;   // Se tem cabeçalho
    totalRows: number;    // Total de linhas
    totalColumns: number; // Total de colunas
    errors: string[];     // Lista de erros
  };
}
```

## 🎯 Exemplos Práticos

### CSV Brasileiro com Ponto e Vírgula

```typescript
const csvBR = `
Data;Produto;Valor;Status
01/07/2025;PETR4;"R$ 25,50";Ativo
02/07/2025;VALE3;"R$ 85,75";Inativo
`;

const resultado = parseCSV(csvBR);
// Detecta automaticamente: delimiter=';', hasHeader=true
```

### CSV Complexo com Problemas

```typescript
const csvProblema = `
"Nome Completo","Data Nasc","E-mail"
"Silva, João","15/03/1990","joao@email.com"  
"Maria ""MC"" Santos","22/07/1985","maria@email.com"
`;

const resultado = parseCSV(csvProblema);
// Trata aspas, vírgulas dentro de campos, espaços extras
```

### Arquivo com Encoding Especial

```typescript
// Arquivo ISO-8859-1 com acentos
const resultado = parseCSVFile('./dados_acentos.csv');
// Detecta encoding automaticamente e converte para UTF-8
```

### CSV sem Cabeçalho

```typescript
const csvSemHeader = `
João;30;Engenheiro
Maria;25;Designer
Pedro;35;Gerente
`;

const resultado = parseCSV(csvSemHeader);
// Detecta ausência de header, retorna array de arrays
console.log(resultado.data);
// [['João', '30', 'Engenheiro'], ['Maria', '25', 'Designer'], ...]
```

## 🛠️ Algoritmos de Detecção

### Detecção de Delimitador
1. Testa delimitadores comuns: `;`, `,`, `\t`, `|`, `:`, espaço
2. Analisa consistência de colunas por linha
3. Pontua baseado em número e consistência de colunas
4. Aplica bonificações para delimitadores mais comuns

### Detecção de Cabeçalho
1. Compara primeira linha com segunda linha
2. Verifica se primeira linha contém texto descritivo
3. Analisa se segunda linha contém dados (números, datas)
4. Decide baseado em score de características

### Detecção de Codificação
1. Usa biblioteca `chardet` para detectar charset
2. Converte com `iconv-lite` para UTF-8
3. Fallback para UTF-8 se codificação não suportada

## ✅ Casos de Teste Incluídos

- CSV simples com ponto e vírgula
- CSV com vírgulas e aspas problemáticas  
- CSV com tabs como delimitador
- CSV sem cabeçalho
- CSV com encoding ISO-8859-1
- CSV com BOM
- CSV com linhas vazias
- CSV com valores nulos

## 🔧 Tratamento de Erros

A função nunca falha completamente. Em caso de erro:
- Retorna array vazio em `data`
- Inclui descrição do erro em `meta.errors`
- Mantém metadados do que foi possível detectar
- Logs detalhados para debugging

## 📊 Performance

- Otimizada para arquivos grandes
- Amostragem inteligente para detecção (primeiras 10-20 linhas)
- Streaming quando possível
- Memória eficiente com limpeza incremental

## 🎉 Conclusão

Esta função `parseCSV` resolve definitivamente os problemas de compatibilidade com CSVs em aplicações TypeScript/Node.js, oferecendo:

- ✅ **Zero configuração** - Funciona out-of-the-box
- ✅ **Máxima compatibilidade** - Lê qualquer formato CSV
- ✅ **Detecção inteligente** - Algoritmos robustos de análise
- ✅ **Tratamento de erros** - Nunca quebra sua aplicação
- ✅ **Metadados ricos** - Informações completas do processo
- ✅ **Fácil integração** - API simples e clara

Pronta para usar em projetos reais, testada e documentada! 🚀