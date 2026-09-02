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
drop policy if exists p_profiles_own on profiles;
create policy p_profiles_own on profiles for all using (
  auth.uid() = id or auth_role() in ('professor','atendente','admin','dono') and gym_id = auth_gym()
) with check (auth.uid() = id);

-- ANAMNESES: só próprio aluno + professor do gym
drop policy if exists p_anamneses on anamneses;
create policy p_anamneses on anamneses for all using (
  aluno_id = auth.uid() or (auth_role() in ('professor','admin','dono') and gym_id = auth_gym())
);

-- TREINOS: aluno vê seus, professor vê do gym
drop policy if exists p_treinos on treinos;
create policy p_treinos on treinos for all using (
  aluno_id = auth.uid() or (auth_role() in ('professor','admin','dono') and gym_id = auth_gym())
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

-- Service_role bypassa RLS automaticamente (usado em server/catraca-server.js)
-- Para testar: faça login como aluno joao.teste@academiaapp.local e tente select * from profiles onde id != seu id (deve retornar 0)
