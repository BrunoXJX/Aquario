import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getReservations, getCompanies, cancelReservation, updateReservation } from '../services/api.js';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const ESTADO_LABELS = {
  confirmada: { label: 'Confirmada', cls: 'badge-confirmada' },
  cancelada:  { label: 'Cancelada',  cls: 'badge-cancelada'  },
  pendente:   { label: 'Pendente',   cls: 'badge-pendente'   },
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [companies, setCompanies]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [toast, setToast]               = useState('');
  const [cancelId, setCancelId]         = useState(null);
  const [cancelling, setCancelling]     = useState(false);

  // Filters
  const today = new Date().toISOString().split('T')[0];
  const [filterDate, setFilterDate]       = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [tab, setTab]                     = useState('upcoming'); // 'upcoming' | 'past' | 'all'

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterDate)    params.date       = filterDate;
      if (filterCompany) params.company_id = filterCompany;
      if (filterStatus)  params.status     = filterStatus;

      if (tab === 'upcoming' && !filterDate) params.start_date = today;
      if (tab === 'past'     && !filterDate) params.end_date   = today;

      const data = await getReservations({ ...params, limit: 200 });
      setReservations(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterCompany, filterStatus, tab, today]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getCompanies().then(setCompanies).catch(() => {}); }, []);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await cancelReservation(cancelId);
      showToast('Reserva cancelada com sucesso.');
      setCancelId(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  const clearFilters = () => {
    setFilterDate('');
    setFilterCompany('');
    setFilterStatus('');
  };

  const groupByDate = (list) => {
    const groups = {};
    list.forEach(r => {
      if (!groups[r.data]) groups[r.data] = [];
      groups[r.data].push(r);
    });
    return Object.entries(groups).sort(([a],[b]) => a.localeCompare(b));
  };

  const grouped = groupByDate(reservations);
  const hasFilters = filterDate || filterCompany || filterStatus;

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      return format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt });
    } catch { return dateStr; }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="alert alert-success" style={{ position: 'fixed', top: 20, right: 20, zIndex: 2000, width: 'auto', minWidth: 280, boxShadow: 'var(--shadow-lg)' }}>
          <span>✓</span><span>{toast}</span>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-text">
          <h1>Reservas</h1>
          <p>{reservations.length} reserva{reservations.length !== 1 ? 's' : ''} encontrada{reservations.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/nova-reserva" className="btn btn-primary">＋ Nova Reserva</Link>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" style={{ marginBottom: 16 }}>
        {[
          { key: 'upcoming', label: '📅 Próximas' },
          { key: 'past',     label: '🕐 Historial' },
          { key: 'all',      label: '📋 Todas' },
        ].map(t => (
          <button key={t.key} className={`admin-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="date"
          className="form-control"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          title="Filtrar por data"
        />
        <select
          className="form-control form-select"
          value={filterCompany}
          onChange={e => setFilterCompany(e.target.value)}
        >
          <option value="">Todas as empresas</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <select
          className="form-control form-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os estados</option>
          <option value="confirmada">Confirmada</option>
          <option value="cancelada">Cancelada</option>
        </select>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>✕ Limpar</button>
        )}
      </div>

      {error && <div className="alert alert-error"><span>⚠️</span><span>{error}</span></div>}

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : reservations.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '64px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h3>Sem reservas encontradas</h3>
            <p style={{ marginBottom: 20 }}>{hasFilters ? 'Tente ajustar os filtros.' : 'Ainda não há reservas neste período.'}</p>
            <Link to="/nova-reserva" className="btn btn-primary">Criar primeira reserva</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(([date, items]) => (
            <div key={date}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginBottom: 10, paddingBottom: 8,
                borderBottom: '1px solid var(--border)'
              }}>
                <div style={{
                  background: date === today ? 'var(--primary)' : 'var(--gray-200)',
                  color: date === today ? '#fff' : 'var(--gray-600)',
                  borderRadius: 8, padding: '4px 12px', fontSize: 13, fontWeight: 700
                }}>
                  {date === today ? 'Hoje' : format(new Date(date + 'T12:00:00'), 'd MMM', { locale: pt })}
                </div>
                <span style={{ fontSize: 14, color: 'var(--gray-600)', textTransform: 'capitalize' }}>
                  {formatDate(date)}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--gray-400)' }}>
                  {items.length} reserva{items.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="card">
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Horário</th>
                        <th>Empresa</th>
                        <th>Responsável</th>
                        <th>Finalidade</th>
                        <th>Estado</th>
                        <th style={{ width: 80 }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items
                        .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                        .map(r => (
                        <tr key={r.id}>
                          <td>
                            <span className="time-range">{r.hora_inicio} – {r.hora_fim}</span>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                              {(() => {
                                const s = r.hora_inicio.split(':').map(Number);
                                const e = r.hora_fim.split(':').map(Number);
                                const d = (e[0]*60+e[1])-(s[0]*60+s[1]);
                                return d > 0 ? `${Math.floor(d/60)}h${d%60?d%60+'min':''}` : '';
                              })()}
                            </div>
                          </td>
                          <td><span className="company-name">{r.company_name}</span></td>
                          <td>
                            <div style={{ fontSize: 14 }}>{r.user_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{r.user_email}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{r.finalidade || '—'}</div>
                            {r.observacoes && (
                              <div style={{ fontSize: 11, color: 'var(--gray-400)', fontStyle: 'italic', marginTop: 2 }}>
                                {r.observacoes.length > 50 ? r.observacoes.substring(0, 50) + '...' : r.observacoes}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${ESTADO_LABELS[r.estado]?.cls || 'badge-confirmada'}`}>
                              {ESTADO_LABELS[r.estado]?.label || r.estado}
                            </span>
                          </td>
                          <td>
                            {r.estado !== 'cancelada' && r.data >= today && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--danger)', fontSize: 12 }}
                                onClick={() => setCancelId(r.id)}
                                title="Cancelar reserva"
                              >
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
            </div>
          ))}
        </div>
      )}

      {/* Confirm Cancel Modal */}
      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">⚠️ Cancelar Reserva</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setCancelId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)' }}>
                Tem a certeza que deseja cancelar esta reserva? Esta ação não pode ser revertida.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setCancelId(null)}>
                Manter Reserva
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'A cancelar...' : 'Cancelar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
