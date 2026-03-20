# MANUAL DO PRODUTO
## Sistema de Reservas AIRV — "Aquário"
**Versão 2.0 | Março 2026**

> Manual para vendas, suporte e demonstração. Escrito para não-programadores.

---

# O QUE É

O **Sistema de Reservas do Aquário** é uma aplicação web que permite às empresas incubadas na AIRV solicitar a utilização da sala de reuniões "Aquário", e à administração (Dra. Fátima) confirmar, rejeitar e gerir todos os pedidos.

## Dois Portais Distintos

### 🏢 Portal da Empresa Incubada
- **Quem usa:** Responsáveis das empresas incubadas
- **O que faz:**
  - Selecionar a empresa a que pertence
  - Ver horários já ocupados (confirmados) para cada dia
  - Solicitar uma reserva → fica como "pendente" ⏳
  - Consultar o estado dos seus pedidos (pendente, confirmada, rejeitada)
- **O que NÃO pode fazer:** Confirmar, cancelar, gerir empresas ou configurações

### ⚙️ Portal da Administração (Dra. Fátima)
- **Quem usa:** A Dra. Fátima e a equipa AIRV
- **O que faz:**
  - ✅ Confirmar pedidos de reserva (com verificação automática de conflitos)
  - ❌ Rejeitar pedidos
  - 📅 Criar reservas diretamente (ficam confirmadas de imediato)
  - 🏢 Gerir empresas incubadas (adicionar, editar, ativar/desativar)
  - 🔒 Bloquear datas (feriados, manutenção)
  - ⚙️ Configurar horários do Aquário
  - 📊 Ver estatísticas e histórico completo

---

# ARGUMENTOS COMERCIAIS

| Benefício | Detalhe |
|---|---|
| **Zero custo mensal** | Sem assinaturas, sem cloud, sem surpresas |
| **100% offline** | Funciona sem internet, dentro da rede AIRV |
| **Fluxo de aprovação** | Empresas pedem, admin confirma — controlo total |
| **Branding AIRV** | Cores e logo oficiais da associação |
| **Multiutilizador** | Empresas e admin acedem por portais diferentes |
| **Visual profissional** | Calendário interativo, Dashboard em tempo real |
| **Sem formação** | Interface intuitiva, em português europeu |

---

# COMO DEMONSTRAR

## 1. Arrancar o Sistema
- Duplo clique em `start.bat`
- Abrir `http://localhost:5173` no browser

## 2. Mostrar a Página de Escolha
- Logo AIRV centrado no topo, com dois cartões:
  - "Empresa Incubada" (verde)
  - "Administração AIRV" (azul)

## 3. Demonstrar o Portal Empresa
- Clicar "Entrar como Empresa"
- Selecionar uma empresa no dropdown
- Mostrar o formulário: data, horas, responsável, email
- Mostrar os horários já ocupados ao selecionar uma data
- Enviar um pedido → aparece como "⏳ Pendente"
- Ir ao separador "Os Meus Pedidos" → mostrar o estado

## 4. Demonstrar o Portal Admin
- Voltar à escolha → "Entrar como Administrador"
- Dashboard: "Bom dia, Dra. Fátima" com estado do Aquário
- Painel Admin → separador "📩 Pedidos Pendentes"
- Confirmar um pedido com ✅ → estado muda para confirmada
- Mostrar o calendário com a reserva agora visível
- Mostrar a gestão de empresas e configurações

---

# FAQ — PERGUNTAS FREQUENTES

**P: A empresa consegue criar uma reserva diretamente?**
R: Não. A empresa faz um *pedido* que fica pendente. Só a Dra. Fátima pode confirmar.

**P: O que acontece se duas empresas pedem o mesmo horário?**
R: Ambos os pedidos ficam pendentes. Quando a admin confirma um, se o outro conflitar, a confirmação é recusada automaticamente.

**P: A admin pode criar reservas sem passar pelo Portal Empresa?**
R: Sim. No menu "Nova Reserva" do Portal Admin, pode criar reservas que ficam confirmadas de imediato.

**P: O sistema funciona sem internet?**
R: Sim, 100%. Funciona na rede local da AIRV.

**P: Quanto custa?**
R: Zero euros mensais. Custo único de implementação. Sem subscrições.

**P: Precisa de servidor dedicado?**
R: Não. Funciona em qualquer PC Windows com Node.js instalado.

---

# SUPORTE BÁSICO

| Problema | O que fazer |
|---|---|
| Não abre no browser | Executar `start.bat` e esperar 5 segundos |
| Erro no formulário | Verificar campos obrigatórios (todos com *) |
| Reserva não aparece no calendário | Verificar se foi confirmada pela admin |
| "Aquário Ocupado" mas ninguém está na sala | Há uma reserva ativa para esta hora — verificar no Dashboard |
| Quero alterar horários | Admin → Painel Admin → Configurações |

---

# PREÇOS E LICENCIAMENTO

O sistema é desenvolvido à medida para a AIRV. Inclui:
- ✅ Software completo (Backend + Frontend)
- ✅ Base de dados local (sem cloud)
- ✅ Branding AIRV personalizado
- ✅ Documentação completa
- ✅ Manual de implementação
- ❌ Sem custos mensais ou anuais
