const fs = require('fs').promises;
const fsSync = require('fs');

let config = {};
let configLastModified = null;

async function loadConfig() {
  const rawConfig = await fs.readFile('./config.json', 'utf8');
  config = JSON.parse(rawConfig);
  const stats = await fs.stat('./config.json');
  configLastModified = stats.mtime.getTime();
  return config;
}

async function reloadConfig() {
  try {
    console.log('🔄 Reloading config...');
    const rawConfig = await fs.readFile('./config.json', 'utf8');
    const newConfig = JSON.parse(rawConfig);
    
    if (!newConfig.listen_port || !newConfig.listen_adress || !newConfig.routes) {
      throw new Error('Invalid config: listen_port, listen_adress & routes are required');
    }
    
    config = newConfig;
    
    console.log('✅  Config successfully reloaded!');
    console.log(`   ${Object.keys(config.routes).length} Routes available`);
    console.log('   New connections will now use the updated config.');
    
    const stats = await fs.stat('./config.json');
    configLastModified = stats.mtime.getTime();
    
  } catch (err) {
    console.error('❌  Error reloading config:', err.message);
    console.error('Continue using the old config.');
  }
}

function watchConfigFile(onChange) {
  fsSync.watchFile('./config.json', { interval: 1000 }, async (curr, prev) => {
    if (curr.mtime.getTime() !== prev.mtime.getTime()) {
      console.log('📝  Config file changed detected!');
      console.log('💡  Use the "reload" command to reload the config.json');
      console.log('(Existing connections remain intact)');
      configLastModified = curr.mtime.getTime();
      if (onChange) onChange();
    }
  });
}

function stopWatchingConfig() {
  fsSync.unwatchFile('./config.json');
}

function getConfig() {
  return config;
}

function displayConfig() {
  console.log('📋 Configuration:');
  console.log(`Listen Address: ${config.listen_adress}`);
  console.log(`Listen Port: ${config.listen_port}`);
  console.log(`Socket Timeout: ${config.socket_timeout}ms`);
  console.log(`Allow Fallback: ${config.allow_fallback}`);
  
  if (config.allow_fallback && config.default_backend) {
    console.log(`Default Backend: ${config.default_backend.host}:${config.default_backend.port}`);
  }
  
  console.log(`🔗  Routes (${Object.keys(config.routes).length}):`);
  for (const [name, route] of Object.entries(config.routes)) {
    console.log(`${name} -> ${route.host}:${route.port}`);
  }
  console.log('');
}

module.exports = {
  loadConfig,
  reloadConfig,
  watchConfigFile,
  stopWatchingConfig,
  getConfig,
  displayConfig
};

