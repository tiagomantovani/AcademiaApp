import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { supabase, isSupabaseConfigured, mockDelay } from '../lib/supabase';

function gerarQrId(){ return `QR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`; }

export default function QRScreen({ navigation, route }) {
  const { treinoId } = route.params || {};
  const [qrId, setQrId] = useState(gerarQrId());
  const [status, setStatus] = useState('pronto'); // pronto | pendente_validacao | comprovada
  const [sessoesHoje, setSessoesHoje] = useState(0);

  const handleCheckIn = async () => {
    if (!isSupabaseConfigured) {
      await mockDelay();
      setStatus('pendente_validacao');
      setSessoesHoje(s=>s+1);
      Alert.alert('MOCK', `QR ${qrId} registrado (a). Aguarde validação professor (b) para virar comprovada.`);
      return;
    }
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sem sessão');
      // busca gym do profile
      const { data: profile } = await supabase.from('profiles').select('gym_id').eq('id', user.id).single();
      const gymId = profile?.gym_id || '00000000-0000-0000-0000-000000000001';
      // busca treino ativo se não passado
      let tId = treinoId;
      if (!tId) {
        const { data: tr } = await supabase.from('treinos').select('id').eq('aluno_id', user.id).eq('status','ativo').limit(1).maybeSingle();
        tId = tr?.id;
        if (!tId) throw new Error('Sem treino ativo');
      }
      const { error } = await supabase.from('sessoes').insert({
        treino_id: tId,
        aluno_id: user.id,
        gym_id: gymId,
        prova_tipo: 'qr_code',
        qr_code_id: qrId,
        status: 'pendente_validacao',
      });
      if (error) throw error;
      // também check_ins
      await supabase.from('check_ins').insert({ aluno_id: user.id, gym_id: gymId, origem:'app_qr' });
      setStatus('pendente_validacao');
      setSessoesHoje(s=>s+1);
      Alert.alert('Check-in', 'QR registrado (a). Professor precisa validar (b).');
    } catch(e){ Alert.alert('Erro', e.message); }
  };

  const handleValidarProfessor = async () => {
    if (status !== 'pendente_validacao') return Alert.alert('Faça check-in primeiro (a)');
    if (!isSupabaseConfigured) {
      await mockDelay();
      setStatus('comprovada');
      Alert.alert('MOCK', 'Professor validou (b) → sessão comprovada! Trigger sessoes_realizadas +1. 30/30 = concluído.');
      return;
    }
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      // pega última sessão pendente
      const { data: sess } = await supabase.from('sessoes').select('id').eq('aluno_id', user.id).eq('status','pendente_validacao').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if (!sess) throw new Error('Nenhuma sessão pendente');
      const { error } = await supabase.from('sessoes').update({ status:'comprovada', validado_por: user.id }).eq('id', sess.id);
      if (error) throw error;
      setStatus('comprovada');
      Alert.alert('Validado', 'Sessão comprovada (a+b)! sessoes_realizadas incrementada via trigger.');
    } catch(e){ Alert.alert('Erro', e.message); }
  };

  const novoQr = () => { setQrId(gerarQrId()); setStatus('pronto'); };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>QR Check-in (a+b)</Text>
      <Text style={styles.sub}>QR Code (a) + Professor (b) = sessoes.comprovada → trigger 30/30</Text>

      <View style={styles.qrBox}>
        <Text style={styles.qrId}>{qrId}</Text>
        <Text style={styles.qrHint}>Mostre na catraca / app professor</Text>
        <View style={[styles.badge, status==='comprovada' ? styles.badgeOk : status==='pendente_validacao' ? styles.badgeWarn : styles.badgePronto]}>
          <Text style={styles.badgeText}>{status==='pronto'?'PRONTO':status==='pendente_validacao'?'PENDENTE (a)':'COMPROVADA (a+b)'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={handleCheckIn}>
        <Text style={styles.btnText}>📷 Simular Leitura QR (a)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btnSecondary, status!=='pendente_validacao' && styles.btnDisabled]} onPress={handleValidarProfessor}>
        <Text style={styles.btnTextDark}>👨‍🏫 Validar Professor (b)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnGhost} onPress={novoQr}><Text style={styles.ghostText}>Gerar novo QR</Text></TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Fluxo 30 sessões</Text>
        <Text style={styles.infoText}>1. Aluno faz QR (a) → sessoes pendente_validacao</Text>
        <Text style={styles.infoText}>2. Professor valida (b) → comprovada → fn_incrementa_sessao +1</Text>
        <Text style={styles.infoText}>3. 30/30 → treino concluído + conquista 30_sessoes + novo treino automático</Text>
        <Text style={styles.infoText}>Hoje: {sessoesHoje} check-in(s) nesta tela</Text>
      </View>

      <TouchableOpacity onPress={()=>navigation.navigate('Treino')}><Text style={styles.link}>← Voltar ao Treino</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:'#0f172a', paddingBottom:40 },
  title:{ fontSize:22, fontWeight:'bold', color:'#fff' },
  sub:{ color:'#94a3b8', marginBottom:14 },
  qrBox:{ backgroundColor:'#fff', padding:20, borderRadius:16, alignItems:'center', marginBottom:12 },
  qrId:{ fontSize:18, fontWeight:'bold', color:'#0f172a', letterSpacing:1 },
  qrHint:{ color:'#64748b', marginTop:6, fontSize:12 },
  badge:{ marginTop:12, paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  badgePronto:{ backgroundColor:'#e2e8f0' },
  badgeWarn:{ backgroundColor:'#fbbf24' },
  badgeOk:{ backgroundColor:'#22c55e' },
  badgeText:{ fontWeight:'bold', color:'#0f172a' },
  btnPrimary:{ backgroundColor:'#38bdf8', padding:14, borderRadius:10, alignItems:'center' },
  btnSecondary:{ backgroundColor:'#22c55e', padding:14, borderRadius:10, alignItems:'center', marginTop:8 },
  btnDisabled:{ opacity:0.5 },
  btnGhost:{ padding:14, alignItems:'center', marginTop:8 },
  ghostText:{ color:'#38bdf8' },
  btnText:{ color:'#0f172a', fontWeight:'bold' },
  btnTextDark:{ color:'#fff', fontWeight:'bold' },
  info:{ backgroundColor:'#1e293b', padding:14, borderRadius:10, marginTop:16, borderWidth:1, borderColor:'#334155' },
  infoTitle:{ color:'#38bdf8', fontWeight:'bold', marginBottom:6 },
  infoText:{ color:'#94a3b8', fontSize:12, marginTop:4 },
  link:{ color:'#64748b', textAlign:'center', marginTop:14 },
});
