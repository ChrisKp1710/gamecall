# Deploy su Fly.io

## Setup

1. Installa Fly CLI:
```bash
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# Mac/Linux
curl -L https://fly.io/install.sh | sh
```

2. Login:
```bash
flyctl auth login
```

3. Crea PostgreSQL database (GRATIS su Fly.io):
```bash
flyctl postgres create --name gamecall-db --region fra
```

Salva la connection string che ti viene fornita.

4. Crea app:
```bash
flyctl launch --name gamecall-api --region fra
```

Risponde `No` quando chiede di deployare subito.

5. Configura secrets:
```bash
flyctl secrets set DATABASE_URL="postgres://..." -a gamecall-api
flyctl secrets set JWT_SECRET="your-super-secret-key" -a gamecall-api
```

6. Deploy:
```bash
flyctl deploy
```

## Fly.toml

Il file `fly.toml` viene generato automaticamente. Esempio:

```toml
app = "gamecall-api"
primary_region = "fra"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"
```

## Dockerfile

```dockerfile
FROM rust:1.75 as builder
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/gamecall-server /usr/local/bin/gamecall-server
CMD ["gamecall-server"]
```

## Verifica deploy

```bash
flyctl status
flyctl logs
```

URL: `https://gamecall-api.fly.dev`

## Free tier limits
- 3 shared-cpu-1x VMs with 256MB RAM
- 3GB persistent storage
- 160GB outbound data transfer
- PostgreSQL: 1GB storage, 1GB RAM

## Aggiorna schema database

Dopo deploy, esegui schema sul database:

```bash
flyctl postgres connect -a gamecall-db
# Nel prompt psql:
\c gamecall
# Copia e incolla il contenuto di schema.sql
```

## Monitoring

```bash
flyctl dashboard
flyctl logs -a gamecall-api
flyctl postgres connect -a gamecall-db
```
