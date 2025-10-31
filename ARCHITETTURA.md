# 📚 ARCHITETTURA E COLLEGAMENTI - GAMECALL

## 🏗️ ARCHITETTURA DEL SISTEMA

GameCall è un'applicazione **desktop cross-platform** per videochiamate P2P tra gamers. L'architettura è divisa in 3 servizi online + 1 app desktop:

```
┌─────────────────────────────────────────────────────────────┐
│                    🌐 SERVIZI ONLINE (Fly.io)                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣  Backend API (Rust)                                      │
│      URL: https://gamecall-api.fly.dev                      │
│      • Autenticazione (JWT)                                 │
│      • Gestione utenti                                      │
│      • Sistema amicizie                                     │
│      • Storico chiamate                                     │
│                                                              │
│  2️⃣  Database PostgreSQL                                     │
│      App: gamecall-db                                       │
│      • Tabella users                                        │
│      • Tabella friendships                                  │
│      • Tabella call_history                                 │
│                                                              │
│  3️⃣  Server PeerJS (Node.js)                                 │
│      URL: https://gamecall-peerjs.fly.dev                   │
│      • Signaling per WebRTC                                 │
│      • Coordinamento chiamate P2P                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↕️  HTTPS
┌─────────────────────────────────────────────────────────────┐
│               💻 APP DESKTOP (Tauri + React)                 │
│                                                              │
│  Frontend React:                                            │
│  • Login/Registrazione                                      │
│  • Dashboard amici                                          │
│  • Videochiamate WebRTC                                     │
│                                                              │
│  Tauri Backend:                                             │
│  • Integrazione sistema operativo                          │
│  • Finestra nativa                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 COME I SERVIZI SONO COLLEGATI

### **1️⃣ Backend API (Rust + Axum)**

**Dove è deployato**: Fly.io app `gamecall-api`
**URL**: `https://gamecall-api.fly.dev`
**Porta**: 8080 (internamente), 443 (HTTPS pubblico)
**Regione**: Amsterdam (ams)

**File di configurazione**:
- `server/fly.toml` - Configurazione Fly.io
- `server/Dockerfile` - Container Docker con Rust 1.83
- `server/.env` - Variabili d'ambiente (JWT_SECRET, DATABASE_URL)

**Database collegato**:
```rust
// In server/src/main.rs
let database_url = env::var("DATABASE_URL")
    .expect("DATABASE_URL deve essere settato");

let pool = PgPoolOptions::new()
    .max_connections(5)
    .connect(&database_url)
    .await?;
```

La variabile `DATABASE_URL` è configurata come secret su Fly.io:
```
postgres://postgres:PASSWORD@gamecall-db.internal:5432/gamecall_api
```

**Endpoints disponibili**:
```
POST /auth/register  → Registra nuovo utente, ritorna { token, user }
POST /auth/login     → Login, ritorna { token, user }
GET  /auth/me        → Info utente corrente (richiede JWT)

GET    /friends           → Lista amici (richiede JWT)
POST   /friends/add       → Aggiungi amico con Friend Code
GET    /friends/requests  → Richieste amicizia pendenti
POST   /friends/accept/:id → Accetta richiesta
POST   /friends/reject/:id → Rifiuta richiesta
DELETE /friends/remove/:id → Rimuovi amico
```

**Schema Database** (`server/schema.sql`):
```sql
-- Tabella utenti
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    friend_code VARCHAR(13) UNIQUE NOT NULL,  -- Es: GC-ABCD-1234
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella amicizie (bidirezionale)
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, accepted, blocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- Storico chiamate
CREATE TABLE call_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    call_type VARCHAR(20) NOT NULL,  -- audio, video, screen
    status VARCHAR(20) NOT NULL,      -- completed, missed, rejected
    duration_seconds INTEGER,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);
```

**Come il frontend si collega**:
```typescript
// src/config/api.ts
export const API_BASE_URL = 'https://gamecall-api.fly.dev';

export const API_ENDPOINTS = {
  register: `${API_BASE_URL}/auth/register`,
  login: `${API_BASE_URL}/auth/login`,
  friends: `${API_BASE_URL}/friends`,
  addFriend: `${API_BASE_URL}/friends/add`,
  // ... altri endpoints
};
```

```typescript
// src/contexts/AuthContext.tsx - Esempio login
const login = async (username: string, password: string) => {
  const response = await fetch(API_ENDPOINTS.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  // data = { token: "JWT_TOKEN", user: { id, username, friend_code, ... } }

  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
};
```

---

### **2️⃣ Database PostgreSQL**

**Dove è deployato**: Fly.io app `gamecall-db`
**Tipo**: PostgreSQL 16
**Connessione interna**: `gamecall-db.internal:5432`
**Database**: `gamecall_api`

**Come è collegato al backend**:
Il backend Rust usa SQLx per connettersi:

```rust
// In server/src/main.rs
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Carica .env
    dotenv().ok();

    // Connetti al database
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    // Esempio query - Registrazione utente
    let friend_code = generate_friend_code(); // Es: GC-ABCD-1234

    sqlx::query(
        "INSERT INTO users (username, password_hash, friend_code)
         VALUES ($1, $2, $3) RETURNING id"
    )
    .bind(&username)
    .bind(&password_hash)
    .bind(&friend_code)
    .fetch_one(&pool)
    .await?;
}
```

**Secret configurato su Fly.io**:
```bash
# Comando usato per settare il secret
flyctl secrets set DATABASE_URL="postgres://postgres:PASSWORD@gamecall-db.internal:5432/gamecall_api" -a gamecall-api
flyctl secrets set JWT_SECRET="your-super-secret-key" -a gamecall-api
```

**Tabelle create**:
- ✅ `users` - Utenti registrati con Friend Code univoco
- ✅ `friendships` - Relazioni amicizie (bidirezionali)
- ✅ `call_history` - Storico chiamate

**Utente di test esistente**:
- Username: `mario`
- Friend Code: `GC-DPH5-7BVH`

---

### **3️⃣ Server PeerJS (Node.js)**

**Dove è deployato**: Fly.io app `gamecall-peerjs`
**URL**: `https://gamecall-peerjs.fly.dev`
**Porta**: 9000 (internamente), 443 (HTTPS pubblico)
**Regione**: Amsterdam (ams)

**Cosa fa**:
PeerJS è un **signaling server** per WebRTC. Non trasporta audio/video (quello va direttamente P2P tra utenti), ma serve per:
- Scoperta peer (chi è online)
- Scambio di offerte/risposte WebRTC (SDP)
- Scambio candidati ICE (per NAT traversal)
- Coordinamento iniziale della connessione P2P

**File di configurazione**:
```javascript
// peerjs-server/server.js
const { ExpressPeerServer } = require('peer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 9000;

// Health endpoint per monitoring
app.get('/health', (req, res) => {
  res.send('OK');
});

// Avvia server HTTP
const server = app.listen(PORT, () => {
  console.log(`🚀 PeerJS Server running on port ${PORT}`);
});

// Crea PeerJS signaling server
const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',           // Path per connessione WebSocket
  allow_discovery: true,     // Permetti scoperta peers
  proxied: true,             // Dietro proxy (Fly.io)
  debug: true,               // Log dettagliati
  corsOptions: {
    origin: '*',             // Permetti tutte le origini
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

app.use('/peerjs', peerServer);

// Eventi PeerJS
peerServer.on('connection', (client) => {
  console.log('✅ Client connesso:', client.getId());
});

peerServer.on('disconnect', (client) => {
  console.log('❌ Client disconnesso:', client.getId());
});
```

**File Fly.io**:
```toml
# peerjs-server/fly.toml
app = "gamecall-peerjs"
primary_region = "ams"

[env]
  PORT = "9000"

[http_service]
  internal_port = 9000
  force_https = true
  auto_stop_machines = true    # Si spegne quando non usato (risparmio)
  auto_start_machines = true   # Si riavvia automaticamente su richiesta
  min_machines_running = 0
```

**Come il frontend si collega**:
```typescript
// src/config/api.ts
export const PEER_CONFIG = {
  host: 'gamecall-peerjs.fly.dev',
  port: 443,                    // HTTPS (WebSocket sicuro wss://)
  path: '/peerjs',              // Path WebSocket
  secure: true,                 // Usa wss:// invece di ws://
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },  // Server STUN Google
      { urls: 'stun:stun1.l.google.com:19302' }  // Server STUN Google (backup)
    ]
  }
};
```

```typescript
// src/hooks/usePeerConnection.ts
import Peer from 'peerjs';
import { PEER_CONFIG } from '../config/api';

export function usePeerConnection(userId: string) {
  // Crea istanza PeerJS con ID basato su userId
  const peerInstance = new Peer(userId, {
    host: PEER_CONFIG.host,
    port: PEER_CONFIG.port,
    path: PEER_CONFIG.path,
    secure: PEER_CONFIG.secure,
    config: PEER_CONFIG.config,
  });

  // Quando connesso al server PeerJS
  peerInstance.on('open', (id) => {
    console.log('✅ Peer connesso con ID:', id);
  });

  // Ascolta chiamate in arrivo
  peerInstance.on('call', (incomingCall) => {
    console.log('📞 Chiamata in arrivo da:', incomingCall.peer);

    // Rispondi con il tuo stream locale (camera/microfono)
    incomingCall.answer(localStream);

    // Ricevi lo stream remoto (video/audio dell'altro utente)
    incomingCall.on('stream', (remoteStream) => {
      videoElement.srcObject = remoteStream;
    });
  });

  // Effettua chiamata verso altro utente
  const makeCall = (targetUserId: string, localStream: MediaStream) => {
    const call = peerInstance.call(targetUserId, localStream);

    call.on('stream', (remoteStream) => {
      // Mostra video dell'altro utente
      remoteVideoElement.srcObject = remoteStream;
    });
  };

  return { peerInstance, makeCall };
}
```

---

### **4️⃣ App Desktop (Tauri + React)**

**Frontend**: React 18 + TypeScript + TailwindCSS
**Backend**: Tauri 2.0 (Rust nativo)
**Build**: `npm run tauri build` → Eseguibile Windows/macOS/Linux
**Dev**: `npm run tauri dev` → Modalità sviluppo con hot-reload

**Componenti chiave e collegamenti**:

#### **A. Autenticazione (`src/contexts/AuthContext.tsx`)**
```typescript
import { API_ENDPOINTS } from '../config/api';

// Login con API reale
const login = async (username: string, password: string) => {
  const response = await fetch(API_ENDPOINTS.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Errore login');
  }

  const data = await response.json();
  // data = {
  //   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  //   user: {
  //     id: "uuid",
  //     username: "mario",
  //     friend_code: "GC-DPH5-7BVH",
  //     avatar_url: "https://...",
  //     status: "online"
  //   }
  // }

  // Salva in localStorage per persistenza
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return true;
};

// Registrazione con API reale
const register = async (username: string, password: string) => {
  // Validazione locale
  if (username.length < 3) throw new Error('Username troppo corto');
  if (password.length < 6) throw new Error('Password troppo corta');

  const response = await fetch(API_ENDPOINTS.register, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Errore registrazione');
  }

  const data = await response.json();
  // Backend genera automaticamente Friend Code (es: GC-ABCD-1234)

  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return true;
};
```

#### **B. Gestione Amici (`src/hooks/useFriends.ts`)**
```typescript
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export function useFriends() {
  const { token } = useAuth();

  // Carica lista amici dall'API
  const loadFriends = async () => {
    const response = await fetch(API_ENDPOINTS.friends, {
      headers: {
        'Authorization': `Bearer ${token}`,  // JWT token per autenticazione
      },
    });

    const friends = await response.json();
    // friends = [
    //   { id: "uuid", username: "bob", friend_code: "GC-XXXX-YYYY", status: 'online', ... },
    //   { id: "uuid2", username: "alice", friend_code: "GC-ZZZZ-WWWW", status: 'offline', ... }
    // ]

    return friends;
  };

  // Aggiungi amico tramite Friend Code
  const addFriend = async (friendCode: string) => {
    const response = await fetch(API_ENDPOINTS.addFriend, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ friend_code: friendCode }),
    });

    if (!response.ok) {
      throw new Error('Friend Code non valido');
    }

    // Ricarica lista amici
    await loadFriends();
  };

  return { loadFriends, addFriend };
}
```

#### **C. Connessione WebRTC (`src/hooks/usePeerConnection.ts`)**
```typescript
import Peer from 'peerjs';
import { PEER_CONFIG } from '../config/api';

export function usePeerConnection(userId: string) {
  // Inizializza PeerJS con configurazione Fly.io
  const peerInstance = new Peer(userId, PEER_CONFIG);

  // Eventi connessione
  peerInstance.on('open', (id) => {
    console.log('✅ Connesso a PeerJS server con ID:', id);
  });

  peerInstance.on('error', (err) => {
    console.error('❌ Errore PeerJS:', err.type, err.message);

    // Gestione errori comuni
    switch (err.type) {
      case 'peer-unavailable':
        // Utente offline o non esistente
        break;
      case 'network':
        // Problemi di rete, tentativo riconnessione
        break;
      case 'server-error':
        // Server PeerJS non raggiungibile
        break;
    }
  });

  // Chiamate in arrivo
  peerInstance.on('call', (incomingCall) => {
    console.log('📞 Chiamata in arrivo da:', incomingCall.peer);
    // incomingCall.peer = userId dell'altro utente
  });

  return peerInstance;
}
```

#### **D. Dashboard (`src/components/dashboard/Dashboard.tsx`)**
```typescript
import { useFriends } from '../../hooks/useFriends';
import { useAuth } from '../../contexts/AuthContext';

export function Dashboard() {
  const { user, logout } = useAuth();
  const { friends, loadFriends, addFriend } = useFriends();

  useEffect(() => {
    // Carica amici all'avvio
    loadFriends();
  }, []);

  // friends viene dall'API reale, NON più mock!
  // friends = [{ id, username, friend_code, status, avatar }, ...]

  return (
    <div>
      <h1>Ciao, {user?.username}!</h1>
      <p>Il tuo Friend Code: {user?.friendCode}</p>

      <div>
        {friends.map(friend => (
          <ContactCard
            key={friend.id}
            contact={friend}
            onCall={() => startCall(friend)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 FLUSSO COMPLETO DI UNA CHIAMATA

```
┌──────────────┐                                    ┌──────────────┐
│   UTENTE A   │                                    │   UTENTE B   │
└──────┬───────┘                                    └──────┬───────┘
       │                                                   │
       │ 1. Login                                          │
       ├──────────► gamecall-api.fly.dev ────────────────►│
       │            POST /auth/login                       │
       │◄───────────┤                                      │
       │            { token: "JWT...", user: {...} }       │
       │                                                   │
       │ 2. Connessione PeerJS                             │
       ├──────────► gamecall-peerjs.fly.dev ◄─────────────┤
       │            new Peer(userA_id)                     │
       │            (registra Peer ID sul server)          │
       │                                                   │
       │ 3. Carica lista amici                             │
       ├──────────► gamecall-api.fly.dev                  │
       │            GET /friends (Authorization: Bearer JWT)│
       │◄───────────┤                                      │
       │            [{ id: "B-ID", username: "bob", ... }] │
       │                                                   │
       │ 4. Clicca "Chiama Bob"                            │
       │            peerInstance.call("B-ID", localStream) │
       │                                                   │
       │ 5. Signaling via PeerJS (attraverso Fly.io)      │
       ├──────────► gamecall-peerjs.fly.dev ──────────────►│
       │            (invia offer SDP + ICE candidates)     │
       │                                                   │
       │                                  B riceve evento "call"
       │                                  B chiama incomingCall.answer()
       │                                                   │
       │ 6. Connessione P2P stabilita (WebRTC)            │
       ├───────────────────────────────────────────────────┤
       │          🎥 Video + 🎤 Audio (diretto P2P)        │
       │          (NON passa più per Fly.io!)              │
       │          (connessione diretta tra A e B)          │
       │                                                   │
       │ 7. Durante chiamata: nessun server coinvolto     │
       │    Audio/video vanno direttamente A ↔ B          │
       │    (grazie a WebRTC + STUN per NAT traversal)    │
       │                                                   │
       │ 8. Termina chiamata                               │
       │            call.close()                           │
       │◄──────────────────────────────────────────────────┤
       │                                                   │
       │ 9. (Opzionale) Salva storico su database         │
       ├──────────► gamecall-api.fly.dev                  │
       │            POST /calls/history                    │
       │            { caller_id, receiver_id, duration }   │
       │                                                   │
```

**Note importanti sul flusso**:
- **Passi 1-5**: Usano i server online (API + PeerJS)
- **Passi 6-8**: Connessione P2P diretta, server NON coinvolto (risparmio banda)
- **STUN servers** (Google): Aiutano a scoprire IP pubblico per attraversare NAT
- **PeerJS**: Solo per signaling iniziale, NON trasporta video/audio

---

## 🗂️ STRUTTURA FILE PROGETTO

```
gamecall/
├── src/                           # Frontend React
│   ├── components/
│   │   ├── auth/
│   │   │   └── Login.tsx          # Login/Registrazione → usa AuthContext
│   │   ├── call/
│   │   │   ├── VideoCall.tsx      # UI videochamata
│   │   │   ├── IncomingCallModal.tsx
│   │   │   └── CallingScreen.tsx
│   │   └── dashboard/
│   │       ├── Dashboard.tsx      # Dashboard principale → usa useFriends()
│   │       └── ContactCard.tsx    # Card singolo amico
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx        # 🔥 Autenticazione con API REALE
│   │
│   ├── hooks/
│   │   ├── usePeerConnection.ts   # 🔥 WebRTC con PeerJS online
│   │   ├── useFriends.ts          # 🔥 Caricamento amici da API
│   │   └── useMediaStream.ts      # Accesso camera/microfono
│   │
│   ├── stores/
│   │   └── callStore.ts           # Zustand store per stato chiamate
│   │
│   ├── config/
│   │   └── api.ts                 # 🔥 CONFIGURAZIONE SERVIZI ONLINE
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript types (User, Contact, Call, etc.)
│   │
│   └── styles/
│       └── design-system.ts       # Sistema design (colori, spaziature, etc.)
│
├── server/                        # Backend Rust
│   ├── src/
│   │   ├── main.rs                # Entry point, setup server Axum
│   │   ├── auth.rs                # Login/register endpoints
│   │   └── friends.rs             # Friends management endpoints
│   │
│   ├── schema.sql                 # Schema database PostgreSQL
│   ├── Dockerfile                 # Container Rust 1.83
│   ├── fly.toml                   # 🔥 Config Fly.io backend
│   ├── .dockerignore              # Escludi target/ dal build
│   └── .env                       # DATABASE_URL, JWT_SECRET (locale)
│
├── peerjs-server/                 # Server PeerJS
│   ├── server.js                  # 🔥 Signaling Server WebRTC
│   ├── package.json               # Dependencies (peer, express)
│   ├── Dockerfile                 # Container Node.js 18
│   └── fly.toml                   # 🔥 Config Fly.io PeerJS
│
├── src-tauri/                     # Tauri app (Rust)
│   ├── src/
│   │   └── main.rs                # Entry point Tauri
│   ├── tauri.conf.json            # Configurazione Tauri
│   └── Cargo.toml                 # Dependencies Rust
│
├── README.md                      # 🔥 Documentazione progetto
├── DEPLOY_COMPLETE.md             # 🔥 Guida deploy completa
├── ARCHITETTURA.md                # 🔥 Questo file (architettura e collegamenti)
├── .gitignore                     # File da escludere da Git
├── package.json                   # Dependencies frontend
└── tailwind.config.js             # Configurazione TailwindCSS

🔥 = File chiave per capire i collegamenti
```

---

## 🎯 INFORMAZIONI CHIAVE

### **Servizi Online Fly.io**
| Servizio | App Name | URL | Porta | Auto-stop | Status |
|----------|----------|-----|-------|-----------|--------|
| Backend API | `gamecall-api` | https://gamecall-api.fly.dev | 8080→443 | ✅ Sì | ✅ OK |
| PeerJS | `gamecall-peerjs` | https://gamecall-peerjs.fly.dev | 9000→443 | ✅ Sì | ✅ OK |
| Database | `gamecall-db` | Interno Fly.io | 5432 | ❌ No | ✅ OK |

### **Secrets configurati su Fly.io**
```bash
# Backend API secrets
flyctl secrets set DATABASE_URL="postgres://postgres:PASSWORD@gamecall-db.internal:5432/gamecall_api" -a gamecall-api
flyctl secrets set JWT_SECRET="your-super-secret-key-here" -a gamecall-api
```

### **Regioni Fly.io**
- Tutti i servizi: `ams` (Amsterdam, Europa)

### **Auto-scaling**
- Backend API e PeerJS si spengono automaticamente quando non usati
- Si riavviano automaticamente alla prima richiesta (cold start ~2-5 secondi)
- Database PostgreSQL rimane sempre attivo

---

## ✅ VERIFICA CONNESSIONI

### **Test servizi online**:
```bash
# Test backend API
curl https://gamecall-api.fly.dev/health
# Output: OK

# Test PeerJS
curl https://gamecall-peerjs.fly.dev/health
# Output: OK

# Test registrazione
curl -X POST https://gamecall-api.fly.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test1234"}'
# Output: {"token":"eyJ...","user":{...}}
```

### **Verifica configurazione frontend**:
```typescript
// src/config/api.ts deve contenere:
export const API_BASE_URL = 'https://gamecall-api.fly.dev';  // NON localhost!

export const PEER_CONFIG = {
  host: 'gamecall-peerjs.fly.dev',  // NON localhost!
  port: 443,
  path: '/peerjs',
  secure: true,
};
```

### **Utente di Test**
- Username: `mario`
- Friend Code: `GC-DPH5-7BVH`
- ID: (UUID generato nel database)

---

## 🔐 SICUREZZA

### **Autenticazione JWT**
- Token generato al login/registrazione
- Valido per 24 ore
- Deve essere inviato nell'header `Authorization: Bearer TOKEN` per tutti gli endpoint protetti

### **Password Hashing**
- Algoritmo: Argon2 (industry standard, più sicuro di bcrypt)
- Salt generato automaticamente per ogni password
- Hash salvato nel database, password in chiaro MAI salvata

### **Friend Code**
- Formato: `GC-XXXX-YYYY` (esempio: `GC-DPH5-7BVH`)
- Generato automaticamente alla registrazione
- Univoco per ogni utente
- Usato per aggiungere amici senza esporre email/dati sensibili

### **Database**
- Connessione interna Fly.io (non esposto pubblicamente)
- Accesso solo dal backend API
- Password database salvata come secret su Fly.io

---

## 🚀 COMANDI UTILI

### **Sviluppo locale**:
```bash
# Avvia app in dev mode
npm run tauri dev

# Avvia solo frontend
npm run dev

# Avvia backend locale (richiede PostgreSQL locale)
cd server && cargo run
```

### **Build produzione**:
```bash
# Build app desktop
npm run tauri build

# Eseguibile sarà in:
# Windows: src-tauri/target/release/gamecall.exe
# macOS: src-tauri/target/release/bundle/macos/GameCall.app
# Linux: src-tauri/target/release/gamecall
```

### **Deploy su Fly.io**:
```bash
# Deploy backend API
cd server && flyctl deploy

# Deploy PeerJS
cd peerjs-server && flyctl deploy

# Controlla status
flyctl status -a gamecall-api
flyctl status -a gamecall-peerjs
flyctl status -a gamecall-db

# Vedi logs
flyctl logs -a gamecall-api
flyctl logs -a gamecall-peerjs
```

---

## 📝 NOTE TECNICHE

### **WebRTC e NAT Traversal**
- **STUN servers** (Google): Scoprono IP pubblico del client per attraversare NAT
- **ICE candidates**: Possibili percorsi di connessione tra peer
- **SDP (Session Description Protocol)**: Descrive media capabilities (codec, formati)
- Se STUN non basta, serve **TURN server** (relay) per casi estremi (dietro firewall restrittivi)

### **PeerJS Signaling Flow**
1. Client A si connette al server PeerJS → riceve Peer ID
2. Client B si connette al server PeerJS → riceve Peer ID
3. Client A chiama `peer.call(B_ID, localStream)`
4. Server PeerJS inoltra messaggio a Client B
5. Client B riceve evento `call`, risponde con `answer()`
6. Server PeerJS facilita scambio SDP e ICE candidates
7. Connessione P2P stabilita, server NON più coinvolto

### **Fly.io Auto-scaling**
- **auto_stop_machines = true**: VM si spegne dopo 5 minuti di inattività
- **auto_start_machines = true**: VM si riavvia alla prima richiesta
- **Cold start**: ~2-5 secondi per riavvio
- **Vantaggi**: Risparmio costi, risorse usate solo quando necessario

---

## 🐛 TROUBLESHOOTING

### **Problema: "Peer non disponibile"**
- **Causa**: Utente offline o ID Peer errato
- **Soluzione**: Verifica che l'altro utente sia connesso e online

### **Problema: "Server error" su PeerJS**
- **Causa**: Server PeerJS in auto-stop, sta riavviando
- **Soluzione**: Aspetta 2-5 secondi, riprova automaticamente

### **Problema: "Unauthorized" su API**
- **Causa**: Token JWT mancante o scaduto
- **Soluzione**: Fai logout e login di nuovo

### **Problema: "Database connection failed"**
- **Causa**: DATABASE_URL non configurato
- **Soluzione**: Verifica secret Fly.io con `flyctl secrets list -a gamecall-api`

---

## 👨‍💻 AUTORE

**Christian Koscielniak Pinto**
- GitHub: [@chriskp1710](https://github.com/chriskp1710)
- Email: chriskp1710@gmail.com

---

## 📅 ULTIMO AGGIORNAMENTO

**Data**: 31 Ottobre 2025
**Versione**: 1.0.0
**Status**: ✅ Tutti i servizi online e funzionanti

---

**Questo file documenta l'architettura completa del progetto GameCall e come tutti i servizi online sono collegati tra loro.**
