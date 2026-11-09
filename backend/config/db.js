const mongoose = require('mongoose');

async function connectDB() {
  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tracky_ai', {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
  return connection;
}

module.exports = connectDB;
