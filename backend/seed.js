/**
 * AIRV Incubação | Reservas – Seed Inicial
 * Popula a base de dados com dados de demonstração
 * Uso: node seed.js
 */

require('dotenv').config();
const db = require('./database');

console.log('\n🌱 AIRV Reservas – A popular base de dados...\n');

// ─── Sala Principal ───────────────────────────────────────
const existingRoom = db.prepare('SELECT id FROM rooms WHERE id = 1').get();
if (!existingRoom) {
  db.prepare(`
    INSERT INTO rooms (id, nome, descricao, capacidade, ativa)
    VALUES (1, 'Aquário', 'Sala de reuniões da Incubadora AIRV. Equipada com projetor Full HD, ecrã interativo, sistema de videoconferência, quadro branco, climatização e capacidade para 12 pessoas. Wi-Fi de alta velocidade disponível.', 12, 1)
  `).run();
  console.log('✅  Aquário criado');
} else {
  db.prepare(`UPDATE rooms SET nome = 'Aquário', descricao = 'Sala de reuniões da Incubadora AIRV. Equipada com projetor Full HD, ecrã interativo, sistema de videoconferência, quadro branco, climatização e capacidade para 12 pessoas. Wi-Fi de alta velocidade disponível.' WHERE id = 1`).run();
  console.log('✅  Sala atualizada para Aquário');
}

// ─── Empresas ─────────────────────────────────────────────
const companies = [
  { nome: 'AIRV – Administração',    email: 'geral@airv.pt',             telefone: '232 470 290' },
  { nome: 'TechStart, Lda',          email: 'info@techstart.pt',          telefone: '966 123 456' },
  { nome: 'InnoVision, Lda',         email: 'hello@innovision.pt',        telefone: '917 654 321' },
  { nome: 'GreenFuture Unipessoal',  email: 'contact@greenfuture.pt',     telefone: '933 111 222' },
  { nome: 'DataBridge Solutions',    email: 'team@databridge.pt',         telefone: '921 999 888' },
  { nome: 'HealthPlus Digital, Lda', email: 'info@healthplus.pt',         telefone: '912 777 666' },
];

companies.forEach((c) => {
  const exists = db.prepare('SELECT id FROM companies WHERE lower(nome) = lower(?)').get(c.nome);
  if (!exists) {
    db.prepare('INSERT INTO companies (nome, email, telefone) VALUES (?, ?, ?)').run(c.nome, c.email, c.telefone);
    console.log(`✅  Empresa criada: ${c.nome}`);
  } else {
    console.log(`⏭️  Empresa já existe: ${c.nome}`);
  }
});

// ─── Reservas de demonstração ─────────────────────────────
const now       = new Date();
const fmt       = (d) => d.toISOString().split('T')[0];
const addDays   = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

// Buscar IDs das empresas
const getCompanyId = (name) => db.prepare("SELECT id FROM companies WHERE nome LIKE ?").get(`%${name}%`)?.id;

const reservations = [
  // Hoje
  {
    company: 'TechStart', user_name: 'João Silva',   user_email: 'joao@techstart.pt',
    data: fmt(addDays(now, 0)), hora_inicio: '09:00', hora_fim: '10:30',
    finalidade: 'Reunião de equipa semanal', observacoes: 'Necessário projetor e marcadores para quadro.'
  },
  {
    company: 'InnoVision', user_name: 'Maria Santos', user_email: 'maria@innovision.pt',
    data: fmt(addDays(now, 0)), hora_inicio: '14:00', hora_fim: '15:30',
    finalidade: 'Reunião com investidores', observacoes: null
  },
  // Amanhã
  {
    company: 'GreenFuture', user_name: 'Carlos Ferreira', user_email: 'carlos@greenfuture.pt',
    data: fmt(addDays(now, 1)), hora_inicio: '10:00', hora_fim: '12:00',
    finalidade: 'Workshop de estratégia Q2', observacoes: 'Mesa em U, se possível.'
  },
  {
    company: 'DataBridge', user_name: 'Ana Lima', user_email: 'ana@databridge.pt',
    data: fmt(addDays(now, 1)), hora_inicio: '15:00', hora_fim: '16:00',
    finalidade: 'Demo produto para cliente', observacoes: 'Videoconferência às 15:00.'
  },
  // Daqui a 2 dias
  {
    company: 'HealthPlus', user_name: 'Miguel Costa', user_email: 'miguel@healthplus.pt',
    data: fmt(addDays(now, 2)), hora_inicio: '09:30', hora_fim: '11:00',
    finalidade: 'Formação da equipa de vendas', observacoes: null
  },
  {
    company: 'TechStart', user_name: 'Pedro Nunes', user_email: 'pedro@techstart.pt',
    data: fmt(addDays(now, 2)), hora_inicio: '14:00', hora_fim: '17:00',
    finalidade: 'Sprint planning', observacoes: 'Post-its e canetas necessários.'
  },
  // Semana seguinte
  {
    company: 'InnoVision', user_name: 'Sofia Rodrigues', user_email: 'sofia@innovision.pt',
    data: fmt(addDays(now, 7)), hora_inicio: '10:00', hora_fim: '11:00',
    finalidade: 'Board meeting mensal', observacoes: null
  },
  {
    company: 'AIRV', user_name: 'Administração AIRV', user_email: 'geral@airv.pt',
    data: fmt(addDays(now, 8)), hora_inicio: '09:00', hora_fim: '12:00',
    finalidade: 'Sessão de networking incubadas', observacoes: 'Evento aberto a todas as incubadas.'
  },
];

reservations.forEach((r) => {
  const company_id = getCompanyId(r.company);
  const company_name = db.prepare("SELECT nome FROM companies WHERE nome LIKE ?").get(`%${r.company}%`)?.nome || r.company;

  const exists = db.prepare(
    'SELECT id FROM reservations WHERE data = ? AND hora_inicio = ? AND room_id = 1'
  ).get(r.data, r.hora_inicio);

  if (!exists) {
    db.prepare(`
      INSERT INTO reservations (room_id, company_id, company_name, user_name, user_email, data, hora_inicio, hora_fim, finalidade, observacoes)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(company_id||null, company_name, r.user_name, r.user_email, r.data, r.hora_inicio, r.hora_fim, r.finalidade||null, r.observacoes||null);
    console.log(`✅  Reserva: ${company_name} — ${r.data} ${r.hora_inicio}–${r.hora_fim}`);
  } else {
    console.log(`⏭️  Reserva já existe: ${r.data} ${r.hora_inicio}`);
  }
});

console.log('\n🎉 Seed concluído! Base de dados pronta para demonstração.\n');
console.log('📋 Dados criados:');
console.log(`   • ${companies.length} empresas (incl. AIRV Administração)`);
console.log(`   • 1 sala (Aquário)`);
console.log(`   • ${reservations.length} reservas de demonstração`);
console.log('\n▶️  Inicia o servidor com: npm start\n');
