# Leitor Universal de CSV - Métrika Trading Analytics

Uma função completa para ler qualquer arquivo CSV, independentemente do delimitador, encoding ou formato.

## 🚀 Características

### ✅ Detecção Automática Completa
- **Encoding**: UTF-8, ISO-8859-1, Windows-1252, ASCII e outros
- **Delimitador**: `;`, `,`, `|`, `\t`, `:`, ` `, `-`, `*`, `~`, `^`, `#`, `.` e outros
- **Cabeçalho**: Detecta automaticamente se a primeira linha é cabeçalho
- **Aspas**: Trata corretamente campos entre aspas simples ou duplas
- **Quebras de linha**: Suporta quebras dentro de células

### 🧠 Inteligência Brasileira
- **Números brasileiros**: Converte automaticamente `1.234,56` para `1234.56`
- **Vocabulário**: Reconhece termos em português como "data", "preço", "quantidade"
- **Formato de dados**: Detecta datas no formato brasileiro `DD/MM/AAAA`
- **Códigos B3**: Reconhece ativos brasileiros (PETR4, VALE3, WDOZ21, etc.)

### 🛡️ Tratamento Robusto de Erros
- **Mensagens claras**: Erros em português com contexto detalhado
- **Sugestões automáticas**: Recomendações específicas para cada tipo de erro
- **Fallbacks inteligentes**: Tenta múltiplas estratégias antes de falhar
- **Validação**: Verifica integridade e consistência dos dados

## 📖 Como Usar

### Uso Básico

```typescript
import { lerCSVUniversal } from './leitor-csv-universal';

// Leitura simples - tudo automático
const resultado = await lerCSVUniversal('meu_arquivo.csv');

console.log(`Processadas ${resultado.metadados.totalLinhas} linhas`);
console.log('Dados:', resultado.dados);
```

### Uso com Configurações

```typescript
const resultado = await lerCSVUniversal('arquivo.csv', {
  delimitadorForcado: ';',        // Forçar delimitador específico
  encodingForcado: 'iso88591',    // Forçar encoding específico
  tamanhoAmostra: 20480,          // Amostra maior para detecção
  debug: true,                    // Logs detalhados
  detectarCabecalho: false        // Desabilitar detecção de cabeçalho
});
```

### Análise Prévia

```typescript
import { analisarFormatoCSV } from './leitor-csv-universal';

// Analisar sem processar completamente
const analise = await analisarFormatoCSV('arquivo.csv');

console.log(`Encoding: ${analise.encoding}`);
console.log(`Delimitador: ${analise.delimitador}`);
console.log(`Colunas: ${analise.colunas.join(', ')}`);
console.log(`Qualidade: ${analise.qualidadeDeteccao}%`);
```

## 🎯 Exemplos Práticos

### 1. CSV Brasileiro Típico
```csv
Nome;Preço;Data;Resultado
PETR4;25,50;01/01/2025;156,75
VALE3;62,30;02/01/2025;-25,10
```

```typescript
const resultado = await lerCSVUniversal('trades.csv');
// Detecta automaticamente: encoding=utf8, delimiter=';', header=true
// Converte preços brasileiros para números
```

### 2. CSV com Delimitador Incomum
```csv
Ativo|Entrada|Saída|Lucro
WINZ21|141750|142100|350
WDOZ21|5510|5520|10
```

```typescript
const resultado = await lerCSVUniversal('operacoes.csv');
// Detecta automaticamente: delimiter='|'
```

### 3. CSV Complexo com Aspas
```csv
"Nome do Ativo";"Preço de Entrada";"Resultado Final"
"PETR4 - Petrobras";"R$ 25,50";"R$ 60,00"
"VALE3 - Vale";"R$ 62,30";"-R$ 50,00"
```

```typescript
const resultado = await lerCSVUniversal('complexo.csv');
// Trata aspas automaticamente e limpa dados
```

## 📊 Estrutura do Resultado

```typescript
interface ResultadoCSVUniversal {
  dados: any[];                    // Array de objetos com os dados
  metadados: {
    encoding: string;              // Encoding detectado
    delimitador: string;           // Delimitador usado
    temCabecalho: boolean;         // Se tem cabeçalho
    totalLinhas: number;           // Número de linhas de dados
    totalColunas: number;          // Número de colunas
    tamanhoArquivo: number;        // Tamanho em bytes
    erros: string[];               // Lista de erros encontrados
    avisos: string[];              // Lista de avisos
    tempoProcessamento: number;    // Tempo em milissegundos
  };
}
```

## 🚨 Tratamento de Erros

### Mensagens Claras com Sugestões

```typescript
try {
  const resultado = await lerCSVUniversal('arquivo_problematico.csv');
} catch (erro) {
  console.log(erro.message);
  /*
  Saída exemplo:
  Falha ao processar CSV: Erro de encoding detectado
  
  💡 Sugestões para correção:
  • Tente forçar o encoding: { encodingForcado: 'utf8' } ou 'iso88591'
  • Verifique se o arquivo não está corrompido
  • Salve o arquivo novamente como UTF-8
  */
}
```

### Tipos Comuns de Erro e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| Arquivo não encontrado | Caminho incorreto | Verificar caminho completo |
| Erro de encoding | Codificação não detectada | `{ encodingForcado: 'iso88591' }` |
| Delimitador incorreto | Formato não padrão | `{ delimitadorForcado: '\\|' }` |
| Arquivo vazio | Sem conteúdo | Verificar se há dados no arquivo |
| Linhas inconsistentes | Formato irregular | Limpar dados manualmente |

## ⚙️ Configurações Avançadas

### Opções Disponíveis

```typescript
interface ConfiguracaoCSVUniversal {
  delimitadorForcado?: string;     // ';', ',', '\t', '|', etc.
  encodingForcado?: string;        // 'utf8', 'iso88591', 'windows1252'
  tamanhoAmostra?: number;         // Padrão: 10240 bytes
  debug?: boolean;                 // Padrão: true
  detectarCabecalho?: boolean;     // Padrão: true
}
```

### Encodings Suportados
- `utf8` - UTF-8 (padrão moderno)
- `iso88591` - ISO-8859-1 (Latin-1, comum no Brasil)
- `windows1252` - Windows-1252 (CP1252)
- `ascii` - ASCII básico
- `latin1` - Latin-1

### Delimitadores Suportados
- `;` - Ponto e vírgula (muito comum no Brasil)
- `,` - Vírgula (padrão internacional)
- `\t` - Tab (TSV)
- `|` - Pipe/barra vertical
- `:` - Dois pontos
- ` ` - Espaço
- `-` - Hífen
- `*` - Asterisco
- E outros caracteres personalizados

## 🧪 Teste Completo

Execute a demonstração completa:

```typescript
import { executarTodosExemplos } from './demo-leitor-universal';

await executarTodosExemplos();
```

Ou teste individual:

```typescript
import { testarLeitorUniversal } from './leitor-csv-universal';

await testarLeitorUniversal();
```

## 🏃 Performance

### Otimizações Implementadas
- **Amostragem inteligente**: Analisa apenas parte do arquivo para detecção
- **Processamento em memória**: Evita I/O desnecessário
- **Limpeza eficiente**: Remove dados inválidos sem reprocessar
- **Conversão lazy**: Converte tipos apenas quando necessário

### Benchmarks Típicos
- **Arquivo pequeno** (<1MB): ~50-100ms
- **Arquivo médio** (1-10MB): ~200-500ms  
- **Arquivo grande** (10-50MB): ~1-3s
- **Detecção de formato**: ~10-20ms

## 🔄 Integração com Métrika

### Uso no Sistema de Trading

```typescript
// Integração com upload de trades
app.post('/api/trades/upload-csv', upload.single('csvFile'), async (req, res) => {
  try {
    const resultado = await lerCSVUniversal(req.file.path);
    
    // Processar trades automaticamente
    const trades = resultado.dados.map(linha => ({
      ativo: linha.ativo || linha.simbolo,
      preco: linha.preco || linha.valor,
      quantidade: linha.quantidade || 1,
      // ... outros campos
    }));
    
    res.json({ 
      success: true, 
      trades,
      metadados: resultado.metadados 
    });
  } catch (erro) {
    res.status(400).json({ 
      success: false, 
      error: erro.message 
    });
  }
});
```

### Validação de Dados de Trading

```typescript
const resultado = await lerCSVUniversal('trades.csv');

// Validar se tem colunas necessárias para trading
const colunasObrigatorias = ['ativo', 'preco', 'quantidade'];
const colunas = Object.keys(resultado.dados[0] || {});

const faltandoColunas = colunasObrigatorias.filter(
  col => !colunas.some(c => c.toLowerCase().includes(col))
);

if (faltandoColunas.length > 0) {
  throw new Error(`Colunas obrigatórias ausentes: ${faltandoColunas.join(', ')}`);
}
```

## 📈 Casos de Uso Reais

### 1. Importação de Trades da Clear (B3)
```typescript
const trades = await lerCSVUniversal('clear_trades.csv');
// Detecta automaticamente formato B3 e converte valores
```

### 2. Dados de Crypto Exchange
```typescript
const dados = await lerCSVUniversal('binance_trades.csv');
// Processa formato internacional com vírgulas
```

### 3. Planilhas Excel Exportadas
```typescript
const planilha = await lerCSVUniversal('excel_export.csv', {
  encodingForcado: 'windows1252'  // Comum em exports do Excel
});
```

### 4. Dados Históricos de Ações
```typescript
const historico = await lerCSVUniversal('acoes_historico.csv');
// Converte automaticamente datas e preços brasileiros
```

## 🤝 Contribuindo

Para melhorar o leitor universal:

1. **Teste novos formatos**: Adicione casos de teste para formatos específicos
2. **Optimize performance**: Melhore algoritmos de detecção
3. **Expanda encoding**: Adicione suporte para mais codificações
4. **Documente casos**: Adicione exemplos de uso real

## 📄 Licença

Parte do sistema Métrika Trading Analytics Platform - 2025