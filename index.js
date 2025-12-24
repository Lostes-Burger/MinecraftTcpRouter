const { loadConfig, watchConfigFile, stopWatchingConfig, displayConfig } = require('./config');
const { startProxy } = require('./proxy');
const { setupConsole } = require('./console');

let server = null;
let rl = null;

(async () => {
  try {
    await loadConfig();
    displayConfig();
    
    server = startProxy();
    watchConfigFile();
    rl = setupConsole();
    
    console.log('💡  Use the "reload" command to reload the config.json');
  } catch (err) {
    console.error('❌  Failed to load config.json:', err.message);
    process.exit(1);
  }
})();

function cleanup() {
  console.log('🛑  Beende Proxy...');
  stopWatchingConfig();
  if (rl) rl.close();
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
