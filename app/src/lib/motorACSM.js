// Motor ACSM 2025 - filtra exercicios por contraindicacoes + periodização
// Regra: se doenca do aluno aparece nas keys de contraindicacoes com valor vetar/evitar, filtra/substitui

const NIVEL_POR_OBJETIVO = {
  emagrecimento: 'iniciante',
  saude_qualidade_vida: 'iniciante',
  hipertrofia: 'intermediario',
  condicionamento: 'intermediario',
  performance: 'avancado',
  reabilitacao: 'iniciante',
};

const MESOCICLO_POR_NIVEL = {
  iniciante: 'incorporacao',
  intermediario: 'base',
  avancado: 'peak',
};

export function filtrarExercicios(exercicios, doencasCronicas = [], options = {}) {
  const doencas = new Set((doencasCronicas || []).map(d => d.toLowerCase()));
  const nivel = options.nivel || 'iniciante';

  return exercicios.filter(ex => {
    const contra = ex.contraindicacoes || {};
    // se objeto vazio -> libera
    if (!contra || Object.keys(contra).length === 0) return true;
    for (const key of Object.keys(contra)) {
      const k = key.toLowerCase();
      const v = String(contra[key]).toLowerCase();
      // vetar total se doenca bate
      const isVetado = v.includes('vetar');
      // verifica se alguma doenca do aluno contém a key
      for (const d of doencas) {
        if (k.includes(d) || d.includes(k)) {
          if (isVetado) return false;
          // evitar -> permite mas marca warning (por enquanto libera, UI mostra alerta)
        }
      }
    }
    // filtra por nivel se solicitado (mantém iniciante sempre, filtra avancado para iniciante)
    if (nivel === 'iniciante' && ex.nivel === 'avancado') return false;
    if (nivel === 'intermediario' && ex.nivel === 'avancado' && Math.random() > 0.3) return false;
    return true;
  });
}

export function gerarTreinoMock(exerciciosFiltrados, objetivo = 'hipertrofia') {
  const nivel = NIVEL_POR_OBJETIVO[objetivo] || 'iniciante';
  const mesociclo = MESOCICLO_POR_NIVEL[nivel] || 'incorporacao';
  const pct = mesociclo === 'incorporacao' ? 60 : mesociclo === 'base' ? 75 : 80;

  // pega 6-8 exercicios balanceados por grupo
  const grupos = {};
  exerciciosFiltrados.forEach(e => {
    if (!grupos[e.grupo_muscular]) grupos[e.grupo_muscular] = [];
    grupos[e.grupo_muscular].push(e);
  });

  const ordemGrupos = ['pernas','peito','costas','ombro','bracos','core','cardio'];
  const selecionados = [];
  for (const g of ordemGrupos) {
    const lista = grupos[g] || [];
    if (lista.length && selecionados.length < 8) {
      selecionados.push(lista[Math.floor(Math.random()*lista.length)]);
    }
  }
  // completa se faltar
  while (selecionados.length < 6 && exerciciosFiltrados.length > selecionados.length) {
    const cand = exerciciosFiltrados[Math.floor(Math.random()*exerciciosFiltrados.length)];
    if (!selecionados.find(s=>s.id===cand.id)) selecionados.push(cand);
  }

  return {
    objetivo,
    mesociclo_atual: mesociclo,
    sessoes_previstas: 30,
    sessoes_realizadas: 0,
    pct_1rm: pct,
    exercicios: selecionados.map((ex, idx) => ({
      exercicio_id: ex.id,
      nome: ex.nome,
      grupo: ex.grupo_muscular,
      ordem: idx+1,
      series: nivel === 'iniciante' ? 3 : 4,
      repeticoes: nivel === 'iniciante' ? '12-15' : nivel === 'intermediario' ? '8-12' : '6-8',
      carga: `${pct}% 1RM`,
      intervalo_segundos: 90,
    }))
  };
}

export function calcularStatusTreino(sessoesRealizadas, sessoesPrevistas = 30) {
  const pct = Math.round((sessoesRealizadas / sessoesPrevistas) * 100);
  if (sessoesRealizadas >= sessoesPrevistas) return { pct:100, label:'Concluído', color:'#22c55e' };
  if (pct >= 80) return { pct, label:'Reta final', color:'#38bdf8' };
  if (pct >= 50) return { pct, label:'Em progresso', color:'#f59e0b' };
  return { pct, label:'Início', color:'#94a3b8' };
}
