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
            <div className="portal-card-icon">🏢</div>
            <h3>Empresa Incubada</h3>
            <p>Consulte a disponibilidade do Aquário e solicite uma reserva. O seu pedido será analisado pela administração.</p>
            <span className="portal-card-btn">Entrar como Empresa →</span>
          </Link>

          <Link to="/admin" className="portal-card portal-card-admin">
            <div className="portal-card-icon">⚙️</div>
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
