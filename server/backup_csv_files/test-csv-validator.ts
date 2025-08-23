/**
 * Teste do Validador CSV
 * =====================
 * 
 * Script para testar o novo validador com CSVs da Clear
 */

import { validateAndParseCSV } from './csvValidator';
import fs from 'fs';

async function testValidador() {
  console.log('🧪 TESTANDO VALIDADOR CSV\n');
  
  // Testar com arquivo da Clear convertido
  const testFiles = [
    '/tmp/test_clear_valid.csv'
  ];
  
  for (const filePath of testFiles) {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Arquivo não encontrado: ${filePath}`);
      continue;
    }
    
    console.log(`📁 Testando: ${filePath}`);
    console.log('='.repeat(50));
    
    try {
      const result = await validateAndParseCSV(filePath);
      
      console.log(`Resultado:`);
      console.log(`  ✅ Válido: ${result.valid}`);
      
      if (!result.valid) {
        console.log(`  ❌ Motivo: ${result.reason}`);
      } else {
        console.log(`  📋 Headers: ${result.headers?.length} colunas`);
        console.log(`  📊 Linhas: ${result.rows?.length} trades`);
        console.log(`  🏷️ Primeiros headers: ${result.headers?.slice(0, 5).join(', ')}`);
        
        if (result.rows && result.rows.length > 0) {
          const firstTrade = result.rows[0];
          console.log(`  📈 Primeiro trade:`, {
            ativo: firstTrade.Ativo || firstTrade.ativo,
            abertura: firstTrade.Abertura || firstTrade.abertura,
            fechamento: firstTrade.Fechamento || firstTrade.fechamento
          });
        }
      }
    } catch (error) {
      console.log(`❌ Erro no teste: ${error}`);
    }
    
    console.log('\n');
  }
  
  // Testar com CSV inválido (sem datas)
  console.log('📁 Testando CSV inválido (sem colunas de data)');
  console.log('='.repeat(50));
  
  const invalidCSV = `Produto,Quantidade,Preco
Notebook,2,1500.00
Mouse,10,25.50`;
  
  try {
    const result = await validateAndParseCSV(invalidCSV);
    console.log(`Resultado CSV inválido:`);
    console.log(`  ✅ Válido: ${result.valid}`);
    console.log(`  ❌ Motivo: ${result.reason}`);
  } catch (error) {
    console.log(`❌ Erro no teste inválido: ${error}`);
  }
  
  console.log('\n🎉 Testes concluídos!');
}

export { testValidador };

// Executar teste
testValidador().catch(console.error);