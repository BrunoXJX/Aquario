# DOCUMENTAÇÃO TÉCNICA COMPLETA
## Sistema de Reservas AIRV Incubação — "Aquário"
**Versão 2.0 | Março 2026**

> Este documento explica TUDO sobre como o software funciona por dentro. Foi escrito para que alguém que nunca programou consiga entender cada peça, cada ficheiro, cada tecnologia, e consiga diagnosticar e corrigir qualquer problema que apareça.

---

# PARTE 1: COMO O SOFTWARE FUNCIONA (A Grande Fotografia)

## 1.1 A Analogia do Restaurante

Imagina que o software é um **restaurante**. Tem 3 partes que trabalham juntas:

| Parte do Restaurante | Parte do Software | O que faz |
|---|---|---|
| **A Sala e o Menu** (o que o cliente vê) | **Frontend** (React + Vite) | É o site que aparece no browser. Mostra o calendário, botões, formulários. Não guarda nada. |
| **A Cozinha** (onde o trabalho real acontece) | **Backend** (Node.js + Express) | Recebe os pedidos do site, valida tudo (horários, conflitos, campos obrigatórios) e devolve respostas. |
| **O Caderno de Registos** | **Base de Dados** (SQLite) | Um ficheiro único (`airv.db`) que guarda TUDO: reservas, empresas, configurações, datas bloqueadas. |

## 1.2 Os Dois Portais

O sistema tem **duas entradas separadas** pensadas para dois tipos de utilizadores:

| Portal | URL | Utilizador | O que pode fazer |
|---|---|---|---|
| **Portal Empresa** | `/empresa` | Empresas incubadas | Ver disponibilidade do Aquário, pedir reservas (ficam **pendentes**), ver estado dos seus pedidos |
| **Portal Admin** | `/admin` | Dra. Fátima (AIRV) | Confirmar/rejeitar pedidos, criar reservas diretamente, gerir empresas, bloquear datas, configurar horários |

A página inicial (`/`) mostra dois cartões: "Empresa Incubada" e "Administração AIRV".

## 1.3 O Fluxo Completo de uma Reserva

### Fluxo da Empresa Incubada:
1. Abre `http://localhost:5173` → clica em "Empresa Incubada"
2. Seleciona a sua empresa no dropdown
3. No separador "Pedir Reserva", escolhe data e hora
4. Vê os horários já ocupados (confirmados) para essa data
5. Preenche o formulário e clica "Enviar Pedido"
6. A reserva é criada com estado **"pendente" ⏳**
7. No separador "Os Meus Pedidos", vê o estado (pendente/confirmada/rejeitada)

### Fluxo da Administração (Dra. Fátima):
1. Abre `http://localhost:5173` → clica em "Administração AIRV"
2. O Dashboard mostra o estado do Aquário (livre/ocupado/reservado)
3. No Painel Admin → separador "📩 Pedidos Pendentes":
   - Vê todos os pedidos com empresa, data, horário, responsável
   - Clica **✅ Confirmar** (verifica conflitos automaticamente) ou **❌ Rejeitar**
4. Pode também criar reservas diretamente (ficam confirmadas de imediato)

### Estados de uma reserva:

| Estado | Significado | Cor |
|---|---|---|
| **pendente** | Empresa pediu, aguarda aprovação da Dra. Fátima | 🟡 Amarelo |
| **confirmada** | Aprovada pela admin, bloqueia o horário | 🟢 Verde |
| **rejeitada** | A admin recusou o pedido | 🔴 Vermelho |
| **cancelada** | Foi cancelada (pela admin ou por bloqueio de data) | ⚫ Cinza |

---

# PARTE 2: AS TECNOLOGIAS EXPLICADAS

## 2.1 Node.js (v24) — O Motor Invisível
Programa que permite correr JavaScript no computador. Sem ele, nada funciona. Executa o `server.js` do Backend.
- **Versão:** v24.14.0
- **Instalação:** `C:\Program Files\nodejs\`
- **Comandos úteis:** `node -v`, `node server.js`, `npm install`, `npm start`

## 2.2 npm — O Gestor de Bibliotecas
Vem com o Node.js. Lê o `package.json` e descarrega todas as bibliotecas para `node_modules`.
- **Regra de ouro:** Se algo inexplicável acontecer, apaga `node_modules` e corre `npm install`.

## 2.3 Express.js — A API do Backend
Framework que cria "links secretos" (endpoints) que aceitam pedidos e devolvem respostas.

**Lista completa dos endpoints:**

| Método | Endpoint | O que faz |
|---|---|---|
| GET | `/api/health` | Verifica se o servidor está vivo |
| GET | `/api/settings` | Lê configurações do Aquário |
| PUT | `/api/settings` | Altera configurações |
| GET | `/api/companies` | Lista empresas ativas |
| GET | `/api/companies/all` | Lista TODAS as empresas |
| POST | `/api/companies` | Cria nova empresa |
| PUT | `/api/companies/:id` | Edita uma empresa |
| GET | `/api/rooms` | Lista salas disponíveis |
| GET | `/api/dashboard/today` | Dados do painel principal |
| **GET** | **`/api/dashboard/pending`** | **Conta e lista pedidos pendentes** |
| GET | `/api/reservations` | Lista reservas (com filtros) |
| POST | `/api/reservations` | Cria nova reserva (estado: pendente ou confirmada) |
| GET | `/api/reservations/:id` | Lê uma reserva |
| PUT | `/api/reservations/:id` | Edita uma reserva |
| DELETE | `/api/reservations/:id` | Cancela uma reserva |
| **PUT** | **`/api/reservations/:id/confirm`** | **Confirma um pedido pendente** |
| **PUT** | **`/api/reservations/:id/reject`** | **Rejeita um pedido pendente** |
| POST | `/api/reservations/check` | Verifica conflitos (sem criar) |
| GET | `/api/blocked-dates` | Lista datas bloqueadas |
| POST | `/api/blocked-dates` | Bloqueia uma data |
| DELETE | `/api/blocked-dates/:id` | Desbloqueia uma data |
| GET | `/api/admin/stats` | Estatísticas completas |

## 2.4 SQLite — A Base de Dados
Ficheiro único `backend/data/airv.db`. Zero instalação, cópia = backup.

### As 5 tabelas:

**`settings`** — Configurações do Aquário (1 linha: horários, durações, intervalos)

**`companies`** — Empresas incubadas (nome, email, telefone, ativa/inativa)

**`rooms`** — Salas (de momento: 1 sala chamada "Aquário", capacidade 12 pessoas)

**`reservations`** — Reservas (o coração do sistema):

| Campo | Exemplo | Significado |
|---|---|---|
| estado | "pendente" | **"pendente", "confirmada", "rejeitada" ou "cancelada"** |
| company_name | "TechStart, Lda" | Empresa que reservou |
| data | "2026-03-19" | Data da reserva |
| hora_inicio / hora_fim | "09:00" / "10:30" | Horário |
| finalidade | "Reunião semanal" | Motivo |

**`blocked_dates`** — Datas bloqueadas (feriados, manutenção)

## 2.5 React.js (v18) — O Frontend
Framework que constrói interfaces web. Tudo funciona numa única página (SPA).

## 2.6 Vite — Servidor de Desenvolvimento
Porta **5173**, com proxy para redirecionar `/api` → `localhost:3002`. Hot reload automático.

## 2.7 FullCalendar — Calendário Visual
Calendários interativos (semana, mês) com reservas como blocos coloridos.

## 2.8 Axios — Comunicação Frontend↔Backend
Timeout de 10s, interceptor de erros em português.

## 2.9 Fonte e Branding
- **Fonte:** Montserrat (Google Fonts) — mesma família do site airv.pt
- **Cor primária:** Verde AIRV `#00965E`
- **Cor secundária:** Navy `#2D5A7B` (sidebar)
- **Logo:** SVG oficial da AIRV descarregado de `airv.pt/wp-content/uploads/2023/08/LogoAIRV-1.svg`

---

# PARTE 3: MAPA DE FICHEIROS

```
airv-reservas/
├── setup.bat                  ← Instala tudo pela 1ª vez
├── start.bat                  ← Arranca o sistema no dia-a-dia
├── DOCUMENTACAO.md            ← ESTE FICHEIRO
├── MANUAL_DO_PRODUTO.md       ← Manual para vendas e suporte
├── IMPLEMENTACAO_AIRV.md      ← Guia de implementação na AIRV
│
├── backend/
│   ├── .env                   ← Configurações (PORT=3002)
│   ├── server.js              ← API completa (~560 linhas)
│   ├── database.js            ← Schema SQLite
│   ├── seed.js                ← Dados de demonstração
│   └── data/airv.db           ← BASE DE DADOS
│
├── frontend/
│   ├── index.html             ← Esqueleto HTML + Google Fonts
│   ├── vite.config.js         ← Proxy + porta
│   ├── public/
│   │   └── airv-logo.svg      ← Logo oficial AIRV
│   └── src/
│       ├── App.jsx            ← Rotas: /, /empresa, /admin/*
│       ├── index.css          ← Estilos (cores AIRV, 2 portais)
│       ├── components/
│       │   ├── Sidebar.jsx    ← Menu lateral (admin)
│       │   └── Header.jsx     ← Barra superior (admin)
│       ├── pages/
│       │   ├── PortalChoice.jsx   ← Página de escolha (2 cartões)
│       │   ├── EmpresaPortal.jsx  ← Portal empresa (simplificado)
│       │   ├── Dashboard.jsx      ← Dashboard admin
│       │   ├── CalendarPage.jsx   ← Calendário
│       │   ├── NewReservation.jsx ← Nova reserva (admin)
│       │   ├── Reservations.jsx   ← Lista reservas
│       │   └── AdminPage.jsx      ← Painel admin + Pendentes
│       └── services/api.js    ← Axios + todos os endpoints
```

---

# PARTE 4: REGRAS DE NEGÓCIO

## 4.1 Criação de Reserva
1. Campos obrigatórios: empresa, nome, email, data, hora início, hora fim
2. Email com formato válido
3. Sem datas passadas, dentro do horário configurado (default 08:00–20:00)
4. Duração: mínimo 30min, máximo 8h
5. Datas bloqueadas são rejeitadas
6. **Conflitos: apenas reservas CONFIRMADAS bloqueiam horários** (pendentes não conflitam)

## 4.2 Estado das Reservas
- **Empresa cria reserva** → estado = `"pendente"`
- **Admin cria reserva** → estado = `"confirmada"` (diretamente)
- **Admin confirma pedido** → verifica conflitos → `"confirmada"`
- **Admin rejeita pedido** → `"rejeitada"`
- **Cancelamento** → `"cancelada"` (mantém histórico)

## 4.3 Bloqueio de Datas
- Quando bloqueada, todas as reservas nessa data são canceladas automaticamente
- Não se pode bloquear a mesma data duas vezes

---

# PARTE 5: ROTAS DO FRONTEND

| URL | Página | Acesso |
|---|---|---|
| `/` | Página de escolha (2 cartões) | Todos |
| `/empresa` | Portal empresa (sem sidebar) | Empresas |
| `/admin` | Dashboard | Admin |
| `/admin/calendario` | Calendário | Admin |
| `/admin/nova-reserva` | Nova Reserva (confirmada) | Admin |
| `/admin/reservas` | Todas as Reservas | Admin |
| `/admin/config` | Painel Admin (6 separadores) | Admin |

**Separadores do Painel Admin:**
📩 Pedidos Pendentes · 📊 Visão Geral · 📋 Reservas · 🏢 Empresas · 🔒 Datas Bloqueadas · ⚙️ Configurações

---

# PARTE 6: RESOLUÇÃO DE PROBLEMAS

| Problema | Causa | Solução |
|---|---|---|
| "Não é possível aceder a este site" | Servidores desligados | Correr `start.bat` e esperar 5s |
| "Erro de ligação ao servidor" | Backend morreu | Ver janela preta, correr `npm install` se necessário |
| "node não é reconhecido" | Node.js não instalado | Instalar de nodejs.org + reiniciar PC |
| Quero apagar tudo | — | Apagar `node_modules` + `airv.db`, correr `setup.bat` |
| Mudar horários do Aquário | — | Admin → Painel Admin → Configurações |
| Reserva não aparece no calendário | Está pendente | Admin precisa confirmar primeiro |

---

# PARTE 7: GLOSSÁRIO

| Termo | Significado |
|---|---|
| **API** | Links do servidor para receber/enviar dados |
| **Backend** | Parte invisível que gere dados e regras |
| **Frontend** | Parte visual no browser |
| **Portal** | Entrada separada para um tipo de utilizador |
| **Pendente** | Reserva que aguarda confirmação da administração |
| **Aquário** | Nome da sala de reuniões da incubadora AIRV |
| **SPA** | Site que funciona numa única página HTML |
| **SQLite** | Base de dados num único ficheiro (.db) |
| **Proxy** | Intermediário que redireciona pedidos |
| **Hot Reload** | Atualização automática quando se edita código |
