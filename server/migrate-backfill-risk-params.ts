/**
 * SCRIPT DE BACKFILL PARA PARÂMETROS DE GESTÃO DE RISCO
 * 
 * Executa o backfill dos 5 novos campos para todos os registros existentes em bankroll_managements:
 * - risk_per_operation
 * - max_daily_risk
 * - max_weekly_risk
 * - min_risk_reward_ratio
 * - drawdown_trigger_losses
 * 
 * USO: npm run tsx server/migrate-backfill-risk-params.ts
 */

import { db } from './db';
import { bankrollManagements } from '../shared/schema';
import { calculateRiskManagementParameters, type QuestionnaireAnswers } from './risk-profile-calculator';
import { eq } from 'drizzle-orm';

async function backfillRiskParameters() {
  console.log('🔄 Iniciando backfill de parâmetros de gestão de risco...\n');

  try {
    // Buscar todos os registros existentes
    const allBankrolls = await db.select().from(bankrollManagements);
    
    console.log(`📊 Total de registros encontrados: ${allBankrolls.length}\n`);

    if (allBankrolls.length === 0) {
      console.log('✅ Nenhum registro para atualizar.');
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const bankroll of allBankrolls) {
      try {
        // Verificar se já tem os parâmetros preenchidos
        if (bankroll.riskPerOperation && bankroll.maxDailyRisk && bankroll.maxWeeklyRisk) {
          console.log(`⏭️  Pulando ${bankroll.id} (já possui parâmetros)`);
          skipCount++;
          continue;
        }

        // Reconstruir respostas do questionário a partir dos dados salvos
        const answers: QuestionnaireAnswers = {
          q1: (bankroll.experienceLevel || 'B') as 'A' | 'B' | 'C',
          q2: (bankroll.tradingObjective || 'B') as 'A' | 'B' | 'C',
          q3: bankroll.tradingMarkets || ['A'],
          q4: (bankroll.tradingTimeframe || 'B') as 'A' | 'B' | 'C',
          q5_winRate: bankroll.customWinRate ? parseFloat(bankroll.customWinRate) : undefined,
          q5_riskReward: bankroll.customRiskReward ? parseFloat(bankroll.customRiskReward) : undefined,
          q6: (bankroll.psychologicalProfile || 'B') as 'A' | 'B' | 'C',
          q7: (bankroll.lossReactionProfile || 'B') as 'A' | 'B' | 'C',
        };

        // Calcular parâmetros de gestão de risco
        const riskParams = calculateRiskManagementParameters(answers);

        // Atualizar registro no banco
        await db
          .update(bankrollManagements)
          .set({
            riskPerOperation: riskParams.risk_per_operation.toString(),
            maxDailyRisk: riskParams.max_daily_risk.toString(),
            maxWeeklyRisk: riskParams.max_weekly_risk.toString(),
            minRiskRewardRatio: riskParams.min_risk_reward_ratio.toString(),
            drawdownTriggerLosses: riskParams.drawdown_trigger_losses,
          })
          .where(eq(bankrollManagements.id, bankroll.id));

        console.log(`✅ Atualizado ${bankroll.id} (Perfil: ${bankroll.profile})`);
        console.log(`   - Risco/Op: ${(riskParams.risk_per_operation * 100).toFixed(2)}%`);
        console.log(`   - Max Diário: ${(riskParams.max_daily_risk * 100).toFixed(2)}%`);
        console.log(`   - Max Semanal: ${(riskParams.max_weekly_risk * 100).toFixed(2)}%`);
        console.log(`   - R:R Mínimo: 1:${riskParams.min_risk_reward_ratio.toFixed(1)}`);
        console.log(`   - Gatilho: ${riskParams.drawdown_trigger_losses} perdas\n`);
        
        successCount++;
      } catch (recordError) {
        console.error(`❌ Erro ao processar ${bankroll.id}:`, recordError);
        errorCount++;
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO DO BACKFILL:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ⏭️  Pulados: ${skipCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📈 Total: ${allBankrolls.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (errorCount === 0) {
      console.log('✅ Backfill concluído com sucesso!\n');
    } else {
      console.log('⚠️ Backfill concluído com alguns erros. Revise os logs acima.\n');
    }

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO no backfill:', error);
    process.exit(1);
  }
}

// Executar backfill
backfillRiskParameters()
  .then(() => {
    console.log('👋 Processo finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha fatal:', error);
    process.exit(1);
  });
