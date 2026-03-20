import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createReservation, getCompanies, getSettings, checkConflicts } from '../services/api.js';

const FINALIDADES = [
  'Reunião de equipa', 'Reunião com cliente', 'Reunião com investidores',
  'Workshop', 'Formação', 'Sprint planning', 'Demo / Apresentação',
  'Videoconferência', 'Sessão de brainstorming', 'Outra'
];

export default function NewReservation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    company_id:   '',
    company_name: '',
    user_name:    '',
    user_email:   '',
    data:         searchParams.get('date') || '',
    hora_inicio:  '',
    hora_fim:     '',
    finalidade:   '',
    observacoes:  '',
  });

  const [companies, setCompanies]       = useState([]);
  const [settings, setSettings]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [conflictCheck, setConflictCheck] = useState(null);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState(false);
  const [fieldErrors, setFieldErrors]   = useState({});

  useEffect(() => {
    getCompanies().then(setCompanies).catch(() => {});
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }));
    setFieldErrors(e => ({ ...e, [key]: '' }));
    setError('');
    setConflictCheck(null);
  };

  const handleCompanySelect = (e) => {
    const id = e.target.value;
    const company = companies.find(c => String(c.id) === id);
    setForm(f => ({
      ...f,
      company_id:   id,
      company_name: company ? company.nome : '',
    }));
    setFieldErrors(fe => ({ ...fe, company_id: '', company_name: '' }));
  };

  // Auto-calculate fim with 1h default when início is set
  const handleHoraInicio = (val) => {
    set('hora_inicio', val);
    if (val && !form.hora_fim) {
      const [h, m] = val.split(':').map(Number);
      const totalMin = h * 60 + m + 60;
      const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
      const endM = String(totalMin % 60).padStart(2, '0');
      if (totalMin <= (settings ? parseInt(settings.closing_hour) * 60 : 20 * 60)) {
        set('hora_fim', `${endH}:${endM}`);
      }
    }
  };

  // Realtime conflict check
  const runConflictCheck = async () => {
    if (!form.data || !form.hora_inicio || !form.hora_fim) return;
    try {
      const result = await checkConflicts({ room_id: 1, data: form.data, hora_inicio: form.hora_inicio, hora_fim: form.hora_fim });
      setConflictCheck(result);
    } catch {}
  };

  useEffect(() => {
    if (form.data && form.hora_inicio && form.hora_fim) {
      const timer = setTimeout(runConflictCheck, 500);
      return () => clearTimeout(timer);
    }
  }, [form.data, form.hora_inicio, form.hora_fim]);

  const validate = () => {
    const errs = {};
    if (!form.company_id && !form.company_name.trim()) errs.company_name = 'Empresa é obrigatória.';
    if (!form.user_name.trim())  errs.user_name  = 'Nome do responsável é obrigatório.';
    if (!form.user_email.trim()) errs.user_email = 'Email é obrigatório.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.user_email)) errs.user_email = 'Email inválido.';
    if (!form.data)         errs.data        = 'Data é obrigatória.';
    if (!form.hora_inicio)  errs.hora_inicio = 'Hora de início é obrigatória.';
    if (!form.hora_fim)     errs.hora_fim    = 'Hora de fim é obrigatória.';
    if (form.hora_inicio && form.hora_fim && form.hora_inicio >= form.hora_fim)
      errs.hora_fim = 'A hora de fim deve ser posterior à hora de início.';

    // Validate date not in past
    const today = new Date().toISOString().split('T')[0];
    if (form.data && form.data < today) errs.data = 'Não é possível reservar para datas passadas.';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (conflictCheck?.hasConflict) {
      setError('Existe conflito de horário. Por favor escolha outro horário.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await createReservation({
        room_id:      1,
        company_id:   form.company_id || null,
        company_name: form.company_name.trim(),
        user_name:    form.user_name.trim(),
        user_email:   form.user_email.trim(),
        data:         form.data,
        hora_inicio:  form.hora_inicio,
        hora_fim:     form.hora_fim,
        finalidade:   form.finalidade || null,
        observacoes:  form.observacoes || null,
      });
      setSuccess(true);
      setTimeout(() => navigate('/reservas'), 1800);
    } catch (err) {
      setError(err.message);
      if (err.conflicts) {
        setConflictCheck({ hasConflict: true, conflicts: err.conflicts });
      }
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Generate time slots
  const timeSlots = () => {
    const open  = settings?.opening_hour  || '08:00';
    const close = settings?.closing_hour  || '20:00';
    const interval = settings?.slot_interval || 30;
    const slots = [];
    let [h, m] = open.split(':').map(Number);
    const [ch, cm] = close.split(':').map(Number);
    while (h * 60 + m <= ch * 60 + cm) {
      slots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
      m += interval;
      if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
    }
    return slots;
  };

  const slots = timeSlots();
  const duration = form.hora_inicio && form.hora_fim
    ? (() => {
        const s = form.hora_inicio.split(':').map(Number);
        const e = form.hora_fim.split(':').map(Number);
        const d = (e[0] * 60 + e[1]) - (s[0] * 60 + s[1]);
        if (d <= 0) return '';
        const h = Math.floor(d / 60), m = d % 60;
        return h > 0 ? `${h}h${m > 0 ? m + 'min' : ''}` : `${m}min`;
      })()
    : '';

  if (success) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 24px' }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <h2 style={{ color: 'var(--success)', marginBottom: 8 }}>Reserva Criada!</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: 24 }}>
          A sua reserva foi registada com sucesso no Aquário da AIRV Incubação.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link to="/reservas"   className="btn btn-primary">Ver Reservas</Link>
          <Link to="/calendario" className="btn btn-outline">Ver Calendário</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Nova Reserva</h1>
          <p>Reservar o Aquário · AIRV Incubação</p>
        </div>
        <Link to="/reservas" className="btn btn-ghost">← Cancelar</Link>
      </div>

      {/* Conflict warning */}
      {conflictCheck?.hasConflict && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <div>
            <strong>Conflito de horário!</strong>
            <div style={{ marginTop: 4 }}>
              {conflictCheck.conflicts?.map((c, i) => (
                <div key={i} style={{ fontSize: 13 }}>· {c}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      {conflictCheck && !conflictCheck.hasConflict && form.data && form.hora_inicio && form.hora_fim && (
        <div className="alert alert-success">
          <span>✓</span>
          <span>Horário disponível! Pode prosseguir com a reserva.</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            🏢 Informações da Empresa e Responsável
          </span>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Empresa */}
            <div className="form-group">
              <label className="form-label">
                Empresa <span className="required">*</span>
              </label>
              {companies.length > 0 ? (
                <>
                  <select
                    className="form-control form-select"
                    value={form.company_id}
                    onChange={handleCompanySelect}
                  >
                    <option value="">-- Selecionar empresa incubada --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                    <option value="__other__">Outra empresa (introduzir manualmente)</option>
                  </select>
                  {(form.company_id === '__other__' || (!form.company_id && form.company_name)) && (
                    <input
                      className="form-control"
                      style={{ marginTop: 8 }}
                      placeholder="Nome da empresa"
                      value={form.company_name}
                      onChange={e => set('company_name', e.target.value)}
                    />
                  )}
                </>
              ) : (
                <input
                  className="form-control"
                  placeholder="Nome da empresa"
                  value={form.company_name}
                  onChange={e => set('company_name', e.target.value)}
                />
              )}
              {fieldErrors.company_name && <div className="form-error">{fieldErrors.company_name}</div>}
            </div>

            {/* Responsável */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nome do Responsável <span className="required">*</span></label>
                <input
                  className={`form-control${fieldErrors.user_name ? ' border-danger' : ''}`}
                  placeholder="Ex: João Silva"
                  value={form.user_name}
                  onChange={e => set('user_name', e.target.value)}
                />
                {fieldErrors.user_name && <div className="form-error">{fieldErrors.user_name}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Email de Contacto <span className="required">*</span></label>
                <input
                  type="email"
                  className={`form-control${fieldErrors.user_email ? ' border-danger' : ''}`}
                  placeholder="Ex: joao@empresa.pt"
                  value={form.user_email}
                  onChange={e => set('user_email', e.target.value)}
                />
                {fieldErrors.user_email && <div className="form-error">{fieldErrors.user_email}</div>}
              </div>
            </div>

            {/* Divider */}
            <div className="divider" />
            <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 16, fontSize: 14 }}>
              🕐 Data e Horário
            </div>

            {/* Data */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Data <span className="required">*</span></label>
                <input
                  type="date"
                  className={`form-control${fieldErrors.data ? ' border-danger' : ''}`}
                  min={today}
                  value={form.data}
                  onChange={e => set('data', e.target.value)}
                />
                {fieldErrors.data && <div className="form-error">{fieldErrors.data}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Duração</label>
                <div className="form-control" style={{ background: 'var(--gray-50)', color: duration ? 'var(--primary)' : 'var(--gray-400)', fontWeight: duration ? 700 : 400 }}>
                  {duration || 'Selecione início e fim'}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hora de Início <span className="required">*</span></label>
                <select
                  className={`form-control form-select${fieldErrors.hora_inicio ? ' border-danger' : ''}`}
                  value={form.hora_inicio}
                  onChange={e => handleHoraInicio(e.target.value)}
                >
                  <option value="">-- Selecionar --</option>
                  {slots.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {fieldErrors.hora_inicio && <div className="form-error">{fieldErrors.hora_inicio}</div>}
                {settings && <div className="form-hint">Horário: {settings.opening_hour} – {settings.closing_hour}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Hora de Fim <span className="required">*</span></label>
                <select
                  className={`form-control form-select${fieldErrors.hora_fim ? ' border-danger' : ''}`}
                  value={form.hora_fim}
                  onChange={e => set('hora_fim', e.target.value)}
                >
                  <option value="">-- Selecionar --</option>
                  {slots.filter(s => !form.hora_inicio || s > form.hora_inicio).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {fieldErrors.hora_fim && <div className="form-error">{fieldErrors.hora_fim}</div>}
              </div>
            </div>

            {/* Divider */}
            <div className="divider" />
            <div style={{ fontWeight: 700, color: 'var(--dark)', marginBottom: 16, fontSize: 14 }}>
              📌 Detalhes Opcionais
            </div>

            {/* Finalidade */}
            <div className="form-group">
              <label className="form-label">Finalidade da Reunião</label>
              <select
                className="form-control form-select"
                value={form.finalidade}
                onChange={e => set('finalidade', e.target.value)}
              >
                <option value="">-- Selecionar (opcional) --</option>
                {FINALIDADES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Observações */}
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Ex: Necessário projetor, videoconferência, mesa em U..."
                value={form.observacoes}
                onChange={e => set('observacoes', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Info sala */}
            <div className="alert alert-info" style={{ marginBottom: 24 }}>
              <span>ℹ️</span>
              <div>
                <strong>Aquário</strong> · Capacidade: 12 pessoas
                <div style={{ fontSize: 12, marginTop: 2, opacity: 0.85 }}>
                  Projetor Full HD · Videoconferência · Quadro Branco · Wi-Fi · Climatização
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Link to="/reservas" className="btn btn-ghost">Cancelar</Link>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading || conflictCheck?.hasConflict}
              >
                {loading ? '⏳ A reservar...' : '✓ Confirmar Reserva'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
