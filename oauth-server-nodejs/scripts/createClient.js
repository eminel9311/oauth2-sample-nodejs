require("dotenv").config();

const mongoose = require("mongoose");
const Client = require("../models/client");

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

// create Client
const createClient = async () => {
  const client = new Client({
    id: "client1",
    secret: "secret1",
    redirectUris: ["http://localhost:3000/oauth2/callback"], // TODO: change to the actual redirect URI
  });
  await client.save();
  console.log("Client created:", client);
  mongoose.connection.close();
};

createClient().catch(console.error);
