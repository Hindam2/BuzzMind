const mongoose = require('mongoose');

async function connectDatabase() {
  const url =
    process.env.MONGODB_URI ||
    'mongodb://Mahmoud:8IXIgivDCFZ5hZOn@ac-9etyztw-shard-00-00.tbdajrz.mongodb.net:27017,ac-9etyztw-shard-00-01.tbdajrz.mongodb.net:27017,ac-9etyztw-shard-00-02.tbdajrz.mongodb.net:27017/all-data?ssl=true&replicaSet=atlas-7eonym-shard-0&authSource=admin&appName=Cluster0';

  await mongoose.connect(url);
  console.log('MongoDB connected');
}

module.exports = connectDatabase;
