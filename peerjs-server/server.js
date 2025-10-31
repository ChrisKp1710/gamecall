const { ExpressPeerServer } = require('peer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 9000;

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

// Avvia server Express
const server = app.listen(PORT, () => {
  console.log(`🚀 PeerJS Server running on port ${PORT}`);
  console.log(`📡 PeerJS path: /peerjs`);
});

// Configura PeerJS
const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',
  allow_discovery: true,
  proxied: true,
  debug: true,
  corsOptions: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }
});

app.use('/peerjs', peerServer);

// Logging connessioni
peerServer.on('connection', (client) => {
  console.log(`✅ Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`❌ Client disconnected: ${client.getId()}`);
});

console.log('✅ PeerJS Server configurato correttamente');
