const net = require('net');
const { readVarInt, safeEnd } = require('./utils');
const { getConfig } = require('./config');

function startProxy() {
  const server = net.createServer(clientSocket => {
    console.log(`🔗  New connection from ${clientSocket.remoteAddress}`);

    let handshakeBuffer = Buffer.alloc(0);
    let parsed = false;
    let backendSocket = null;
    const config = getConfig();

    clientSocket.setTimeout(config.socket_timeout, () => {
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
      
        let target = config.routes[serverAddress.toLowerCase()];

        if (!target) {
          if (config.allow_fallback) {
            target = config.default_backend;
            console.log(`🔀  Using fallback backend: ${target.host}:${target.port}`);
          } else {
            console.warn(`⛔  Address not allowed (no default enabled): ${serverAddress}`);
            return safeEnd(clientSocket);
          }
        } else {
          console.log(`✅  Forwarding to ${target.host}:${target.port}`);
        }

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

  const config = getConfig();
  server.listen(config.listen_port, config.listen_adress, () => {
    console.log("Started!")
    console.log(`🚀  Proxy started on ${config.listen_adress}:${config.listen_port}`);
  });

  return server;
}

module.exports = {
  startProxy
};

