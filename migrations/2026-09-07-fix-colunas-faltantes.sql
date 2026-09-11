-- Alinha o banco de produção com o schema do código.
-- Idempotente: pode rodar mais de uma vez sem estragar nada.

BEGIN;

-- ============================================================
-- 1) bankroll_managements
--
-- Produção tem uma versão antiga desta tabela, com nomes em português
-- (capital, risco_por_trade, meta_diaria, meta_mensal, max_drawdown) e
-- nenhuma das colunas que o código de hoje escreve. Era por isso que o
-- POST /api/bankroll-management falhava sempre com 500.
--
-- A tabela antiga é renomeada, não apagada: os dados continuam
-- disponíveis em bankroll_managements_legacy caso precise consultá-los.
-- ============================================================

DO $$
BEGIN
  -- Só renomeia se ainda for a tabela antiga (tem 'capital' e não tem 'bankroll_value')
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bankroll_managements' AND column_name = 'capital'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bankroll_managements' AND column_name = 'bankroll_value'
  ) THEN
    -- Garante nome livre para o backup
    EXECUTE 'DROP TABLE IF EXISTS bankroll_managements_legacy';
    EXECUTE 'ALTER TABLE bankroll_managements RENAME TO bankroll_managements_legacy';
    RAISE NOTICE 'Tabela antiga preservada como bankroll_managements_legacy';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS bankroll_managements (
  id                      varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 varchar NOT NULL UNIQUE REFERENCES users(id),
  bankroll_value          numeric(12,2) NOT NULL,

  -- Respostas do questionário
  experience_level        text,
  trading_objective       text,
  trading_markets         text[],
  trading_timeframe       text,
  custom_win_rate         numeric(5,2),
  custom_risk_reward      numeric(5,2),
  psychological_profile   text,
  loss_reaction_profile   text,
  questionnaire_answers   jsonb,

  -- Perfil calculado
  profile                 text NOT NULL,
  time_horizon            text NOT NULL,
  horizon_days            integer NOT NULL,
  risk_per_trade          numeric(5,4) NOT NULL,
  daily_profit_target     numeric(5,4) NOT NULL,

  -- Parâmetros de risco
  risk_per_operation      numeric(5,4) NOT NULL,
  max_daily_risk          numeric(5,4) NOT NULL,
  max_weekly_risk         numeric(5,4) NOT NULL,
  min_risk_reward_ratio   numeric(5,2) NOT NULL,
  drawdown_trigger_losses integer NOT NULL,

  -- Projeções e monitoramento
  projected_growth        jsonb NOT NULL,
  target_balance          numeric(12,2) NOT NULL,
  auto_adjust             boolean DEFAULT true,
  consecutive_wins        integer DEFAULT 0,
  consecutive_losses      integer DEFAULT 0,
  last_adjustment_at      timestamp,
  last_reset_at           timestamp DEFAULT now(),
  created_at              timestamp DEFAULT now(),
  updated_at              timestamp DEFAULT now()
);

-- Se a tabela já existia com o nome novo mas incompleta, completa o que falta.
ALTER TABLE bankroll_managements
  ADD COLUMN IF NOT EXISTS experience_level        text,
  ADD COLUMN IF NOT EXISTS trading_objective       text,
  ADD COLUMN IF NOT EXISTS trading_markets         text[],
  ADD COLUMN IF NOT EXISTS trading_timeframe       text,
  ADD COLUMN IF NOT EXISTS custom_win_rate         numeric(5,2),
  ADD COLUMN IF NOT EXISTS custom_risk_reward      numeric(5,2),
  ADD COLUMN IF NOT EXISTS psychological_profile   text,
  ADD COLUMN IF NOT EXISTS loss_reaction_profile   text,
  ADD COLUMN IF NOT EXISTS questionnaire_answers   jsonb,
  ADD COLUMN IF NOT EXISTS auto_adjust             boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS consecutive_wins        integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_losses      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_adjustment_at      timestamp,
  ADD COLUMN IF NOT EXISTS last_reset_at           timestamp DEFAULT now();

-- ============================================================
-- 2) diary_images
--
-- As imagens passam a ser guardadas no próprio Postgres. O Object Storage
-- anterior dependia do sidecar do Replit, que não existe no Railway, e o
-- disco local é apagado a cada deploy.
-- ============================================================

CREATE TABLE IF NOT EXISTS diary_images (
  id             varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id varchar,
  trade_id       varchar,
  file_name      text NOT NULL,
  original_name  text NOT NULL,
  file_path      text NOT NULL,
  file_data      text,
  file_size      integer NOT NULL,
  mime_type      text NOT NULL,
  caption        text,
  created_at     timestamp DEFAULT now()
);

ALTER TABLE diary_images
  ADD COLUMN IF NOT EXISTS file_data text,
  ADD COLUMN IF NOT EXISTS trade_id  varchar;

COMMIT;

-- Conferência
SELECT 'bankroll_managements' AS tabela, count(*) AS colunas
  FROM information_schema.columns WHERE table_name = 'bankroll_managements'
UNION ALL
SELECT 'diary_images', count(*)
  FROM information_schema.columns WHERE table_name = 'diary_images';
