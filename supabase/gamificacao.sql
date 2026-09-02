-- Gamificação - Streak + Conquistas + Social Posts Opção B LGPD
-- Trigger: ao comprovar sessão, verifica streak 5/10 e 30 sessões

create or replace function fn_conquista_streak() returns trigger as $$
declare
  v_streak int;
  v_gym uuid;
  v_count int;
begin
  if NEW.status = 'comprovada' and (OLD.status is distinct from 'comprovada') then
    select gym_id into v_gym from treinos where id = NEW.treino_id;
    -- Conta dias consecutivos com sessão comprovada (últimos 10 dias)
    select count(distinct s.data::date) into v_streak
    from sessoes s
    where s.aluno_id = NEW.aluno_id and s.status='comprovada' and s.data >= (NEW.data - interval '10 days');

    -- Streak 5 dias
    if v_streak >= 5 then
      insert into conquistas (aluno_id, gym_id, tipo, treino_id, descricao)
      values (NEW.aluno_id, v_gym, 'streak_5_dias', NEW.treino_id, '5 dias seguidos 💪')
      on conflict do nothing;
      -- Cria rascunho social_posts para enviar via WhatsApp (LGPD B)
      insert into social_posts (gym_id, aluno_id, conquista_id, plataforma, legenda, status)
      values (v_gym, NEW.aluno_id, (select id from conquistas where aluno_id=NEW.aluno_id and tipo='streak_5_dias' order by created_at desc limit 1),
              'instagram', 'Conquistei 5 dias seguidos na Academia! 💪 #AcademiaApp', 'rascunho')
      on conflict do nothing;
    end if;

    if v_streak >= 10 then
      insert into conquistas (aluno_id, gym_id, tipo, treino_id, descricao)
      values (NEW.aluno_id, v_gym, 'streak_10_dias', NEW.treino_id, '10 dias seguidos 🔥')
      on conflict do nothing;
    end if;

    -- 30 sessões: já tratado em fn_incrementa_sessao, aqui só garante conquista
    select count(*) into v_count from sessoes where treino_id=NEW.treino_id and status='comprovada';
    if v_count >= 30 then
      insert into conquistas (aluno_id, gym_id, tipo, treino_id, descricao)
      values (NEW.aluno_id, v_gym, '30_sessoes_concluidas', NEW.treino_id, 'Treino 30 sessões concluído! 🏆')
      on conflict do nothing;
    end if;
  end if;
  return NEW;
end; $$ language plpgsql;

drop trigger if exists trg_conquista_streak on sessoes;
create trigger trg_conquista_streak after update on sessoes for each row execute function fn_conquista_streak();
