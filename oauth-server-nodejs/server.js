require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");

const app = express();

// Body parsing - multiple approaches for compatibility
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//CORS middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Client app URL
    credentials: true,
  })
);

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "oauth2-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);

// Passport
require("./controllers/passport");
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/oauth2", require("./routes/index"));

// Database connection và start server...
// Database setup và start server
const MONGODB_URI = `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@127.0.0.1:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}?authSource=admin`;

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected...");
    app.listen(3000, () => {
      console.log("OAuth server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
