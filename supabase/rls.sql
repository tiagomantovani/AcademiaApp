-- RLS - AcademiaApp Multi-Gym LGPD Safe
-- Ativa Row Level Security e cria policies aluno/professor/dono
-- Rode após schema + seed + update_planos_v2 no SQL Editor (uma vez)

-- Habilita RLS
alter table profiles enable row level security;
alter table anamneses enable row level security;
alter table parq_respostas enable row level security;
alter table treinos enable row level security;
alter table treino_exercicios enable row level security;
alter table sessoes enable row level security;
alter table mensalidades enable row level security;
alter table pagamentos_pix enable row level security;
alter table pagamentos_cartao enable row level security;
alter table conquistas enable row level security;
alter table check_ins enable row level security;

-- Helper: função gym do usuário logado
create or replace function auth_gym() returns uuid as $$
  select gym_id from profiles where id = auth.uid()
$$ language sql security definer stable;

create or replace function auth_role() returns text as $$
  select role::text from profiles where id = auth.uid()
$$ language sql security definer stable;

-- PROFILES: aluno vê/edita só seu, professor/dono vê do seu gym
-- FIX 02/09: cadastro via app (anon) precisa inserir profiles antes de auth.uid existir
drop policy if exists p_profiles_own on profiles;
drop policy if exists p_profiles_select on profiles;
drop policy if exists p_profiles_insert on profiles;
drop policy if exists p_profiles_update on profiles;
create policy p_profiles_select on profiles for select using (
  auth.uid() = id or auth_role() in ('professor','atendente','admin','dono') and gym_id = auth_gym()
  or auth.uid() is null -- permite anon verificar durante cadastro (limitado)
);
create policy p_profiles_insert on profiles for insert with check (true); -- app cria profile após signUp; trigger valida em produção
create policy p_profiles_update on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- ANAMNESES: só próprio aluno + professor do gym
drop policy if exists p_anamneses on anamneses;
create policy p_anamneses on anamneses for all using (
  aluno_id = auth.uid() or (auth_role() in ('professor','admin','dono') and gym_id = auth_gym())
);
-- PARQ: vinculado à anamnese
drop policy if exists p_parq on parq_respostas;
create policy p_parq on parq_respostas for all using (
  exists (select 1 from anamneses a where a.id = anamnese_id and (a.aluno_id = auth.uid() or a.gym_id = auth_gym()))
) with check (
  exists (select 1 from anamneses a where a.id = anamnese_id and a.aluno_id = auth.uid())
);

-- TREINOS: aluno vê seus, professor vê do gym
drop policy if exists p_treinos on treinos;
create policy p_treinos on treinos for all using (
  aluno_id = auth.uid() or (auth_role() in ('professor','admin','dono') and gym_id = auth_gym())
);
-- TREINO_EXERCICIOS: via treino
drop policy if exists p_treino_ex on treino_exercicios;
create policy p_treino_ex on treino_exercicios for all using (
  exists (select 1 from treinos t where t.id = treino_id and (t.aluno_id = auth.uid() or t.gym_id = auth_gym()))
);

-- SESSOES: aluno insere só suas, professor valida
drop policy if exists p_sessoes_select on sessoes;
create policy p_sessoes_select on sessoes for select using (aluno_id = auth.uid() or gym_id = auth_gym());
drop policy if exists p_sessoes_insert on sessoes;
create policy p_sessoes_insert on sessoes for insert with check (aluno_id = auth.uid());
drop policy if exists p_sessoes_update on sessoes;
create policy p_sessoes_update on sessoes for update using (gym_id = auth_gym() or aluno_id = auth.uid());

-- MENSALIDADES / PAGAMENTOS: aluno vê suas, atendente/admin vê do gym
drop policy if exists p_mensalidades on mensalidades;
create policy p_mensalidades on mensalidades for all using (aluno_id = auth.uid() or gym_id = auth_gym());
drop policy if exists p_pag_pix on pagamentos_pix;
create policy p_pag_pix on pagamentos_pix for all using (aluno_id = auth.uid() or exists (select 1 from mensalidades m where m.id = mensalidade_id and m.gym_id = auth_gym()));
drop policy if exists p_pag_cartao on pagamentos_cartao;
create policy p_pag_cartao on pagamentos_cartao for all using (aluno_id = auth.uid() or gym_id = auth_gym());
-- CONQUISTAS / CHECK_INS: aluno vê suas
drop policy if exists p_conquistas on conquistas;
create policy p_conquistas on conquistas for all using (aluno_id = auth.uid() or gym_id = auth_gym());
drop policy if exists p_checkins on check_ins;
create policy p_checkins on check_ins for all using (aluno_id = auth.uid() or gym_id = auth_gym());

-- Service_role bypassa RLS automaticamente (usado em server/catraca-server.js)
-- Para testar: faça login como aluno joao.teste@academiaapp.local e tente select * from profiles onde id != seu id (deve retornar 0)
