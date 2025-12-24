const readline = require('readline');
const { reloadConfig } = require('./config');

function setupConsole() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', async (input) => {
    const command = input.trim().toLowerCase();
    if (command === 'reload') {
      await reloadConfig();
    }
  });

  return rl;
}

module.exports = {
  setupConsole
};

