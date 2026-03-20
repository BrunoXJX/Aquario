import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Header  from './components/Header.jsx';
import Dashboard      from './pages/Dashboard.jsx';
import CalendarPage   from './pages/CalendarPage.jsx';
import NewReservation from './pages/NewReservation.jsx';
import Reservations   from './pages/Reservations.jsx';
import AdminPage      from './pages/AdminPage.jsx';
import PortalChoice   from './pages/PortalChoice.jsx';
import EmpresaPortal  from './pages/EmpresaPortal.jsx';

function AdminLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Header />
        <main className="page-content">
          <Routes>
            <Route path="/"             element={<Dashboard />} />
            <Route path="/calendario"   element={<CalendarPage />} />
            <Route path="/nova-reserva" element={<NewReservation />} />
            <Route path="/reservas"     element={<Reservations />} />
            <Route path="/config"       element={<AdminPage />} />
            <Route path="*"             element={<Navigate to="/admin" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalChoice />} />
        <Route path="/empresa" element={<EmpresaPortal />} />
        <Route path="/admin/*" element={<AdminLayout />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
