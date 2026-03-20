import { useState, useEffect } from 'react';
import {
  getAdminStats, getReservations, cancelReservation,
  getSettings, updateSettings, getBlockedDates, blockDate, unblockDate,
  getCompanies, createCompany, updateCompany,
  confirmReservation, rejectReservation, getPendingReservations
} from '../services/api.js';

function StatCard({ value, label, color }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────
function SettingsTab() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getSettings().then(s => setForm({ ...s })).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      await updateSettings(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  if (!form) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 560 }}>
      <h3 style={{ marginBottom: 20, color: 'var(--dark)', fontWeight: 700 }}>Configuração do Aquário</h3>
      {error  && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}
      {saved  && <div className="alert alert-success"><span>✓</span><span>Configurações guardadas com sucesso.</span></div>}
      <form onSubmit={handleSave}>
        <div className="card">
          <div className="card-header"><span className="card-title">🕐 Horário do Aquário</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Abertura</label>
                <input type="time" className="form-control" value={form.opening_hour} onChange={e => set('opening_hour', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Encerramento</label>
                <input type="time" className="form-control" value={form.closing_hour} onChange={e => set('closing_hour', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Intervalo de slots (minutos)</label>
                <select className="form-control form-select" value={form.slot_interval} onChange={e => set('slot_interval', parseInt(e.target.value))}>
                  <option value={15}>15 min</option><option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Buffer entre reservas (min)</label>
                <input type="number" className="form-control" min={0} max={60} value={form.buffer_minutes} onChange={e => set('buffer_minutes', parseInt(e.target.value))} />
                <div className="form-hint">Tempo livre obrigatório entre reservas</div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duração mínima (min)</label>
                <input type="number" className="form-control" min={15} max={240} step={15} value={form.min_duration} onChange={e => set('min_duration', parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label className="form-label">Duração máxima (horas)</label>
                <input type="number" className="form-control" min={1} max={12} value={form.max_duration / 60} onChange={e => set('max_duration', parseInt(e.target.value) * 60)} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '⏳ A guardar...' : '💾 Guardar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Blocked Dates Tab ─────────────────────────────────────
function BlockedDatesTab() {
  const [blocked, setBlocked] = useState([]);
  const [newDate, setNewDate] = useState('');
  const [motivo, setMotivo]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => getBlockedDates().then(setBlocked).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleBlock = async (e) => {
    e.preventDefault();
    if (!newDate) return;
    setLoading(true); setError('');
    try {
      await blockDate({ data: newDate, motivo });
      setNewDate(''); setMotivo('');
      showToast(`Data ${newDate} bloqueada.`);
      load();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleUnblock = async (id) => {
    try {
      await unblockDate(id);
      showToast('Data desbloqueada.');
      load();
    } catch (err) { setError(err.message); }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ maxWidth: 560 }}>
      <h3 style={{ marginBottom: 20, color: 'var(--dark)', fontWeight: 700 }}>Datas Bloqueadas</h3>
      {toast && <div className="alert alert-success"><span>✓</span><span>{toast}</span></div>}
      {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">🔒 Bloquear Nova Data</span></div>
        <div className="card-body">
          <form onSubmit={handleBlock}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data a bloquear</label>
                <input type="date" className="form-control" min={today} value={newDate} onChange={e => setNewDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo (opcional)</label>
                <input className="form-control" placeholder="Ex: Feriado, manutenção..." value={motivo} onChange={e => setMotivo(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-danger" disabled={loading || !newDate}>
              {loading ? '⏳' : '🔒'} Bloquear Data
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">📋 Datas Bloqueadas ({blocked.length})</span></div>
        {blocked.length === 0 ? (
          <div className="empty-state"><p>Nenhuma data bloqueada.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Data</th><th>Motivo</th><th style={{ width: 80 }}>Ação</th></tr></thead>
              <tbody>
                {blocked.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{b.data}</td>
                    <td style={{ color: 'var(--gray-600)' }}>{b.motivo || '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--success)' }} onClick={() => handleUnblock(b.id)}>
                        🔓 Desbloquear
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Companies Tab ─────────────────────────────────────────
function CompaniesTab() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ nome: '', email: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const load = () => getCompanies(true).then(setCompanies).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await createCompany(form);
      setForm({ nome: '', email: '', telefone: '' });
      showToast(`Empresa "${form.nome}" criada.`);
      load();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const toggleActive = async (c) => {
    try {
      await updateCompany(c.id, { ativa: c.ativa ? 0 : 1 });
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h3 style={{ marginBottom: 20, color: 'var(--dark)', fontWeight: 700 }}>Gestão de Empresas</h3>
      {toast && <div className="alert alert-success"><span>✓</span><span>{toast}</span></div>}
      {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">＋ Nova Empresa</span></div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Nome <span className="required">*</span></label>
                <input className="form-control" placeholder="Nome da empresa" value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" placeholder="email@empresa.pt" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input className="form-control" placeholder="9XX XXX XXX" value={form.telefone} onChange={e => setForm(f => ({...f, telefone: e.target.value}))} />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={loading || !form.nome}>
                {loading ? '⏳' : '＋'} Criar Empresa
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">🏢 Empresas Incubadas ({companies.length})</span></div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Empresa</th><th>Email</th><th>Telefone</th><th>Estado</th></tr></thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id}>
                    <td><span className="company-name">{c.nome}</span></td>
                    <td style={{ fontSize: 13 }}>{c.email || '—'}</td>
                    <td style={{ fontSize: 13 }}>{c.telefone || '—'}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${c.ativa ? 'btn-ghost' : 'btn-outline'}`}
                        style={{ fontSize: 12 }}
                        onClick={() => toggleActive(c)}
                      >
                        {c.ativa ? '✓ Ativa' : '✕ Inativa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── All Reservations Tab ──────────────────────────────────
function AllReservationsTab() {
  const [reservations, setReservations] = useState([]);
  const [companies, setCompanies]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('confirmada');
  const [cancelId, setCancelId]           = useState(null);
  const [toast, setToast]                 = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCompany) params.company_id = filterCompany;
      if (filterStatus)  params.status = filterStatus;
      const data = await getReservations({ ...params, limit: 300 });
      setReservations(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterCompany, filterStatus]);
  useEffect(() => { getCompanies(true).then(setCompanies).catch(() => {}); }, []);

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelReservation(cancelId);
      showToast('Reserva cancelada.');
      setCancelId(null); load();
    } catch {}
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <h3 style={{ marginBottom: 20, color: 'var(--dark)', fontWeight: 700 }}>Todas as Reservas</h3>
      {toast && <div className="alert alert-success"><span>✓</span><span>{toast}</span></div>}

      <div className="filters-bar" style={{ marginBottom: 16 }}>
        <select className="form-control form-select" value={filterCompany} onChange={e => setFilterCompany(e.target.value)}>
          <option value="">Todas as empresas</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select className="form-control form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os estados</option>
          <option value="pendente">Pendente</option>
          <option value="confirmada">Confirmada</option>
          <option value="rejeitada">Rejeitada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th><th>Horário</th><th>Empresa</th>
                  <th>Responsável</th><th>Finalidade</th><th>Estado</th><th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Sem reservas</td></tr>
                ) : reservations.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.data}</td>
                    <td><span className="time-range">{r.hora_inicio}–{r.hora_fim}</span></td>
                    <td><span className="company-name">{r.company_name}</span></td>
                    <td>
                      <div style={{ fontSize: 13 }}>{r.user_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.user_email}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{r.finalidade || '—'}</td>
                    <td>
                      <span className={`badge badge-${r.estado}`}>{r.estado}</span>
                    </td>
                    <td>
                      {r.estado !== 'cancelada' && r.data >= today && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: 11 }} onClick={() => setCancelId(r.id)}>
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title">Cancelar Reserva</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setCancelId(null)}>✕</button>
            </div>
            <div className="modal-body"><p>Confirma o cancelamento desta reserva?</p></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setCancelId(null)}>Não</button>
              <button className="btn btn-danger" onClick={handleCancel}>Sim, cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pending Reservations Tab ──────────────────────────────
function PendingTab() {
  const [data, setData] = useState({ count: 0, pending: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = () => {
    setLoading(true);
    getPendingReservations()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async (id) => {
    try {
      await confirmReservation(id);
      showToast('Reserva confirmada com sucesso!');
      load();
    } catch (e) { setError(e.message); }
  };

  const handleReject = async (id) => {
    try {
      await rejectReservation(id);
      showToast('Reserva rejeitada.');
      load();
    } catch (e) { setError(e.message); }
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <h3 style={{ marginBottom: 20, color: 'var(--dark)', fontWeight: 700 }}>
        Pedidos Pendentes
        {data.count > 0 && <span className="badge badge-pendente" style={{ marginLeft: 10, fontSize: 13 }}>{data.count}</span>}
      </h3>
      {toast && <div className="alert alert-success"><span>✓</span><span>{toast}</span></div>}
      {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

      {data.pending.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <h3>Nenhum pedido pendente</h3>
            <p>Todos os pedidos foram tratados. Bom trabalho, Dra. Fátima!</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th><th>Horário</th><th>Empresa</th>
                  <th>Responsável</th><th>Finalidade</th><th style={{width:180}}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.pending.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.data}</td>
                    <td><span className="time-range">{r.hora_inicio}–{r.hora_fim}</span></td>
                    <td><span className="company-name">{r.company_name}</span></td>
                    <td>
                      <div style={{ fontSize: 13 }}>{r.user_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.user_email}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{r.finalidade || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }} onClick={() => handleConfirm(r.id)}>
                          ✅ Confirmar
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleReject(r.id)}>
                          ❌ Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState('pending');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (tab === 'overview') {
      getAdminStats().then(setStats).catch(() => {});
    }
  }, [tab]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Painel de Administração</h1>
          <p>Gestão completa do Aquário · AIRV Incubação</p>
        </div>
        <span className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)', padding: '6px 14px', fontSize: 12 }}>
          ⭐ Administrador
        </span>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        {[
          { key: 'pending',     label: '📩 Pedidos Pendentes' },
          { key: 'overview',    label: '📊 Visão Geral' },
          { key: 'reservations',label: '📋 Reservas' },
          { key: 'companies',   label: '🏢 Empresas' },
          { key: 'blocked',     label: '🔒 Datas Bloqueadas' },
          { key: 'settings',    label: '⚙️ Configurações' },
        ].map(t => (
          <button key={t.key} className={`admin-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div>
          {stats && (
            <>
              <div className="stats-grid">
                <StatCard value={stats.totalReservations} label="Total Reservas" color="var(--primary)" />
                <StatCard value={stats.thisMonth}         label="Este Mês"       color="var(--accent)" />
                <StatCard value={stats.totalCancelled}    label="Canceladas"     color="var(--danger)" />
                <StatCard value={stats.totalCompanies}    label="Empresas"       color="var(--success)" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div className="card">
                  <div className="card-header"><span className="card-title">🏆 Por Empresa</span></div>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead><tr><th>Empresa</th><th style={{ textAlign: 'right' }}>Reservas</th></tr></thead>
                      <tbody>
                        {stats.byCompany.map((r, i) => (
                          <tr key={i}>
                            <td><span className="company-name">{r.company_name}</span></td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>{r.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">🕐 Atividade Recente</span></div>
                  <div style={{ padding: 16 }}>
                    {stats.recentActivity.slice(0, 6).map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--gray-100)' }}>
                        <div style={{ background: 'var(--primary-10)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                          {r.data}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.company_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{r.hora_inicio}–{r.hora_fim}</div>
                        </div>
                        <span className={`badge badge-${r.estado}`} style={{ fontSize: 10 }}>{r.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'pending'      && <PendingTab />}
      {tab === 'reservations' && <AllReservationsTab />}
      {tab === 'companies'    && <CompaniesTab />}
      {tab === 'blocked'      && <BlockedDatesTab />}
      {tab === 'settings'     && <SettingsTab />}
    </div>
  );
}
