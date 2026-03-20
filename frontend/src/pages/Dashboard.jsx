import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/api.js';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

const STATUS_CONFIG = {
  'livre': {
    bannerCls: 'sala-status-livre',
    dotCls: 'dot-livre',
    title: 'Sala Disponível',
    sub: 'O Aquário está livre agora.',
    icon: '✓'
  },
  'ocupada': {
    bannerCls: 'sala-status-ocupada',
    dotCls: 'dot-ocupada',
    title: 'Sala em Utilização',
    sub: 'O Aquário está ocupado neste momento.',
    icon: '●'
  },
  'reservada-em-breve': {
    bannerCls: 'sala-status-reservada',
    dotCls: 'dot-reservada',
    title: 'Reservada em Breve',
    sub: 'O Aquário tem uma reserva próxima.',
    icon: '◷'
  },
};

function StatCard({ value, label, sub, color, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}18` }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

function ReservationItem({ reservation, isCurrent = false }) {
  return (
    <div className="reservation-card" style={isCurrent ? { borderLeftColor: 'var(--danger)', borderLeftWidth: 3 } : {}}>
      <div className="reservation-time-badge" style={isCurrent ? { background: 'var(--danger-light)', color: 'var(--danger-dark)' } : {}}>
        <div>{reservation.hora_inicio}</div>
        <div style={{ fontSize: 10, opacity: 0.7 }}>↓</div>
        <div>{reservation.hora_fim}</div>
      </div>
      <div className="reservation-info">
        <div className="reservation-company">{reservation.company_name}</div>
        <div className="reservation-person">
          👤 {reservation.user_name}
          {reservation.user_email && (
            <span style={{ color: 'var(--gray-400)', marginLeft: 6 }}>· {reservation.user_email}</span>
          )}
        </div>
        {reservation.finalidade && (
          <div className="reservation-purpose">📌 {reservation.finalidade}</div>
        )}
        {reservation.observacoes && (
          <div className="reservation-purpose">💬 {reservation.observacoes}</div>
        )}
      </div>
      {isCurrent && (
        <span className="badge badge-confirmada" style={{ background: 'var(--danger-light)', color: 'var(--danger-dark)', alignSelf: 'flex-start' }}>
          Agora
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    getDashboard()
      .then(d => { setData(d); setError(null); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="loading-wrap"><div className="spinner" /></div>
  );

  if (error) return (
    <div className="alert alert-error">
      <span>⚠️</span>
      <div>
        <strong>Erro de ligação ao servidor.</strong>
        <div style={{ marginTop: 4, fontSize: 13 }}>{error}</div>
        <button className="btn btn-sm btn-outline" style={{ marginTop: 10 }} onClick={load}>
          Tentar novamente
        </button>
      </div>
    </div>
  );

  const sc = STATUS_CONFIG[data.salaStatus] || STATUS_CONFIG['livre'];
  const today = data.today ? new Date(data.today + 'T12:00:00') : new Date();
  const todayLabel = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt });

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-text">
          <h1>Bom dia, Dra. Fátima 👋</h1>
          <p style={{ textTransform: 'capitalize' }}>{todayLabel} · {data.currentTime}</p>
        </div>
        <Link to="/admin/nova-reserva" className="btn btn-primary">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Nova Reserva
        </Link>
      </div>

      {/* Sala Status Banner */}
      <div className={`sala-status-banner ${sc.bannerCls}`}>
        <div className={`sala-status-dot ${sc.dotCls}`} />
        <div className="sala-status-text">
          <div className="sala-status-title">Aquário · {sc.title}</div>
          <div className="sala-status-sub">
            {data.currentReservation
              ? `Em utilização por ${data.currentReservation.company_name} até às ${data.currentReservation.hora_fim}`
              : data.nextReservation
              ? `Próxima reserva: ${data.nextReservation.company_name} às ${data.nextReservation.hora_inicio}`
              : sc.sub}
          </div>
        </div>
        {data.currentReservation && (
          <div style={{ textAlign: 'right', fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>{data.currentReservation.hora_inicio} – {data.currentReservation.hora_fim}</div>
            <div style={{ opacity: 0.8 }}>{data.currentReservation.user_name}</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          value={data.stats.totalHoje}
          label="Reservas Hoje"
          sub="no Aquário"
          color="var(--primary)"
          icon="📅"
        />
        <StatCard
          value={data.stats.totalSemana}
          label="Esta Semana"
          sub="próximos 7 dias"
          color="var(--accent)"
          icon="📊"
        />
        <StatCard
          value={data.stats.totalMes}
          label="Este Mês"
          sub="total de reservas"
          color="var(--success)"
          icon="📈"
        />
        <StatCard
          value={data.stats.totalEmpresas}
          label="Empresas Ativas"
          sub="na incubadora"
          color="var(--info)"
          icon="🏢"
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Hoje */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Reservas de Hoje
            </span>
            <Link to="/admin/reservas" className="btn btn-ghost btn-sm">Ver todas →</Link>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            {data.todayReservations.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <h3>Sem reservas hoje</h3>
                <p>O Aquário está disponível o dia todo.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.todayReservations.map((r) => (
                  <ReservationItem
                    key={r.id}
                    reservation={r}
                    isCurrent={r.id === data.currentReservation?.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Próximas */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>
              </svg>
              Próximas Reservas
            </span>
            <Link to="/admin/calendario" className="btn btn-ghost btn-sm">Calendário →</Link>
          </div>
          <div className="card-body" style={{ padding: 16 }}>
            {data.upcoming.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🗓️</div>
                <h3>Sem reservas futuras</h3>
                <p>Nenhuma reserva agendada.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.upcoming.map((r) => (
                  <div key={r.id} className="reservation-card">
                    <div style={{ minWidth: 70, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                        {format(new Date(r.data + 'T12:00:00'), 'EEE', { locale: pt })}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', lineHeight: 1.1 }}>
                        {format(new Date(r.data + 'T12:00:00'), 'd', { locale: pt })}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>
                        {format(new Date(r.data + 'T12:00:00'), 'MMM', { locale: pt })}
                      </div>
                    </div>
                    <div className="reservation-info">
                      <div className="reservation-company">{r.company_name}</div>
                      <div className="reservation-person">
                        🕐 {r.hora_inicio} – {r.hora_fim} · {r.user_name}
                      </div>
                      {r.finalidade && <div className="reservation-purpose">📌 {r.finalidade}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/admin/nova-reserva" className="btn btn-primary">
          ＋ Nova Reserva
        </Link>
        <Link to="/admin/calendario" className="btn btn-outline">
          📅 Ver Calendário
        </Link>
        <Link to="/admin/reservas" className="btn btn-ghost">
          📋 Todas as Reservas
        </Link>
      </div>
    </div>
  );
}
