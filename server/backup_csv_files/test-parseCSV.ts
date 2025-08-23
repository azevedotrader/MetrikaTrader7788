import { parseCSV, previewCSV } from './parseCSV';

/**
 * Teste rápido da função parseCSV
 */

console.log('🧪 Testando função parseCSV...\n');

// Teste 1: CSV simples com ponto e vírgula
const csvSimples = `Nome;Idade;Cidade
João;30;São Paulo
Maria;25;Rio de Janeiro`;

console.log('=== TESTE 1: CSV Simples ===');
const resultado1 = parseCSV(csvSimples);
console.log('✅ Dados:', resultado1.data);
console.log('📊 Meta:', resultado1.meta);

// Teste 2: CSV com vírgula e valores problemáticos
const csvProblema = `"Nome Completo",Data,"Salário (R$)"
"Silva, João",01/01/2025,"R$ 5.000,50"
"Maria ""MC"" Santos",15/02/2025,"R$ 3.200,00"`;

console.log('\n=== TESTE 2: CSV Problemático ===');
previewCSV(csvProblema, 5);

// Teste 3: Dados numéricos com tab
const csvNumerico = `ID	Valor	Status
1	1500.75	Ativo
2	2300.00	Inativo
3	850.25	Ativo`;

console.log('\n=== TESTE 3: CSV com Tab ===');
const resultado3 = parseCSV(csvNumerico);
console.log('Delimitador detectado:', resultado3.meta.delimiter);
console.log('Dados:', resultado3.data);

console.log('\n🎉 Testes concluídos!');