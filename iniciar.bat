@echo off
title Ctrl-Licitacao - Servidor Local
chcp 65001 > nul
clear

echo ================================================================
echo             INICIANDO CTRL-LICITAÇÃO (LOCAL)
echo ================================================================
echo.

:: 1. Verificar se o Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não foi encontrado neste computador!
    echo Por favor, instale o Node.js antes de continuar.
    echo Baixe em: https://nodejs.org/
    pause
    exit
)

:: 2. Verificar pasta node_modules (se não existir, instala)
if not exist node_modules (
    echo [INFO] Primeira execução detectada. Instalando dependências...
    echo Isso pode levar alguns minutos...
    call npm install
)

:: 3. Verificar banco de dados SQLite local
if not exist prisma\dev.db (
    echo [INFO] Criando banco de dados SQLite local...
    call npx prisma db push
    echo [INFO] Populando banco de dados com dados de teste...
    call npm run db:seed
)

:: 4. Abrir o navegador automaticamente
echo [INFO] Abrindo o sistema no navegador...
start http://localhost:3000

:: 5. Iniciar o servidor
echo [INFO] Servidor rodando! Não feche esta janela enquanto estiver usando.
echo.
echo Para desligar o servidor, feche esta janela ou aperte Ctrl+C
echo.
echo ================================================================
call npm run dev
pause
