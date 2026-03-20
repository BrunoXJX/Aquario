import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDashboard } from '../services/api.js';

const routeTitles = {
  '/admin':              { title: 'Dashboard',       sub: 'Visão geral do dia' },
  '/admin/calendario':    { title: 'Calendário',      sub: 'Reservas por dia e semana' },
  '/admin/nova-reserva':  { title: 'Nova Reserva',    sub: 'Agendar utilização do Aquário' },
  '/admin/reservas':      { title: 'Reservas',         sub: 'Histórico e próximas reservas' },
  '/admin/config':         { title: 'Administração',    sub: 'Gestão e configuração' },
};

const statusConfig = {
  'livre':             { label: 'Aquário Livre',      cls: 'badge-livre',    dot: 'dot-livre' },
  'ocupada':           { label: 'Aquário Ocupado',    cls: 'badge-ocupada',  dot: 'dot-ocupada' },
  'reservada-em-breve':{ label: 'Reservada em breve', cls: 'badge-reservada',dot: 'dot-reservada' },
};

export default function Header() {
  const location = useLocation();
  const routeInfo = routeTitles[location.pathname] || { title: 'AIRV Reservas', sub: '' };

  const [salaStatus, setSalaStatus] = useState('livre');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getDashboard()
      .then(d => setSalaStatus(d.salaStatus || 'livre'))
      .catch(() => {});
  }, [location.pathname]);

  const sc = statusConfig[salaStatus] || statusConfig['livre'];

  return (
    <header className="app-header">
      <div>
        <div className="header-title">{routeInfo.title}</div>
        {routeInfo.sub && <span className="header-subtitle">— {routeInfo.sub}</span>}
      </div>
      <div className="header-right">
        {currentTime && (
          <span style={{ fontSize: 13, color: 'var(--gray-500)', fontVariantNumeric: 'tabular-nums' }}>
            {currentTime}
          </span>
        )}
        <span className={`header-badge ${sc.cls}`}>
          <span className={`sala-status-dot ${sc.dot}`} style={{ width: 8, height: 8, animation: 'pulse 2s infinite' }} />
          {sc.label}
        </span>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--primary-10)', border: '1.5px solid var(--primary-20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: 'var(--primary)'
        }}>
          F
        </div>
      </div>
    </header>
  );
}
