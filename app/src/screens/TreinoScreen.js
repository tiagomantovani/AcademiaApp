import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase, isSupabaseConfigured, mockDelay } from '../lib/supabase';
import { filtrarExercicios, gerarTreinoMock, calcularStatusTreino } from '../lib/motorACSM';

// Fallback seed local se sem Supabase (espelha supabase/seed_exercicios.sql resumido)
const MOCK_EXERCICIOS = [
  { id:'1', nome:'Leg Press 45 Leve', grupo_muscular:'pernas', nivel:'iniciante', contraindicacoes:{} },
  { id:'2', nome:'Supino Maquina', grupo_muscular:'peito', nivel:'iniciante', contraindicacoes:{} },
  { id:'3', nome:'Puxada Frontal Aberta', grupo_muscular:'costas', nivel:'iniciante', contraindicacoes:{} },
  { id:'4', nome:'Elevacao Lateral Leve', grupo_muscular:'ombro', nivel:'iniciante', contraindicacoes:{} },
  { id:'5', nome:'Rosca Direta Barra', grupo_muscular:'bracos', nivel:'iniciante', contraindicacoes:{} },
  { id:'6', nome:'Prancha Abdominal', grupo_muscular:'core', nivel:'iniciante', contraindicacoes:{hipertensao:'evitar_isometria_longa'} },
  { id:'7', nome:'Bicicleta Ergométrica', grupo_muscular:'cardio', nivel:'iniciante', contraindicacoes:{} },
  { id:'8', nome:'Agachamento Livre Barra', grupo_muscular:'pernas', nivel:'avancado', contraindicacoes:{hernia_disco:'vetar', hipertensao:'evitar_falha'} },
  { id:'9', nome:'Remada Curvada Barra', grupo_muscular:'costas', nivel:'avancado', contraindicacoes:{hernia_disco:'vetar'} },
  { id:'10', nome:'Caminhada Esteira', grupo_muscular:'cardio', nivel:'iniciante', contraindicacoes:{} },
];

export default function TreinoScreen({ navigation, route }) {
  const { objetivo: objetivoParam, doencas: doencasParam, anamneseId } = route.params || {};
  const [treino, setTreino] = useState(null);
  const [loading, setLoading] = useState(true);
  const objetivo = objetivoParam || 'hipertrofia';
  const doencas = doencasParam || [];

  const carregarTreino = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await mockDelay();
        const filtrados = filtrarExercicios(MOCK_EXERCICIOS, doencas, { nivel:'iniciante' });
        setTreino({ ...gerarTreinoMock(filtrados, objetivo), id:'mock-treino-1', sessoes_realizadas: 28, status:'ativo' });
        return;
      }
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sem sessão');
      const { data, error } = await supabase.from('treinos').select('*, treino_exercicios!inner(*, exercicios(*))').eq('aluno_id', user.id).eq('status','ativo').limit(1).maybeSingle();
      if (error) throw error;
      if (!data) {
        // sem treino ativo -> gera via motor e insere
        const { data: exs } = await supabase.from('exercicios').select('*').limit(80);
        const filtrados = filtrarExercicios(exs || MOCK_EXERCICIOS, doencas);
        const novo = gerarTreinoMock(filtrados, objetivo);
        const { data: treinoIns, error:e1 } = await supabase.from('treinos').insert({
          aluno_id: user.id,
          gym_id: '00000000-0000-0000-0000-000000000001',
          objetivo,
          status:'ativo',
          sessoes_previstas: novo.sessoes_previstas,
          mesociclo_atual: novo.mesociclo_atual,
        }).select().single();
        if (e1) throw e1;
        for (const ex of novo.exercicios) {
          await supabase.from('treino_exercicios').insert({
            treino_id: treinoIns.id,
            exercicio_id: ex.exercicio_id,
            ordem: ex.ordem,
            series: ex.series,
            repeticoes: ex.repeticoes,
            carga: ex.carga,
            intervalo_segundos: ex.intervalo_segundos,
          });
        }
        setTreino({ ...treinoIns, exercicios: novo.exercicios, sessoes_realizadas:0 });
      } else {
        // adapta shape
        setTreino({
          ...data,
          sessoes_realizadas: data.sessoes_realizadas,
          exercicios: (data.treino_exercicios||[]).map(t=>({ nome: t.exercicios?.nome || t.exercicio_id, series:t.series, repeticoes:t.repeticoes, carga:t.carga, ordem:t.ordem }))
        });
      }
    } catch(e){ Alert.alert('Erro treino', e.message); } finally { setLoading(false); }
  };

  useEffect(()=>{ carregarTreino(); },[]);

  if (loading) return <View style={styles.center}><Text style={styles.muted}>Carregando treino...</Text></View>;
  if (!treino) return <View style={styles.center}><Text style={styles.muted}>Sem treino</Text></View>;

  const status = calcularStatusTreino(treino.sessoes_realizadas, treino.sessoes_previstas || 30);
  const isConcluido = treino.sessoes_realizadas >= (treino.sessoes_previstas||30);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Treino Ativo</Text>
      <Text style={styles.sub}>{objetivo} • {treino.mesociclo_atual} • {doencas.length?`Filtros: ${doencas.join(', ')}`:'Sem restrições'}</Text>

      <View style={styles.card}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{treino.sessoes_realizadas}/{treino.sessoes_previstas || 30} sessões</Text>
          <Text style={[styles.badge,{backgroundColor:status.color}]}>{status.label} {status.pct}%</Text>
        </View>
        <View style={styles.barBg}><View style={[styles.barFill,{width:`${status.pct}%`, backgroundColor:status.color}]} /></View>
        {isConcluido && <Text style={styles.concluido}>✅ Treino concluído — novo treino será gerado (trigger fn_incrementa_sessao)</Text>}
      </View>

      <Text style={styles.section}>Exercícios (motor ACSM 2025 filtrado)</Text>
      {(treino.exercicios||[]).map((ex,i)=>(
        <View key={i} style={styles.exCard}>
          <Text style={styles.exOrdem}>{ex.ordem}.</Text>
          <View style={{flex:1}}>
            <Text style={styles.exNome}>{ex.nome}</Text>
            <Text style={styles.exDet}>{ex.series}x {ex.repeticoes} • {ex.carga} • {ex.intervalo_segundos||90}s</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.btnPrimary} onPress={()=>navigation.navigate('QR', { treinoId: treino.id })}>
        <Text style={styles.btnText}>📱 Fazer Check-in (QR a+b)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btnSecondary,{backgroundColor:'#22c55e', borderColor:'#22c55e'}]} onPress={()=>navigation.navigate('Pix')}>
        <Text style={styles.btnTextDark}>💰 Pix / Cartão / Migrar Plano</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btnSecondary,{backgroundColor:'#f59e0b', borderColor:'#f59e0b'}]} onPress={()=>navigation.navigate('Conquistas')}>
        <Text style={[styles.btnText,{color:'#fff'}]}>🏆 Conquistas & Streak</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnSecondary} onPress={carregarTreino}><Text style={styles.btnTextDark}>🔄 Recarregar treino</Text></TouchableOpacity>
      {!isSupabaseConfigured && <Text style={styles.warn}>MOCK: sem Supabase, progresso 28/30 simulado</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:'#0f172a', paddingBottom:40 },
  center:{ flex:1, backgroundColor:'#0f172a', justifyContent:'center', alignItems:'center' },
  muted:{ color:'#64748b' },
  title:{ fontSize:22, fontWeight:'bold', color:'#fff' },
  sub:{ color:'#94a3b8', marginBottom:12 },
  card:{ backgroundColor:'#1e293b', padding:14, borderRadius:12, borderWidth:1, borderColor:'#334155', marginBottom:12 },
  progressHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  progressLabel:{ color:'#fff', fontWeight:'bold' },
  badge:{ color:'#0f172a', paddingHorizontal:8, paddingVertical:4, borderRadius:20, fontWeight:'bold', overflow:'hidden' },
  barBg:{ height:10, backgroundColor:'#0f172a', borderRadius:10, marginTop:10, overflow:'hidden' },
  barFill:{ height:10, borderRadius:10 },
  concluido:{ color:'#4ade80', marginTop:8, textAlign:'center' },
  section:{ color:'#e2e8f0', fontWeight:'bold', marginTop:8, marginBottom:8 },
  exCard:{ flexDirection:'row', backgroundColor:'#1e293b', padding:12, borderRadius:10, marginBottom:8, borderWidth:1, borderColor:'#334155', alignItems:'center' },
  exOrdem:{ color:'#38bdf8', fontWeight:'bold', marginRight:10, fontSize:16 },
  exNome:{ color:'#fff', fontWeight:'600' },
  exDet:{ color:'#94a3b8', fontSize:12, marginTop:2 },
  btnPrimary:{ backgroundColor:'#38bdf8', padding:14, borderRadius:10, alignItems:'center', marginTop:16 },
  btnSecondary:{ backgroundColor:'#1e293b', padding:14, borderRadius:10, alignItems:'center', marginTop:8, borderWidth:1, borderColor:'#334155' },
  btnText:{ color:'#0f172a', fontWeight:'bold' },
  btnTextDark:{ color:'#fff', fontWeight:'bold' },
  warn:{ color:'#fdba74', textAlign:'center', marginTop:12 },
});
