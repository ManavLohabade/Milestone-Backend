require("dotenv").config();
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI; 
    await mongoose.connect(mongoURI);

    console.log("MongoDB Connected...");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1); 
  }
};

module.exports = connectDB;
