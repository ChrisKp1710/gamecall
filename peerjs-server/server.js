const { ExpressPeerServer } = require('peer');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 9000;

// CORS middleware PRIMA di tutto
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GameCall PeerJS Server',
    path: '/peerjs'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Avvia server Express
const server = app.listen(PORT, () => {
  console.log(`🚀 PeerJS Server running on port ${PORT}`);
  console.log(`📡 PeerJS path: /peerjs`);
  console.log(`🌍 Access: http://localhost:${PORT}/peerjs`);
});

// Configura PeerJS - monta su /peerjs
const peerServer = ExpressPeerServer(server, {
  path: '/',  // Path relativo alla mount point
  allow_discovery: true,
  proxied: true,
  debug: true,
});

// Monta PeerJS su /peerjs - il path completo sarà /peerjs/peerjs (gestito automaticamente)
app.use('/peerjs', peerServer);

// Logging connessioni
peerServer.on('connection', (client) => {
  console.log(`✅ Client connected: ${client.getId()}`);
});

peerServer.on('disconnect', (client) => {
  console.log(`❌ Client disconnected: ${client.getId()}`);
});

console.log('✅ PeerJS Server configurato correttamente');
