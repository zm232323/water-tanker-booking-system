const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // If the URI is the default placeholder, instruct the user to configure it
    if (process.env.MONGO_URI.includes('example.mongodb.net')) {
      console.error('\n*** WARNING: Please update the MONGO_URI in your .env file to your actual MongoDB Atlas connection string! ***\n');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
