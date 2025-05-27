require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

//Connecting our database
const MONGODB_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@127.0.0.1:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;
console.log("MONGODB_URI", MONGODB_URI);
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected...");
  });

const createUser = async () => {
  try {
    const user = new User({
      username: "quanbh",
      password: "conga@1102",
    });
    await user.save();
    console.log("User created");
  } catch (err) {
    console.error("Error creating user:", err);
  } finally {
    mongoose.connection.close();
  }
};

createUser().catch(console.error);
