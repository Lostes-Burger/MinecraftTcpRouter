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

function safeEnd(socket) {
  if (socket && !socket.destroyed) {
    try { socket.end(); } catch {}
    try { socket.destroy(); } catch {}
  }
}

module.exports = {
  readVarInt,
  safeEnd
};

