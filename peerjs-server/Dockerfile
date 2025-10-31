FROM node:18-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm install --production

# Copia codice server
COPY server.js ./

# Esponi porta
EXPOSE 9000

# Avvia server
CMD ["node", "server.js"]
