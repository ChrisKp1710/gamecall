FROM rust:1.75 as builder

WORKDIR /app

# Copia manifest e crea layer di cache per le dipendenze
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copia il codice reale e compila
COPY src ./src
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y ca-certificates libssl3 && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/gamecall-server /usr/local/bin/gamecall-server

EXPOSE 8080

CMD ["gamecall-server"]
