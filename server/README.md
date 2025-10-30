# GameCall Backend

Backend server in Rust per GameCall - Video Calling App

## Setup

### Prerequisiti
- Rust (stable)
- PostgreSQL
- sqlx-cli

### Installazione sqlx-cli
```bash
cargo install sqlx-cli --no-default-features --features postgres
```

### Setup Database

1. Crea database:
```bash
createdb gamecall
```

2. Copia file environment:
```bash
cp .env.example .env
```

3. Modifica `.env` con le tue credenziali PostgreSQL

4. Esegui schema:
```bash
psql -d gamecall -f schema.sql
```

### Sviluppo

Avvia server:
```bash
cargo run
```

Server disponibile su `http://localhost:3000`

## API Endpoints

### Auth
- `POST /auth/register` - Registrazione nuovo utente
  ```json
  {
    "username": "mario",
    "password": "password123"
  }
  ```
  Response:
  ```json
  {
    "token": "jwt_token_here",
    "user": {
      "id": "uuid",
      "username": "mario",
      "friend_code": "GC-A7B2-X9K4",
      "avatar_url": null,
      "status": "offline"
    }
  }
  ```

- `POST /auth/login` - Login utente
  ```json
  {
    "username": "mario",
    "password": "password123"
  }
  ```

- `GET /auth/me` - Info utente corrente (richiede JWT)

### Friends
- `GET /friends` - Lista amici (richiede JWT)
- `POST /friends/add` - Aggiungi amico con friend code (richiede JWT)
  ```json
  {
    "friend_code": "GC-A7B2-X9K4"
  }
  ```
- `GET /friends/requests` - Richieste di amicizia in arrivo (richiede JWT)
- `POST /friends/accept` - Accetta richiesta (richiede JWT)
- `POST /friends/reject` - Rifiuta richiesta (richiede JWT)
- `POST /friends/remove` - Rimuovi amico (richiede JWT)

### Health
- `GET /health` - Health check

## Deploy

### Fly.io
```bash
fly launch
fly deploy
```

### Shuttle.rs
```bash
cargo shuttle init
cargo shuttle deploy
```

## TODO
- [ ] Middleware per autenticazione JWT
- [ ] Implementazione completa route friends
- [ ] WebSocket per notifiche real-time
- [ ] Rate limiting
- [ ] Tests
