import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { supabase, isSupabaseConfigured, mockDelay } from '../lib/supabase';

export default function PixScreen({ navigation, route }) {
  const [planos, setPlanos] = useState([]);
  const [planoSel, setPlanoSel] = useState(null);
  const [valor, setValor] = useState('');
  const [txid, setTxid] = useState('');
  const [mensalidade, setMensalidade] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);

  const carregar = async () => {
    if (!isSupabaseConfigured) {
      setPlanos([{id:'m', nome:'Mensal 30/30d', valor:149.90}, {id:'t', nome:'Trimestral 90/90d', valor:379.90}, {id:'a', nome:'Anual 360/365d', valor:1299.90}]);
      setPlanoSel({id:'m', nome:'Mensal 30/30d', valor:149.90});
      setValor('149.90');
      return;
    }
    const { data } = await supabase.from('planos').select('id,nome,valor,duracao_dias,sessoes_inclusas').eq('status','ativo');
    if (data) { setPlanos(data); if (data[0]) { setPlanoSel(data[0]); setValor(String(data[0].valor)); } }
    const { data:{user} } = await supabase.auth.getUser();
    if (user) {
      const { data: mens } = await supabase.from('mensalidades').select('*').eq('aluno_id', user.id).order('vencimento',{ascending:false}).limit(1).maybeSingle();
      setMensalidade(mens);
      const { data: pays } = await supabase.from('pagamentos_pix').select('*').eq('aluno_id', user.id).order('created_at',{ascending:false}).limit(5);
      setPagamentos(pays||[]);
    }
  };
  useEffect(()=>{ carregar(); },[]);

  const handlePagar = async () => {
    if (!planoSel) return Alert.alert('Selecione um plano');
    if (!valor) return Alert.alert('Informe valor');
    if (!isSupabaseConfigured) {
      await mockDelay();
      Alert.alert('MOCK', `Pix ${planoSel.nome} R$${valor} enviado para pix@academiapiloto.com.br. Aguardando atendente validar via WhatsApp (mock).`);
      return;
    }
    try {
      const { data:{user} } = await supabase.auth.getUser();
      if (!user) throw new Error('Faça login');
      const { data: profile } = await supabase.from('profiles').select('gym_id').eq('id', user.id).single();
      const gymId = profile?.gym_id || '00000000-0000-0000-0000-000000000001';
      // Cria mensalidade pendente se não houver
      let mensId = mensalidade?.id;
      if (!mensId || mensalidade.status==='paga') {
        const venc = new Date(Date.now()+planoSel.duracao_dias*24*3600*1000).toISOString().split('T')[0];
        const { data: nova, error:e1 } = await supabase.from('mensalidades').insert({
          aluno_id: user.id, gym_id: gymId, plano_id: planoSel.id, vencimento: venc, valor: parseFloat(valor), status:'pendente'
        }).select().single();
        if (e1) throw e1;
        mensId = nova.id;
      }
      const { error } = await supabase.from('pagamentos_pix').insert({
        mensalidade_id: mensId, aluno_id: user.id, valor_informado: parseFloat(valor), pix_txid: txid || null, status:'aguardando_validacao', comprovante_url: 'mock_url'
      });
      if (error) throw error;
      Alert.alert('Enviado', `Pix R$${valor} enviado. Atendente validará via WhatsApp. Chave Pix: pix@academiapiloto.com.br`);
      carregar();
    } catch(e){ Alert.alert('Erro', e.message); }
  };

  const handleMigrar = async (destino) => {
    Alert.alert('Migração', `Regra: ${planoSel?.nome} → ${destino.nome}\nTipo: prorata_dias_restantes com desconto.\nValor cheio diferença: R$${(destino.valor - (planoSel?.valor||0)).toFixed(2)}\n\nDeixamos estrutura pronta em plano_migracao_regras. Quando implementar billing, calcularemos pró-rata automático.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Pix via WhatsApp</Text>
      <Text style={styles.sub}>Validação humana — comprovante via WhatsApp → atendente aprova</Text>

      <Text style={styles.label}>Planos (regras editáveis em plano_migracao_regras)</Text>
      {planos.map(p=>(
        <TouchableOpacity key={p.id} style={[styles.planoCard, planoSel?.id===p.id && styles.planoActive]} onPress={()=>{ setPlanoSel(p); setValor(String(p.valor)); }}>
          <Text style={[styles.planoNome, planoSel?.id===p.id && styles.planoNomeActive]}>{p.nome}</Text>
          <Text style={styles.planoDet}>R${p.valor} • {p.sessoes_inclusas||'?'} sess • {p.duracao_dias||'?'}d • R${(p.valor/(p.sessoes_inclusas||30)).toFixed(2)}/sess</Text>
        </TouchableOpacity>
      ))}

      {mensalidade && (
        <View style={styles.mensCard}>
          <Text style={styles.mensTitle}>Mensalidade atual</Text>
          <Text style={styles.mensText}>Venc: {mensalidade.vencimento} • R${mensalidade.valor} • {mensalidade.status}</Text>
          {mensalidade.status!=='paga' && <Text style={styles.warn}>⚠️ Pendente — faça Pix abaixo</Text>}
        </View>
      )}

      <Text style={styles.label}>Valor informado (Pix)</Text>
      <TextInput style={styles.input} value={valor} onChangeText={setValor} keyboardType="numeric" placeholder="149.90" placeholderTextColor="#64748b" />
      <Text style={styles.label}>TxID / código comprovante (opcional mock)</Text>
      <TextInput style={styles.input} value={txid} onChangeText={setTxid} placeholder="pix_txid_mock_123" placeholderTextColor="#64748b" />

      <TouchableOpacity style={styles.btnPrimary} onPress={handlePagar}>
        <Text style={styles.btnText}>📲 Enviar Pix (chave: pix@academiapiloto.com.br)</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>Mock: envia para fila aguardando_validacao. Atendente valida em dashboard → mensalidade vira paga.</Text>

      <Text style={[styles.label,{marginTop:16}]}>Migração de plano (estrutura pronta)</Text>
      <Text style={styles.hint}>Regras em plano_migracao_regras: prorata_dias_restantes com desconto 10-15%. Ex: Mensal→Anual calcula (valor_destino - valor_origem) * dias_restantes/duracao.</Text>
      <View style={styles.migrRow}>
        {planos.filter(p=>p.id!==planoSel?.id).slice(0,2).map(p=>(
          <TouchableOpacity key={p.id} style={styles.migrBtn} onPress={()=>handleMigrar(p)}>
            <Text style={styles.migrText}>→ {p.nome.split(' ')[0]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {pagamentos.length>0 && (
        <View style={styles.hist}>
          <Text style={styles.histTitle}>Histórico Pix</Text>
          {pagamentos.map(p=>(
            <View key={p.id} style={styles.histItem}>
              <Text style={styles.histText}>R${p.valor_informado} • {p.status} • {new Date(p.created_at).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={()=>navigation.navigate('Treino')}><Text style={styles.link}>← Voltar ao Treino</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:'#0f172a', paddingBottom:40 },
  title:{ fontSize:22, fontWeight:'bold', color:'#fff' },
  sub:{ color:'#94a3b8', marginBottom:12 },
  label:{ color:'#e2e8f0', fontWeight:'600', marginTop:10, marginBottom:6 },
  planoCard:{ backgroundColor:'#1e293b', padding:12, borderRadius:10, marginBottom:8, borderWidth:1, borderColor:'#334155' },
  planoActive:{ borderColor:'#38bdf8', backgroundColor:'#1e3a5f' },
  planoNome:{ color:'#fff', fontWeight:'bold' },
  planoNomeActive:{ color:'#38bdf8' },
  planoDet:{ color:'#94a3b8', fontSize:12 },
  mensCard:{ backgroundColor:'#1e293b', padding:12, borderRadius:10, marginTop:10, borderWidth:1, borderColor:'#334155' },
  mensTitle:{ color:'#38bdf8', fontWeight:'bold' },
  mensText:{ color:'#e2e8f0' },
  warn:{ color:'#fbbf24', marginTop:4 },
  input:{ backgroundColor:'#1e293b', color:'#fff', padding:12, borderRadius:8, borderWidth:1, borderColor:'#334155' },
  btnPrimary:{ backgroundColor:'#22c55e', padding:14, borderRadius:10, alignItems:'center', marginTop:12 },
  btnText:{ color:'#fff', fontWeight:'bold' },
  hint:{ color:'#64748b', fontSize:12, marginTop:6, textAlign:'center' },
  migrRow:{ flexDirection:'row', gap:8, marginTop:8 },
  migrBtn:{ backgroundColor:'#334155', padding:12, borderRadius:8, flex:1, alignItems:'center' },
  migrText:{ color:'#fff', fontWeight:'600' },
  hist:{ backgroundColor:'#1e293b', padding:12, borderRadius:10, marginTop:16, borderWidth:1, borderColor:'#334155' },
  histTitle:{ color:'#e2e8f0', fontWeight:'bold', marginBottom:6 },
  histItem:{ paddingVertical:4 },
  histText:{ color:'#94a3b8', fontSize:12 },
  link:{ color:'#64748b', textAlign:'center', marginTop:14 },
});
