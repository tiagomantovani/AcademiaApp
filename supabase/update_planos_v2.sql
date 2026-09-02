-- Update Planos v2 - corrige pricing progressivo e deixa estrutura pronta para migracao
-- Mensal 30/30d 149.90 (R$4,99/sess) | Trimestral 90/90d 379.90 (R$4,22/sess 15% off) | Anual 360/365d 1299.90 (R$3,61/sess 27% off)

-- Corrige planos existentes (idempotente por nome)
update planos set valor=149.90, duracao_dias=30, sessoes_inclusas=30, status='ativo' where nome='Mensal 30 Sessões - Estética';
update planos set valor=379.90, duracao_dias=90, sessoes_inclusas=90, status='ativo' where nome='Trimestral Periodizado - Saúde';
update planos set valor=1299.90, duracao_dias=365, sessoes_inclusas=360, status='ativo' where nome='Anual Completo - Performance';

-- Garante caso não existam (insert fallback)
insert into planos (gym_id, nome, valor, duracao_dias, sessoes_inclusas, status)
select (select id from gyms limit 1), 'Mensal 30 Sessões - Estética', 149.90, 30, 30, 'ativo' where not exists (select 1 from planos where nome='Mensal 30 Sessões - Estética');
insert into planos (gym_id, nome, valor, duracao_dias, sessoes_inclusas, status)
select (select id from gyms limit 1), 'Trimestral Periodizado - Saúde', 379.90, 90, 90, 'ativo' where not exists (select 1 from planos where nome='Trimestral Periodizado - Saúde');
insert into planos (gym_id, nome, valor, duracao_dias, sessoes_inclusas, status)
select (select id from gyms limit 1), 'Anual Completo - Performance', 1299.90, 365, 360, 'ativo' where not exists (select 1 from planos where nome='Anual Completo - Performance');

-- Estrutura pronta para migracao futura (regras configuráveis por gym)
create table if not exists plano_migracao_regras (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid not null references gyms(id) on delete cascade,
  plano_origem_id uuid not null references planos(id) on delete cascade,
  plano_destino_id uuid not null references planos(id) on delete cascade,
  permite_migracao boolean default true,
  -- Regras de valores
  tipo_calculo text not null default 'prorata_dias_restantes' check (tipo_calculo in ('prorata_dias_restantes','diferenca_cheia','credito_sessoes')),
  desconto_migracao_percent numeric(5,2) default 0, -- ex: 10% off na migração mensal->anual
  -- Janela permitida
  janela_min_dias int default 0, -- só pode migrar após X dias do início
  janela_max_dias int, -- até X dias antes do vencimento
  observacoes text,
  created_at timestamptz default now(),
  unique(gym_id, plano_origem_id, plano_destino_id)
);

-- Regras padrão iniciais (exemplo: mensal->trimestral, mensal->anual, trimestral->anual)
insert into plano_migracao_regras (gym_id, plano_origem_id, plano_destino_id, tipo_calculo, desconto_migracao_percent)
select g.id, po.id, pd.id, 'prorata_dias_restantes', 10
from gyms g, planos po, planos pd
where g.id=(select id from gyms limit 1)
  and po.nome='Mensal 30 Sessões - Estética' and pd.nome='Trimestral Periodizado - Saúde'
on conflict do nothing;

insert into plano_migracao_regras (gym_id, plano_origem_id, plano_destino_id, tipo_calculo, desconto_migracao_percent)
select g.id, po.id, pd.id, 'prorata_dias_restantes', 15
from gyms g, planos po, planos pd
where g.id=(select id from gyms limit 1)
  and po.nome='Mensal 30 Sessões - Estética' and pd.nome='Anual Completo - Performance'
on conflict do nothing;

insert into plano_migracao_regras (gym_id, plano_origem_id, plano_destino_id, tipo_calculo, desconto_migracao_percent)
select g.id, po.id, pd.id, 'prorata_dias_restantes', 10
from gyms g, planos po, planos pd
where g.id=(select id from gyms limit 1)
  and po.nome='Trimestral Periodizado - Saúde' and pd.nome='Anual Completo - Performance'
on conflict do nothing;

-- View auxiliar para app: calcula diferença pró-rata (exemplo)
create or replace view vw_migracao_simulacao as
select
  r.id as regra_id,
  g.nome as gym,
  po.nome as origem,
  pd.nome as destino,
  po.valor as valor_origem,
  pd.valor as valor_destino,
  r.desconto_migracao_percent,
  round((pd.valor - po.valor) * (1 - r.desconto_migracao_percent/100),2) as valor_migracao_cheia,
  r.tipo_calculo
from plano_migracao_regras r
join gyms g on g.id=r.gym_id
join planos po on po.id=r.plano_origem_id
join planos pd on pd.id=r.plano_destino_id;
