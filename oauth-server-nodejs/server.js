require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");

const app = express();

// Body parsing - multiple approaches for compatibility
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
      console.log(
        "Test URL: http://localhost:3000/oauth2/authorize?client_id=client1&response_type=code&redirect_uri=http://localhost:3000/oauth2/callback&scope=read&state=random123"
      );
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
