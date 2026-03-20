# GUIA DE IMPLEMENTAÇÃO NA AIRV
## Sistema de Reservas — "Aquário"
**Versão 2.0 | Março 2026**

> Guia prático para instalar, configurar e manter o sistema na AIRV.

---

# 1. REQUISITOS

| Componente | Requisito |
|---|---|
| **Computador** | Qualquer PC Windows 10/11 (pode ser o da receção) |
| **RAM** | Mínimo 4GB (recomendado 8GB) |
| **Disco** | 500MB livres |
| **Node.js** | v18 ou superior (instalado: v24.14.0) |
| **Browser** | Chrome, Edge, ou Opera (moderno) |
| **Rede** | Os PCs das empresas devem aceder ao IP do servidor |

---

# 2. INSTALAÇÃO INICIAL

## Passo 1: Instalar Node.js
1. Descarregar de https://nodejs.org (versão LTS)
2. Instalar com opções por defeito
3. **Reiniciar o computador**
4. Abrir terminal → `node -v` → deve mostrar a versão

## Passo 2: Copiar o Projeto
1. Copiar a pasta `airv-reservas` para o computador de destino
2. Exemplo: `C:\AIRV\airv-reservas\`

## Passo 3: Instalação Automática
1. Duplo clique em `setup.bat`
2. Aguardar que instale as dependências (2-5 minutos)
3. O script também cria dados de demonstração na BD

## Passo 4: Arrancar
1. Duplo clique em `start.bat`
2. Abrir `http://localhost:5173` no browser

---

# 3. CONFIGURAÇÃO DE REDE

Para que as empresas incubadas acedam ao sistema a partir dos seus computadores:

## Descobrir o IP do servidor
No computador onde o sistema está instalado:
```
ipconfig
```
Anotar o "Endereço IPv4" (ex: `192.168.1.100`)

## Acesso das empresas
No browser de qualquer PC na mesma rede:
```
http://192.168.1.100:5173
```
Aparecerá a página de escolha com os dois portais.

## Firewall (se necessário)
Abrir as portas **5173** (frontend) e **3002** (backend) no firewall do Windows Server.

---

# 4. PERSONALIZAÇÃO AIRV

O sistema já vem personalizado para a AIRV:

| Elemento | Configuração atual |
|---|---|
| **Logo** | SVG oficial da AIRV (`frontend/public/airv-logo.svg`) |
| **Cor primária** | Verde AIRV `#00965E` |
| **Cor sidebar** | Navy `#2D5A7B` |
| **Fonte** | Montserrat (Google Fonts) |
| **Nome da sala** | "Aquário" |
| **Saudação admin** | "Bom dia, Dra. Fátima" |
| **Avatar admin** | Letra "F" (Fátima) |
| **Favicon** | Verde com "A" |

### Alterar dados personalizados:
- **Nome da Dra. Fátima** → editar `Dashboard.jsx` (linha ~121)
- **Avatar** → editar `Header.jsx` (linha ~66)
- **Logo** → substituir `frontend/public/airv-logo.svg`
- **Cores** → editar variáveis CSS no `index.css` (linhas 6-68)

---

# 5. GESTÃO DO DIA-A-DIA

## Fluxo típico da Dra. Fátima:
1. Abrir `http://localhost:5173` → "Administração AIRV"
2. Ir ao Painel Admin → "📩 Pedidos Pendentes"
3. Para cada pedido: **✅ Confirmar** ou **❌ Rejeitar**
4. Se necessário, criar reserva diretamente em "Nova Reserva"

## Adicionar nova empresa incubada:
1. Portal Admin → Painel Admin → separador "🏢 Empresas"
2. Preencher nome, email, telefone
3. Clicar "Criar Empresa"
4. A empresa aparece automaticamente no dropdown do Portal Empresa

## Bloquear data (feriado, evento, manutenção):
1. Portal Admin → Painel Admin → "🔒 Datas Bloqueadas"
2. Selecionar data e motivo
3. Clicar "Bloquear" → todas as reservas nessa data são canceladas

## Alterar horários do Aquário:
1. Portal Admin → Painel Admin → "⚙️ Configurações"
2. Alterar abertura, encerramento, durações
3. Guardar

---

# 6. BACKUP

## O que fazer backup:
Copiar **apenas** o ficheiro `backend/data/airv.db` — contém todas as reservas, empresas e configurações.

## Automatizar (Windows):
Criar ficheiro `backup.bat`:
```batch
@echo off
set DESTINO=D:\Backups\AIRV
set DATA=%date:~6,4%%date:~3,2%%date:~0,2%
if not exist "%DESTINO%" mkdir "%DESTINO%"
copy "C:\AIRV\airv-reservas\backend\data\airv.db" "%DESTINO%\airv_%DATA%.db"
echo Backup concluído: airv_%DATA%.db
```

Agendar no Agendador de Tarefas do Windows para correr diariamente.

---

# 7. ARRANQUE AUTOMÁTICO (Opcional)

Para que o sistema arranque automaticamente com o Windows:

1. Pressionar `Win + R` → escrever `shell:startup`
2. Criar atalho para `start.bat` nessa pasta
3. Ao ligar o PC, o sistema arranca sozinho

---

# 8. ATUALIZAÇÕES FUTURAS

Possíveis expansões (requerem desenvolvimento):
- 📧 Notificações por email de confirmação/rejeição
- 📱 App móvel para empresas
- 🖥️ Ecrã TV na receção (mostrar estado do Aquário)
- 📊 Relatórios mensais de utilização
- 🔐 Login com password para cada empresa
- 🏢 Suporte a múltiplas salas

---

# 9. CONTACTOS DE SUPORTE

| Tipo | Contacto |
|---|---|
| **Suporte técnico** | [a definir] |
| **Email AIRV** | geral@airv.pt |
| **Telefone AIRV** | 232 470 290 |
