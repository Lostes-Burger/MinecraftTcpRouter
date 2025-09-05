const net = require('net');
const fs = require('fs').promises;

// 🌐  Load config
let config = {};
(async () => {
  try {
    const rawConfig = await fs.readFile('./config.json', 'utf8');
    config = JSON.parse(rawConfig);
    startProxy();
  } catch (err) {
    console.error('❌  Failed to load config.json:', err.message);
    process.exit(1);
  }
})();

// 🔧  VarInt reader (sync utility)
function readVarInt(buffer, offset = 0) {
  let numRead = 0, result = 0, read;
  do {
    if (offset + numRead >= buffer.length) return null;
    read = buffer.readUInt8(offset + numRead);
    result |= (read & 0x7F) << (7 * numRead);
    numRead++;
    if (numRead > 5) return null;
  } while ((read & 0x80) !== 0);
  return { value: result, size: numRead };
}

// 🧼  Safe socket shutdown
function safeEnd(socket) {
  if (socket && !socket.destroyed) {
    try { socket.end(); } catch {}
    try { socket.destroy(); } catch {}
  }
}

// 🚀  Main proxy function
function startProxy() {
  const server = net.createServer(clientSocket => {
    console.log(`🔗  New connection from ${clientSocket.remoteAddress}`);

    let handshakeBuffer = Buffer.alloc(0);
    let parsed = false;
    let backendSocket = null;

    clientSocket.setTimeout(10000, () => {
      console.warn('⏳  Connection timeout – closing');
      safeEnd(clientSocket);
    });

    clientSocket.on('data', chunk => {
      if (parsed) return;
      handshakeBuffer = Buffer.concat([handshakeBuffer, chunk]);

      try {
        if (handshakeBuffer.length < 3) return;

        const lengthData = readVarInt(handshakeBuffer);
        if (!lengthData || lengthData.value <= 0 || lengthData.value > 300) {
          console.warn('📛  Invalid packet length – closing');
          return safeEnd(clientSocket);
        }

        if (handshakeBuffer.length < lengthData.value + lengthData.size) return;

        let offset = lengthData.size;
        const packetIdData = readVarInt(handshakeBuffer, offset);
        if (!packetIdData || packetIdData.value !== 0x00) {
          console.warn('📛  Invalid packet ID – closing');
          return safeEnd(clientSocket);
        }
        offset += packetIdData.size;

        const protoData = readVarInt(handshakeBuffer, offset);
        if (!protoData) {
          console.warn('📛  Invalid protocol version – closing');
          return safeEnd(clientSocket);
        }
        offset += protoData.size;

        const strLenData = readVarInt(handshakeBuffer, offset);
        if (!strLenData || strLenData.value <= 0 || strLenData.value > 255) {
          console.warn('📛  Invalid server address length – closing');
          return safeEnd(clientSocket);
        }
        offset += strLenData.size;

        const serverAddress = handshakeBuffer.toString('utf8', offset, offset + strLenData.value);

        if (!/^[a-zA-Z0-9.\-]+$/.test(serverAddress)) {
          console.warn(`🚫  Invalid characters in server address: ${serverAddress}`);
          return safeEnd(clientSocket);
        }

        console.log(`🌍  Server address detected: ${serverAddress}`);

        let target = config.routes[serverAddress];

        if (!target) {
          if (config.allow_fallback) {
            target = config.default_backend;
            console.log(`🔀  Using fallback backend: ${target.host}:${target.port}`);
          } else {
            console.warn(`⛔  Address not allowed: ${serverAddress}`);
            return safeEnd(clientSocket);
          }
        } else {
          console.log(`✅  Forwarding to ${target.host}:${target.port}`);
        }

        // 🔄  Connect to backend
        backendSocket = net.connect(target.port, target.host, () => {
          backendSocket.write(handshakeBuffer);
          clientSocket.pipe(backendSocket);
          backendSocket.pipe(clientSocket);
        });

        backendSocket.on('error', err => {
          console.error(`❌  Backend error (${target.host}:${target.port}):`, err.message);
          safeEnd(clientSocket);
        });

        backendSocket.setTimeout(30000, () => {
          console.warn('⏳  Backend timeout – closing');
          safeEnd(clientSocket);
          safeEnd(backendSocket);
        });

        parsed = true;

      } catch (err) {
        console.error('❌  Unexpected error during handshake:', err.message);
        safeEnd(clientSocket);
      }
    });

    clientSocket.on('error', err => {
      console.error('❌  Client error:', err.message);
      safeEnd(backendSocket);
    });

    clientSocket.on('close', () => {
      safeEnd(backendSocket);
    });
  });

  server.listen(config.listen_port, config.listen_adress, () => {
    console.log(`🚀  Proxy started on ${config.listen_adress}:${config.listen_port}`);
  });
}
