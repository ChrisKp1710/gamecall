# 🚀 SETUP BACKEND COMPLETO - GameCall

## 📋 PREREQUISITI

- ✅ Rust (già installato)
- ✅ Node.js (già installato)
- ⬜ PostgreSQL (da installare)

---

## 🐘 STEP 1: Installa PostgreSQL

### **Opzione A: Con Docker** (Più veloce, consigliato)

Se hai Docker installato:

```bash
# Avvia container PostgreSQL
docker run --name gamecall-postgres \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=gamecall \
  -p 5432:5432 \
  -d postgres:15

# Verifica che funzioni
docker ps
```

### **Opzione B: Installer Ufficiale**

1. Scarica PostgreSQL da: https://www.postgresql.org/download/windows/
2. Oppure usa winget:
   ```bash
   winget install PostgreSQL.PostgreSQL
   ```
3. Durante installazione:
   - Password: `password123` (o quella che preferisci)
   - Port: `5432` (default)
   - Locale: `Italian, Italy`

### **Opzione C: Con Scoop** (se lo hai)

```bash
scoop install postgresql
```

---

## 🗄️ STEP 2: Crea il Database

### Se usi Docker:

```bash
# Entra nel container
docker exec -it gamecall-postgres psql -U postgres

# Dentro psql:
CREATE DATABASE gamecall;
\c gamecall
\q
```

### Se usi PostgreSQL installato:

```bash
# Apri psql (dalla PowerShell o cmd)
psql -U postgres

# Dentro psql:
CREATE DATABASE gamecall;
\c gamecall
\q
```

---

## 📝 STEP 3: Configura Environment Variables

Il file `.env` è già creato in `server/.env`:

```env
DATABASE_URL=postgresql://postgres:password123@localhost:5432/gamecall
JWT_SECRET=super-secret-jwt-key-change-in-production-12345
PORT=3000
```

**⚠️ IMPORTANTE**: Se hai usato una password diversa, modifica `password123` nel DATABASE_URL!

---

## 🏗️ STEP 4: Crea le Tabelle

```bash
cd server

# Applica lo schema del database
psql -U postgres -d gamecall -f schema.sql
```

Oppure manualmente:

```bash
docker exec -i gamecall-postgres psql -U postgres -d gamecall < schema.sql
```

---

## 🚀 STEP 5: Avvia il Server

```bash
cd server

# Compila e avvia
cargo run

# Dovresti vedere:
# Connected to database
# Server listening on port 3000
```

---

## 🧪 STEP 6: Testa le API

### Health Check:
```bash
curl http://localhost:3000/health
# Risposta: OK
```

### Registrazione:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "mario", "password": "password123"}'

# Risposta:
# {
#   "token": "eyJ...",
#   "user": {
#     "id": "...",
#     "username": "mario",
#     "friend_code": "GC-XXXX-YYYY"
#   }
# }
```

### Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "mario", "password": "password123"}'
```

### Lista Amici (richiede token):
```bash
curl http://localhost:3000/friends \
  -H "Authorization: Bearer <il_tuo_token>"
```

---

## 🌐 STEP 7: Deploy su Railway (GRATIS)

### Setup Railway:

1. Crea account su https://railway.app (usa GitHub)

2. Installa Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

3. Login:
   ```bash
   railway login
   ```

4. Deploy:
   ```bash
   cd server
   railway init
   railway up
   ```

5. Aggiungi PostgreSQL su Railway:
   - Vai su dashboard Railway
   - Clicca "New" → "Database" → "PostgreSQL"
   - Railway ti darà una CONNECTION_STRING

6. Configura variabili ambiente su Railway:
   ```bash
   railway variables set DATABASE_URL=<connection_string_da_railway>
   railway variables set JWT_SECRET=super-secret-key
   railway variables set PORT=3000
   ```

7. L'app sarà disponibile su: `https://tuo-progetto.railway.app`

---

## 🔥 STEP 8: Deploy su Fly.io (Alternativa a Railway)

### Setup Fly.io:

1. Installa Fly CLI:
   ```bash
   pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. Signup/Login:
   ```bash
   fly auth signup
   # oppure
   fly auth login
   ```

3. Launch app:
   ```bash
   cd server
   fly launch

   # Quando chiede:
   # - App name: gamecall-api (o quello che vuoi)
   # - Region: Amsterdam (più vicino all'Italia)
   # - PostgreSQL: YES
   # - Redis: NO
   ```

4. Deploy:
   ```bash
   fly deploy
   ```

5. Configura secrets:
   ```bash
   fly secrets set JWT_SECRET=super-secret-key-production
   ```

6. L'app sarà su: `https://gamecall-api.fly.dev`

---

## 📊 COMANDI UTILI

### PostgreSQL (Docker):

```bash
# Start
docker start gamecall-postgres

# Stop
docker stop gamecall-postgres

# Logs
docker logs gamecall-postgres

# Backup database
docker exec gamecall-postgres pg_dump -U postgres gamecall > backup.sql

# Restore
docker exec -i gamecall-postgres psql -U postgres gamecall < backup.sql
```

### Server Rust:

```bash
# Sviluppo (con auto-reload)
cargo watch -x run

# Build produzione
cargo build --release

# Check errori senza compilare
cargo check

# Formatta codice
cargo fmt

# Linting
cargo clippy
```

---

## 🐛 TROUBLESHOOTING

### Errore: "DATABASE_URL must be set"
→ Il file `.env` non è stato caricato. Verifica che esista in `server/.env`

### Errore: "Connection refused" (port 5432)
→ PostgreSQL non è avviato
```bash
# Docker
docker start gamecall-postgres

# Windows Service
net start postgresql-x64-15
```

### Errore: "Password authentication failed"
→ Password errata nel DATABASE_URL. Verifica in `.env`

### Errore: "Database does not exist"
→ Crea il database:
```bash
psql -U postgres -c "CREATE DATABASE gamecall;"
```

### Errore: "Relation does not exist" (tabelle non trovate)
→ Applica lo schema:
```bash
cd server
psql -U postgres -d gamecall -f schema.sql
```

---

## ✅ CHECKLIST FINALE

Prima di procedere, verifica:

- [ ] PostgreSQL è in esecuzione (Docker o servizio)
- [ ] Database `gamecall` esiste
- [ ] Tabelle create (schema.sql applicato)
- [ ] File `.env` configurato correttamente
- [ ] Server Rust compila (`cargo check`)
- [ ] Server avviato (`cargo run`)
- [ ] Health check funziona (`curl localhost:3000/health`)
- [ ] Registrazione funziona
- [ ] Login funziona

---

## 🎯 PROSSIMO STEP

Una volta che il backend funziona in locale, passiamo a:

1. **Integrare frontend** → Modificare AuthContext per chiamare API reali
2. **Testare videochiamate** → PeerJS + backend
3. **Deploy tutto** → Railway o Fly.io

---

**🚀 Fatto! Ora hai un backend production-ready!**
