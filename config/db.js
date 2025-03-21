require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error("MongoDB URI is not defined in environment variables");
    }

    console.log("Attempting to connect to MongoDB...");
    console.log("URI:", mongoURI);

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    
    // Test the connection by listing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Available collections:", collections.map(c => c.name));
    
  } catch (error) {
    console.error("MongoDB Connection Error Details:");
    console.error("Error Message:", error.message);
    console.error("Error Code:", error.code);
    console.error("Error Name:", error.name);
    
    if (error.code === 'ECONNREFUSED') {
      console.error("\nPossible issues:");
      console.error("1. MongoDB service is not running");
      console.error("2. MongoDB is not installed");
      console.error("3. MongoDB is running on a different port");
      console.error("\nTo fix:");
      console.error("1. Start MongoDB service: net start MongoDB");
      console.error("2. Check MongoDB installation: mongod --version");
      console.error("3. Verify MongoDB port: netstat -an | findstr 27017");
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;
