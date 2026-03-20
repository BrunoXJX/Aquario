import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin   from '@fullcalendar/daygrid';
import timeGridPlugin  from '@fullcalendar/timegrid';
import listPlugin      from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptLocale from '@fullcalendar/core/locales/pt';
import { useNavigate } from 'react-router-dom';
import { getReservations, getSettings } from '../services/api.js';

const COLORS = [
  '#003B82','#0057BE','#1A759F','#198754',
  '#E8A020','#C0392B','#7B3F9E','#2C7BE5'
];

function getCompanyColor(companyName, companies) {
  const idx = companies.indexOf(companyName) % COLORS.length;
  return COLORS[Math.max(0, idx)];
}

export default function CalendarPage() {
  const [events, setEvents]         = useState([]);
  const [companies, setCompanies]   = useState([]);
  const [settings, setSettings]     = useState(null);
  const [selected, setSelected]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();
  const calRef = useRef(null);

  const loadEvents = async (startStr, endStr) => {
    setLoading(true);
    try {
      const params = {};
      if (startStr) params.start_date = startStr.split('T')[0];
      if (endStr)   params.end_date   = endStr.split('T')[0];
      const data = await getReservations({ ...params, status: 'confirmada', limit: 500 });

      // Collect unique company names for color mapping
      const uniqueCompanies = [...new Set(data.map(r => r.company_name))];
      setCompanies(uniqueCompanies);

      const mapped = data.map(r => ({
        id:        String(r.id),
        title:     r.company_name,
        start:     `${r.data}T${r.hora_inicio}`,
        end:       `${r.data}T${r.hora_fim}`,
        color:     getCompanyColor(r.company_name, uniqueCompanies),
        extendedProps: r
      }));
      setEvents(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
    loadEvents();
  }, []);

  const handleDateClick = (info) => {
    navigate(`/nova-reserva?date=${info.dateStr}`);
  };

  const handleEventClick = (info) => {
    setSelected(info.event.extendedProps);
  };

  const handleDatesSet = (dateInfo) => {
    loadEvents(dateInfo.startStr, dateInfo.endStr);
  };

  const openHour  = settings?.opening_hour  ? parseInt(settings.opening_hour.split(':')[0])  : 8;
  const closeHour = settings?.closing_hour  ? parseInt(settings.closing_hour.split(':')[0])  : 20;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h1>Calendário de Reservas</h1>
          <p>Vista por dia, semana ou mês. Clique num slot livre para reservar.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/nova-reserva')}>
          ＋ Nova Reserva
        </button>
      </div>

      {/* Legend */}
      {companies.length > 0 && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          {companies.map((c, i) => (
            <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-600)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length], flexShrink: 0 }} />
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body" style={{ padding: 16 }}>
          {loading && (
            <div style={{ position: 'absolute', top: 10, right: 16, fontSize: 12, color: 'var(--gray-400)' }}>
              A carregar...
            </div>
          )}
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            locale={ptLocale}
            headerToolbar={{
              left:   'prev,next today',
              center: 'title',
              right:  'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            buttonText={{
              month:    'Mês',
              week:     'Semana',
              day:      'Dia',
              listWeek: 'Lista'
            }}
            events={events}
            slotMinTime={`${String(openHour).padStart(2,'0')}:00:00`}
            slotMaxTime={`${String(closeHour).padStart(2,'0')}:00:00`}
            slotDuration="00:30:00"
            slotLabelInterval="01:00"
            allDaySlot={false}
            weekends={true}
            height="auto"
            contentHeight={620}
            editable={false}
            selectable={true}
            selectMirror={true}
            nowIndicator={true}
            businessHours={{
              daysOfWeek: [1,2,3,4,5],
              startTime: settings?.opening_hour || '08:00',
              endTime:   settings?.closing_hour || '20:00',
            }}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            eventContent={(arg) => (
              <div style={{ padding: '2px 4px', overflow: 'hidden' }}>
                <div style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.2 }}>{arg.event.title}</div>
                <div style={{ fontSize: 10, opacity: 0.85 }}>
                  {arg.event.extendedProps.user_name}
                </div>
                {arg.event.extendedProps.finalidade && (
                  <div style={{ fontSize: 10, opacity: 0.7, fontStyle: 'italic' }}>
                    {arg.event.extendedProps.finalidade}
                  </div>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Event Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Detalhe da Reserva</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div className="form-label">Empresa</div>
                  <div style={{ fontWeight: 700, color: 'var(--dark)', fontSize: 15 }}>{selected.company_name}</div>
                </div>
                <div>
                  <div className="form-label">Responsável</div>
                  <div style={{ fontWeight: 600 }}>{selected.user_name}</div>
                </div>
                <div>
                  <div className="form-label">Data</div>
                  <div style={{ fontWeight: 600 }}>{selected.data}</div>
                </div>
                <div>
                  <div className="form-label">Horário</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {selected.hora_inicio} – {selected.hora_fim}
                  </div>
                </div>
                <div>
                  <div className="form-label">Email</div>
                  <div>{selected.user_email}</div>
                </div>
                <div>
                  <div className="form-label">Estado</div>
                  <span className={`badge badge-${selected.estado}`}>{selected.estado}</span>
                </div>
                {selected.finalidade && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div className="form-label">Finalidade</div>
                    <div>{selected.finalidade}</div>
                  </div>
                )}
                {selected.observacoes && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div className="form-label">Observações</div>
                    <div style={{ color: 'var(--gray-600)', fontStyle: 'italic' }}>{selected.observacoes}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
