const mongoose = require('mongoose');

let isConnected = false;

async function connectMongoDB() {
  const rawUri = process.env.MONGODB_URI;
  const uri = rawUri ? rawUri.trim() : '';

  if (!uri) {
    console.log('\x1b[33m%s\x1b[0m', 'ℹ [Database] MONGODB_URI is not set in .env. Running on local storage engine.');
    return false;
  }

  // Disable command buffering so queries don't hang when disconnected
  mongoose.set('bufferCommands', false);

  try {
    console.log('\x1b[36m%s\x1b[0m', '⚡ [MongoDB Atlas] Connecting to MongoDB cluster...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    const host = mongoose.connection.host;
    const dbName = mongoose.connection.name;
    console.log('\x1b[32m%s\x1b[0m', `✓ [MongoDB Atlas] Successfully connected to: ${host}/${dbName}`);
    return true;
  } catch (err) {
    console.warn('\x1b[33m%s\x1b[0m', `ℹ [MongoDB Atlas] Atlas unreachable (${err.message}). Using local embedded storage.`);
    isConnected = false;
    return false;
  }
}

function getMongoStatus() {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    host: isConnected ? mongoose.connection.host : null,
    dbName: isConnected ? mongoose.connection.name : null,
    readyState: mongoose.connection.readyState
  };
}

module.exports = {
  connectMongoDB,
  getMongoStatus
};
