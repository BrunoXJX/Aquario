import { Link } from 'react-router-dom';

export default function PortalChoice() {
  return (
    <div className="portal-choice-page">
      <div className="portal-choice-container">
        <div className="portal-choice-header">
          <img src="/airv-logo.svg" alt="AIRV" className="portal-logo" />
          <h2 className="portal-choice-subtitle">Reserva do Aquário</h2>
          <p className="portal-choice-desc">Incubadora de Empresas · Edifício Expobeiras, Viseu</p>
        </div>

        <div className="portal-choice-cards">
          <Link to="/empresa" className="portal-card portal-card-empresa">
            <div className="portal-card-icon">
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="1.5">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/><path d="M9 9h1M14 9h1M9 13h1M14 13h1"/>
              </svg>
            </div>
            <h3>Empresa Incubada</h3>
            <p>Consulte a disponibilidade do Aquário e solicite uma reserva. O seu pedido será analisado pela administração.</p>
            <span className="portal-card-btn">Entrar como Empresa →</span>
          </Link>

          <Link to="/admin" className="portal-card portal-card-admin">
            <div className="portal-card-icon">
              <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </div>
            <h3>Administração AIRV</h3>
            <p>Painel completo de gestão: confirme pedidos, gerencie empresas, configure horários e bloqueie datas.</p>
            <span className="portal-card-btn">Entrar como Administrador →</span>
          </Link>
        </div>

        <div className="portal-choice-footer">
          AIRV — Associação Empresarial da Região de Viseu · geral@airv.pt · 232 470 290
        </div>
      </div>
    </div>
  );
}
