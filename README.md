# 🎮 GameCall

> Applicazione desktop per video chiamate P2P tra amici durante il gaming.

[![Rust](https://img.shields.io/badge/Rust-1.83-orange.svg)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb.svg)](https://reactjs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-24c8db.svg)](https://tauri.app/)

## ✨ Features

- 🎥 **Video chiamate P2P** - Connessione diretta peer-to-peer senza intermediari
- 🔐 **Sistema amici** - Aggiungi amici tramite Friend Code unico
- 💬 **Chat in tempo reale** - Messaggistica durante le chiamate
- 🖥️ **Screen sharing** - Condividi il tuo schermo (coming soon)
- 📌 **Picture-in-Picture** - Overlay video durante il gaming (coming soon)
- 🌍 **Cross-platform** - Windows, macOS, Linux

## 🏗️ Architettura

```
☁️ Backend Online (Fly.io)
├── API REST (Rust + Axum)
├── PostgreSQL Database
└── PeerJS Signaling Server

💻 Desktop App (Tauri)
└── React + TypeScript Frontend
```

## 🚀 Quick Start

### Sviluppo

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Produzione

```bash
# Build desktop app
npm run tauri build
```

L'eseguibile sarà in `src-tauri/target/release/`.

## 🌐 API Endpoints

- **Backend**: `https://gamecall-api.fly.dev`
- **PeerJS**: `https://gamecall-peerjs.fly.dev`

Vedi `DEPLOY_COMPLETE.md` per documentazione completa.

## 📦 Tech Stack

**Frontend:**
- React 18
- TypeScript
- TailwindCSS
- Zustand (state management)
- PeerJS (WebRTC)

**Backend:**
- Rust (Axum framework)
- PostgreSQL
- SQLx
- JWT authentication
- Argon2 password hashing

**Desktop:**
- Tauri 2.0
- Native system integration

**Infra:**
- Fly.io (hosting)
- Docker (containerization)

## 📚 Documentation

- 📖 [Documentazione Completa](./DEPLOY_COMPLETE.md) - Setup, deploy, testing, troubleshooting

## 🔧 Development

### Prerequisites

- Node.js 18+
- Rust 1.83+
- PostgreSQL 18 (solo per sviluppo locale)

### Environment Variables

Create `server/.env`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/gamecall
JWT_SECRET=your-secret-key
PORT=3000
```

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

# Run app
npm run tauri dev
```

## 🛠️ Project Structure

```
gamecall/
├── src/                    # Frontend React
│   ├── components/         # UI components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── hooks/              # Custom hooks (PeerJS, media)
│   ├── config/             # API configuration
│   └── types/              # TypeScript types
├── src-tauri/              # Tauri backend
├── server/                 # Rust API server
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── auth.rs         # Authentication
│   │   └── friends.rs      # Friends management
│   ├── schema.sql          # Database schema
│   └── Dockerfile          # Docker config
├── peerjs-server/          # PeerJS signaling server
└── DEPLOY_COMPLETE.md      # Full documentation
```

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

---

Made with ❤️ for gamers who want to stay connected
