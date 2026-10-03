/**
 * IELTS CD Mock Test Platform - Host / Admin Server
 * Coordinates 22 Core i3 Windows Client PCs over Local Area Network (LAN)
 */
const express = require('express');
const http = require('http');
const path = require('path');
const os = require('os');
const cors = require('cors');
const { WebSocketServer, WebSocket } = require('ws');
const config = require('./config');

const apiRouter = require('./routes/api');
const invigilatorRouter = require('./routes/invigilator');

const app = express();
const server = http.createServer(app);

// WebSocket Server for instantaneous LAN synchronization
const wss = new WebSocketServer({ server, path: '/ws' });

// Track active connections
const clientSockets = new Map(); // sessionId -> WebSocket
const invigilatorSockets = new Set(); // Set of WebSockets

// Utility to find all local LAN IPv4 addresses, prioritizing physical network adapters
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const physicalAddresses = [];
  const virtualAddresses = [];

  const virtualPatterns = /virtual|vmware|vbox|vethernet|hyper-v|wsl|pseudo|loopback/i;
  const physicalPatterns = /wi-fi|wlan|ethernet|local area connection|eth\d|en\d|wlan\d/i;

  for (const name of Object.keys(interfaces)) {
    const isVirtual = virtualPatterns.test(name);
    const isExplicitPhysical = physicalPatterns.test(name);

    for (const iface of interfaces[name]) {
      // Skip internal (127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        const item = { interface: name, ip: iface.address };
        if (isVirtual) {
          virtualAddresses.push(item);
        } else if (isExplicitPhysical) {
          physicalAddresses.unshift(item);
        } else {
          physicalAddresses.push(item);
        }
      }
    }
  }
  return [...physicalAddresses, ...virtualAddresses];
}

// Broadcasters for app context
function broadcastToInvigilators(message) {
  const payload = JSON.stringify(message);
  for (const ws of invigilatorSockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function broadcastToClients(message) {
  const payload = JSON.stringify(message);
  if (message.targetSessionId === 'ALL') {
    for (const [_, ws] of clientSockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  } else if (clientSockets.has(message.targetSessionId)) {
    const ws = clientSockets.get(message.targetSessionId);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

app.set('broadcastToInvigilators', broadcastToInvigilators);
app.set('broadcastToClients', broadcastToClients);

// Middlewares
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static frontend files with optimal caching for LAN clients
app.use(express.static(path.join(__dirname, '..', 'client', 'public'), {
  etag: true,
  maxAge: '1h'
}));

// API Routes
app.use('/api/sessions', apiRouter);
app.use('/api/invigilator', invigilatorRouter);

// Specific Page Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'admin.html'));
});

app.get('/report', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'report.html'));
});

// Fallback for Candidate Application
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'public', 'index.html'));
});

// WebSocket Connection Management
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const role = url.searchParams.get('role') || 'candidate';
  const sessionId = url.searchParams.get('sessionId');

  if (role === 'invigilator') {
    invigilatorSockets.add(ws);
    ws.on('close', () => invigilatorSockets.delete(ws));
  } else {
    if (sessionId) {
      clientSockets.set(sessionId, ws);
      ws.on('close', () => clientSockets.delete(sessionId));
    }
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (e) {}
  });
});

// Server Initialization
if (require.main === module) {
  server.listen(config.PORT, config.HOST, () => {
    const localIps = getLocalIpAddresses();
    const primaryIp = localIps.length > 0 ? localIps[0].ip : '127.0.0.1';

    console.log('='.repeat(72));
    console.log('  KEYSTONE OPEN IELTS - COMPUTER-DELIVERED MOCK TEST PLATFORM');
    console.log('  Designed for 22 Windows Core i3 LAN Terminals + 1 Host PC');
    console.log('='.repeat(72));
    console.log(`  * Local Server:        http://localhost:${config.PORT}`);
    console.log(`  * Invigilator Hub:     http://localhost:${config.PORT}/admin`);
    console.log(`  * Primary LAN URL:     http://${primaryIp}:${config.PORT}`);
    if (localIps.length > 1) {
      console.log('  * Alternate Interfaces:');
      localIps.slice(1).forEach(iface => {
        console.log(`    - ${iface.interface}: http://${iface.ip}:${config.PORT}`);
      });
    }
    console.log(`  * AI Engine:           ${config.AI_PROVIDER.toUpperCase()}`);
    console.log('='.repeat(72));
    console.log('  To connect the 22 client PCs, launch Chrome on each terminal with:');
    console.log(`  chrome.exe --kiosk --app=http://${primaryIp}:${config.PORT}`);
    console.log('='.repeat(72));
  });
}

module.exports = { app, server };
