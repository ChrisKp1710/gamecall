# 🗺️ ROADMAP COMPLETA - App P2P Video/Schermo

## 📋 **OBIETTIVI DEL PROGETTO**

### **Funzionalità core:**

1. ✅ Chiamate vocali
2. ✅ Videochiamate
3. ✅ Condivisione schermo (anche durante gaming)
4. ✅ Picture-in-picture (vedere schermo amico mentre giochi)
5. ✅ Chat integrata
6. ✅ Multi-piattaforma (Windows, Linux, macOS)

### **Requisiti tecnici:**

* Leggero e performante (no Electron)
* Architettura P2P ibrida
* Crittografia end-to-end
* Costi zero sviluppo e hosting
* Codice privato (closed source OK)

---

## 🎯 **FASE 1: Setup Iniziale** (Settimana 1)

### **1.1 Installazione ambiente di sviluppo**

bash

```bash
# Installa Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Installa Node.js (per frontend)
# Scarica da: https://nodejs.org/

# Installa Tauri CLI
cargo install tauri-cli

# Crea progetto
cargo create-tauri-app
```

**Scegli durante setup:**

* Package manager: `npm` o `pnpm`
* Frontend: `Vanilla` (HTML/CSS/JS) o `React/Vue/Svelte`
* UI template: Vanilla TypeScript

### **1.2 Dipendenze Rust**

Aggiungi al tuo `Cargo.toml`:

toml

```toml
[dependencies]
tauri = { version = "2.1", features = ["protocol-asset"] }
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
tokio-tungstenite = "0.21"  # WebSocket
webrtc = "0.9"              # WebRTC nativo
ring = "0.17"               # Crittografia
jsonwebtoken = "9.2"        # JWT auth
reqwest = "0.11"            # HTTP client
```

---

## 🏗️ **FASE 2: Server Minimalista** (Settimana 2-3)

### **2.1 Server di segnalazione (Rust)**

Crea progetto server separato:

bash

```bash
cargo new signaling-server
cd signaling-server
```

**Stack server:**

* **Axum** - Web framework veloce
* **Tower-WebSocket** - WebSocket support
* **SQLite** - Database embedded (zero config)

toml

```toml
[dependencies]
axum = { version = "0.7", features = ["ws"] }
tokio = { version = "1", features = ["full"] }
tower = "0.4"
tower-http = { version = "0.5", features = ["cors"] }
sqlx = { version = "0.7", features = ["sqlite", "runtime-tokio"] }
argon2 = "0.5"           # Hash password
jsonwebtoken = "9.2"
serde = { version = "1.0", features = ["derive"] }
uuid = "1.6"
```

### **2.2 API del server**

rust

```rust
// Endpoints necessari:

POST   /api/register      // Registrazione utente
POST   /api/login         // Login e JWT
GET    /api/users         // Lista contatti online
WS     /ws/signaling      // WebSocket per segnalazione P2P

// Database schema (SQLite):
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    public_key TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);
```

### **2.3 Deploy server gratuito**

**Opzione 1 - Fly.io (consigliato):**

bash

```bash
# Installa flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

**Opzione 2 - Railway:**

- Push codice su GitHub
- Connetti Railway al repo
- Deploy automatico

**Costi: 0€** (tutti hanno tier gratuito permanente)

---

## 💻 **FASE 3: Client Tauri - Base** (Settimana 3-4)

### **3.1 UI principale**

```
src-tauri/         # Backend Rust
  ├── src/
  │   ├── main.rs
  │   ├── webrtc.rs
  │   └── commands.rs
  
src/               # Frontend
  ├── index.html
  ├── style.css
  ├── main.js
  └── components/
      ├── login.js
      ├── call.js
      └── settings.js
```

### **3.2 Schermata login**

html

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>GameCall</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="login-screen">
        <input id="username" placeholder="Username">
        <input id="password" type="password" placeholder="Password">
        <button onclick="login()">Login</button>
        <button onclick="register()">Registrati</button>
    </div>
  
    <div id="main-screen" style="display:none">
        <div id="contacts-list"></div>
        <div id="video-container"></div>
    </div>
  
    <script src="main.js"></script>
</body>
</html>
```

### **3.3 Comandi Tauri (Rust backend)**

rust

```rust
// src-tauri/src/commands.rs

#[tauri::command]
async fn login(username: String, password: String) -> Result<String, String> {
    // Chiama API server
    // Ritorna JWT token
}

#[tauri::command]
async fn get_contacts() -> Result<Vec<User>, String> {
    // Ottieni lista contatti online
}

#[tauri::command]
async fn start_call(peer_id: String) -> Result<(), String> {
    // Inizia segnalazione WebRTC
}
```

---

## 🎥 **FASE 4: WebRTC e Video** (Settimana 5-6)

### **4.1 Setup WebRTC**

javascript

```javascript
// src/main.js

let peerConnection;
let localStream;
let remoteStream;

const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },  // STUN gratuito
        // Aggiungi TURN se necessario
    ]
};

async function startCall(peerId) {
    // 1. Ottieni stream locale (camera + microfono)
    localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
    });
  
    // 2. Crea peer connection
    peerConnection = new RTCPeerConnection(config);
  
    // 3. Aggiungi stream locale
    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });
  
    // 4. Gestisci stream remoto
    peerConnection.ontrack = (event) => {
        remoteStream = event.streams[0];
        document.getElementById('remote-video').srcObject = remoteStream;
    };
  
    // 5. Crea offerta e invia tramite signaling
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
  
    // Invia offerta al peer tramite server
    await sendSignaling(peerId, {
        type: 'offer',
        sdp: offer
    });
}
```

### **4.2 Condivisione schermo**

javascript

```javascript
async function shareScreen() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always",  // Mostra cursore
                displaySurface: "monitor"  // Cattura tutto lo schermo
            },
            audio: false  // O true se vuoi anche audio sistema
        });
      
        // Sostituisci track video con schermo
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders()
            .find(s => s.track.kind === 'video');
      
        sender.replaceTrack(videoTrack);
      
        // Quando utente stoppa condivisione
        videoTrack.onended = () => {
            // Ritorna a camera
            switchBackToCamera();
        };
      
    } catch (err) {
        console.error("Errore condivisione schermo:", err);
    }
}
```

### **4.3 Picture-in-Picture (PIP)**

javascript

```javascript
async function enablePIP() {
    const videoElement = document.getElementById('remote-video');
  
    if (document.pictureInPictureEnabled) {
        try {
            await videoElement.requestPictureInPicture();
            // Ora puoi giocare a Fortnite vedendo l'amico in PIP!
        } catch (err) {
            console.error("PIP error:", err);
        }
    }
}

// Tauri può anche creare finestra floating nativa
#[tauri::command]
async fn create_floating_window() {
    // Finestra sempre in primo piano per video amico
}
```

---

## 💬 **FASE 5: Chat crittografata** (Settimana 7)

### **5.1 Crittografia E2E**

rust

```rust
// src-tauri/src/crypto.rs

use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM};
use ring::rand::{SecureRandom, SystemRandom};

pub fn encrypt_message(key: &[u8], message: &str) -> Vec<u8> {
    let rng = SystemRandom::new();
    let unbound_key = UnboundKey::new(&AES_256_GCM, key).unwrap();
    let key = LessSafeKey::new(unbound_key);
  
    let mut nonce_bytes = [0u8; 12];
    rng.fill(&mut nonce_bytes).unwrap();
    let nonce = Nonce::assume_unique_for_key(nonce_bytes);
  
    let mut in_out = message.as_bytes().to_vec();
    key.seal_in_place_append_tag(nonce, Aad::empty(), &mut in_out)
        .unwrap();
  
    in_out
}
```

### **5.2 Chat UI**

javascript

```javascript
function sendMessage(text) {
    const encrypted = encryptMessage(sharedKey, text);
  
    // Invia tramite data channel WebRTC (P2P diretto)
    dataChannel.send(encrypted);
}

// Setup data channel
peerConnection.ondatachannel = (event) => {
    const channel = event.channel;
    channel.onmessage = (e) => {
        const decrypted = decryptMessage(sharedKey, e.data);
        displayMessage(decrypted);
    };
};
```

---

## 🎨 **FASE 6: UI/UX Finale** (Settimana 8-9)

### **6.1 Design interfaccia**

css

```css
/* Stile minimale gaming-oriented */
body {
    background: #1a1a2e;
    color: #eee;
    font-family: 'Segoe UI', system-ui;
}

.video-grid {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 10px;
}

.video-main {
    /* Schermo amico grande */
    border-radius: 8px;
    overflow: hidden;
}

.video-pip {
    /* Tuo video piccolo */
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 200px;
    border: 2px solid #00ff88;
}
```

### **6.2 Controlli chiamata**

html

```html
<div class="call-controls">
    <button onclick="toggleMic()">🎤 Mute</button>
    <button onclick="toggleVideo()">📹 Video</button>
    <button onclick="shareScreen()">🖥️ Schermo</button>
    <button onclick="enablePIP()">⬜ PIP</button>
    <button onclick="endCall()">📞 Chiudi</button>
</div>
```

---

## 🧪 **FASE 7: Test e Ottimizzazione** (Settimana 10)

### **7.1 Test scenari**

* ✅ Chiamata 1-a-1 funziona
* ✅ Condivisione schermo durante gaming (bassa latenza)
* ✅ PIP funziona su tutti OS
* ✅ Chat crittografata
* ✅ Riconnessione automatica
* ✅ Gestione NAT/Firewall

### **7.2 Ottimizzazioni performance**

rust

```rust
// Codec video preferito (H.264 per gaming)
sdp = sdp.replace("VP8", "H264");

// Bitrate adattivo
peerConnection.getSenders().forEach(sender => {
    if (sender.track.kind === 'video') {
        const params = sender.getParameters();
        params.encodings[0].maxBitrate = 2500000; // 2.5 Mbps
        sender.setParameters(params);
    }
});
```

---

## 📦 **FASE 8: Build e Distribuzione** (Settimana 11)

### **8.1 Build per tutte le piattaforme**

bash

```bash
# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu

# macOS (serve Mac per buildare)
npm run tauri build -- --target x86_64-apple-darwin
npm run tauri build -- --target aarch64-apple-darwin  # Apple Silicon
```

### **8.2 Installer**

Tauri genera automaticamente:

* **Windows**: `.msi` installer
* **Linux**: `.deb`, `.AppImage`
* **macOS**: `.dmg`, `.app`

### **8.3 Auto-update (opzionale)**

toml

```toml
# tauri.conf.json
{
  "updater": {
    "active": true,
    "endpoints": [
      "https://tuo-dominio.com/updates/{{target}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_PUBLIC_KEY"
  }
}
```

---

## 📊 **TIMELINE COMPLETA**

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Settimana</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Fase</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Obiettivo</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">1</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Setup</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Ambiente pronto</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">2-3</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Server</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Server deployed gratuitamente</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">3-4</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Client base</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Login e UI base</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">5-6</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">WebRTC</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Video chiamate funzionanti</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">7</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Chat</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Messaggi crittografati</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">8-9</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">UI</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Interfaccia completa</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">10</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Test</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Tutto funziona perfettamente</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">11</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Release</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Build per tutti OS</td></tr></tbody></table></pre>

**Totale: \~11 settimane** (lavorando part-time)

---

## 💰 **COSTI FINALI**

<pre class="font-ui border-border-100/50 overflow-x-scroll w-full rounded border-[0.5px] shadow-[0_2px_12px_hsl(var(--always-black)/5%)]"><table class="bg-bg-100 min-w-full border-separate border-spacing-0 text-sm leading-[1.88888] whitespace-normal"><thead class="border-b-border-100/50 border-b-[0.5px] text-left"><tr class="[tbody>&]:odd:bg-bg-500/10"><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Voce</th><th class="text-text-000 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] px-2 [&:not(:first-child)]:border-l-[0.5px]">Costo</th></tr></thead><tbody><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Sviluppo (Rust/Tauri)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>0€</strong> (MIT license)</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Server hosting</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>0€</strong> (Fly.io/Railway free tier)</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Database</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>0€</strong> (SQLite embedded)</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">STUN server</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>0€</strong> (Google STUN pubblico)</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">TURN server</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>0€</strong> (Metered.ca 50GB/mese)</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">Dominio (opzionale)</td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]">~10€/anno</td></tr><tr class="[tbody>&]:odd:bg-bg-500/10"><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>TOTALE</strong></td><td class="border-t-border-100/50 [&:not(:first-child)]:-x-[hsla(var(--border-100) / 0.5)] border-t-[0.5px] px-2 [&:not(:first-child)]:border-l-[0.5px]"><strong>0-10€/anno</strong></td></tr></tbody></table></pre>

---

## 🔒 **LICENZE E LEGALITÀ**

### **Puoi usare liberamente:**

* ✅ **Tauri** - MIT/Apache 2.0
* ✅ **Rust** - MIT/Apache 2.0
* ✅ **WebRTC** - BSD license
* ✅ **Tutte le librerie menzionate** - MIT/Apache

### **Il TUO codice:**

* ✅ Puoi tenerlo **privato**
* ✅ Puoi venderlo
* ✅ **NON** sei obbligato a open source
* ✅ Puoi fare app commerciale

**Solo requisito**: Menzionare licenze librerie usate (file `LICENSES.txt` nell'installer)
