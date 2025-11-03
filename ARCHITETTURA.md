# 🏗️ Architettura Tecnica - GameCall

> **Documentazione tecnica completa dell'architettura software di GameCall**
> Versione: 0.1.0 | Ultimo aggiornamento: Novembre 2025

---

## 📋 Indice

1. [Overview](#overview)
2. [Stack Tecnologico](#stack-tecnologico)
3. [Architettura Backend](#architettura-backend)
4. [Architettura Frontend](#architettura-frontend)
5. [Comunicazione Real-Time](#comunicazione-real-time)
6. [Database Schema](#database-schema)
7. [Autenticazione e Sicurezza](#autenticazione-e-sicurezza)
8. [WebRTC Implementation](#webrtc-implementation)
9. [Deploy e Infrastruttura](#deploy-e-infrastruttura)
10. [Performance e Scalabilità](#performance-e-scalabilità)

---

## Overview

GameCall è un'applicazione desktop cross-platform per **chat P2P criptata** e **video chiamate** tra amici durante il gaming. L'architettura è progettata per essere **scalabile, sicura e performante**.

### Principi Architetturali

- **P2P First**: Messaggi e media transitano direttamente tra peer (no proxy server)
- **Real-time**: WebSocket per aggiornamenti stati in tempo reale
- **Security by Design**: JWT, Argon2, HTTPS/WSS, end-to-end encryption
- **Offline-first**: App desktop funziona anche con connessioni instabili
- **Modular**: Componenti disaccoppiati e riutilizzabili

---

## Stack Tecnologico

### Frontend (Desktop App)

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **Tauri** | 2.0 | Framework desktop cross-platform |
| **React** | 18.2 | UI library |
| **TypeScript** | 5.8 | Type safety |
| **TailwindCSS** | 3.3 | Styling e design system |
| **Zustand** | 5.0 | State management (chiamate) |
| **PeerJS** | 1.5 | WebRTC wrapper (video/audio) |
| **WebRTC native** | - | Data Channel per chat P2P |

### Backend (API + WebSocket)

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **Rust** | 1.83 | Linguaggio backend |
| **Axum** | 0.7 | Web framework async |
| **SQLx** | 0.7 | Database driver PostgreSQL |
| **PostgreSQL** | 18 | Database relazionale |
| **jsonwebtoken** | 9 | JWT authentication |
| **Argon2** | 0.5 | Password hashing |
| **tokio** | 1 | Async runtime |

### Infrastructure

| Servizio | Provider | Utilizzo |
|----------|----------|----------|
| **API Server** | Fly.io (Amsterdam) | Backend REST + WebSocket |
| **Database** | Fly.io PostgreSQL | Persistenza dati |
| **PeerJS Server** | Fly.io | Signaling WebRTC |
| **CI/CD** | GitHub Actions | Build automatici |

---

## Architettura Backend

### Structure

```
server/
├── src/
│   ├── main.rs           # Entry point + routing
│   ├── auth.rs           # JWT authentication
│   ├── friends.rs        # Friends CRUD + bidirezionale
│   ├── websocket.rs      # WebSocket server
│   ├── middleware.rs     # Auth middleware
│   ├── models.rs         # Database models
│   └── utils.rs          # Helper functions
├── schema.sql            # Database schema
├── Cargo.toml            # Dependencies
├── Dockerfile            # Container image
└── fly.toml              # Fly.io config
```

### API Endpoints

#### Public Routes

```rust
POST /auth/register          // Registrazione nuovo utente
POST /auth/login             // Login (ritorna JWT)
GET  /health                 // Health check
```

#### Protected Routes (require JWT)

```rust
GET  /auth/me                // Info utente corrente
GET  /friends                // Lista amici
POST /friends/add            // Aggiungi amico (Friend Code)
POST /friends/remove         // Rimuovi amico (bidirezionale)
GET  /friends/requests       // Lista richieste (future use)
POST /friends/accept         // Accetta richiesta (future use)
POST /friends/reject         // Rifiuta richiesta (future use)
```

#### WebSocket Route

```rust
GET /ws?token=<JWT>          // WebSocket connection (authenticated)
```

### Backend Components

#### 1. Main Server (`main.rs`)

```rust
#[tokio::main]
async fn main() {
    // Setup database connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url).await?;

    // Create WebSocket state
    let ws_state = WsState::new();

    // Build router with CORS
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        .merge(protected_routes) // JWT required
        .merge(ws_route)          // WebSocket
        .layer(cors)
        .with_state(state);

    // Start server
    axum::serve(listener, app).await?;
}
```

#### 2. Authentication (`auth.rs`)

**Registrazione**:
1. Valida username (3-50 caratteri) e password (min **8 caratteri**)
2. Hasha password con Argon2
3. Genera Friend Code univoco (`GC-XXXX-YYYY`)
4. Salva user su DB
5. Genera JWT (validità **30 giorni**)

**Login**:
1. Trova user per username
2. Verifica password con Argon2
3. Aggiorna status a `online`
4. Genera JWT (validità **30 giorni**)

**JWT Claims**:
```rust
struct Claims {
    sub: String,      // user_id
    username: String,
    exp: i64,         // expiration timestamp
}
```

#### 3. Friends Management (`friends.rs`)

**Add Friend** (bidirezionale automatico):
```rust
// Crea due righe in friendships:
// 1. user_id -> friend_id (status: accepted)
// 2. friend_id -> user_id (status: accepted)
// Entrambi si vedono subito nella lista
```

**Remove Friend** (bidirezionale):
```rust
// Rimuove entrambe le righe:
// DELETE WHERE (user_id, friend_id) OR (friend_id, user_id)
// Broadcast via WebSocket a entrambi
```

#### 4. WebSocket Server (`websocket.rs`)

**Gestione connessioni**:
- Ogni utente ha un `broadcast::Sender` per ricevere messaggi
- Mappa `user_id -> Sender` per inviare messaggi specifici
- Mappa `user_id -> (status, in_chat_with)` per tracciare stati

**Messaggi supportati**:
```rust
enum WsMessage {
    UserOnline { user_id },
    UserOffline { user_id },
    UserAway { user_id },
    UserEnteredChat { user_id, chat_with_user_id },
    UserLeftChat { user_id, chat_with_user_id },
    ChatNotificationRequest { from_user_id, from_username, to_user_id },
    WebRTCSignal { from_user_id, to_user_id, signal },
    FriendAdded { friend_id, friend_username, friend_code },
    FriendRemoved { friend_id },
    Ping,
    Pong,
}
```

**Flow**:
1. Client connette con JWT: `wss://gamecall-api.fly.dev/ws?token=<JWT>`
2. Server valida JWT e registra connessione
3. Broadcast `user_online` a tutti
4. Gestisce messaggi in/out
5. Alla disconnessione, broadcast `user_offline`

---

## Architettura Frontend

### Structure

```
src/
├── main.tsx                      # Entry point
├── App.tsx                       # Router (Login vs Dashboard)
├── components/
│   ├── auth/
│   │   └── Login.tsx             # Login + registrazione
│   ├── dashboard/
│   │   ├── NewDashboard.tsx      # Container principale
│   │   ├── Sidebar.tsx           # Lista amici
│   │   ├── ChatArea.tsx          # Area chat P2P
│   │   ├── ContactCard.tsx       # Card singolo amico
│   │   ├── AddFriendModal.tsx    # Modal aggiungi amico
│   │   ├── ProfilePanel.tsx      # Profilo utente
│   │   └── NotesPanel.tsx        # Note personali
│   ├── call/
│   │   ├── VideoCall.tsx         # Interfaccia video chiamata
│   │   ├── IncomingCallModal.tsx # Modal chiamata in arrivo
│   │   ├── CallControls.tsx      # Controlli chiamata
│   │   └── CallPreparation.tsx   # Preparazione chiamata
│   ├── notifications/
│   │   └── ChatNotificationToast.tsx # Toast notifica chat
│   └── ErrorBoundary.tsx         # Error handling
├── contexts/
│   └── AuthContext.tsx           # Context autenticazione
├── hooks/
│   ├── useWebSocket.ts           # WebSocket connection
│   ├── useWebRTC.ts              # WebRTC Data Channel (chat)
│   ├── useMediaStream.ts         # Camera/microfono
│   ├── usePeerConnection.ts      # PeerJS (video/audio)
│   ├── useFriends.ts             # API friends
│   ├── useNotes.ts               # Note locali
│   └── useAppLifecycle.ts        # Focus/blur handling
├── stores/
│   └── callStore.ts              # Zustand store chiamate
├── types/
│   └── index.ts                  # TypeScript interfaces
├── config/
│   └── api.ts                    # API endpoints + config
└── styles/
    └── design-system.ts          # Design tokens
```

### Component Hierarchy

```
App
├── AuthProvider (context)
│   ├── Login (non autenticato)
│   └── NewDashboard (autenticato)
│       ├── useWebSocket (1 istanza)
│       ├── useAppLifecycle
│       ├── Sidebar
│       │   ├── Profilo utente
│       │   ├── Search bar
│       │   └── Lista amici (ContactCard[])
│       ├── ChatArea
│       │   ├── useWebRTC (per chat P2P)
│       │   ├── Header chat
│       │   ├── Area messaggi
│       │   └── Input messaggio
│       ├── ProfilePanel (opzionale)
│       ├── NotesPanel (opzionale)
│       └── ChatNotificationToast (se notifica)
```

---

## Comunicazione Real-Time

### WebSocket Flow

```
Client                    WebSocket Server                 Altri Clients
  |                             |                                 |
  |-- Connect (JWT) ----------->|                                 |
  |<-- user_online broadcast ---|--------- user_online --------->|
  |                             |                                 |
  |-- user_entered_chat ------->|                                 |
  |                             |-- user_entered_chat (target) -->|
  |                             |                                 |
  |-- chat_notification ------->|                                 |
  |                             |-- chat_notification (target) -->|
  |                             |                                 |
  |-- webrtc_signal ----------->|                                 |
  |                             |-- webrtc_signal (relay) ------->|
  |                             |                                 |
  |<-- friend_added ------------|<-- API /friends/add             |
  |                             |-- friend_added (broadcast) ---->|
  |                             |                                 |
  |-- Disconnect --------------->|                                 |
  |                             |-- user_offline (broadcast) ---->|
```

### WebRTC Data Channel Flow (Chat P2P)

```
User A                    WebSocket Server                 User B
  |                             |                                 |
  |-- Create RTCPeerConnection->|                                 |
  |-- Create DataChannel ------>|                                 |
  |-- Create Offer ------------>|                                 |
  |-- Send offer (via WS) ----->|-- webrtc_signal (offer) ------->|
  |                             |                                 |-- Create PeerConnection
  |                             |                                 |-- setRemoteDescription(offer)
  |                             |                                 |-- Create Answer
  |<-- webrtc_signal (answer) --|<-- Send answer (via WS) --------|
  |-- setRemoteDescription ----->|                                 |
  |                             |                                 |
  |<-- ICE candidates exchange (via WS) -------------------------->|
  |                             |                                 |
  |<========== P2P DataChannel established ======================>|
  |                             |                                 |
  |<========== Send messages directly (no server) ===============>|
```

**Vantaggi**:
- Messaggi **end-to-end encrypted** (no server intermediario)
- **Bassa latenza** (connessione diretta)
- **Scalabile** (server solo per signaling)

---

## Database Schema

### Tables

#### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,      -- Argon2
    friend_code VARCHAR(20) UNIQUE NOT NULL,  -- GC-XXXX-YYYY
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'offline',     -- online|offline|away|in_chat
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_friend_code ON users(friend_code);
CREATE INDEX idx_users_username ON users(username);
```

#### `friendships`
```sql
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'accepted',  -- pending|accepted|blocked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Indexes
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
```

**Note**:
- Ogni amicizia crea **2 righe** (bidirezionale)
- Status attualmente sempre `accepted` (auto-accepted)
- Future use: implementare `pending` per richieste amicizia

#### `call_history` (future use)
```sql
CREATE TABLE call_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    callee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    call_type VARCHAR(20) NOT NULL,  -- video|audio
    duration INTEGER,                -- secondi
    status VARCHAR(20) NOT NULL,     -- completed|missed|rejected
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);
```

---

## Autenticazione e Sicurezza

### Password Hashing (Argon2)

```rust
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

// Registrazione
let salt = SaltString::generate(&mut OsRng);
let argon2 = Argon2::default();
let password_hash = argon2
    .hash_password(password.as_bytes(), &salt)?
    .to_string();

// Login
let parsed_hash = PasswordHash::new(&user.password_hash)?;
Argon2::default().verify_password(password.as_bytes(), &parsed_hash)?;
```

**Requisiti password**:
- Minimo **8 caratteri**
- Almeno una lettera
- Almeno un numero

### JWT Authentication

**Generazione**:
```rust
let expiration = Utc::now()
    .checked_add_signed(Duration::days(30))  // ✅ 30 giorni
    .timestamp();

let claims = Claims {
    sub: user.id.to_string(),
    username: user.username.clone(),
    exp: expiration,
};

let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret))?;
```

**Middleware**:
```rust
async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Estrai token da header Authorization
    let token = extract_token(&req)?;

    // Valida JWT
    let claims = decode::<Claims>(&token, &state.jwt_secret)?;

    // Aggiungi claims a request
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}
```

### HTTPS/WSS

- API: `https://gamecall-api.fly.dev` (TLS 1.3)
- WebSocket: `wss://gamecall-api.fly.dev/ws` (WSS)
- PeerJS: `https://gamecall-peerjs.fly.dev` (TLS 1.3)

### CORS Policy

```rust
let cors = CorsLayer::new()
    .allow_origin(Any)  // TODO: limitare in produzione
    .allow_methods(Any)
    .allow_headers(Any);
```

**TODO**: In produzione, limitare CORS solo ai domini frontend.

---

## WebRTC Implementation

### 1. Chat P2P (Data Channel)

**Hook**: `useWebRTC.ts`

```typescript
// Configurazione ICE servers (Google STUN)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Crea peer connection
const pc = new RTCPeerConnection(ICE_SERVERS);

// Crea data channel
const channel = pc.createDataChannel('messages', { ordered: true });

// Gestione messaggi
channel.onmessage = (event) => {
  const message = JSON.parse(event.data);
  onMessageReceived(message);
};

// Invia messaggio
channel.send(JSON.stringify(message));
```

**Flow**:
1. User A crea `RTCPeerConnection` e `DataChannel`
2. Crea offer: `pc.createOffer()`
3. Invia offer a User B via WebSocket
4. User B riceve offer, crea answer
5. Scambio ICE candidates via WebSocket
6. Connessione P2P stabilita
7. Messaggi viaggiano direttamente (no server)

### 2. Video/Audio Chiamate (Media Stream)

**Hooks**: `useMediaStream.ts`, `usePeerConnection.ts`

**Status**: ✅ Implementati, ⏳ Integrazione finale da completare

**Flow futuro**:
1. User A avvia chiamata
2. Richiedi permessi camera/microfono: `getUserMedia()`
3. Crea offer con stream locale
4. User B riceve chiamata
5. Accetta e invia answer con stream locale
6. Entrambi ricevono remote stream
7. Visualizzazione video in `VideoCall.tsx`

**Configurazione media**:
```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user',
  },
});
```

---

## Deploy e Infrastruttura

### Fly.io Backend

**File**: `server/fly.toml`

```toml
app = "gamecall-api"
primary_region = "ams"  # Amsterdam

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = '256mb'
  cpu_kind = 'shared'
  cpus = 1
```

**Deploy**:
```bash
cd server
flyctl deploy
```

### GitHub Actions (Build Desktop)

**File**: `.github/workflows/build.yml`

```yaml
jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, ubuntu-22.04, windows-latest]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: npm ci
      - uses: tauri-apps/tauri-action@v0
```

**Output**:
- Windows: `.msi`, `.exe`
- macOS: `.dmg`, `.app`
- Linux: `.AppImage`, `.deb`

---

## Performance e Scalabilità

### Backend Performance

| Metrica | Valore | Note |
|---------|--------|------|
| Latenza API | ~50-100ms | Fly.io Amsterdam → Europa |
| WebSocket latency | ~20-50ms | Real-time |
| DB connection pool | 5 connections | Sufficiente per MVP |
| Max concurrent WebSocket | ~1000 | Con 256MB RAM |

**Ottimizzazioni future**:
- Aumentare connection pool a 10-20
- Caching con Redis per stati utenti
- Rate limiting per API
- Load balancing con più istanze Fly.io

### Frontend Performance

| Metrica | Valore |
|---------|--------|
| Bundle size | ~2.5MB (gzipped) |
| First load | ~1-2s |
| WebRTC connection time | ~2-5s |
| Message latency (P2P) | ~50-200ms |

**Ottimizzazioni**:
- Code splitting con React.lazy()
- Memoization con useMemo/useCallback
- Virtual scrolling per lista messaggi (se >100)

### Scalabilità

**Limitazioni attuali**:
- WebSocket: 1 server, ~1000 connessioni simultanee
- Database: Postgres singolo su Fly.io

**Piano scalabilità futura**:
1. **Horizontal scaling**: Più istanze backend + Redis pub/sub
2. **Database**: Read replicas per query pesanti
3. **CDN**: Servire assets statici via CDN
4. **Microservizi**: Separare auth, friends, calls in servizi dedicati

---

## Conclusioni

GameCall è progettato con principi architetturali solidi:
- ✅ Modularità e separazione concerns
- ✅ Sicurezza by design (JWT 30 giorni, Argon2, password min 8 caratteri)
- ✅ Performance ottimizzate
- ✅ Scalabilità incrementale

**Status attuale**: MVP funzionante con chat P2P, real-time updates, sistema amici.

**Prossimi step**: Completare integrazione video/audio chiamate, persistenza messaggi, auto-updater.

---

**Autore**: Christian Koscielniak Pinto
**Versione**: 0.1.0
**Ultimo aggiornamento**: Novembre 2025
