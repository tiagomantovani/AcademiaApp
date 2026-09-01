-- AcademiaApp - Schema Multi-Gyms LGPD Safe
-- Stack: Supabase Postgres + pgvector (futuro)
-- Ciclo de vida: Descoberta -> Matricula -> Onboarding -> Ativacao -> Engajamento 30 sessoes -> Risco -> Fidelizacao -> Advocacia
-- Prova: QR Code (a) + Validacao Professor (b) | Pix: validacao humana | Social: opcao B LGPD (envia via WhatsApp)

-- Extensoes
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
do $$ begin create type user_role as enum ('aluno','professor','atendente','admin','dono'); exception when duplicate_object then null; end $$;
do $$ begin create type plano_status as enum ('ativo','inativo'); exception when duplicate_object then null; end $$;
do $$ begin create type mensalidade_status as enum ('pendente','paga','atrasada','cancelada'); exception when duplicate_object then null; end $$;
do $$ begin create type pagamento_pix_status as enum ('aguardando_validacao','aprovado','rejeitado'); exception when duplicate_object then null; end $$;
do $$ begin create type treino_status as enum ('rascunho','ativo','concluido','pendente_validacao_personal','arquivado'); exception when duplicate_object then null; end $$;
do $$ begin create type sessao_status as enum ('comprovada','pendente_validacao','rejeitada'); exception when duplicate_object then null; end $$;
do $$ begin create type prova_tipo as enum ('qr_code','validacao_professor','ambos'); exception when duplicate_object then null; end $$;
do $$ begin create type conquista_tipo as enum ('primeiro_treino','streak_5_dias','streak_10_dias','30_sessoes_concluidas','evolucao_carga'); exception when duplicate_object then null; end $$;
do $$ begin create type social_plataforma as enum ('instagram','facebook','tiktok','whatsapp'); exception when duplicate_object then null; end $$;
do $$ begin create type social_post_status as enum ('rascunho','agendado','enviado_whatsapp','postado','erro'); exception when duplicate_object then null; end $$;
do $$ begin create type objetivo_tipo as enum ('emagrecimento','hipertrofia','condicionamento','saude_qualidade_vida','performance','reabilitacao'); exception when duplicate_object then null; end $$;

-- 1. GYMS (multi-unidade)
create table if not exists gyms (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cnpj text unique,
  pix_chave text,
  whatsapp_oficial text,
  instagram_handle text,
  created_at timestamptz default now()
);

-- 2. PROFILES (extende auth.users do Supabase)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  gym_id uuid references gyms(id) on delete set null,
  role user_role not null default 'aluno',
  nome text not null,
  cpf text unique,
  whatsapp text,
  data_nascimento date,
  sexo text check (sexo in ('M','F','outro')),
  -- Vinculo social aluno (OAuth) - permite marcar mas com consentimento
  permite_marcar_social boolean default false,
  lgpd_consentimento boolean default false,
  lgpd_consentimento_data timestamptz,
  created_at timestamptz default now()
);

-- 2b. Conexoes sociais do aluno (OAuth)
create table if not exists aluno_social_connections (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  plataforma social_plataforma not null,
  handle text,
  external_user_id text,
  access_token_encrypted text, -- criptografar na aplicacao
  permite_marcar boolean default false,
  created_at timestamptz default now(),
  unique(aluno_id, plataforma)
);

-- Conexoes sociais da ACADEMIA (para postar)
create table if not exists social_accounts (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid not null references gyms(id) on delete cascade,
  plataforma social_plataforma not null,
  page_id text,
  access_token_encrypted text,
  created_at timestamptz default now(),
  unique(gym_id, plataforma)
);

-- 3. ANAMNESE (LGPD sensivel)
create table if not exists anamneses (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid not null references gyms(id) on delete cascade,
  objetivo objetivo_tipo not null,
  objetivo_detalhe text,
  -- Historico saude JSONB para flexibilidade + colunas indexaveis
  doencas_cronicas jsonb default '[]', -- ["hipertensao","diabetes_tipo2"]
  medicamentos jsonb default '[]',
  cirurgias_lesoes text,
  dores_atuais text,
  alergias text,
  restricoes_medicas text,
  nivel_atividade text check (nivel_atividade in ('sedentario','leve','moderado','intenso')),
  horas_sono int,
  fumante boolean default false,
  objetivo_texto text,
  disponibilidade_dias int, -- ex: 5 dias/semana
  observacoes text,
  assinatura_digital text, -- hash
  validade_ate date, -- +3 a 6 meses
  created_at timestamptz default now()
);
create index if not exists idx_anamneses_aluno on anamneses(aluno_id);

-- 4. PAR-Q (7 perguntas)
create table if not exists parq_respostas (
  id uuid primary key default uuid_generate_v4(),
  anamnese_id uuid not null references anamneses(id) on delete cascade unique,
  q1_dor_peito boolean not null default false,
  q2_tontura boolean not null default false,
  q3_dor_articular boolean not null default false,
  q4_medicamento_pressao boolean not null default false,
  q5_falta_ar boolean not null default false,
  q6_diabetes boolean not null default false,
  q7_outro_motivo boolean not null default false,
  precisa_atestado boolean generated always as (q1_dor_peito or q2_tontura or q3_dor_articular or q4_medicamento_pressao or q5_falta_ar or q6_diabetes or q7_outro_motivo) stored,
  created_at timestamptz default now()
);

-- 5. AVALIACAO FISICA
create table if not exists avaliacoes_fisicas (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  anamnese_id uuid references anamneses(id) on delete set null,
  peso numeric(5,2),
  altura numeric(4,2),
  imc numeric(4,2) generated always as (case when altura > 0 then peso / ((altura/100)*(altura/100)) else null end) stored,
  percentual_gordura numeric(4,2),
  massa_magra numeric(5,2),
  circunferencia_cintura numeric(5,2),
  created_at timestamptz default now()
);

-- 6. PLANOS e MENSALIDADES
create table if not exists planos (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid not null references gyms(id) on delete cascade,
  nome text not null, -- "Mensal 30 sessoes", "Anual"
  valor numeric(10,2) not null,
  duracao_dias int not null default 30,
  sessoes_inclusas int default 30,
  status plano_status default 'ativo',
  created_at timestamptz default now()
);

create table if not exists mensalidades (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid not null references gyms(id) on delete cascade,
  plano_id uuid references planos(id) on delete set null,
  vencimento date not null,
  valor numeric(10,2) not null,
  status mensalidade_status not null default 'pendente',
  created_at timestamptz default now()
);
create index if not exists idx_mensalidades_aluno_venc on mensalidades(aluno_id, vencimento);

-- 7. PAGAMENTOS PIX (validacao humana)
create table if not exists pagamentos_pix (
  id uuid primary key default uuid_generate_v4(),
  mensalidade_id uuid not null references mensalidades(id) on delete cascade,
  aluno_id uuid not null references profiles(id) on delete cascade,
  comprovante_url text, -- storage bucket
  pix_txid text,
  valor_informado numeric(10,2),
  whatsapp_message_id text, -- Evolution API id
  status pagamento_pix_status not null default 'aguardando_validacao',
  validado_por uuid references profiles(id) on delete set null,
  validado_em timestamptz,
  observacao_atendente text,
  created_at timestamptz default now()
);

-- 8. EXERCICIOS (base cientifica ACSM 2025)
create table if not exists exercicios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null unique,
  grupo_muscular text not null, -- "peito","costas","pernas","core","cardio"
  equipamento text,
  video_url text,
  nivel text check (nivel in ('iniciante','intermediario','avancado')) default 'iniciante',
  -- Periodizacao
  mesociclo_recomendado text, -- "incorporacao","base","peak","deload"
  pct_1rm_recomendado int, -- 60,75,80
  contraindicacoes jsonb default '{}', -- ver seed
  substituicoes jsonb default '{}', -- {"hernia_disco": "leg_press_45"}
  created_at timestamptz default now()
);

-- 9. TREINOS (ficha com 30 sessoes)
create table if not exists treinos (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid not null references gyms(id) on delete cascade,
  anamnese_id uuid references anamneses(id) on delete set null,
  criado_por uuid references profiles(id) on delete set null, -- professor ou IA (null = IA)
  objetivo objetivo_tipo,
  status treino_status not null default 'ativo',
  sessoes_previstas int not null default 30,
  sessoes_realizadas int not null default 0 check (sessoes_realizadas >= 0),
  mesociclo_atual text default 'incorporacao',
  data_inicio date default current_date,
  data_validade date,
  observacoes text,
  aprovado_por uuid references profiles(id) on delete set null,
  aprovado_em timestamptz,
  created_at timestamptz default now(),
  constraint sessoes_check check (sessoes_realizadas <= sessoes_previstas)
);
create index if not exists idx_treinos_aluno_status on treinos(aluno_id, status);

create table if not exists treino_exercicios (
  id uuid primary key default uuid_generate_v4(),
  treino_id uuid not null references treinos(id) on delete cascade,
  exercicio_id uuid not null references exercicios(id) on delete restrict,
  ordem int not null,
  series int not null,
  repeticoes text not null, -- "8-12" ou "12-20"
  carga text, -- "60% 1RM" ou "leve"
  intervalo_segundos int default 90,
  observacao text,
  unique(treino_id, exercicio_id, ordem)
);

-- 10. SESSOES (prova a+b)
create table if not exists sessoes (
  id uuid primary key default uuid_generate_v4(),
  treino_id uuid not null references treinos(id) on delete cascade,
  aluno_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid not null references gyms(id) on delete cascade,
  data timestamptz not null default now(),
  prova_tipo prova_tipo not null default 'ambos',
  qr_code_id text,
  validado_por uuid references profiles(id) on delete set null, -- professor
  status sessao_status not null default 'pendente_validacao',
  observacao text,
  created_at timestamptz default now()
);
create index if not exists idx_sessoes_treino on sessoes(treino_id);
create index if not exists idx_sessoes_aluno_data on sessoes(aluno_id, data);

-- Trigger: incrementa sessoes_realizadas e verifica troca automatica
create or replace function fn_incrementa_sessao() returns trigger as $$
begin
  if NEW.status = 'comprovada' and (OLD.status is distinct from 'comprovada') then
    update treinos set sessoes_realizadas = sessoes_realizadas + 1 where id = NEW.treino_id;
    -- Se bateu 30, marca concluido e cria conquista (trigger secundario cuida do novo treino)
    update treinos set status = 'concluido' where id = NEW.treino_id and sessoes_realizadas + 1 >= sessoes_previstas;
  end if;
  return NEW;
end; $$ language plpgsql;

drop trigger if exists trg_sessao_comprovada on sessoes;
create trigger trg_sessao_comprovada after update on sessoes for each row execute function fn_incrementa_sessao();

-- 11. CONQUISTAS / STREAK
create table if not exists conquistas (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid not null references gyms(id) on delete cascade,
  tipo conquista_tipo not null,
  treino_id uuid references treinos(id) on delete set null,
  descricao text,
  created_at timestamptz default now()
);

-- 12. SOCIAL POSTS (opcao B LGPD: enviado via WhatsApp para aluno postar)
create table if not exists social_posts (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid not null references gyms(id) on delete cascade,
  aluno_id uuid references profiles(id) on delete set null, -- null = post geral diario
  conquista_id uuid references conquistas(id) on delete set null,
  plataforma social_plataforma not null default 'instagram',
  legenda text not null,
  imagem_url text, -- gerada por Higgsfield
  status social_post_status not null default 'rascunho',
  agendado_para timestamptz,
  enviado_whatsapp_em timestamptz,
  whatsapp_message_id text,
  created_at timestamptz default now()
);

-- 13. CHECK-INS (catraca/entrada)
create table if not exists check_ins (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid not null references gyms(id) on delete cascade,
  data timestamptz default now(),
  origem text default 'app_qr' -- "catraca","app_qr","manual"
);

-- 14. CATRACAS FISICAS
create table if not exists catracas (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid not null references gyms(id) on delete cascade,
  nome text not null, -- "Catraca Principal"
  modelo text, -- "Control iD iDFlex", "Henry", "TopData"
  ip text,
  mac text,
  status text default 'ativa' check (status in ('ativa','inativa','manutencao')),
  created_at timestamptz default now()
);

-- 15. ACESSO LOGS (auditoria da catraca)
create table if not exists acesso_logs (
  id uuid primary key default uuid_generate_v4(),
  aluno_id uuid references profiles(id) on delete set null,
  gym_id uuid not null references gyms(id) on delete cascade,
  catraca_id uuid references catracas(id) on delete set null,
  data timestamptz default now(),
  liberado boolean not null,
  motivo_bloqueio text, -- "Mensalidade atrasada", "Anamnese vencida", "Sem treino ativo"
  origem text default 'catraca' check (origem in ('catraca','qr','biometria','facial','manual')),
  cpf_digitado text,
  created_at timestamptz default now()
);
create index if not exists idx_acesso_logs_aluno on acesso_logs(aluno_id, data);
create index if not exists idx_acesso_logs_gym on acesso_logs(gym_id, data);

-- RLS (Row Level Security) - ativar para producao
-- alter table profiles enable row level security;
-- Exemplo: aluno so ve seu gym
