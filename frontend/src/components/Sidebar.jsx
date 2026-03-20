import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  {
    label: 'Principal',
    items: [
      {
        to: '/admin', label: 'Dashboard',
        icon: (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/>
            <rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>
          </svg>
        )
      },
      {
        to: '/admin/calendario', label: 'Calendário',
        icon: (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        )
      },
    ]
  },
  {
    label: 'Reservas',
    items: [
      {
        to: '/admin/nova-reserva', label: 'Nova Reserva',
        icon: (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        )
      },
      {
        to: '/admin/reservas', label: 'Todas as Reservas',
        icon: (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/>
            <line x1="9" y1="16" x2="13" y2="16"/>
          </svg>
        )
      },
    ]
  },
  {
    label: 'Administração',
    items: [
      {
        to: '/admin/config', label: 'Painel Admin',
        icon: (
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        )
      },
    ]
  }
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="app-sidebar">
      {/* Logo AIRV */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-badge">
          <img src="/airv-logo.svg" alt="AIRV" style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'contain', background: '#fff', padding: 3 }} />
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">AIRV</span>
            <span className="sidebar-logo-sub">Incubação · Reservas</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-nav-item${isActive ? ' active' : ''}`
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 }}>
            AIRV – Incubadora
          </div>
          <div>Edifício Expobeiras, Viseu</div>
          <div>geral@airv.pt</div>
        </div>
      </div>
    </aside>
  );
}
