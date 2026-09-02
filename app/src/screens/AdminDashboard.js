import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function AdminDashboard({ navigation }) {
  const [tab, setTab] = useState('alunos'); // alunos | pagos | logs
  const [alunos, setAlunos] = useState([]);
  const [pendPix, setPendPix] = useState([]);
  const [pendCard, setPendCard] = useState([]);
  const [logs, setLogs] = useState([]);
  const [gym, setGym] = useState(null);

  const carregar = async () => {
    if (!isSupabaseConfigured) {
      setAlunos([{id:'1', nome:'João Real', cpf:'12345678901', mensalidade:'paga'}]);
      setPendPix([{id:'p1', aluno:'João', valor:149.90, status:'aguardando_validacao'}]);
      setLogs([{id:'l1', aluno:'João', liberado:true}]);
      return;
    }
    try {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) throw new Error('Sem sessão');
      const { data: prof } = await supabase.from('profiles').select('gym_id, role').eq('id', user.id).single();
      if (!['professor','atendente','admin','dono'].includes(prof.role)) {
        Alert.alert('Sem permissão', `Seu role é ${prof.role}. Apenas professor/atendente/admin/dono acessam.`);
        navigation.navigate('Treino');
        return;
      }
      setGym(prof.gym_id);
      const { data: als } = await supabase.from('profiles').select('id,nome,cpf,whatsapp,role').eq('gym_id', prof.gym_id).eq('role','aluno').limit(20);
      setAlunos(als||[]);
      const { data: pix } = await supabase.from('pagamentos_pix').select('id,aluno_id,valor_informado,status,created_at, profiles!inner(nome)').eq('status','aguardando_validacao').limit(10);
      setPendPix(pix||[]);
      const { data: card } = await supabase.from('pagamentos_cartao').select('id,aluno_id,valor,status,cartao_ultimos4,parcelas').eq('status','pendente').limit(10);
      setPendCard(card||[]);
      const { data: lg } = await supabase.from('acesso_logs').select('id,aluno_id,liberado,motivo_bloqueio,cpf_digitado,created_at').order('created_at',{ascending:false}).limit(10);
      setLogs(lg||[]);
    } catch(e){ Alert.alert('Erro admin', e.message); }
  };
  useEffect(()=>{ carregar(); },[]);

  const aprovarPix = async (id, mensalidade_id) => {
    try {
      await supabase.from('pagamentos_pix').update({ status:'aprovado', validado_em: new Date().toISOString() }).eq('id', id);
      if (mensalidade_id) await supabase.from('mensalidades').update({ status:'paga' }).eq('id', mensalidade_id);
      Alert.alert('Aprovado', 'Pix aprovado, mensalidade paga');
      carregar();
    } catch(e){ Alert.alert('Erro', e.message); }
  };
  const aprovarCard = async (id, mensalidade_id) => {
    await supabase.from('pagamentos_cartao').update({ status:'aprovado', aprovado_em: new Date().toISOString() }).eq('id', id);
    if (mensalidade_id) await supabase.from('mensalidades').update({ status:'paga' }).eq('id', mensalidade_id);
    Alert.alert('Aprovado', 'Cartão aprovado');
    carregar();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.sub}>Gym {gym ? gym.slice(0,8) : 'piloto'} • {isSupabaseConfigured?'Supabase real':'MOCK'}</Text>
      <View style={styles.tabs}>
        {['alunos','pagos','logs'].map(t=>(
          <TouchableOpacity key={t} style={[styles.tab, tab===t&&styles.tabActive]} onPress={()=>setTab(t)}>
            <Text style={[styles.tabText, tab===t&&styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab==='alunos' && (
        <>
          <Text style={styles.section}>Alunos ({alunos.length})</Text>
          {alunos.map(a=>(
            <View key={a.id} style={styles.card}>
              <Text style={styles.cardTitle}>{a.nome} • {a.cpf||'sem cpf'}</Text>
              <Text style={styles.cardSub}>{a.whatsapp||'sem whats'} • {a.role}</Text>
            </View>
          ))}
          {alunos.length===0 && <Text style={styles.empty}>Nenhum aluno</Text>}
        </>
      )}

      {tab==='pagos' && (
        <>
          <Text style={styles.section}>Pix aguardando ({pendPix.length})</Text>
          {pendPix.map(p=>(
            <View key={p.id} style={styles.card}>
              <Text style={styles.cardTitle}>R${p.valor_informado} • {p.profiles?.nome||p.aluno_id.slice(0,8)}</Text>
              <Text style={styles.cardSub}>{p.status} • {new Date(p.created_at).toLocaleDateString()}</Text>
              <TouchableOpacity style={styles.okBtn} onPress={()=>aprovarPix(p.id, p.mensalidade_id)}><Text style={styles.okText}>Aprovar</Text></TouchableOpacity>
            </View>
          ))}
          <Text style={styles.section}>Cartão pendente ({pendCard.length})</Text>
          {pendCard.map(p=>(
            <View key={p.id} style={styles.card}>
              <Text style={styles.cardTitle}>R${p.valor} • ....{p.cartao_ultimos4} • {p.parcelas}x</Text>
              <Text style={styles.cardSub}>{p.status}</Text>
              <TouchableOpacity style={styles.okBtn} onPress={()=>aprovarCard(p.id, p.mensalidade_id)}><Text style={styles.okText}>Aprovar</Text></TouchableOpacity>
            </View>
          ))}
          {pendPix.length===0 && pendCard.length===0 && <Text style={styles.empty}>Nenhum pagamento pendente</Text>}
        </>
      )}

      {tab==='logs' && (
        <>
          <Text style={styles.section}>Catraca logs ({logs.length})</Text>
          {logs.map(l=>(
            <View key={l.id} style={[styles.card, !l.liberado&&styles.cardBlock]}>
              <Text style={styles.cardTitle}>{l.liberado?'LIBERADO':'BLOQUEADO'} • {l.cpf_digitado||'?'}</Text>
              <Text style={styles.cardSub}>{l.motivo_bloqueio||'ok'} • {new Date(l.created_at).toLocaleTimeString()}</Text>
            </View>
          ))}
        </>
      )}

      <TouchableOpacity style={styles.refresh} onPress={carregar}><Text style={styles.refreshText}>🔄 Atualizar</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>navigation.navigate('Treino')}><Text style={styles.link}>← Voltar Treino</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:'#0f172a', paddingBottom:40 },
  title:{ fontSize:22, fontWeight:'bold', color:'#fff' },
  sub:{ color:'#94a3b8', marginBottom:12 },
  tabs:{ flexDirection:'row', backgroundColor:'#1e293b', borderRadius:10, padding:4, marginBottom:12, borderWidth:1, borderColor:'#334155' },
  tab:{ flex:1, padding:10, borderRadius:8, alignItems:'center' },
  tabActive:{ backgroundColor:'#38bdf8' },
  tabText:{ color:'#94a3b8', fontWeight:'600', textTransform:'capitalize' },
  tabTextActive:{ color:'#0f172a' },
  section:{ color:'#e2e8f0', fontWeight:'bold', marginTop:8, marginBottom:6 },
  card:{ backgroundColor:'#1e293b', padding:12, borderRadius:10, marginBottom:8, borderWidth:1, borderColor:'#334155' },
  cardBlock:{ borderColor:'#ef4444' },
  cardTitle:{ color:'#fff', fontWeight:'bold' },
  cardSub:{ color:'#94a3b8', fontSize:12, marginTop:4 },
  okBtn:{ backgroundColor:'#22c55e', padding:8, borderRadius:8, alignItems:'center', marginTop:8 },
  okText:{ color:'#fff', fontWeight:'bold' },
  empty:{ color:'#64748b', textAlign:'center', marginTop:10 },
  refresh:{ backgroundColor:'#38bdf8', padding:12, borderRadius:10, alignItems:'center', marginTop:12 },
  refreshText:{ color:'#0f172a', fontWeight:'bold' },
  link:{ color:'#64748b', textAlign:'center', marginTop:12 },
});
