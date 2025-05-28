const express = require("express");
const router = express.Router();
const oauth2Controller = require("../config/oauth2");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Thêm middleware để parse body
router.use(express.urlencoded({ extended: true }));

// Login form route
router.get("/identifier", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
        .login-form { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        input { width: 100%; padding: 8px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
        button { width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { opacity: 0.8; }
        .error { color: red; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="login-form">
        <h2>🔐 Login</h2>
        ${req.query.error ? `<div class="error">${req.query.error}</div>` : ""}
        <form method="post" action="/oauth2/identifier">
          <input type="text" name="username" placeholder="Username" required>
          <input type="password" name="password" placeholder="Password" required>
          <input type="hidden" name="client_id" value="${req.query.client_id}">
          <input type="hidden" name="response_type" value="${
            req.query.response_type
          }">
          <input type="hidden" name="redirect_uri" value="${
            req.query.redirect_uri
          }">
          <input type="hidden" name="scope" value="${req.query.scope}">
          <input type="hidden" name="state" value="${req.query.state}">
          <button type="submit">Login</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Login form submission handler
router.post("/identifier", async (req, res) => {
  try {
    const {
      username,
      password,
      client_id,
      response_type,
      redirect_uri,
      scope,
      state,
    } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.redirect(
        `/oauth2/identifier?error=Invalid username or password&client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.redirect(
        `/oauth2/identifier?error=Invalid username or password&client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`
      );
    }

    // Store user in session
    req.session.user = user;

    // Redirect to authorization form
    const authUrl = `/oauth2/authorize?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
    res.redirect(authUrl);
  } catch (err) {
    res.redirect(
      `/oauth2/identifier?error=Server error&client_id=${req.body.client_id}&response_type=${req.body.response_type}&redirect_uri=${req.body.redirect_uri}&scope=${req.body.scope}&state=${req.body.state}`
    );
  }
});

// Authorization endpoint
router.get("/authorize", oauth2Controller.authorization);
router.post("/authorize", oauth2Controller.authorization);

// Token endpoint
router.post("/token", oauth2Controller.token);

// Callback endpoint cho testing
// router.get("/callback", (req, res) => {
//   res.json({
//     message: "Authorization successful!",
//     code: req.query.code,
//     state: req.query.state,
//     error: req.query.error,
//     error_description: req.query.error_description,
//   });
// });

// Thêm route mới để lấy thông tin user
router.get(
  "/userinfo",
  // Middleware xác thực token
  (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback-secret-key"
      );
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  },
  // Handler lấy thông tin user
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user._id,
        username: user.username,
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
