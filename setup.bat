@echo off
title "AIRV Incubacao - Setup"

echo Verificando Node e NPM...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    pause
    exit /b 1
)

echo [1/4] Instalando dependencias do Backend...
cd /d "%~dp0backend"
call npm install

if not exist ".env" (
    copy ".env.example" ".env" >nul
)

echo [2/4] Instalando dependencias do Frontend...
cd /d "%~dp0frontend"
call npm install

if not exist ".env" (
    copy ".env.example" ".env" >nul
)

echo [3/4] Base de dados inicial...
cd /d "%~dp0backend"
node seed.js

echo.
echo [4/4] Setup concluido com sucesso!
echo.
pause
