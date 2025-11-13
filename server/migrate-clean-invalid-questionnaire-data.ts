/**
 * MIGRAÇÃO: Limpar dados inválidos de questionários e gestão de banca
 * 
 * USA SANITIZAÇÃO PROFUNDA para aceitar strings, arrays, objetos malformados
 * e converter para números válidos dentro dos intervalos:
 * - Win Rate: 0-100
 * - Risk/Reward: 0.5-10
 * 
 * Execute: npm run tsx server/migrate-clean-invalid-questionnaire-data.ts
 */

import { db } from './db';
import { questionnaireStates, bankrollManagements } from '@shared/schema';
import { sql } from 'drizzle-orm';
import { sanitizePartialAnswers, sanitizeCustomMetrics } from './questionnaire-sanitizer';

async function cleanInvalidQuestionnaireData() {
  console.log('🧹 Iniciando limpeza PROFUNDA de dados inválidos de questionários...\n');

  try {
    // 1. Limpar questionnaire_states com valores inválidos
    console.log('📋 Limpando questionnaireStates...');
    
    const states = await db.select().from(questionnaireStates);
    let statesUpdated = 0;
    
    for (const state of states) {
      const original = JSON.stringify(state.partialAnswers);
      const sanitized = sanitizePartialAnswers(state.partialAnswers);
      const final = JSON.stringify(sanitized);
      
      if (original !== final) {
        console.log(`  🔧 Estado ${state.id}: Sanitizando partialAnswers`);
        console.log(`     Antes: ${original.substring(0, 100)}...`);
        console.log(`     Depois: ${final.substring(0, 100)}...`);
        
        await db
          .update(questionnaireStates)
          .set({ partialAnswers: sanitized })
          .where(sql`${questionnaireStates.id} = ${state.id}`);
        statesUpdated++;
      }
    }
    
    console.log(`✅ QuestionnaireStates: ${statesUpdated} registros atualizados\n`);
    
    // 2. Limpar bankroll_managements com valores inválidos
    console.log('💰 Limpando bankrollManagements...');
    
    const bankrolls = await db.select().from(bankrollManagements);
    let bankrollsUpdated = 0;
    
    for (const bankroll of bankrolls) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Sanitizar customWinRate e customRiskReward
      const customMetrics = sanitizeCustomMetrics(
        bankroll.customWinRate,
        bankroll.customRiskReward
      );
      
      if (customMetrics.customWinRate !== bankroll.customWinRate) {
        console.log(`  🔧 Bankroll ${bankroll.id}: customWinRate ${bankroll.customWinRate} → ${customMetrics.customWinRate}`);
        updates.customWinRate = customMetrics.customWinRate;
        needsUpdate = true;
      }
      
      if (customMetrics.customRiskReward !== bankroll.customRiskReward) {
        console.log(`  🔧 Bankroll ${bankroll.id}: customRiskReward ${bankroll.customRiskReward} → ${customMetrics.customRiskReward}`);
        updates.customRiskReward = customMetrics.customRiskReward;
        needsUpdate = true;
      }
      
      // Sanitizar questionnaireAnswers (jsonb)
      if (bankroll.questionnaireAnswers) {
        const original = JSON.stringify(bankroll.questionnaireAnswers);
        const sanitized = sanitizePartialAnswers(bankroll.questionnaireAnswers);
        const final = JSON.stringify(sanitized);
        
        if (original !== final) {
          console.log(`  🔧 Bankroll ${bankroll.id}: Sanitizando questionnaireAnswers`);
          console.log(`     Antes: ${original.substring(0, 100)}...`);
          console.log(`     Depois: ${final.substring(0, 100)}...`);
          updates.questionnaireAnswers = sanitized;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await db
          .update(bankrollManagements)
          .set(updates)
          .where(sql`${bankrollManagements.id} = ${bankroll.id}`);
        bankrollsUpdated++;
      }
    }
    
    console.log(`✅ BankrollManagements: ${bankrollsUpdated} registros atualizados\n`);
    
    console.log('✅ Migração concluída com sucesso!');
    console.log(`\n📊 Resumo:`);
    console.log(`   - ${statesUpdated} questionnaireStates limpos`);
    console.log(`   - ${bankrollsUpdated} bankrollManagements limpos`);
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}

// Executar migração
cleanInvalidQuestionnaireData()
  .then(() => {
    console.log('\n🎉 Migração finalizada!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migração falhou:', error);
    process.exit(1);
  });
