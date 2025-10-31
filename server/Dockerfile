FROM rust:latest as builder

WORKDIR /app

# Copia tutto e compila direttamente
COPY . .
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y ca-certificates libssl3 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/gamecall-server /usr/local/bin/gamecall-server

EXPOSE 8080

CMD ["gamecall-server"]
