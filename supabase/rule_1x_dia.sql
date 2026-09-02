-- Regra 1x/dia treino, catraca ilimitada
-- 1 comprovada por aluno por dia (protege DB, app já valida)
create unique index if not exists idx_sessoes_1_por_dia on sessoes (aluno_id, (data::date)) where status='comprovada';
-- check_ins sem restricao: catraca pode passar varias vezes ao dia
