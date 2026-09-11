-- Colunas presentes no schema do código mas ausentes no banco de produção.
-- Idempotente: pode rodar quantas vezes precisar.

-- 1) Gestão de risco (questionário) — a ausência destas colunas fazia o
--    POST /api/bankroll-management falhar sempre com 500.
ALTER TABLE bankroll_managements
  ADD COLUMN IF NOT EXISTS risk_per_operation    numeric(5,4),
  ADD COLUMN IF NOT EXISTS max_daily_risk        numeric(5,4),
  ADD COLUMN IF NOT EXISTS max_weekly_risk       numeric(5,4),
  ADD COLUMN IF NOT EXISTS min_risk_reward_ratio numeric(5,2),
  ADD COLUMN IF NOT EXISTS drawdown_trigger_losses integer,
  ADD COLUMN IF NOT EXISTS experience_level      text,
  ADD COLUMN IF NOT EXISTS trading_objective     text,
  ADD COLUMN IF NOT EXISTS trading_markets       text[],
  ADD COLUMN IF NOT EXISTS trading_timeframe     text,
  ADD COLUMN IF NOT EXISTS custom_win_rate       numeric(5,2),
  ADD COLUMN IF NOT EXISTS custom_risk_reward    numeric(5,2),
  ADD COLUMN IF NOT EXISTS psychological_profile text,
  ADD COLUMN IF NOT EXISTS loss_reaction_profile text,
  ADD COLUMN IF NOT EXISTS questionnaire_answers jsonb,
  ADD COLUMN IF NOT EXISTS auto_adjust           boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS consecutive_wins      integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_losses    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_adjustment_at    timestamp;

-- Preenche linhas antigas antes de aplicar NOT NULL.
UPDATE bankroll_managements SET
  risk_per_operation      = COALESCE(risk_per_operation, risk_per_trade, 0.01),
  max_daily_risk          = COALESCE(max_daily_risk, 0.03),
  max_weekly_risk         = COALESCE(max_weekly_risk, 0.06),
  min_risk_reward_ratio   = COALESCE(min_risk_reward_ratio, 2.0),
  drawdown_trigger_losses = COALESCE(drawdown_trigger_losses, 4)
WHERE risk_per_operation IS NULL
   OR max_daily_risk IS NULL
   OR max_weekly_risk IS NULL
   OR min_risk_reward_ratio IS NULL
   OR drawdown_trigger_losses IS NULL;

ALTER TABLE bankroll_managements
  ALTER COLUMN risk_per_operation      SET NOT NULL,
  ALTER COLUMN max_daily_risk          SET NOT NULL,
  ALTER COLUMN max_weekly_risk         SET NOT NULL,
  ALTER COLUMN min_risk_reward_ratio   SET NOT NULL,
  ALTER COLUMN drawdown_trigger_losses SET NOT NULL;

-- 2) Imagens agora ficam no próprio Postgres (base64). O Object Storage
--    anterior dependia do sidecar do Replit, inexistente no Railway, e o
--    disco local é apagado a cada deploy.
ALTER TABLE diary_images
  ADD COLUMN IF NOT EXISTS file_data text;
