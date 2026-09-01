# Ciclo de Vida AcademiaApp - Prototipo Inteligente

## Validacao: Atende todos os processos de negocio? SIM
Baseado em SCA + Tecnofit + Next Fit + TotalPass Jornada 7 etapas

### Fluxograma 30 Sessoes (Core Inteligente)
```
[Aluno Cadastro + OAuth Social] 
  -> [Anamnese + PAR-Q] --precisa_atestado?--> [Bloqueia Treino, pede atestado]
  -> [Avaliacao Fisica IMC] 
  -> [Motor Regras ACSM 2025: filtra exercicios vetados por comorbidade]
  -> [Gera Treino: status = ativo (saudavel) OU pendente_validacao_personal (comorbidade)]
  -> [Loop 30x: QR Code (a) + Validacao Professor (b) = sessoes.comprovada]
  -> [Trigger: sessoes_realizadas = 30 => treino.status='concluido' + conquista 30_sessoes]
  -> [IA Gera Novo Treino: mesociclo seguinte (incorporacao->base->peak->deload)]
  -> [Streak 5 dias? => conquista streak_5_dias + social_posts rascunho]
  -> [Social Posts: IA gera legenda+imagem Higgsfield -> Envia via WhatsApp para aluno postar (LGPD B) + Envia motivacional diario 18h]
  -> [Mensalidade: Pix via WhatsApp -> pagamentos_pix aguardando_validacao -> Atendente aprova -> mensalidade paga]
```

### Periodizacao Cientifica Implementada
- **Iniciante/Saude:** Linear 4-6 semanas, 60% 1RM, 12 reps, volume > intensidade
- **Intermediario/Estetica:** Ondulatoria Semanal (WUP), 70-75% 1RM
- **Avancado/Performance:** Ondulatoria Diaria (DUP) + Blocos, 80% 1RM, 3-6 reps
- **Deload:** A cada 4-8 semanas, 40-50% 1RM (previne lesao)

### Processos de Negocio Cobertos
| Processo | Tabela | Status |
|---|---|---|
| Comercial (planos, matricula) | gyms, planos, profiles | OK |
| Operacional (acesso, treino) | check_ins, sessoes, treinos | OK (QR+b) |
| Saude/Legal (LGPD) | anamneses, parq, avaliacoes | OK (consentimento + validade 3m) |
| Financeiro | mensalidades, pagamentos_pix | OK (validacao humana) |
| Marketing/Social | social_posts, conquistas | OK (LGPD B - WhatsApp) |
| Retencao/Gamificacao | conquistas, sessoes | OK (streak 5 dias, 30 sessoes) |

### Automacoes WhatsApp (Evolution API + IA)
1. **Financeiro:** "Ola Joao, identificamos seu Pix de R$149,90. Atendente validando..."
2. **Motivacional:** "Faltam 2 sessoes para seu novo treino! 💪"
3. **Evasao (5 dias sem treino):** "Sentimos sua falta, seu treino vence em X sessoes"
4. **Conquista (5 dias seguidos):** Envia imagem+legenda pronta via WhatsApp para aluno postar

### LGPD - Opcao B Segura
- Aluno da consentimento no cadastro (`lgpd_consentimento`)
- `permite_marcar_social=false` por padrao
- Nenhum post vai para Instagram da academia sem ele reenviar via WhatsApp
- Dados saude (anamneses) criptografados e com validade

### Proximo Passo Tecnico
1. Rodar `supabase/schema.sql` no Supabase Free
2. Rodar `seed_exercicios.sql` (80 exercicios)
3. Testar trigger 30 sessoes no SQL
4. Criar App Expo com telas: Cadastro -> Anamnese -> Treino -> QR Checkin
