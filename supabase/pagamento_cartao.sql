-- Pagamento por Cartão - estrutura pronta (mock gateway, futuro Stripe/MercadoPago)
do $$ begin create type pagamento_cartao_status as enum ('pendente','aprovado','rejeitado','estornado'); exception when duplicate_object then null; end $$;
do $$ begin create type cartao_bandeira as enum ('visa','mastercard','elo','amex','hipercard','outra'); exception when duplicate_object then null; end $$;

create table if not exists pagamentos_cartao (
  id uuid primary key default uuid_generate_v4(),
  mensalidade_id uuid not null references mensalidades(id) on delete cascade,
  aluno_id uuid not null references profiles(id) on delete cascade,
  gym_id uuid not null references gyms(id) on delete cascade,
  -- Gateway mock
  valor numeric(10,2) not null,
  status pagamento_cartao_status not null default 'pendente',
  -- Cartão (LGPD: nunca salvar número completo/CVV, só últimos 4 e token)
  cartao_ultimos4 text check (cartao_ultimos4 ~ '^[0-9]{4}$'),
  cartao_bandeira cartao_bandeira,
  cartao_token text, -- token do gateway (Stripe tok_..., MP token)
  parcelas int not null default 1 check (parcelas between 1 and 12),
  -- Resposta gateway
  gateway text default 'mock' check (gateway in ('mock','stripe','mercadopago','pagseguro')),
  gateway_payment_id text,
  gateway_mensagem text,
  -- Auditoria
  created_at timestamptz default now(),
  aprovado_em timestamptz,
  aprovado_por uuid references profiles(id) on delete set null
);
create index if not exists idx_pag_cartao_aluno on pagamentos_cartao(aluno_id, created_at);
create index if not exists idx_pag_cartao_mensalidade on pagamentos_cartao(mensalidade_id);

-- View unificada pagamentos (pix + cartão) para dashboard atendente
-- pagamentos_pix não tem gym_id (usa mensalidades.gym_id), por isso JOIN
create or replace view vw_pagamentos as
select p.id, p.aluno_id, p.mensalidade_id, m.gym_id, p.valor_informado as valor, p.status::text, 'pix' as metodo, p.created_at
from pagamentos_pix p left join mensalidades m on m.id = p.mensalidade_id
union all
select id, aluno_id, mensalidade_id, gym_id, valor, status::text, 'cartao' as metodo, created_at from pagamentos_cartao;
