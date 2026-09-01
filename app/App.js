import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>AcademiaApp - Protótipo</Text>
        <Text style={styles.subtitle}>Multi-Gym + IA + LGPD Safe (Opção B)</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ Banco Criado</Text>
          <Text>14 tabelas em supabase/schema.sql</Text>
          <Text>80 exercícios ACSM 2025 em seed_exercicios.sql</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔄 Ciclo 30 Sessões</Text>
          <Text>QR Code (a) + Professor (b) = sessão comprovada</Text>
          <Text>30/30 => Treino concluído + novo treino automático</Text>
          <Text>Saudável: IA 100% | Comorbidade: Personal valida</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📱 Próximas Telas</Text>
          <Text>1. Cadastro + OAuth Social</Text>
          <Text>2. Anamnese + PAR-Q (LGPD)</Text>
          <Text>3. Treino Ativo (28/30)</Text>
          <Text>4. QR Check-in</Text>
          <Text>5. Pix via WhatsApp (validação humana)</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📲 WhatsApp IA (Opção B LGPD)</Text>
          <Text>Conquista 5 dias => Envia via WhatsApp para aluno postar</Text>
          <Text>Não posta direto no Insta da academia</Text>
        </View>

        <Text style={styles.footer}>Docs: docs/CICLO_DE_VIDA.md</Text>
        <StatusBar style="auto" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', paddingTop: 50 },
  scroll: { padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  card: { backgroundColor: '#1e293b', padding: 16, borderRadius: 12, width: '100%', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#38bdf8', marginBottom: 6 },
  footer: { color: '#64748b', marginTop: 20, fontSize: 12 }
});
