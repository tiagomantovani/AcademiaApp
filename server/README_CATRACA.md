# Catraca Física - Guia Teste Real

## Passo 1: Crie Supabase Grátis (2 min)
1. supabase.com -> New Project
2. SQL Editor -> cole `supabase/schema.sql` + `supabase/seed_exercicios.sql`
3. Settings -> API -> copie URL e service_role key
4. Crie `.env` a partir de `.env.example` e cole as chaves

## Passo 2: Crie aluno teste no Supabase
```sql
-- No SQL Editor do Supabase
insert into profiles (id, gym_id, role, nome, cpf, whatsapp) values
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'aluno', 'João Real', '12345678901', '5511999999999');

insert into mensalidades (aluno_id, gym_id, plano_id, vencimento, valor, status) values
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', (select id from planos limit 1), current_date + 30, 149.90, 'paga');

insert into anamneses (aluno_id, gym_id, objetivo, validade_ate) values
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'hipertrofia', current_date + 90);

insert into treinos (aluno_id, gym_id, status, sessoes_previstas) values
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'ativo', 30);
```

## Passo 3: Rode servidor
```bash
cd D:\AcademiaApp\server
copy .env.example .env  # edite com sua URL
node catraca-server.js
# => http://192.168.3.200:3001
```

## Passo 4: Teste
```bash
curl -X POST http://192.168.3.200:3001/api/catraca/verificar -H "Content-Type: application/json" -d '{"cpf":"12345678901"}'
# => {"liberado":true,"display":"BEM VINDO! JOÃO"}

curl -X POST http://192.168.3.200:3001/api/catraca/verificar -H "Content-Type: application/json" -d '{"cpf":"00000000000"}'
# Mock ainda funciona se Supabase não tiver o CPF
```

## Passo 5: Configure catraca física
No painel da catraca (digite IP dela no navegador):
- URL: `http://192.168.3.200:3001/api/catraca/verificar`
- Método: POST JSON `{"cpf":"{cpf}"}`
- Catracas testadas: Control iD iDFlex, Henry, TopData - todas aceitam esse formato

## Logs
Tudo gravado em `acesso_logs` e `check_ins` no Supabase.
