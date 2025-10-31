# 🎮 GameCall

> Applicazione desktop per video chiamate P2P tra amici durante il gaming.

[![Rust](https://img.shields.io/badge/Rust-1.83-orange.svg)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-24c8db.svg)](https://tauri.app/)

## 🎯 Stato Progetto

**Versione**: 0.1.0 - Beta Funzionante ✅

### ✅ Funzionalità Implementate

- ✅ **Autenticazione completa** - Login, registrazione, JWT
- ✅ **Sistema amici** - Aggiungi amici tramite Friend Code unico
- ✅ **Eliminazione amici bidirezionale** - Rimuovi amici (entrambi si vedono aggiornati)
- ✅ **Video chiamate P2P** - WebRTC con PeerJS per chiamate dirette
- ✅ **UI Responsive** - Funziona su mobile, tablet e desktop
- ✅ **Database PostgreSQL** - Persistenza dati online (Fly.io)
- ✅ **Build automatici** - GitHub Actions per Windows, macOS, Linux

### 🚧 In Sviluppo

- 🔄 **Status online real-time** - Attualmente statico, serve WebSocket
- 🔄 **Chiamate vocali** - Audio-only (già presente video)
- 🔄 **Screen sharing** - Condivisione schermo durante chiamate
- 🔄 **Picture-in-Picture** - Overlay video durante il gaming
- 🔄 **Gestione richieste amicizia** - Sistema richieste pending/accepted

## ✨ Features

- 🎥 **Video chiamate P2P** - Connessione diretta peer-to-peer senza intermediari
- 🔐 **Sistema amici** - Aggiungi e rimuovi amici tramite Friend Code
- 👥 **Gestione contatti** - Lista amici con status (online/offline)
- 🗑️ **Eliminazione bidirezionale** - Rimuovi amici con conferma (anche l'amico ti vede rimosso)
- 📱 **UI Responsive** - Design adattivo per ogni dimensione schermo
- 🌍 **Cross-platform** - Windows, macOS, Linux
- ☁️ **Backend online** - API REST su Fly.io con database PostgreSQL

## 🏗️ Architettura

```
☁️ Backend Online (Fly.io)
├── API REST (Rust + Axum) - https://gamecall-api.fly.dev
│   ├── Autenticazione (JWT + Argon2)
│   ├── Gestione amici (CRUD bidirezionale)
│   └── Database PostgreSQL
├── PeerJS Signaling Server - https://gamecall-peerjs.fly.dev
└── GitHub Actions (Build automatici per 3 piattaforme)

💻 Desktop App (Tauri)
└── React + TypeScript Frontend
    ├── WebRTC (video calls)
    ├── TailwindCSS (UI responsive)
    └── Zustand (state management)
```

## 🚀 Quick Start

### Installazione

**Windows**: Scarica `.msi` o `.exe` da GitHub Releases
**macOS**: Scarica `.dmg` da GitHub Releases
- ⚠️ Su macOS esegui: `xattr -cr /Applications/GameCall.app` per rimuovere quarantena
**Linux**: Scarica `.AppImage` o `.deb` da GitHub Releases

### Sviluppo

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build Locale

```bash
# Build desktop app
npm run tauri build
```

L'eseguibile sarà in `src-tauri/target/release/bundle/`.

## 🌐 API Endpoints

- **Backend API**: `https://gamecall-api.fly.dev`
- **PeerJS Server**: `https://gamecall-peerjs.fly.dev`

### API Routes

```
POST /auth/register          - Registrazione utente
POST /auth/login             - Login (ritorna JWT token)
GET  /auth/me                - Info utente corrente

GET  /friends                - Lista amici accettati
POST /friends/add            - Aggiungi amico (Friend Code)
POST /friends/remove         - Rimuovi amico (bidirezionale)
GET  /friends/requests       - Lista richieste pending
POST /friends/accept         - Accetta richiesta
POST /friends/reject         - Rifiuta richiesta
```

## 📦 Tech Stack

**Frontend:**
- React 18
- TypeScript 5
- TailwindCSS (con design system custom)
- Zustand (state management)
- PeerJS (WebRTC)

**Backend:**
- Rust 1.83
- Axum (web framework)
- PostgreSQL 18
- SQLx (async SQL)
- JWT authentication (jsonwebtoken)
- Argon2 password hashing

**Desktop:**
- Tauri 2.0
- Native system integration
- Auto-updater (coming soon)

**Infra:**
- Fly.io (API + DB + PeerJS)
- GitHub Actions (CI/CD)
- Docker (containerization)

## 📚 Documentation

- 📖 [Documentazione Completa](./DEPLOY_COMPLETE.md) - Setup, deploy, testing, troubleshooting

## 🔧 Development

### Prerequisites

- Node.js 18+
- Rust 1.83+
- PostgreSQL 18 (solo per sviluppo locale con DB locale)

### Environment Variables

Create `server/.env` (solo per sviluppo locale):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/gamecall
JWT_SECRET=your-secret-key-here
PORT=3000
```

**Nota**: L'app usa i servizi online su Fly.io di default, non serve DB locale per testare.

### Run Backend Locally

```bash
cd server
cargo run
```

### Run Frontend Locally

```bash
npm run tauri dev
```

## 🧪 Testing

```bash
# Test backend health
curl https://gamecall-api.fly.dev/health

# Test PeerJS
curl https://gamecall-peerjs.fly.dev/health

# Run app in dev mode
npm run tauri dev
```

## 🛠️ Project Structure

```
gamecall/
├── src/                    # Frontend React
│   ├── components/
│   │   ├── auth/           # Login, Register
│   │   ├── dashboard/      # Dashboard, ContactCard, AddFriendModal
│   │   └── call/           # VideoCall, IncomingCallModal
│   ├── contexts/           # AuthContext (gestione auth globale)
│   ├── hooks/              # useFriends, usePeerConnection, useMediaStream
│   ├── stores/             # callStore (Zustand)
│   ├── config/             # api.ts (endpoints + config)
│   ├── styles/             # design-system.ts (colori, spacing)
│   └── types/              # TypeScript interfaces
├── src-tauri/              # Tauri backend
│   └── src/
│       └── lib.rs          # Entry point Tauri
├── server/                 # Rust API server
│   ├── src/
│   │   ├── main.rs         # Entry point + routes
│   │   ├── auth.rs         # JWT auth + register/login
│   │   ├── friends.rs      # Friends CRUD + bidirezionale
│   │   └── models.rs       # Database models (User, Friendship)
│   ├── schema.sql          # Database schema PostgreSQL
│   ├── Dockerfile          # Docker per deploy Fly.io
│   └── fly.toml            # Config Fly.io
├── peerjs-server/          # PeerJS signaling server
│   ├── index.js            # Server Express + PeerJS
│   └── fly.toml            # Config Fly.io
├── .github/workflows/
│   └── build.yml           # GitHub Actions (build automatici)
└── DEPLOY_COMPLETE.md      # Documentazione completa
```

## 🎯 Come Funziona

### 1. Registrazione e Login
- L'utente si registra con username/password
- Password hashata con Argon2
- Viene generato un **Friend Code** unico (formato: `GC-XXXX-YYYY`)
- Al login riceve un token JWT valido 30 giorni

### 2. Sistema Amici
- **Aggiungi amico**: Inserisci il Friend Code dell'amico
- L'amicizia viene creata **automaticamente bidirezionale** (entrambi si vedono)
- **Rimuovi amico**: Conferma eliminazione, entrambi vengono aggiornati
- Validazione: non puoi aggiungere te stesso o duplicati

### 3. Video Chiamate
- Click su "Videochiamata" per amico online
- Stabilita connessione P2P con WebRTC
- Signaling via PeerJS server su Fly.io
- Stream video/audio diretti tra peer (nessun proxy)

## 📝 Changelog Recente

### v0.1.0 (31 Ottobre 2025)
- ✅ Implementata eliminazione amici bidirezionale
- ✅ Aggiunto pulsante "Rimuovi amico" con conferma
- ✅ Fix refresh immediato lista amici dopo aggiunta
- ✅ UI responsive completa (mobile, tablet, desktop)
- ✅ GitHub Actions per build automatici (Windows, macOS, Linux)
- ✅ Design system con colori primari/accento/errori
- ✅ Amicizie automaticamente accettate (no richieste pending)

## 🤝 Contributing

Questo è un progetto personale. Pull requests sono benvenute!

## 📝 License

MIT License - vedi LICENSE file

## 👤 Author

**Christian Koscielniak Pinto**
- GitHub: [@chriskp1710](https://github.com/chriskp1710)
- Email: chriskp1710@gmail.com

## 🙏 Credits

- [Tauri](https://tauri.app/) - Desktop framework
- [PeerJS](https://peerjs.com/) - WebRTC wrapper
- [Fly.io](https://fly.io/) - Hosting platform
- [Axum](https://github.com/tokio-rs/axum) - Rust web framework
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS

---

Made with ❤️ for gamers who want to stay connected
