const mongoose = require("mongoose");
require("dotenv").config();

const mongoURI = process.env.MONGODB;

const initializeDB = async () => {
  try {
    const connection = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    if (connection) {
      console.log("Connected successfully");
    }
  } catch (error) {
    console.log("Connection failed", error);
  }
};

module.exports = { initializeDB };
