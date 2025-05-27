const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  secret: { type: String, required: true },
  redirectUris: { type: [String], required: true },
});

const Client = mongoose.model("Client", clientSchema);

module.exports = Client;
