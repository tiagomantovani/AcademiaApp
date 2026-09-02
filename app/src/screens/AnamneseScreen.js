import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { supabase, isSupabaseConfigured, mockDelay } from '../lib/supabase';

const DOENCAS_OPCOES = ['hipertensao','diabetes_tipo2','hernia_disco','lesao_joelho','cardiopatia','obesidade_grau2'];
const OBJETIVOS = ['emagrecimento','hipertrofia','condicionamento','saude_qualidade_vida','performance','reabilitacao'];

export default function AnamneseScreen({ navigation, route }) {
  const [objetivo, setObjetivo] = useState('hipertrofia');
  const [doencas, setDoencas] = useState([]);
  const [nivelAtiv, setNivelAtiv] = useState('sedentario');
  const [horasSono, setHorasSono] = useState('7');
  const [fumante, setFumante] = useState(false);
  const [lgpd, setLgpd] = useState(false);
  const [parq, setParq] = useState({ q1:false,q2:false,q3:false,q4:false,q5:false,q6:false,q7:false });
  const precisaAtestado = Object.values(parq).some(Boolean);

  const toggleDoenca = (d) => setDoencas(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev,d]);

  const handleSalvar = async () => {
    if (!lgpd) return Alert.alert('LGPD', 'É necessário consentir com o tratamento de dados sensíveis.');
    if (!isSupabaseConfigured) {
      await mockDelay();
      Alert.alert('MOCK', `Anamnese salva local: objetivo ${objetivo}, doencas [${doencas.join(',')}] ${precisaAtestado?'+ precisa atestado':''}`);
      navigation.navigate('Treino', { mockAnamnese: { objetivo, doencas, precisaAtestado } });
      return;
    }
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login antes');
      const { data: anamnese, error } = await supabase.from('anamneses').insert({
        aluno_id: user.id,
        gym_id: '00000000-0000-0000-0000-000000000001',
        objetivo,
        doencas_cronicas: doencas,
        nivel_atividade: nivelAtiv,
        horas_sono: parseInt(horasSono)||7,
        fumante,
        validade_ate: new Date(Date.now()+90*24*3600*1000).toISOString().split('T')[0],
      }).select().single();
      if (error) throw error;
      const { error: e2 } = await supabase.from('parq_respostas').insert({
        anamnese_id: anamnese.id,
        q1_dor_peito: parq.q1,
        q2_tontura: parq.q2,
        q3_dor_articular: parq.q3,
        q4_medicamento_pressao: parq.q4,
        q5_falta_ar: parq.q5,
        q6_diabetes: parq.q6,
        q7_outro_motivo: parq.q7,
      });
      if (e2) throw e2;
      Alert.alert('Sucesso', precisaAtestado ? 'Precisa atestado médico antes do treino!' : 'Anamnese salva. Gerando treino...');
      navigation.navigate('Treino', { anamneseId: anamnese.id, objetivo, doencas });
    } catch(e){ Alert.alert('Erro', e.message); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Anamnese + PAR-Q</Text>
      <Text style={styles.sub}>LGPD sensível — validade 90 dias</Text>

      <Text style={styles.label}>Objetivo</Text>
      <View style={styles.chips}>
        {OBJETIVOS.map(o=>(
          <TouchableOpacity key={o} style={[styles.chip, objetivo===o && styles.chipActive]} onPress={()=>setObjetivo(o)}>
            <Text style={[styles.chipText, objetivo===o && styles.chipTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Doenças crônicas / limitações</Text>
      <View style={styles.chips}>
        {DOENCAS_OPCOES.map(d=>(
          <TouchableOpacity key={d} style={[styles.chip, doencas.includes(d) && styles.chipActive]} onPress={()=>toggleDoenca(d)}>
            <Text style={[styles.chipText, doencas.includes(d) && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Nível atividade</Text>
      <View style={styles.chips}>
        {['sedentario','leve','moderado','intenso'].map(n=>(
          <TouchableOpacity key={n} style={[styles.chip, nivelAtiv===n && styles.chipActive]} onPress={()=>setNivelAtiv(n)}>
            <Text style={[styles.chipText, nivelAtiv===n && styles.chipTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Horas sono / noite</Text>
      <TextInput style={styles.input} value={horasSono} onChangeText={setHorasSono} keyboardType="numeric" placeholderTextColor="#64748b" />

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Fumante</Text>
        <Switch value={fumante} onValueChange={setFumante} />
      </View>

      <Text style={[styles.label,{marginTop:16}]}>PAR-Q (7 perguntas — qualquer SIM = precisa atestado)</Text>
      {[
        ['q1','Dor no peito em esforço'],
        ['q2','Tontura / desmaio'],
        ['q3','Dor articular'],
        ['q4','Remédio pressão / coração'],
        ['q5','Falta de ar'],
        ['q6','Diabetes'],
        ['q7','Outro motivo médico'],
      ].map(([k,label])=>(
        <View key={k} style={styles.row}>
          <Text style={styles.rowLabel}>{label}</Text>
          <Switch value={parq[k]} onValueChange={v=>setParq({...parq,[k]:v})} />
        </View>
      ))}
      {precisaAtestado && <Text style={styles.needAtestado}>⚠️ Precisa atestado médico — treino ficará pendente_validacao_personal</Text>}

      <View style={styles.row}>
        <Text style={[styles.rowLabel,{flex:1}]}>Consinto LGPD dados saúde (art.11)</Text>
        <Switch value={lgpd} onValueChange={setLgpd} />
      </View>

      <TouchableOpacity style={[styles.btn, !lgpd && styles.btnDisabled]} onPress={handleSalvar}>
        <Text style={styles.btnText}>Salvar e gerar treino</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={()=>navigation.navigate('Treino')}><Text style={styles.skip}>Pular (dev) → Treino</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:'#0f172a', paddingBottom:40 },
  title:{ fontSize:22, fontWeight:'bold', color:'#fff' },
  sub:{ color:'#94a3b8', marginBottom:12 },
  label:{ color:'#e2e8f0', fontWeight:'600', marginTop:10, marginBottom:6 },
  chips:{ flexDirection:'row', flexWrap:'wrap', gap:8 },
  chip:{ backgroundColor:'#1e293b', paddingHorizontal:10, paddingVertical:8, borderRadius:20, borderWidth:1, borderColor:'#334155' },
  chipActive:{ backgroundColor:'#38bdf8', borderColor:'#38bdf8' },
  chipText:{ color:'#94a3b8', fontSize:12 },
  chipTextActive:{ color:'#0f172a', fontWeight:'bold' },
  input:{ backgroundColor:'#1e293b', color:'#fff', padding:12, borderRadius:8, borderWidth:1, borderColor:'#334155', marginTop:6 },
  row:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#1e293b', padding:12, borderRadius:8, marginTop:8, borderWidth:1, borderColor:'#334155' },
  rowLabel:{ color:'#e2e8f0', flex:1 },
  needAtestado:{ color:'#fbbf24', backgroundColor:'#451a03', padding:8, borderRadius:8, marginTop:10, textAlign:'center' },
  btn:{ backgroundColor:'#22c55e', padding:14, borderRadius:10, alignItems:'center', marginTop:16 },
  btnDisabled:{ opacity:0.5 },
  btnText:{ color:'#fff', fontWeight:'bold' },
  skip:{ color:'#64748b', textAlign:'center', marginTop:12 },
});
