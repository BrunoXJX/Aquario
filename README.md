# AIRV Incubação | Reservas

**Sistema de Gestão e Reserva da Sala de Reuniões**
Incubadora de Empresas — AIRV, Associação Empresarial da Região de Viseu

---

## Stack Técnica

| Camada    | Tecnologia                | Porta  |
|-----------|---------------------------|--------|
| Frontend  | React 18 + Vite 5         | 5173   |
| Backend   | Express.js 4 + SQLite     | 3001   |
| Base dados| SQLite (better-sqlite3)   | local  |
| Orquestração | n8n (ambiente aquário) | 5678   |

---

## Arranque Rápido (Windows)

### 1ª vez (instalar dependências + seed)
```batch
setup.bat
```

### Arranque diário
```batch
start.bat
```

Abre automaticamente: **http://localhost:5173**

---

## Instalação Manual

### Backend
```batch
cd backend
npm install
copy .env.example .env
node seed.js
npm start
```

### Frontend
```batch
cd frontend
npm install
copy .env.example .env
npm run dev
```

---

## Estrutura do Projeto

```
airv-reservas/
├── backend/
│   ├── server.js          → API Express (todos os endpoints)
│   ├── database.js        → SQLite schema + conexão
│   ├── seed.js            → Dados iniciais de demonstração
│   ├── data/airv.db       → Base de dados SQLite (criada automaticamente)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         → Dashboard, Calendário, Nova Reserva, Reservas, Admin
│   │   ├── components/    → Header, Sidebar
│   │   ├── services/api.js → Chamadas à API
│   │   └── index.css      → Estilos AIRV
│   └── package.json
├── n8n-workflows/         → Workflows exportáveis para n8n
├── setup.bat              → Instalação automática
└── start.bat              → Arranque da aplicação
```

---

## API Endpoints

| Método | Endpoint                    | Descrição                    |
|--------|-----------------------------|------------------------------|
| GET    | /api/health                 | Health check                 |
| GET    | /api/dashboard/today        | Dashboard com stats do dia   |
| GET    | /api/reservations           | Listar reservas (com filtros)|
| POST   | /api/reservations           | Criar reserva                |
| GET    | /api/reservations/:id       | Detalhe da reserva           |
| PUT    | /api/reservations/:id       | Editar reserva               |
| DELETE | /api/reservations/:id       | Cancelar reserva             |
| POST   | /api/reservations/check     | Verificar conflitos          |
| GET    | /api/companies              | Listar empresas              |
| POST   | /api/companies              | Criar empresa                |
| PUT    | /api/companies/:id          | Editar empresa               |
| GET    | /api/rooms                  | Listar salas                 |
| GET    | /api/settings               | Obter configurações          |
| PUT    | /api/settings               | Atualizar configurações      |
| GET    | /api/blocked-dates          | Datas bloqueadas             |
| POST   | /api/blocked-dates          | Bloquear data                |
| DELETE | /api/blocked-dates/:id      | Desbloquear data             |
| GET    | /api/admin/stats            | Estatísticas admin           |

### Filtros disponíveis em GET /api/reservations
- `?date=2025-03-20` — por data exata
- `?start_date=2025-03-01&end_date=2025-03-31` — intervalo
- `?company_id=2` — por empresa
- `?status=confirmada` — por estado
- `?limit=50&offset=0` — paginação

---

## Integração com n8n (ambiente aquário)

Os workflows estão em `n8n-workflows/`. Para importar:

1. Abrir n8n → http://localhost:5678
2. Ir ao ambiente **aquário**
3. Menu → **Import from file**
4. Selecionar os ficheiros `.json`
5. Ativar os workflows desejados

### Endpoints n8n disponíveis (após importação)
| Workflow | Endpoint Webhook |
|----------|-----------------|
| Criar reserva | POST `/webhook/airv/reservas/criar` |
| Listar reservas | GET `/webhook/airv/reservas` |
| Dashboard | GET `/webhook/airv/dashboard` |
| Cancelar | DELETE `/webhook/airv/reservas/:id` |
| Email (opcional) | POST `/webhook/airv/notificar` |

**Nota:** O frontend utiliza diretamente o backend Express (porta 3001). Os webhooks n8n são camadas adicionais de orquestração/integração.

---

## Modelo de Dados

### reservations
| Campo        | Tipo    | Descrição                    |
|--------------|---------|------------------------------|
| id           | INTEGER | Chave primária               |
| room_id      | INTEGER | ID da sala (default: 1)      |
| company_id   | INTEGER | FK para companies            |
| company_name | TEXT    | Nome da empresa              |
| user_name    | TEXT    | Nome do responsável          |
| user_email   | TEXT    | Email do responsável         |
| data         | TEXT    | Data (YYYY-MM-DD)            |
| hora_inicio  | TEXT    | Hora início (HH:MM)          |
| hora_fim     | TEXT    | Hora fim (HH:MM)             |
| estado       | TEXT    | confirmada / cancelada       |
| finalidade   | TEXT    | Propósito da reunião         |
| observacoes  | TEXT    | Notas adicionais             |
| created_at   | TEXT    | Timestamp criação            |
| updated_at   | TEXT    | Timestamp atualização        |

---

## Funcionalidades MVP

- ✅ Dashboard com estado atual da sala em tempo real
- ✅ Calendário (dia / semana / mês / lista) com FullCalendar
- ✅ Criação de reservas com validação completa
- ✅ Verificação de conflitos em tempo real
- ✅ Cancelamento de reservas
- ✅ Lista de reservas com filtros (data, empresa, estado)
- ✅ Painel admin completo (stats, todas reservas, empresas, datas bloqueadas, configurações)
- ✅ Gestão de empresas incubadas
- ✅ Configuração de horário, duração min/max, buffer
- ✅ Datas bloqueadas (feriados, manutenção)
- ✅ Seed inicial com dados de demonstração
- ✅ Workflows n8n exportáveis

---

## Evolução Futura (Fase 2)

1. **Autenticação** — JWT + login por empresa
2. **Notificações email** — Ativar workflow n8n 05
3. **Multi-sala** — Adicionar salas na tabela rooms
4. **Deploy remoto** — Node.js + PM2 + Nginx ou Railway/Render
5. **API pública** — Expor via n8n com autenticação
6. **Lembretes automáticos** — Cron job n8n antes da reunião
7. **Relatórios** — Excel/PDF via n8n
8. **App mobile** — PWA ou React Native

---

## Suporte

**AIRV – Associação Empresarial da Região de Viseu**
Edifício Expobeiras, Parque Industrial de Coimbrões
3500-618 Viseu · geral@airv.pt · 232 470 290
