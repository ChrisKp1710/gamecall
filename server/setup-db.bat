@echo off
echo ========================================
echo Setup Database GameCall
echo ========================================
echo.

set PGPASSWORD=admin
set PSQL_PATH=C:\Program Files\PostgreSQL\18\bin\psql.exe

echo Creazione database gamecall...
"%PSQL_PATH%" -U postgres -c "CREATE DATABASE gamecall;" 2>nul

if %errorlevel% equ 0 (
    echo [OK] Database creato con successo
) else (
    echo [OK] Database gia esistente
)

echo.
echo Applicazione schema SQL...
"%PSQL_PATH%" -U postgres -d gamecall -f schema.sql

if %errorlevel% equ 0 (
    echo [OK] Schema applicato con successo!
) else (
    echo [ERRORE] Problema applicazione schema
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completato!
echo ========================================
echo.
echo Verifica tabelle create:
"%PSQL_PATH%" -U postgres -d gamecall -c "\dt"

echo.
echo Ora puoi avviare il server con:
echo   cargo run
echo.
pause
