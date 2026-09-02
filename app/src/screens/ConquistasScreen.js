import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { supabase, isSupabaseConfigured, mockDelay } from '../lib/supabase';

const ICONS = {
  primeiro_treino: '🎯',
  streak_5_dias: '💪',
  streak_10_dias: '🔥',
  '30_sessoes_concluidas': '🏆',
  evolucao_carga: '📈',
};

export default function ConquistasScreen({ navigation }) {
  const [conquistas, setConquistas] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await mockDelay();
        setConquistas([
          { id:'1', tipo:'streak_5_dias', descricao:'5 dias seguidos 💪', created_at: new Date().toISOString() },
          { id:'2', tipo:'30_sessoes_concluidas', descricao:'Treino 30 sessões concluído! 🏆', created_at: new Date(Date.now()-86400000).toISOString() },
        ]);
        setPosts([{id:'p1', legenda:'Conquistei 5 dias seguidos! 💪 #AcademiaApp', status:'rascunho', plataforma:'instagram'}]);
        return;
      }
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) throw new Error('Sem sessão');
      const { data: cons, error:e1 } = await supabase.from('conquistas').select('*').eq('aluno_id', user.id).order('created_at',{ascending:false}).limit(20);
      if (e1) throw e1;
      setConquistas(cons||[]);
      const { data: sp, error:e2 } = await supabase.from('social_posts').select('*').eq('aluno_id', user.id).order('created_at',{ascending:false}).limit(10);
      if (e2) throw e2;
      setPosts(sp||[]);
    } catch(e){ Alert.alert('Erro', e.message); } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(()=>{ carregar(); },[]);
  const onRefresh = useCallback(()=>{ setRefreshing(true); carregar(); },[]);

  const handleEnviarWhats = (post) => {
    Alert.alert('WhatsApp LGPD B', `Mock: envia via WhatsApp para aluno postar:\n\n"${post.legenda}"\n\nFuturo: Evolution API → whatsapp_message_id. Aluno decide postar no Insta.`);
  };

  if (loading) return <View style={styles.center}><Text style={styles.muted}>Carregando conquistas...</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#38bdf8']} />}>
      <Text style={styles.title}>Conquistas</Text>
      <Text style={styles.sub}>Streaks + 30 sessões → dispara gamificação (trigger fn_conquista_streak)</Text>

      {conquistas.length===0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Nenhuma conquista ainda. Faça QR a+b por 5 dias seguidos para ganhar 💪</Text></View>
      ) : conquistas.map(c=>(
        <View key={c.id} style={styles.card}>
          <Text style={styles.icon}>{ICONS[c.tipo]||'⭐'}</Text>
          <View style={{flex:1}}>
            <Text style={styles.tipo}>{c.tipo.replaceAll('_',' ')}</Text>
            <Text style={styles.desc}>{c.descricao}</Text>
            <Text style={styles.date}>{new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString()}</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.title,{marginTop:16}]}>Posts para WhatsApp</Text>
      <Text style={styles.sub}>Opção B LGPD: rascunho → enviado_whatsapp → aluno posta no Insta (não postamos direto)</Text>
      {posts.length===0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Sem posts. Conquiste streak 5 dias para gerar rascunho.</Text></View>
      ) : posts.map(p=>(
        <View key={p.id} style={styles.postCard}>
          <Text style={styles.postLegenda}>"{p.legenda}"</Text>
          <View style={styles.postRow}>
            <Text style={styles.postMeta}>{p.plataforma} • {p.status}</Text>
            <TouchableOpacity style={[styles.whatsBtn, p.status!=='rascunho' && styles.whatsDisabled]} onPress={()=>handleEnviarWhats(p)} disabled={p.status!=='rascunho'}>
              <Text style={styles.whatsText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.btn} onPress={onRefresh}><Text style={styles.btnText}>🔄 Atualizar</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>navigation.navigate('Treino')}><Text style={styles.link}>← Voltar ao Treino</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:'#0f172a', paddingBottom:40 },
  center:{ flex:1, backgroundColor:'#0f172a', justifyContent:'center', alignItems:'center' },
  muted:{ color:'#64748b' },
  title:{ fontSize:22, fontWeight:'bold', color:'#fff' },
  sub:{ color:'#94a3b8', marginBottom:12 },
  empty:{ backgroundColor:'#1e293b', padding:16, borderRadius:10, borderWidth:1, borderColor:'#334155', marginBottom:12 },
  emptyText:{ color:'#94a3b8', textAlign:'center' },
  card:{ flexDirection:'row', backgroundColor:'#1e293b', padding:14, borderRadius:12, marginBottom:8, borderWidth:1, borderColor:'#334155', alignItems:'center' },
  icon:{ fontSize:28, marginRight:12 },
  tipo:{ color:'#38bdf8', fontWeight:'bold', textTransform:'capitalize' },
  desc:{ color:'#e2e8f0', marginTop:2 },
  date:{ color:'#64748b', fontSize:11, marginTop:4 },
  postCard:{ backgroundColor:'#1e293b', padding:14, borderRadius:10, marginBottom:8, borderWidth:1, borderColor:'#334155' },
  postLegenda:{ color:'#fff', fontStyle:'italic' },
  postRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:8 },
  postMeta:{ color:'#94a3b8', fontSize:12 },
  whatsBtn:{ backgroundColor:'#25D366', paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  whatsDisabled:{ opacity:0.5 },
  whatsText:{ color:'#fff', fontWeight:'bold' },
  btn:{ backgroundColor:'#38bdf8', padding:14, borderRadius:10, alignItems:'center', marginTop:12 },
  btnText:{ color:'#0f172a', fontWeight:'bold' },
  link:{ color:'#64748b', textAlign:'center', marginTop:12 },
});
