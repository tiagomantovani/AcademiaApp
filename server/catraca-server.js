// Servidor Catraca - Teste com Catraca Física
// Roda em http://192.168.3.200:3001
// Catraca deve fazer POST http://192.168.3.200:3001/api/catraca/verificar { cpf: "123", catraca_id: "uuid"}
// Supabase Free: configure SUPABASE_URL e SUPABASE_KEY no .env

const http = require('http');
const url = require('url');

const PORT = 3001;
const HOST = '0.0.0.0'; // escuta na rede para catraca acessar via 192.168.3.200

// Mock + Supabase Real (se .env existir usa Supabase, senão mock)
require('fs').existsSync(require('path').join(__dirname,'.env')) && require('dotenv')?.config?.();
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    console.log('✅ Supabase conectado:', process.env.SUPABASE_URL);
  } else {
    console.log('⚠️  Sem .env -> usando MOCK (crie server/.env para usar Supabase real)');
  }
} catch(e) { console.log('⚠️  Supabase não configurado, usando MOCK:', e.message); }

const mockAlunos = {
  '00000000000': { id: 'aluno-mock-1', nome: 'João Teste', mensalidade: 'paga', treino: 'ativo', anamnese_valida: true },
  '11111111111': { id: 'aluno-mock-2', nome: 'Maria Inadimplente', mensalidade: 'atrasada', treino: 'ativo', anamnese_valida: true },
};

async function verificarAcesso(cpf, catraca_id) {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // --- MODO REAL: Supabase ---
  if (supabase) {
    // Busca aluno por CPF
    const { data: profile } = await supabase.from('profiles').select('id,nome,gym_id').eq('cpf', cpfLimpo).single();
    if (!profile) return { liberado: false, motivo: 'Aluno não encontrado', display: 'NAO CADASTRADO' };
    
    // Verifica mensalidade (vencimento >= hoje e status paga)
    const hoje = new Date().toISOString().split('T')[0];
    const { data: mensalidade } = await supabase.from('mensalidades').select('status,vencimento').eq('aluno_id', profile.id).gte('vencimento', hoje).eq('status','paga').limit(1).maybeSingle();
    // Se não tem mensalidade paga válida, pega a mais recente para mensagem
    const { data: ultima } = await supabase.from('mensalidades').select('status').eq('aluno_id', profile.id).order('vencimento', {ascending:false}).limit(1).maybeSingle();
    if (!mensalidade) {
      const motivo = ultima?.status === 'atrasada' ? 'Mensalidade atrasada' : 'Mensalidade pendente';
      return { liberado: false, motivo, aluno: profile.nome, display: motivo.toUpperCase(), profile };
    }
    // Verifica anamnese válida
    const { data: anamnese } = await supabase.from('anamneses').select('validade_ate').eq('aluno_id', profile.id).gte('validade_ate', hoje).limit(1).maybeSingle();
    if (!anamnese) return { liberado: false, motivo: 'Anamnese vencida', aluno: profile.nome, display: 'ANAMNESE VENCIDA', profile };
    // Verifica treino ativo
    const { data: treino } = await supabase.from('treinos').select('id').eq('aluno_id', profile.id).eq('status','ativo').limit(1).maybeSingle();
    if (!treino) return { liberado: false, motivo: 'Sem treino ativo', aluno: profile.nome, display: 'SEM TREINO', profile };
    
    return { liberado: true, motivo: null, aluno: profile.nome, display: 'BEM VINDO! ' + profile.nome.split(' ')[0].toUpperCase(), profile };
  }
  
  // --- MODO MOCK ---
  const aluno = mockAlunos[cpfLimpo];
  if (!aluno) return { liberado: false, motivo: 'Aluno não encontrado', display: 'NAO CADASTRADO' };
  if (aluno.mensalidade === 'atrasada') return { liberado: false, motivo: 'Mensalidade atrasada', aluno: aluno.nome, display: 'MENSALIDADE ATRASADA' };
  if (!aluno.anamnese_valida) return { liberado: false, motivo: 'Anamnese vencida', aluno: aluno.nome, display: 'ANAMNESE VENCIDA' };
  if (aluno.treino !== 'ativo') return { liberado: false, motivo: 'Sem treino ativo', aluno: aluno.nome, display: 'SEM TREINO' };
  return { liberado: true, motivo: null, aluno: aluno.nome, display: 'BEM VINDO! ' + aluno.nome.split(' ')[0].toUpperCase() };
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  
  // CORS para catraca e app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  
  if (req.method === 'GET' && parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', ip: '192.168.3.200', port: PORT, mock_alunos: Object.keys(mockAlunos) }));
  }
  
  if (req.method === 'POST' && parsed.pathname === '/api/catraca/verificar') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const cpf = data.cpf || data.cpf_digitado || data.codigo || '';
        const catraca_id = data.catraca_id || null;
        
        console.log(`[${new Date().toISOString()}] Catraca ${catraca_id || 'mock'} -> CPF: ${cpf}`);
        const resultado = await verificarAcesso(cpf, catraca_id);
        console.log(`  -> ${resultado.liberado ? 'LIBERADO' : 'BLOQUEADO'}: ${resultado.motivo || resultado.display}`);
        
        // Grava log no Supabase se conectado
        if (supabase && resultado.profile) {
          await supabase.from('acesso_logs').insert({
            aluno_id: resultado.profile.id,
            gym_id: resultado.profile.gym_id,
            catraca_id: catraca_id,
            liberado: resultado.liberado,
            motivo_bloqueio: resultado.motivo,
            origem: 'catraca',
            cpf_digitado: cpf.replace(/\D/g,'')
          });
          if (resultado.liberado) {
            await supabase.from('check_ins').insert({ aluno_id: resultado.profile.id, gym_id: resultado.profile.gym_id, origem: 'catraca' });
          }
        } else if (supabase) {
          await supabase.from('acesso_logs').insert({ gym_id: process.env.GYM_ID, liberado: false, motivo_bloqueio: resultado.motivo, origem: 'catraca', cpf_digitado: cpf });
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          liberado: resultado.liberado,
          liberar: resultado.liberado,
          acesso: resultado.liberado ? 1 : 0,
          display: resultado.display,
          motivo: resultado.motivo,
          aluno: resultado.aluno || null,
          tempo_abertura: resultado.liberado ? 5 : 0
        }));
        
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ liberado: false, motivo: 'JSON inválido: ' + e.message }));
      }
    });
    return;
  }
  
  if (req.method === 'GET' && parsed.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`
      <h1>AcademiaApp - Servidor Catraca</h1>
      <p>Rodando em http://192.168.3.200:${PORT}</p>
      <p>Teste: POST /api/catraca/verificar { "cpf": "00000000000" } => LIBERADO</p>
      <p>Teste: POST /api/catraca/verificar { "cpf": "11111111111" } => BLOQUEADO (mensalidade)</p>
      <p>Health: <a href="/health">/health</a></p>
      <hr>
      <form onsubmit="testar(event)">
        <input id="cpf" placeholder="CPF" value="00000000000">
        <button>Testar</button>
      </form>
      <pre id="out"></pre>
      <script>
        async function testar(e){
          e.preventDefault();
          const cpf=document.getElementById('cpf').value;
          const r=await fetch('/api/catraca/verificar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cpf})});
          document.getElementById('out').textContent=JSON.stringify(await r.json(),null,2);
        }
      </script>
    `);
  }
  
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, HOST, () => {
  console.log(`✅ Servidor Catraca rodando em http://${HOST}:${PORT}`);
  console.log(`   Rede local: http://192.168.3.200:${PORT}`);
  console.log(`   Teste LIBERADO: curl -X POST http://192.168.3.200:${PORT}/api/catraca/verificar -H \"Content-Type: application/json\" -d '{\"cpf\":\"00000000000\"}'`);
  console.log(`   Teste BLOQUEADO: curl -X POST http://192.168.3.200:${PORT}/api/catraca/verificar -H \"Content-Type: application/json\" -d '{\"cpf\":\"11111111111\"}'`);
});
