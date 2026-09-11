-- A tabela diary_images em produção também está numa versão antiga: faltam
-- file_name, original_name, file_path, file_size, mime_type e caption, o que
-- fazia GET /api/images/:id responder 500 com 'column "file_name" does not
-- exist' — ou seja, nenhuma imagem carregava, mesmo as já enviadas.
--
-- Todas as colunas entram como nullable: a tabela pode ter linhas antigas, e
-- o código preenche esses campos em todo insert.
--
-- Idempotente.

ALTER TABLE diary_images
  ADD COLUMN IF NOT EXISTS diary_entry_id varchar,
  ADD COLUMN IF NOT EXISTS trade_id       varchar,
  ADD COLUMN IF NOT EXISTS file_name      text,
  ADD COLUMN IF NOT EXISTS original_name  text,
  ADD COLUMN IF NOT EXISTS file_path      text,
  ADD COLUMN IF NOT EXISTS file_data      text,
  ADD COLUMN IF NOT EXISTS file_size      integer,
  ADD COLUMN IF NOT EXISTS mime_type      text,
  ADD COLUMN IF NOT EXISTS caption        text,
  ADD COLUMN IF NOT EXISTS created_at     timestamp DEFAULT now();

-- Conferência: lista as colunas resultantes
SELECT column_name, data_type
  FROM information_schema.columns
 WHERE table_name = 'diary_images'
 ORDER BY ordinal_position;
