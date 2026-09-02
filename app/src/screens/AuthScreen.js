import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase, isSupabaseConfigured, mockDelay } from '../lib/supabase';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState('cadastro'); // cadastro | login

  const handleAuth = async () => {
    if (!email || !senha) return Alert.alert('Preencha e-mail e senha');
    if (modo === 'cadastro' && !nome) return Alert.alert('Informe seu nome');
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        await mockDelay();
        // Mock local: salva em memória e navega
        Alert.alert('Modo MOCK', `Cadastro ${nome} (${email}) sem Supabase. Configure EXPO_PUBLIC_SUPABASE_URL para usar backend real.`);
        navigation.navigate('Anamnese', { mockUser: { email, nome, cpf } });
        return;
      }
      if (modo === 'cadastro') {
        const { data, error } = await supabase.auth.signUp({ email, password: senha, options: { data: { nome, cpf } } });
        if (error) throw error;
        // cria profile (RLS agora permite insert com check true)
        if (data.user) {
          const { error: e2 } = await supabase.from('profiles').insert({
            id: data.user.id,
            gym_id: '00000000-0000-0000-0000-000000000001',
            role: 'aluno',
            nome,
            cpf: cpf.replace(/\D/g,'') || null,
          });
          if (e2) console.log('profile insert err', e2.message);
        }
        // Se já tem sessão (email confirm desabilitado), vai direto para Anamnese
        if (data.session) {
          Alert.alert('Conta criada', 'Bem-vinda! Vamos para anamnese.');
          navigation.navigate('Anamnese');
        } else {
          Alert.alert('Verifique seu e-mail', 'Confirme o cadastro e faça login. Se desabilitou confirmação no Dashboard Auth, faça login direto.');
          // Tenta login automático para UX
          const { error: e3 } = await supabase.auth.signInWithPassword({ email, password: senha });
          if (!e3) navigation.navigate('Anamnese');
          else setModo('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        navigation.navigate('Anamnese');
      }
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally { setLoading(false); }
  };

  const handleOAuth = (provider) => {
    Alert.alert('OAuth', `Login ${provider} - configure em Supabase Auth > Providers. No MVP navega direto.`);
    navigation.navigate('Anamnese', { mockUser: { email: `oauth_${provider}@mock.com`, nome: `Usuario ${provider}` } });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>AcademiaApp</Text>
      <Text style={styles.subtitle}>{modo === 'cadastro' ? 'Cadastro + OAuth Social' : 'Login'}</Text>
      {!isSupabaseConfigured && <Text style={styles.warn}>⚠️ Sem Supabase (.env) — modo MOCK ativo</Text>}

      {modo === 'cadastro' && (
        <>
          <TextInput style={styles.input} placeholder="Nome completo" placeholderTextColor="#64748b" value={nome} onChangeText={setNome} />
          <TextInput style={styles.input} placeholder="CPF (só números)" placeholderTextColor="#64748b" value={cpf} onChangeText={setCpf} keyboardType="numeric" maxLength={11} />
        </>
      )}
      <TextInput style={styles.input} placeholder="E-mail" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Senha" placeholderTextColor="#64748b" value={senha} onChangeText={setSenha} secureTextEntry />

      <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Aguarde...' : modo === 'cadastro' ? 'Criar conta' : 'Entrar'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setModo(modo === 'cadastro' ? 'login' : 'cadastro')}>
        <Text style={styles.link}>{modo === 'cadastro' ? 'Já tenho conta → Login' : 'Não tenho conta → Cadastro'}</Text>
      </TouchableOpacity>

      <View style={styles.divider} />
      <Text style={styles.oauthTitle}>OAuth Social (LGPD: permite_marcar_social)</Text>
      <View style={styles.oauthRow}>
        <TouchableOpacity style={styles.oauthBtn} onPress={() => handleOAuth('google')}><Text style={styles.oauthText}>Google</Text></TouchableOpacity>
        <TouchableOpacity style={styles.oauthBtn} onPress={() => handleOAuth('apple')}><Text style={styles.oauthText}>Apple</Text></TouchableOpacity>
        <TouchableOpacity style={styles.oauthBtn} onPress={() => handleOAuth('instagram')}><Text style={styles.oauthText}>Instagram</Text></TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.skip} onPress={() => navigation.navigate('Anamnese')}>
        <Text style={styles.skipText}>Pular → Anamnese (dev)</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ flexGrow:1, padding:20, backgroundColor:'#0f172a', paddingTop:40 },
  title:{ fontSize:26, fontWeight:'bold', color:'#fff', textAlign:'center' },
  subtitle:{ color:'#94a3b8', textAlign:'center', marginBottom:12 },
  warn:{ backgroundColor:'#451a03', color:'#fdba74', padding:8, borderRadius:8, marginBottom:12, textAlign:'center' },
  input:{ backgroundColor:'#1e293b', color:'#fff', padding:14, borderRadius:10, marginBottom:10, borderWidth:1, borderColor:'#334155' },
  btnPrimary:{ backgroundColor:'#38bdf8', padding:14, borderRadius:10, alignItems:'center', marginTop:8 },
  btnText:{ color:'#0f172a', fontWeight:'bold' },
  link:{ color:'#38bdf8', textAlign:'center', marginTop:12 },
  divider:{ height:1, backgroundColor:'#334155', marginVertical:20 },
  oauthTitle:{ color:'#64748b', textAlign:'center', marginBottom:8 },
  oauthRow:{ flexDirection:'row', gap:8, justifyContent:'center' },
  oauthBtn:{ backgroundColor:'#1e293b', padding:12, borderRadius:8, borderWidth:1, borderColor:'#334155', minWidth:90, alignItems:'center' },
  oauthText:{ color:'#fff', fontWeight:'600' },
  skip:{ marginTop:20, alignItems:'center' },
  skipText:{ color:'#64748b' },
});
