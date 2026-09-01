-- Seed 80 Exercicios - Base Cientifica ACSM 2025 + Diretriz Brasileira Obesidade 2025
-- Periodizacao: Incorporacao (60% 1RM, 12 reps) -> Base (80% 1RM, 6-8 reps) -> Peak (75-85% 1RM, 6-12 reps, ondulatorio) -> Deload
-- Contraindicacoes validadas: hipertensao nao controlada, diabetes, hernia disco, lesao joelho, cardiopatia

insert into exercicios (nome, grupo_muscular, equipamento, nivel, mesociclo_recomendado, pct_1rm_recomendado, contraindicacoes, substituicoes) values
-- PEITO (10)
('Supino Reto Barra', 'peito', 'barra', 'iniciante', 'incorporacao', 60, '{"hipertensao_nao_controlada": "evitar_carga_maxima_valsalva", "lesao_ombro": "vetar"}', '{"lesao_ombro": "Supino Maquina"}'),
('Supino Inclinado Halteres', 'peito', 'halteres', 'intermediario', 'base', 75, '{"hipertensao": "controlar_respiracao"}', '{}'),
('Supino Maquina', 'peito', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Crucifixo Maquina', 'peito', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Flexao de Braco', 'peito', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{"lesao_punho": "vetar"}', '{"lesao_punho": "Crucifixo Maquina"}'),
('Crossover Polia Alta', 'peito', 'cabo', 'intermediario', 'peak', 75, '{}', '{}'),
('Supino Declinado', 'peito', 'barra', 'avancado', 'peak', 80, '{"hipertensao": "evitar_declinado_longo"}', '{}'),
('Pullover Halter', 'peito', 'halteres', 'intermediario', 'base', 70, '{}', '{}'),
('Peck Deck', 'peito', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Supino Fechado', 'peito', 'barra', 'intermediario', 'base', 75, '{}', '{}'),

-- COSTAS (10)
('Puxada Frontal Aberta', 'costas', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Remada Baixa Triangulo', 'costas', 'maquina', 'iniciante', 'incorporacao', 60, '{"hernia_disco": "usar_apoio_peito"}', '{"hernia_disco": "Remada Maquina com Apoio"}'),
('Remada Curvada Barra', 'costas', 'barra', 'avancado', 'base', 80, '{"hernia_disco": "vetar", "lombalgia": "vetar"}', '{"hernia_disco": "Remada Baixa Triangulo"}'),
('Remada Maquina com Apoio', 'costas', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Barra Fixa Assistida', 'costas', 'maquina', 'intermediario', 'base', 70, '{}', '{"iniciante": "Puxada Frontal Aberta"}'),
('Pulldown Corda', 'costas', 'cabo', 'intermediario', 'peak', 75, '{}', '{}'),
('Remada Unilateral Halter', 'costas', 'halteres', 'intermediario', 'base', 70, '{"hernia_disco": "apoiar_joelho"}', '{}'),
('Crucifixo Inverso Maquina', 'costas', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Levantamento Terra Tecnico Leve', 'costas', 'barra', 'avancado', 'peak', 75, '{"hernia_disco": "vetar", "hipertensao": "evitar_valsalva"}', '{"hernia_disco": "Remada Baixa Triangulo"}'),
('Remada Alta Polia', 'costas', 'cabo', 'intermediario', 'base', 70, '{"lesao_ombro": "vetar"}', '{}'),

-- PERNAS (15)
('Agachamento Livre Barra', 'pernas', 'barra', 'avancado', 'base', 80, '{"hernia_disco": "vetar", "lesao_joelho_aguda": "vetar", "hipertensao": "evitar_falha"}', '{"hernia_disco": "Leg Press 45 Leve", "lesao_joelho": "Cadeira Extensora Leve"}'),
('Leg Press 45 Leve', 'pernas', 'maquina', 'iniciante', 'incorporacao', 60, '{"hipertensao": "evitar_90_graus_prolongado"}', '{}'),
('Cadeira Extensora Leve', 'pernas', 'maquina', 'iniciante', 'incorporacao', 60, '{"lesao_joelho": "reduzir_amplitude"}', '{}'),
('Cadeira Flexora', 'pernas', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Stiff Halteres Leve', 'pernas', 'halteres', 'intermediario', 'base', 70, '{"hernia_disco": "vetar", "lombalgia": "vetar"}', '{"hernia_disco": "Cadeira Flexora"}'),
('Agachamento Búlgaro', 'pernas', 'halteres', 'intermediario', 'peak', 75, '{"lesao_joelho": "vetar"}', '{}'),
('Afundo com Halteres', 'pernas', 'halteres', 'intermediario', 'base', 70, '{}', '{}'),
('Panturrilha em Pe', 'pernas', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Abdutora Maquina', 'pernas', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Adutora Maquina', 'pernas', 'maquina', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Gluteo Polia', 'pernas', 'cabo', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Elevacao Pelvica (Hip Thrust)', 'pernas', 'barra', 'intermediario', 'base', 75, '{}', '{}'),
('Cadeira Extensora Pesada', 'pernas', 'maquina', 'avancado', 'peak', 80, '{"lesao_joelho": "vetar"}', '{}'),
('Leg Press 45 Pesado', 'pernas', 'maquina', 'avancado', 'peak', 80, '{"hipertensao_nao_controlada": "vetar"}', '{"hipertensao": "Leg Press 45 Leve"}'),
('Agachamento Sumô', 'pernas', 'halteres', 'intermediario', 'base', 70, '{}', '{}'),

-- OMBRO (8)
('Desenvolvimento Halteres', 'ombro', 'halteres', 'intermediario', 'base', 70, '{"lesao_ombro": "vetar", "hipertensao": "evitar_acima_cabeca_pesado"}', '{"lesao_ombro": "Elevacao Lateral Leve"}'),
('Elevacao Lateral Leve', 'ombro', 'halteres', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Elevacao Frontal', 'ombro', 'halteres', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Desenvolvimento Maquina', 'ombro', 'maquina', 'iniciante', 'incorporacao', 60, '{"hipertensao": "controlar_respiracao"}', '{}'),
('Remada Alta Barra', 'ombro', 'barra', 'intermediario', 'base', 70, '{"lesao_ombro": "vetar"}', '{}'),
('Face Pull', 'ombro', 'cabo', 'intermediario', 'base', 70, '{}', '{}'),
('Elevacao Lateral Polia', 'ombro', 'cabo', 'intermediario', 'peak', 75, '{}', '{}'),
('Encolhimento Trapézio', 'ombro', 'halteres', 'iniciante', 'incorporacao', 60, '{}', '{}'),

-- BRAÇOS (8)
('Rosca Direta Barra', 'bracos', 'barra', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Rosca Alternada Halteres', 'bracos', 'halteres', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Rosca Martelo', 'bracos', 'halteres', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Triceps Pulley', 'bracos', 'cabo', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Triceps Frances', 'bracos', 'halteres', 'intermediario', 'base', 70, '{"lesao_cotovelo": "vetar"}', '{}'),
('Rosca Scott', 'bracos', 'maquina', 'intermediario', 'base', 70, '{}', '{}'),
('Triceps Coice', 'bracos', 'halteres', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Rosca Concentrada', 'bracos', 'halteres', 'intermediario', 'peak', 75, '{}', '{}'),

-- CORE (6)
('Prancha Abdominal', 'core', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{"hipertensao": "evitar_isometria_longa"}', '{}'),
('Abdominal Supra', 'core', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Abdominal Infra', 'core', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{"hernia_disco": "vetar"}', '{"hernia_disco": "Prancha Abdominal"}'),
('Russian Twist Leve', 'core', 'halteres', 'intermediario', 'base', 70, '{"hernia_disco": "vetar"}', '{}'),
('Ab Wheel', 'core', 'roda', 'avancado', 'peak', 80, '{"hernia_disco": "vetar", "lombalgia": "vetar"}', '{}'),
('Pallof Press', 'core', 'cabo', 'intermediario', 'base', 70, '{}', '{}'),

-- CARDIO / FUNCIONAL (13) - Recomendado ACSM para hipertenso/diabetico
('Caminhada Esteira', 'cardio', 'esteira', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Bicicleta Ergométrica', 'cardio', 'bike', 'iniciante', 'incorporacao', 60, '{"lesao_joelho": "ajustar_altura"}', '{}'),
('Eliptico', 'cardio', 'eliptico', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Remo Ergométrico', 'cardio', 'remo', 'intermediario', 'base', 70, '{"hernia_disco": "vetar"}', '{"hernia_disco": "Bicicleta Ergométrica"}'),
('Circuito Funcional Leve 12-20 reps', 'cardio', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{"diabetes_tipo2": "recomendado", "hipertensao": "recomendado"}', '{}'),
('HIIT Bike 30s/60s', 'cardio', 'bike', 'avancado', 'peak', 80, '{"hipertensao_nao_controlada": "vetar", "cardiopatia": "vetar"}', '{"hipertensao": "Caminhada Esteira"}'),
('Natação', 'cardio', 'piscina', 'intermediario', 'base', 70, '{"diabetes_pe_diabetico": "cuidado_com_pes"}', '{}'),
('Pedalar Leve', 'cardio', 'bike', 'iniciante', 'incorporacao', 60, '{}', '{}'),
('Corrida Leve', 'cardio', 'esteira', 'intermediario', 'base', 70, '{"lesao_joelho": "vetar", "obesidade_grau2": "preferir_eliptico"}', '{"lesao_joelho": "Eliptico"}'),
('Escada', 'cardio', 'maquina', 'intermediario', 'base', 70, '{}', '{}'),
('Burpee Adaptado', 'cardio', 'peso_corporal', 'intermediario', 'peak', 75, '{"hipertensao": "vetar", "lesao_joelho": "vetar"}', '{}'),
('Kettlebell Swing Leve', 'cardio', 'kettlebell', 'intermediario', 'base', 70, '{"hernia_disco": "vetar", "hipertensao": "evitar"}', '{}'),
('Alongamento Dinâmico', 'cardio', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{}', '{}'),
-- COMPLEMENTO 9 EXERCICIOS (ciencia 2025 - seguros para comorbidade)
('Agachamento Goblet', 'pernas', 'halteres', 'iniciante', 'incorporacao', 60, '{}', '{"hernia_disco": "Cadeira Extensora Leve"}'),
('Cadeira Flexora Unilateral', 'pernas', 'maquina', 'intermediario', 'base', 70, '{}', '{}'),
('Remada Cavalinho', 'costas', 'maquina', 'intermediario', 'base', 70, '{"hernia_disco": "usar_apoio"}', '{"hernia_disco": "Remada Maquina com Apoio"}'),
('Desenvolvimento Arnold', 'ombro', 'halteres', 'intermediario', 'peak', 75, '{"lesao_ombro": "vetar"}', '{"lesao_ombro": "Desenvolvimento Maquina"}'),
('Triceps Testa Halter', 'bracos', 'halteres', 'intermediario', 'base', 70, '{"lesao_cotovelo": "vetar"}', '{}'),
('Prancha Lateral', 'core', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{"hipertensao": "evitar_isometria_longa"}', '{}'),
('Dead Bug', 'core', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{"hernia_disco": "recomendado"}', '{}'),
('Step Up no Banco', 'pernas', 'peso_corporal', 'iniciante', 'incorporacao', 60, '{"lesao_joelho": "reduzir_altura"}', '{"lesao_joelho": "Leg Press 45 Leve"}'),
('Corda Naval Leve (Battle Rope)', 'cardio', 'corda', 'intermediario', 'peak', 75, '{"hipertensao_nao_controlada": "vetar"}', '{"hipertensao": "Circuito Funcional Leve 12-20 reps"}')
on conflict (nome) do nothing;

-- Planos base multi-gym exemplo
insert into gyms (id, nome, cnpj, pix_chave) values
('00000000-0000-0000-0000-000000000001', 'Academia Piloto Matriz', '00.000.000/0001-00', 'pix@academiapiloto.com.br')
on conflict (id) do nothing;

insert into planos (gym_id, nome, valor, duracao_dias, sessoes_inclusas) values
((select id from gyms limit 1), 'Mensal 30 Sessões - Estética', 149.90, 60, 30),
((select id from gyms limit 1), 'Trimestral Periodizado - Saúde', 399.90, 90, 45),
((select id from gyms limit 1), 'Anual Completo - Performance', 1299.90, 365, 180)
on conflict do nothing;
