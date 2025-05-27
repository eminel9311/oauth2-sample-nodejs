const express = require("express");
const router = express.Router();
const oauth2Controller = require("../config/oauth2");

// Authorization endpoint
router.get("/authorize", oauth2Controller.authorization);
router.post("/authorize", oauth2Controller.authorization);

// Token endpoint
router.post("/token", oauth2Controller.token);

// Callback endpoint cho testing
router.get("/callback", (req, res) => {
  res.json({
    message: "Authorization successful!",
    code: req.query.code,
    state: req.query.state,
    error: req.query.error,
    error_description: req.query.error_description,
  });
});

module.exports = router;
