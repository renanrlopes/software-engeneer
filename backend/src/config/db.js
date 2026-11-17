const mongoose = require('mongoose');

let memoryServer = null;

/**
 * Conecta ao MongoDB.
 * - Com MONGODB_URI definido: usa o banco informado (local ou Atlas).
 * - Sem MONGODB_URI: sobe um MongoDB em memória (mongodb-memory-server),
 *   para que o projeto rode sem instalar nada. Os dados somem ao encerrar.
 * Retorna true quando o banco é em memória.
 */
async function connectDB() {
  let uri = process.env.MONGODB_URI;
  let emMemoria = false;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('educa');
    emMemoria = true;
  }

  await mongoose.connect(uri);
  console.log(`[db] conectado ${emMemoria ? '(MongoDB em memória)' : 'a ' + uri.replace(/\/\/.*@/, '//***@')}`);
  return emMemoria;
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDB, disconnectDB };
