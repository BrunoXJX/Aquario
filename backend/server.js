/**
 * ═══════════════════════════════════════════════════════════════
 * AIRV Incubação | Reservas – API Backend
 * Express.js + SQLite (better-sqlite3)
 * Porta: 3001
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const db      = require('./database');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','OPTIONS'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString('pt-PT')}] ${req.method} ${req.url}`);
    next();
  });
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const checkConflict = (room_id, data, hora_inicio, hora_fim, exclude_id = null) => {
  let query = `
    SELECT id, company_name, user_name, hora_inicio, hora_fim
    FROM reservations
    WHERE room_id = ?
      AND data    = ?
      AND estado = 'confirmada'
      AND hora_inicio < ?
      AND hora_fim    > ?
  `;
  const params = [room_id, data, hora_fim, hora_inicio];

  if (exclude_id) {
    query += ' AND id != ?';
    params.push(exclude_id);
  }

  return db.prepare(query).all(...params);
};

const validateReservationTime = (hora_inicio, hora_fim, settings) => {
  const start    = toMinutes(hora_inicio);
  const end      = toMinutes(hora_fim);
  const open     = toMinutes(settings.opening_hour);
  const close    = toMinutes(settings.closing_hour);
  const duration = end - start;

  if (start >= end)          return `A hora de início deve ser anterior à hora de fim.`;
  if (start < open)          return `A sala abre às ${settings.opening_hour}. Horário inválido.`;
  if (end > close)           return `A sala fecha às ${settings.closing_hour}. Horário inválido.`;
  if (duration < settings.min_duration)
    return `Duração mínima é ${settings.min_duration} min. (${Math.floor(settings.min_duration/60)}h${settings.min_duration%60 ? settings.min_duration%60+'min' : ''}).`;
  if (duration > settings.max_duration)
    return `Duração máxima é ${settings.max_duration / 60}h.`;

  return null;
};

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AIRV Reservas API', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
app.get('/api/settings', (_req, res) => {
  const s = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  res.json(s);
});

app.put('/api/settings', (req, res) => {
  const { opening_hour, closing_hour, slot_interval, min_duration, max_duration, buffer_minutes } = req.body;

  // Validate hours
  if (opening_hour && closing_hour && toMinutes(opening_hour) >= toMinutes(closing_hour)) {
    return res.status(400).json({ error: 'Horário de abertura deve ser antes do encerramento.' });
  }

  db.prepare(`
    UPDATE settings SET
      opening_hour   = COALESCE(?, opening_hour),
      closing_hour   = COALESCE(?, closing_hour),
      slot_interval  = COALESCE(?, slot_interval),
      min_duration   = COALESCE(?, min_duration),
      max_duration   = COALESCE(?, max_duration),
      buffer_minutes = COALESCE(?, buffer_minutes)
    WHERE id = 1
  `).run(opening_hour||null, closing_hour||null, slot_interval||null, min_duration||null, max_duration||null, buffer_minutes??null);

  res.json(db.prepare('SELECT * FROM settings WHERE id = 1').get());
});

// ═══════════════════════════════════════════
// COMPANIES
// ═══════════════════════════════════════════
app.get('/api/companies', (_req, res) => {
  const companies = db.prepare('SELECT * FROM companies WHERE ativa = 1 ORDER BY nome COLLATE NOCASE').all();
  res.json(companies);
});

app.get('/api/companies/all', (_req, res) => {
  const companies = db.prepare('SELECT * FROM companies ORDER BY nome COLLATE NOCASE').all();
  res.json(companies);
});

app.post('/api/companies', (req, res) => {
  const { nome, email, telefone } = req.body;
  if (!nome?.trim()) return res.status(400).json({ error: 'Nome da empresa é obrigatório.' });

  const exists = db.prepare('SELECT id FROM companies WHERE lower(nome) = lower(?)').get(nome.trim());
  if (exists) return res.status(409).json({ error: 'Já existe uma empresa com este nome.' });

  const result = db.prepare('INSERT INTO companies (nome, email, telefone) VALUES (?, ?, ?)').run(nome.trim(), email||null, telefone||null);
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(company);
});

app.put('/api/companies/:id', (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, ativa } = req.body;

  const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Empresa não encontrada.' });

  db.prepare(`
    UPDATE companies SET
      nome     = COALESCE(?, nome),
      email    = COALESCE(?, email),
      telefone = COALESCE(?, telefone),
      ativa    = COALESCE(?, ativa)
    WHERE id = ?
  `).run(nome||null, email||null, telefone||null, ativa??null, id);

  res.json(db.prepare('SELECT * FROM companies WHERE id = ?').get(id));
});

// ═══════════════════════════════════════════
// ROOMS
// ═══════════════════════════════════════════
app.get('/api/rooms', (_req, res) => {
  res.json(db.prepare('SELECT * FROM rooms WHERE ativa = 1').all());
});

// ═══════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════
app.get('/api/dashboard/today', (_req, res) => {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const todayReservations = db.prepare(`
    SELECT r.*, c.nome as company_nome
    FROM reservations r
    LEFT JOIN companies c ON r.company_id = c.id
    WHERE r.data = ? AND r.estado != 'cancelada'
    ORDER BY r.hora_inicio
  `).all(today);

  const upcoming = db.prepare(`
    SELECT r.*, c.nome as company_nome
    FROM reservations r
    LEFT JOIN companies c ON r.company_id = c.id
    WHERE (r.data > ? OR (r.data = ? AND r.hora_inicio > ?))
      AND r.estado != 'cancelada'
    ORDER BY r.data, r.hora_inicio
    LIMIT 5
  `).all(today, today, currentTime);

  const currentReservation = todayReservations.find(r =>
    r.hora_inicio <= currentTime && r.hora_fim > currentTime
  ) || null;

  const nextTodayRes = todayReservations.find(r => r.hora_inicio > currentTime) || null;

  let salaStatus = 'livre';
  if (currentReservation) salaStatus = 'ocupada';
  else if (nextTodayRes) salaStatus = 'reservada-em-breve';

  const statsMonth = db.prepare(`
    SELECT COUNT(*) as count FROM reservations
    WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
      AND estado != 'cancelada'
  `).get();

  const statsCompanies = db.prepare('SELECT COUNT(*) as count FROM companies WHERE ativa = 1').get();
  const statsWeek      = db.prepare(`
    SELECT COUNT(*) as count FROM reservations
    WHERE data BETWEEN date('now') AND date('now','+6 days')
      AND estado != 'cancelada'
  `).get();

  res.json({
    today,
    currentTime,
    salaStatus,
    currentReservation,
    nextReservation: nextTodayRes,
    todayReservations,
    upcoming,
    stats: {
      totalHoje:    todayReservations.length,
      totalSemana:  statsWeek.count,
      totalMes:     statsMonth.count,
      totalEmpresas: statsCompanies.count
    }
  });
});

// ═══════════════════════════════════════════
// RESERVATIONS
// ═══════════════════════════════════════════
app.get('/api/reservations', (req, res) => {
  const {
    date, start_date, end_date, company_id,
    status, limit = 200, offset = 0
  } = req.query;

  let query  = `
    SELECT r.*, c.nome as company_nome
    FROM reservations r
    LEFT JOIN companies c ON r.company_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (date)       { query += ' AND r.data = ?';       params.push(date); }
  if (start_date) { query += ' AND r.data >= ?';      params.push(start_date); }
  if (end_date)   { query += ' AND r.data <= ?';      params.push(end_date); }
  if (company_id) { query += ' AND r.company_id = ?'; params.push(company_id); }
  if (status)     { query += ' AND r.estado = ?';     params.push(status); }

  query += ' ORDER BY r.data DESC, r.hora_inicio DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  res.json(db.prepare(query).all(...params));
});

// Verificar conflitos (sem criar)
app.post('/api/reservations/check', (req, res) => {
  const { room_id = 1, data, hora_inicio, hora_fim, exclude_id } = req.body;
  if (!data || !hora_inicio || !hora_fim)
    return res.status(400).json({ error: 'data, hora_inicio e hora_fim são obrigatórios.' });

  const conflicts = checkConflict(room_id, data, hora_inicio, hora_fim, exclude_id || null);
  res.json({ hasConflict: conflicts.length > 0, conflicts });
});

// Criar reserva
app.post('/api/reservations', (req, res) => {
  const {
    room_id = 1, company_id, company_name,
    user_name, user_email, data, hora_inicio, hora_fim,
    observacoes, finalidade
  } = req.body;

  // Validação de campos obrigatórios
  const missing = [];
  if (!company_name?.trim()) missing.push('nome da empresa');
  if (!user_name?.trim())    missing.push('nome do responsável');
  if (!user_email?.trim())   missing.push('email');
  if (!data)                 missing.push('data');
  if (!hora_inicio)          missing.push('hora de início');
  if (!hora_fim)             missing.push('hora de fim');
  if (missing.length > 0)
    return res.status(400).json({ error: `Campos obrigatórios em falta: ${missing.join(', ')}.` });

  // Validação de email básica
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user_email))
    return res.status(400).json({ error: 'Email inválido.' });

  // Validação de data (não aceitar datas passadas)
  const today = new Date().toISOString().split('T')[0];
  if (data < today)
    return res.status(400).json({ error: 'Não é possível reservar para uma data passada.' });

  // Validação de horário
  const settings  = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const timeError = validateReservationTime(hora_inicio, hora_fim, settings);
  if (timeError) return res.status(400).json({ error: timeError });

  // Data bloqueada?
  const blocked = db.prepare('SELECT id FROM blocked_dates WHERE data = ?').get(data);
  if (blocked) return res.status(400).json({ error: 'Esta data está bloqueada para reservas. Contacte a administração AIRV.' });

  // Verificar conflitos
  const conflicts = checkConflict(room_id, data, hora_inicio, hora_fim);
  if (conflicts.length > 0) {
    return res.status(409).json({
      error: 'Existe um conflito de horário com outra reserva.',
      conflicts: conflicts.map(c => `${c.company_name} (${c.hora_inicio}–${c.hora_fim})`)
    });
  }

  // Estado: se vem do admin (req.query.admin ou req.body.estado), usa 'confirmada'; senão, 'pendente'
  const estadoInicial = req.body.estado === 'confirmada' ? 'confirmada' : 'pendente';

  const result = db.prepare(`
    INSERT INTO reservations
      (room_id, company_id, company_name, user_name, user_email, data, hora_inicio, hora_fim, observacoes, finalidade, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    room_id,
    company_id ? parseInt(company_id) : null,
    company_name.trim(),
    user_name.trim(),
    user_email.trim().toLowerCase(),
    data,
    hora_inicio,
    hora_fim,
    observacoes?.trim() || null,
    finalidade?.trim() || null,
    estadoInicial
  );

  const reservation = db.prepare(`
    SELECT r.*, c.nome as company_nome
    FROM reservations r
    LEFT JOIN companies c ON r.company_id = c.id
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(reservation);
});

// Obter reserva por ID
app.get('/api/reservations/:id', (req, res) => {
  const r = db.prepare(`
    SELECT r.*, c.nome as company_nome
    FROM reservations r
    LEFT JOIN companies c ON r.company_id = c.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!r) return res.status(404).json({ error: 'Reserva não encontrada.' });
  res.json(r);
});

// Editar reserva
app.put('/api/reservations/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(id);

  if (!existing) return res.status(404).json({ error: 'Reserva não encontrada.' });
  if (existing.estado === 'cancelada')
    return res.status(400).json({ error: 'Não é possível editar uma reserva cancelada.' });

  const {
    room_id, company_id, company_name, user_name, user_email,
    data, hora_inicio, hora_fim, observacoes, finalidade, estado
  } = req.body;

  const newData   = data       || existing.data;
  const newStart  = hora_inicio || existing.hora_inicio;
  const newEnd    = hora_fim    || existing.hora_fim;
  const newRoom   = room_id    || existing.room_id;

  // Validar data
  const today = new Date().toISOString().split('T')[0];
  if (newData < today)
    return res.status(400).json({ error: 'Não é possível mover uma reserva para uma data passada.' });

  const settings  = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  const timeError = validateReservationTime(newStart, newEnd, settings);
  if (timeError) return res.status(400).json({ error: timeError });

  const conflicts = checkConflict(newRoom, newData, newStart, newEnd, id);
  if (conflicts.length > 0) {
    return res.status(409).json({
      error: 'Existe conflito de horário com outra reserva.',
      conflicts: conflicts.map(c => `${c.company_name} (${c.hora_inicio}–${c.hora_fim})`)
    });
  }

  db.prepare(`
    UPDATE reservations SET
      room_id      = COALESCE(?, room_id),
      company_id   = COALESCE(?, company_id),
      company_name = COALESCE(?, company_name),
      user_name    = COALESCE(?, user_name),
      user_email   = COALESCE(?, user_email),
      data         = COALESCE(?, data),
      hora_inicio  = COALESCE(?, hora_inicio),
      hora_fim     = COALESCE(?, hora_fim),
      observacoes  = COALESCE(?, observacoes),
      finalidade   = COALESCE(?, finalidade),
      estado       = COALESCE(?, estado),
      updated_at   = datetime('now','localtime')
    WHERE id = ?
  `).run(
    room_id||null, company_id||null, company_name||null,
    user_name||null, user_email||null, data||null,
    hora_inicio||null, hora_fim||null,
    observacoes||null, finalidade||null, estado||null,
    id
  );

  res.json(db.prepare(`
    SELECT r.*, c.nome as company_nome
    FROM reservations r LEFT JOIN companies c ON r.company_id = c.id
    WHERE r.id = ?
  `).get(id));
});

// Cancelar reserva
app.delete('/api/reservations/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Reserva não encontrada.' });
  if (existing.estado === 'cancelada')
    return res.status(400).json({ error: 'Reserva já cancelada.' });

  db.prepare(`
    UPDATE reservations SET estado = 'cancelada', updated_at = datetime('now','localtime') WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: 'Reserva cancelada com sucesso.', id: parseInt(req.params.id) });
});

// Confirmar reserva pendente
app.put('/api/reservations/:id/confirm', (req, res) => {
  const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Reserva não encontrada.' });
  if (existing.estado !== 'pendente')
    return res.status(400).json({ error: 'Apenas reservas pendentes podem ser confirmadas.' });

  // Verificar conflitos com reservas já confirmadas
  const conflicts = checkConflict(existing.room_id, existing.data, existing.hora_inicio, existing.hora_fim, existing.id);
  if (conflicts.length > 0) {
    return res.status(409).json({
      error: 'Existe conflito com outra reserva confirmada.',
      conflicts: conflicts.map(c => `${c.company_name} (${c.hora_inicio}–${c.hora_fim})`)
    });
  }

  db.prepare(`UPDATE reservations SET estado = 'confirmada', updated_at = datetime('now','localtime') WHERE id = ?`).run(req.params.id);
  const updated = db.prepare('SELECT r.*, c.nome as company_nome FROM reservations r LEFT JOIN companies c ON r.company_id = c.id WHERE r.id = ?').get(req.params.id);
  res.json(updated);
});

// Rejeitar reserva pendente
app.put('/api/reservations/:id/reject', (req, res) => {
  const existing = db.prepare('SELECT * FROM reservations WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Reserva não encontrada.' });
  if (existing.estado !== 'pendente')
    return res.status(400).json({ error: 'Apenas reservas pendentes podem ser rejeitadas.' });

  db.prepare(`UPDATE reservations SET estado = 'rejeitada', updated_at = datetime('now','localtime') WHERE id = ?`).run(req.params.id);
  res.json({ success: true, message: 'Reserva rejeitada.', id: parseInt(req.params.id) });
});

// Contar pendentes
app.get('/api/dashboard/pending', (_req, res) => {
  const count = db.prepare("SELECT COUNT(*) as c FROM reservations WHERE estado = 'pendente'").get();
  const pending = db.prepare(`
    SELECT r.*, c.nome as company_nome
    FROM reservations r LEFT JOIN companies c ON r.company_id = c.id
    WHERE r.estado = 'pendente'
    ORDER BY r.data, r.hora_inicio
  `).all();
  res.json({ count: count.c, pending });
});

// ═══════════════════════════════════════════
// BLOCKED DATES
// ═══════════════════════════════════════════
app.get('/api/blocked-dates', (_req, res) => {
  res.json(db.prepare('SELECT * FROM blocked_dates ORDER BY data').all());
});

app.post('/api/blocked-dates', (req, res) => {
  const { data, motivo } = req.body;
  if (!data) return res.status(400).json({ error: 'Data é obrigatória.' });

  try {
    const result = db.prepare('INSERT INTO blocked_dates (data, motivo) VALUES (?, ?)').run(data, motivo||null);
    // Cancelar reservas nessa data
    db.prepare(`UPDATE reservations SET estado='cancelada', updated_at=datetime('now','localtime') WHERE data=? AND estado!='cancelada'`).run(data);
    res.status(201).json({ id: result.lastInsertRowid, data, motivo: motivo||null });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Esta data já está bloqueada.' });
    throw err;
  }
});

app.delete('/api/blocked-dates/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM blocked_dates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Data bloqueada não encontrada.' });
  db.prepare('DELETE FROM blocked_dates WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: `Data ${existing.data} desbloqueada.` });
});

// ═══════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════
app.get('/api/admin/stats', (_req, res) => {
  res.json({
    totalReservations:   db.prepare("SELECT COUNT(*) as c FROM reservations WHERE estado != 'cancelada'").get().c,
    totalCancelled:      db.prepare("SELECT COUNT(*) as c FROM reservations WHERE estado = 'cancelada'").get().c,
    totalCompanies:      db.prepare('SELECT COUNT(*) as c FROM companies WHERE ativa = 1').get().c,
    thisMonth:           db.prepare("SELECT COUNT(*) as c FROM reservations WHERE strftime('%Y-%m',data)=strftime('%Y-%m','now') AND estado!='cancelada'").get().c,
    byCompany: db.prepare(`
      SELECT company_name, COUNT(*) as total
      FROM reservations WHERE estado != 'cancelada'
      GROUP BY company_name ORDER BY total DESC LIMIT 10
    `).all(),
    recentActivity: db.prepare(`
      SELECT r.*, c.nome as company_nome
      FROM reservations r LEFT JOIN companies c ON r.company_id = c.id
      ORDER BY r.updated_at DESC LIMIT 10
    `).all(),
    blockedDates: db.prepare('SELECT * FROM blocked_dates ORDER BY data').all()
  });
});

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERRO]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor. Tente novamente.' });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ─────────────────────────────────────────
// START
// ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║   AIRV Incubação | Reservas — Backend    ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`🚀  API:       http://localhost:${PORT}/api`);
  console.log(`🔍  Health:    http://localhost:${PORT}/api/health`);
  console.log(`🌍  Ambiente:  ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
