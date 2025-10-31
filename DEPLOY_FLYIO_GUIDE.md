# 🚀 GUIDA COMPLETA DEPLOY FLY.IO - GameCall

## 📋 INDICE

1. [Cosa deployare e perché](#cosa-deployare)
2. [Setup Fly.io](#setup-flyio)
3. [Deploy Backend Rust](#deploy-backend)
4. [Configurare Frontend](#configurare-frontend)
5. [Testing Completo](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 COSA DEPLOYARE E PERCHÉ {#cosa-deployare}

### **Architettura Completa**

```
┌─────────────────────────────────────────────────┐
│           ☁️  FLY.IO (ONLINE)                   │
│                                                  │
│  ┌─────────────────────────────────────┐       │
│  │  Backend Rust API                    │       │
│  │  • Login/Register                    │       │
│  │  • Gestione amici                    │       │
│  │  • Friend codes                      │       │
│  │  Port: 8080                          │       │
│  │  URL: gamecall-api.fly.dev          │       │
│  └─────────────────────────────────────┘       │
│             ↓ connesso a                        │
│  ┌─────────────────────────────────────┐       │
│  │  PostgreSQL Database                 │       │
│  │  • Tabella users                     │       │
│  │  • Tabella friendships               │       │
│  │  • Tabella call_history              │       │
│  └─────────────────────────────────────┘       │
│                                                  │
└─────────────────────────────────────────────────┘
                    ↑
                    │ HTTPS/REST API
                    │
        ┌───────────┴──────────┐
        │                      │
    💻 PC 1                💻 PC 2
    App Tauri              App Tauri
        │                      │
        └──────── P2P ─────────┘
         (PeerJS pubblico)
```

### **Cosa NON deployare**
- ❌ App Tauri → È desktop, gira sul PC dell'utente
- ❌ PeerJS Server → Usiamo uno pubblico (gratis)

---

## 🛠️ SETUP FLY.IO {#setup-flyio}

### **Step 1: Crea Account Fly.io**

1. Vai su: https://fly.io/app/sign-up
2. Registrati con:
   - GitHub (consigliato)
   - oppure Email

**IMPORTANTE**: Fly.io richiede carta di credito, MA:
- ✅ Non ti addebita nulla per progetti piccoli
- ✅ Free tier: 3 VM gratis + 3GB PostgreSQL gratis
- ✅ Puoi impostare limiti di spesa (es: $0/mese)

---

### **Step 2: Installa Fly CLI**

**Per Windows (PowerShell come Admin):**

```powershell
# Scarica e installa
iwr https://fly.io/install.ps1 -useb | iex

# Verifica installazione
fly version
```

Se il comando `fly` non funziona, riavvia PowerShell.

---

### **Step 3: Login**

```bash
fly auth login
```

Si aprirà il browser, conferma il login.

---

## 🚢 DEPLOY BACKEND RUST {#deploy-backend}

### **Step 1: Prepara il Progetto**

```bash
cd C:\Users\chris\Documents\Chat\gamecall\server
```

Verifica che questi file esistano:
- ✅ `Cargo.toml`
- ✅ `Dockerfile`
- ✅ `schema.sql`
- ✅ `.env` (NON verrà deployato, è locale)

---

### **Step 2: Crea App su Fly.io**

```bash
fly launch
```

Ti farà delle domande:

**Domanda 1**: `Choose an app name`
```
gamecall-api
```
(o un nome diverso se è già preso)

**Domanda 2**: `Choose a region`
```
ams (Amsterdam)
```
È la più vicina all'Italia!

**Domanda 3**: `Would you like to set up a PostgreSQL database?`
```
YES (y)
```

**Domanda 4**: `Select configuration`
```
Development - Single node, 1x shared CPU, 256MB RAM, 1GB disk
```
È gratis!

**Domanda 5**: `Would you like to deploy now?`
```
NO (n)
```
Prima configuriamo i secrets!

---

### **Step 3: Configura Secrets (Variabili Ambiente)**

Fly.io ti ha creato un database PostgreSQL e ti ha dato il `DATABASE_URL`.

Verifica con:
```bash
fly postgres list
```

Prendi il `DATABASE_URL`:
```bash
fly postgres connect -a <nome-postgres-app>
```

Ora imposta i secrets:

```bash
# JWT Secret (usa una stringa random sicura!)
fly secrets set JWT_SECRET="super-secret-production-key-12345-change-me"

# La DATABASE_URL è già configurata automaticamente da Fly.io
# Non serve settarla manualmente!
```

---

### **Step 4: Aggiorna fly.toml**

Fly.io ha creato un file `fly.toml`. Modifichiamolo:

```toml
app = "gamecall-api"  # Il nome che hai scelto
primary_region = "ams"

[build]

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

  [[http_service.ports]]
    port = 80
    handlers = ["http"]

  [[http_service.ports]]
    port = 443
    handlers = ["tls", "http"]

[[vm]]
  memory = '256mb'
  cpu_kind = 'shared'
  cpus = 1
```

---

### **Step 5: Applica Schema Database**

Prima di deployare, creiamo le tabelle nel database Fly.io:

```bash
# Connettiti al database Fly.io
fly postgres connect -a <nome-postgres-app>

# Dentro psql, copia-incolla il contenuto di schema.sql
# Oppure:
\i schema.sql
```

Se non funziona, fai così:

```bash
# Dalla cartella server
cat schema.sql | fly postgres connect -a <nome-postgres-app>
```

---

### **Step 6: Deploy!**

```bash
fly deploy
```

Vedrai:
```
==> Building image
==> Pushing image to fly
==> Deploying
==> Monitoring deployment
```

Dopo 2-3 minuti:
```
✅ Deployment successful!
```

---

### **Step 7: Verifica che Funzioni**

```bash
# Health check
curl https://gamecall-api.fly.dev/health

# Dovresti vedere: OK
```

Se funziona, il backend è ONLINE! 🎉

---

## 🔧 CONFIGURARE FRONTEND {#configurare-frontend}

Ora devi dire al frontend di usare il backend online invece di localhost.

### **File da Modificare**

#### **1. Crea file di configurazione API**

```bash
cd C:\Users\chris\Documents\Chat\gamecall
```

Crea `src/config/api.ts`:

```typescript
// API Configuration

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const API_ENDPOINTS = {
  // Auth
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  me: `${API_BASE_URL}/auth/me`,

  // Friends
  friends: `${API_BASE_URL}/friends`,
  addFriend: `${API_BASE_URL}/friends/add`,
  friendRequests: `${API_BASE_URL}/friends/requests`,
  acceptFriend: `${API_BASE_URL}/friends/accept`,
  rejectFriend: `${API_BASE_URL}/friends/reject`,
  removeFriend: `${API_BASE_URL}/friends/remove`,
};

export default API_BASE_URL;
```

#### **2. Crea .env per sviluppo**

File: `.env.development`
```env
VITE_API_URL=http://localhost:3000
```

File: `.env.production`
```env
VITE_API_URL=https://gamecall-api.fly.dev
```

#### **3. Aggiorna AuthContext per usare API reali**

(Modificheremo questo file dopo)

---

## 🧪 TESTING COMPLETO {#testing}

### **Test 1: API Backend Online**

```bash
# Health check
curl https://gamecall-api.fly.dev/health

# Register
curl -X POST https://gamecall-api.fly.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'

# Login
curl -X POST https://gamecall-api.fly.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

---

### **Test 2: Frontend + Backend**

```bash
# Avvia frontend con API produzione
npm run tauri dev

# Prova login/register
# Dovresti vedere richieste a https://gamecall-api.fly.dev
```

---

### **Test 3: Cross-Device**

1. Build app Tauri:
   ```bash
   npm run tauri build
   ```

2. Installa su 2 PC diversi

3. Registra 2 utenti diversi

4. Prova chiamata tra loro

---

## 🐛 TROUBLESHOOTING {#troubleshooting}

### **Errore: "Could not resolve host"**
→ Nome app errato o non deployato
```bash
fly status
```

### **Errore: "Database connection failed"**
→ DATABASE_URL non configurato
```bash
fly secrets list
fly postgres list
```

### **Errore: "Certificate error"**
→ HTTPS non ancora attivo (aspetta 5 min)
```bash
fly certs list
```

### **Errore: "Build failed"**
→ Dockerfile errato, controlla logs:
```bash
fly logs
```

### **Errore: "Out of memory"**
→ VM troppo piccola, scala:
```bash
fly scale memory 512
```

---

## 📊 COMANDI UTILI

```bash
# Status app
fly status

# Logs real-time
fly logs

# SSH dentro container
fly ssh console

# Restart app
fly apps restart

# Info database
fly postgres list
fly postgres connect -a <db-name>

# Scala risorse
fly scale memory 512
fly scale count 2

# Aggiorna secrets
fly secrets set KEY=value

# Lista secrets
fly secrets list

# Deploy dopo modifiche
fly deploy

# Rollback versione precedente
fly releases
fly releases rollback <version>
```

---

## 💰 COSTI

**Free Tier Include:**
- ✅ 3 VM shared-cpu-1x (256MB RAM)
- ✅ 3GB PostgreSQL storage
- ✅ 160GB bandwidth/mese
- ✅ HTTPS certificates gratis

**Per GameCall:**
- Backend: 1 VM = GRATIS
- PostgreSQL: < 1GB = GRATIS
- Traffico: < 160GB/mese = GRATIS

**Totale: 0€/mese** fino a ~100 utenti attivi!

---

## ✅ CHECKLIST DEPLOY

Prima di deployare:
- [ ] Account Fly.io creato
- [ ] Fly CLI installato
- [ ] Login fatto (`fly auth login`)
- [ ] File Dockerfile esiste
- [ ] File schema.sql esiste
- [ ] JWT_SECRET generato

Dopo deploy:
- [ ] Health check funziona
- [ ] Register funziona
- [ ] Login funziona
- [ ] Database ha tabelle
- [ ] Frontend configurato con URL produzione

---

## 🎉 FATTO!

Ora hai:
- ✅ Backend Rust online su Fly.io
- ✅ Database PostgreSQL online
- ✅ API REST accessibili da ovunque
- ✅ HTTPS automatico
- ✅ Scaling automatico
- ✅ Monitoring e logs

**Prossimo step**: Integrare frontend per usare API online!

---

**Domande? Controlla la sezione Troubleshooting o scrivi!** 🚀
