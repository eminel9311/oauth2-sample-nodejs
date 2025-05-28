const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;
const User = require("../models/user");
const Client = require("../models/client");
const bcrypt = require("bcryptjs");

// passport.use(
//   new BasicStrategy(async function (username, password, done) {
//     try {
//       console.log(`Authenticating user: ${username} - ${password}`);
//       const user = await User.findOne({ username: username });
//       console.log("user", user);
//       if (!user) {
//         console.log("User not found");
//         return done(null, false);
//       }
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (isMatch) {
//         return done(null, user);
//       } else {
//         console.log("Password does not match");
//         return done(null, false);
//       }
//     } catch (err) {
//       console.log("Error:", err);
//       return done(err);
//     }
//   })
// );

// passport.use(
//   "client-basic",
//   new BasicStrategy(async function (clientId, clientSecret, done) {
//     try {
//       console.log(`Authenticating client: ${clientId}`);
//       const client = await Client.findOne({ id: clientId });
//       if (!client || client.secret !== clientSecret) {
//         console.log("Client not found or secret does not match");
//         return done(null, false);
//       }
//       return done(null, client);
//     } catch (err) {
//       console.log("Error:", err);

//       return done(err);
//     }
//   })
// );

module.exports = passport;
