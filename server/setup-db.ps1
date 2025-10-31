# Script PowerShell per setup database GameCall

Write-Host "🗄️  Setup Database GameCall" -ForegroundColor Cyan
Write-Host ""

# Trova psql.exe
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    # Cerca nelle cartelle standard di PostgreSQL
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            break
        }
    }
}

if (-not $psqlPath) {
    Write-Host "❌ psql.exe non trovato!" -ForegroundColor Red
    Write-Host "Verifica che PostgreSQL sia installato correttamente." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL trovato: $psqlPath" -ForegroundColor Green
Write-Host ""

# Crea database
Write-Host "📦 Creazione database 'gamecall'..." -ForegroundColor Yellow

$env:PGPASSWORD = "admin"
& $psqlPath -U postgres -c "CREATE DATABASE gamecall;" 2>$null

if ($LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq 1) {
    Write-Host "✅ Database 'gamecall' creato (o già esistente)" -ForegroundColor Green
} else {
    Write-Host "❌ Errore creazione database" -ForegroundColor Red
    Write-Host "Prova manualmente: psql -U postgres -c 'CREATE DATABASE gamecall;'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📋 Applicazione schema SQL..." -ForegroundColor Yellow

# Applica schema
& $psqlPath -U postgres -d gamecall -f schema.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Schema applicato con successo!" -ForegroundColor Green
} else {
    Write-Host "❌ Errore applicazione schema" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Setup completato!" -ForegroundColor Green
Write-Host ""
Write-Host "Verifica tabelle create:" -ForegroundColor Cyan
& $psqlPath -U postgres -d gamecall -c "\dt"

Write-Host ""
Write-Host "✅ Tutto pronto! Ora puoi avviare il server con:" -ForegroundColor Green
Write-Host "   cd server" -ForegroundColor Yellow
Write-Host "   cargo run" -ForegroundColor Yellow
