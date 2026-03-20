import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanies, getReservations, getSettings, createReservation, getBlockedDates } from '../services/api.js';

export default function EmpresaPortal() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [settings, setSettings] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [form, setForm] = useState({
    user_name: '', user_email: '', data: '', hora_inicio: '', hora_fim: '', finalidade: '', observacoes: ''
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('reservar'); // 'reservar' | 'minhas'
  const [myReservations, setMyReservations] = useState([]);

  useEffect(() => {
    Promise.all([getCompanies(), getSettings(), getBlockedDates()])
      .then(([c, s, b]) => {
        setCompanies(c);
        setSettings(s);
        setBlockedDates(b);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Load upcoming confirmed reservations for calendar view
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    getReservations({ start_date: today, status: 'confirmada', limit: 50 })
      .then(setReservations)
      .catch(() => {});
  }, [success]);

  // Load "my reservations" when company is selected
  useEffect(() => {
    if (!selectedCompany) return;
    getReservations({ company_id: selectedCompany, limit: 50 })
      .then(setMyReservations)
      .catch(() => {});
  }, [selectedCompany, success]);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const company = companies.find(c => c.id === parseInt(selectedCompany));
    if (!company) return setError('Selecione a sua empresa.');

    createReservation({
      company_id: company.id,
      company_name: company.nome,
      user_name: form.user_name,
      user_email: form.user_email,
      data: form.data,
      hora_inicio: form.hora_inicio,
      hora_fim: form.hora_fim,
      finalidade: form.finalidade,
      observacoes: form.observacoes,
      estado: 'pendente'
    })
      .then(() => {
        setSuccess('Pedido de reserva enviado com sucesso! Aguarde a confirmação da administração AIRV.');
        setForm({ user_name: '', user_email: '', data: '', hora_inicio: '', hora_fim: '', finalidade: '', observacoes: '' });
      })
      .catch(e => setError(e.message));
  };

  const isBlocked = (date) => blockedDates.some(b => b.data === date);

  const getOccupiedSlots = (date) => {
    return reservations.filter(r => r.data === date);
  };

  const statusBadge = (estado) => {
    const cfg = {
      'pendente': { cls: 'badge-pendente', label: '⏳ Pendente', desc: 'A aguardar confirmação' },
      'confirmada': { cls: 'badge-confirmada', label: '✅ Confirmada', desc: '' },
      'rejeitada': { cls: 'badge-rejeitada', label: '❌ Rejeitada', desc: '' },
      'cancelada': { cls: 'badge-cancelada', label: '🚫 Cancelada', desc: '' },
    };
    const c = cfg[estado] || cfg['pendente'];
    return <span className={`badge ${c.cls}`}>{c.label}</span>;
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /></div>;

  return (
    <div className="empresa-portal">
      {/* Header */}
      <header className="empresa-header">
        <Link to="/" className="empresa-back">← Voltar</Link>
        <img src="/airv-logo.svg" alt="AIRV" className="empresa-logo" />
        <h1>Reserva do Aquário</h1>
        <p>Incubadora de Empresas AIRV · Edifício Expobeiras, Viseu</p>
      </header>

      {/* Selecionar Empresa */}
      <div className="empresa-company-select">
        <label className="form-label">A sua empresa:</label>
        <select
          className="form-control form-select"
          value={selectedCompany}
          onChange={e => setSelectedCompany(e.target.value)}
        >
          <option value="">— Selecione a empresa incubada —</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      {selectedCompany && (
        <>
          {/* Tabs */}
          <div className="empresa-tabs">
            <button className={`empresa-tab ${tab === 'reservar' ? 'active' : ''}`} onClick={() => setTab('reservar')}>
              📅 Pedir Reserva
            </button>
            <button className={`empresa-tab ${tab === 'minhas' ? 'active' : ''}`} onClick={() => setTab('minhas')}>
              📋 Os Meus Pedidos {myReservations.length > 0 && <span className="empresa-tab-count">{myReservations.length}</span>}
            </button>
          </div>

          {tab === 'reservar' && (
            <div className="empresa-content">
              {/* Messages */}
              {success && <div className="alert alert-success"><span>✅</span><div>{success}</div></div>}
              {error && <div className="alert alert-error"><span>⚠️</span><div>{error}</div></div>}

              <div className="empresa-form-grid">
                {/* Form */}
                <div className="card">
                  <div className="card-header"><span className="card-title">📝 Solicitar Reserva</span></div>
                  <div className="card-body">
                    <form onSubmit={handleSubmit}>
                      <div className="form-group">
                        <label className="form-label">Nome do responsável <span className="required">*</span></label>
                        <input className="form-control" required value={form.user_name}
                          onChange={e => setForm({...form, user_name: e.target.value})}
                          placeholder="Ex: João Silva" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email <span className="required">*</span></label>
                        <input className="form-control" type="email" required value={form.user_email}
                          onChange={e => setForm({...form, user_email: e.target.value})}
                          placeholder="Ex: joao@empresa.pt" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Data pretendida <span className="required">*</span></label>
                        <input className="form-control" type="date" required value={form.data} min={today}
                          onChange={e => setForm({...form, data: e.target.value})} />
                        {form.data && isBlocked(form.data) && (
                          <span className="form-error">⚠️ Esta data está bloqueada para reservas.</span>
                        )}
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Hora início <span className="required">*</span></label>
                          <input className="form-control" type="time" required value={form.hora_inicio}
                            min={settings?.opening_hour} max={settings?.closing_hour}
                            onChange={e => setForm({...form, hora_inicio: e.target.value})} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Hora fim <span className="required">*</span></label>
                          <input className="form-control" type="time" required value={form.hora_fim}
                            min={form.hora_inicio || settings?.opening_hour} max={settings?.closing_hour}
                            onChange={e => setForm({...form, hora_fim: e.target.value})} />
                        </div>
                      </div>
                      {settings && (
                        <p className="form-hint">Horário da sala: {settings.opening_hour} – {settings.closing_hour} · Mín: {settings.min_duration}min · Máx: {settings.max_duration/60}h</p>
                      )}
                      <div className="form-group">
                        <label className="form-label">Finalidade</label>
                        <input className="form-control" value={form.finalidade}
                          onChange={e => setForm({...form, finalidade: e.target.value})}
                          placeholder="Ex: Reunião de equipa" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Observações</label>
                        <textarea className="form-control" rows="2" value={form.observacoes}
                          onChange={e => setForm({...form, observacoes: e.target.value})}
                          placeholder="Ex: Necessário projetor" />
                      </div>
                      <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}}>
                        📩 Enviar Pedido de Reserva
                      </button>
                      <p className="form-hint" style={{textAlign:'center', marginTop: 8}}>
                        O seu pedido será analisado pela administração AIRV.<br/>
                        Receberá confirmação ou indicação de indisponibilidade.
                      </p>
                    </form>
                  </div>
                </div>

                {/* Occupied slots for selected date */}
                <div className="card">
                  <div className="card-header"><span className="card-title">🕐 Horários Ocupados {form.data && `(${form.data})`}</span></div>
                  <div className="card-body">
                    {!form.data ? (
                      <div className="empty-state" style={{padding: '24px 16px'}}>
                        <div style={{fontSize: 28, marginBottom: 8}}>📅</div>
                        <h3>Selecione uma data</h3>
                        <p>Escolha a data no formulário para ver os horários já ocupados.</p>
                      </div>
                    ) : isBlocked(form.data) ? (
                      <div className="alert alert-error">
                        <span>🚫</span><div>Esta data está bloqueada.</div>
                      </div>
                    ) : getOccupiedSlots(form.data).length === 0 ? (
                      <div className="empty-state" style={{padding: '24px 16px'}}>
                        <div style={{fontSize: 28, marginBottom: 8}}>✅</div>
                        <h3>Aquário livre!</h3>
                        <p>Não há reservas confirmadas para esta data. O Aquário está completamente disponível.</p>
                      </div>
                    ) : (
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <p className="form-hint">Horários já reservados (confirmados):</p>
                        {getOccupiedSlots(form.data).map(r => (
                          <div key={r.id} className="reservation-card">
                            <div className="reservation-time-badge">
                              <div>{r.hora_inicio}</div>
                              <div style={{fontSize:10, opacity:.7}}>↓</div>
                              <div>{r.hora_fim}</div>
                            </div>
                            <div className="reservation-info">
                              <div className="reservation-company">{r.company_name}</div>
                              {r.finalidade && <div className="reservation-purpose">📌 {r.finalidade}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'minhas' && (
            <div className="empresa-content">
              <div className="card">
                <div className="card-header"><span className="card-title">📋 Os Meus Pedidos de Reserva</span></div>
                <div className="card-body">
                  {myReservations.length === 0 ? (
                    <div className="empty-state" style={{padding: '32px 16px'}}>
                      <div style={{fontSize: 32, marginBottom: 12}}>📭</div>
                      <h3>Sem pedidos</h3>
                      <p>A sua empresa ainda não fez nenhum pedido de reserva.</p>
                    </div>
                  ) : (
                    <div className="table-wrapper">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Horário</th>
                            <th>Responsável</th>
                            <th>Finalidade</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myReservations.map(r => (
                            <tr key={r.id}>
                              <td style={{fontWeight:600}}>{r.data}</td>
                              <td className="time-range">{r.hora_inicio} – {r.hora_fim}</td>
                              <td>{r.user_name}</td>
                              <td>{r.finalidade || '—'}</td>
                              <td>{statusBadge(r.estado)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
