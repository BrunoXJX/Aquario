@echo off
title "AIRV Incubacao - Iniciar"

if not exist "%~dp0backend\node_modules" (
    echo [AVISO] Dependencias nao instaladas. Executando setup...
    call "%~dp0setup.bat"
)

echo Iniciando Backend...
start "AIRV Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 /nobreak >nul

echo Iniciando Frontend...
start "AIRV Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 3 /nobreak >nul

echo Abrindo o browser...
start http://localhost:5173
echo.
echo Para fechar a aplicacao, basta fechar as novas janelas pretas que abriram (AIRV Backend e AIRV Frontend)
echo.
pause
