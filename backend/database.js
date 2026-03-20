/**
 * AIRV Incubação | Reservas
 * Database module – SQLite via better-sqlite3
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'airv.db');

// Garante que a pasta data existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Optimizações de performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');

// ─────────────────────────────────────────
// SCHEMA – Criação de tabelas
// ─────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id             INTEGER PRIMARY KEY DEFAULT 1,
    opening_hour   TEXT    NOT NULL DEFAULT '08:00',
    closing_hour   TEXT    NOT NULL DEFAULT '20:00',
    slot_interval  INTEGER NOT NULL DEFAULT 30,
    min_duration   INTEGER NOT NULL DEFAULT 30,
    max_duration   INTEGER NOT NULL DEFAULT 480,
    buffer_minutes INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS companies (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nome       TEXT NOT NULL,
    email      TEXT,
    telefone   TEXT,
    ativa      INTEGER NOT NULL DEFAULT 1,
    created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nome        TEXT NOT NULL,
    descricao   TEXT,
    capacidade  INTEGER NOT NULL DEFAULT 10,
    ativa       INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id      INTEGER NOT NULL DEFAULT 1,
    company_id   INTEGER,
    company_name TEXT    NOT NULL,
    user_name    TEXT    NOT NULL,
    user_email   TEXT    NOT NULL,
    data         TEXT    NOT NULL,
    hora_inicio  TEXT    NOT NULL,
    hora_fim     TEXT    NOT NULL,
    estado       TEXT    NOT NULL DEFAULT 'confirmada',
    observacoes  TEXT,
    finalidade   TEXT,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (room_id)    REFERENCES rooms(id),
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS blocked_dates (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    data       TEXT NOT NULL UNIQUE,
    motivo     TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
  );

  -- Índices para performance
  CREATE INDEX IF NOT EXISTS idx_reservations_data     ON reservations(data);
  CREATE INDEX IF NOT EXISTS idx_reservations_estado   ON reservations(estado);
  CREATE INDEX IF NOT EXISTS idx_reservations_company  ON reservations(company_id);
  CREATE INDEX IF NOT EXISTS idx_blocked_dates_data    ON blocked_dates(data);
`);

// Settings default
const existingSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!existingSettings) {
  db.prepare(`
    INSERT INTO settings (id, opening_hour, closing_hour, slot_interval, min_duration, max_duration, buffer_minutes)
    VALUES (1, '08:00', '20:00', 30, 30, 480, 0)
  `).run();
}

console.log(`💾 Base de dados SQLite iniciada: ${DB_PATH}`);

module.exports = db;
