const oauth2orize = require("oauth2orize");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Client = require("../models/client");
const passport = require("passport");
const crypto = require("crypto");

// Kiểm tra JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key";
if (!process.env.JWT_SECRET) {
  console.warn(
    "Warning: Using fallback JWT secret. Set JWT_SECRET in .env file"
  );
}

// Create a new OAuth2 server
const server = oauth2orize.createServer();

// Store authorization codes temporarily (in production, use Redis)
const authorizationCodes = new Map();

// Serialization functions
server.serializeClient((client, done) => {
  return done(null, client.id);
});

server.deserializeClient(async (id, done) => {
  try {
    const client = await Client.findOne({ id: id });
    return done(null, client);
  } catch (err) {
    return done(err);
  }
});

// Authorization Code Grant
server.grant(
  oauth2orize.grant.code(async (client, redirectUri, user, req, done) => {
    try {
      // Tạo authorization code đơn giản
      const code = crypto.randomBytes(32).toString("hex");

      // Lưu code với thông tin liên quan
      authorizationCodes.set(code, {
        clientId: client.id,
        userId: user.id,
        redirectUri: redirectUri,
        createdAt: Date.now(),
        expiresIn: 10 * 60 * 1000, // 10 minutes
      });

      // Cleanup expired codes
      setTimeout(() => {
        authorizationCodes.delete(code);
      }, 10 * 60 * 1000);

      done(null, code);
    } catch (err) {
      done(err);
    }
  })
);

// Token Exchange
server.exchange(
  oauth2orize.exchange.code(async (client, code, redirectUri, done) => {
    try {
      // Kiểm tra authorization code
      const authData = authorizationCodes.get(code);
      if (!authData) {
        return done(new Error("Invalid or expired authorization code"));
      }

      // Kiểm tra expiration
      if (Date.now() - authData.createdAt > authData.expiresIn) {
        authorizationCodes.delete(code);
        return done(new Error("Authorization code expired"));
      }

      // Kiểm tra client có quyền sử dụng code này
      if (authData.clientId !== client.id) {
        return done(new Error("Invalid client for this authorization code"));
      }

      // Kiểm tra redirectUri khớp
      if (authData.redirectUri !== redirectUri) {
        return done(new Error("Redirect URI mismatch"));
      }

      // Xóa code sau khi sử dụng (one-time use)
      authorizationCodes.delete(code);

      // Tạo access token
      const accessToken = jwt.sign(
        {
          clientId: client.id,
          userId: authData.userId,
          type: "access_token",
          scope: "read", // có thể customize
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Tạo refresh token
      const refreshToken = jwt.sign(
        {
          clientId: client.id,
          userId: authData.userId,
          type: "refresh_token",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      done(null, accessToken, refreshToken, {
        expires_in: 3600,
        token_type: "Bearer",
      });
    } catch (err) {
      done(err);
    }
  })
);

// Custom authorization middleware để tránh vấn đề body parsing
const customAuthorization = async (req, res, next) => {
  try {
    const { client_id, redirect_uri, response_type, scope, state } = req.query;
    console.log("req.query", req.query);
    // Validate required parameters
    if (!client_id || !redirect_uri || !response_type) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing required parameters",
      });
    }

    if (response_type !== "code") {
      return res.status(400).json({
        error: "unsupported_response_type",
        error_description: "Only authorization code flow is supported",
      });
    }

    // Find client
    const client = await Client.findOne({ id: client_id });
    if (!client) {
      return res.status(400).json({
        error: "invalid_client",
        error_description: "Client not found",
      });
    }

    console.log("client", client);
    console.log("redirect_uri", redirect_uri);
    // Validate redirect URI
    if (!client.redirectUris || !client.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Invalid redirect URI",
      });
    }

    // Check if user is authenticated
    if (!req.session.user) {
      // Redirect to login form with all parameters
      const loginUrl = `/oauth2/identifier?client_id=${client_id}&response_type=${response_type}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
      return res.redirect(loginUrl);
    }

    // Store client and redirect info in request
    req.oauth2 = {
      client: client,
      redirectUri: redirect_uri,
      scope: scope,
      state: state,
      user: req.session.user, // Add user to oauth2 context
    };

    next();
  } catch (err) {
    console.error("Authorization error:", err);
    res.status(500).json({
      error: "server_error",
      error_description: "Internal server error",
    });
  }
};

// Custom decision handler
const customDecision = async (req, res) => {
  try {
    const { authorize } = req.body;
    const { client, redirectUri, scope, state, user } = req.oauth2;

    if (authorize === "deny") {
      // User denied authorization
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set("error", "access_denied");
      errorUrl.searchParams.set(
        "error_description",
        "User denied authorization"
      );
      if (state) errorUrl.searchParams.set("state", state);

      return res.redirect(errorUrl.toString());
    }

    if (authorize === "allow") {
      // User approved authorization - generate code
      const code = crypto.randomBytes(32).toString("hex");

      // Use the authenticated user
      const userId = user._id;

      // Store authorization code
      authorizationCodes.set(code, {
        clientId: client.id,
        userId: userId,
        redirectUri: redirectUri,
        createdAt: Date.now(),
        expiresIn: 10 * 60 * 1000,
      });

      // Cleanup after 10 minutes
      setTimeout(() => {
        authorizationCodes.delete(code);
      }, 10 * 60 * 1000);

      // Redirect back with authorization code
      const callbackUrl = new URL(redirectUri);
      callbackUrl.searchParams.set("code", code);
      if (state) callbackUrl.searchParams.set("state", state);

      return res.redirect(callbackUrl.toString());
    }

    // Should not reach here
    res.status(400).json({
      error: "invalid_request",
      error_description: "Invalid authorization decision",
    });
  } catch (err) {
    console.error("Decision error:", err);
    res.status(500).json({
      error: "server_error",
      error_description: "Internal server error",
    });
  }
};

// Authorization form renderer
const renderAuthorizationForm = (req, res) => {
  const { client, scope, state } = req.oauth2;
  const currentUrl = req.originalUrl;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OAuth2 Authorization</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; }
        .client-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .buttons { margin: 20px 0; }
        button { padding: 12px 24px; margin: 0 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .allow { background: #4CAF50; color: white; }
        .deny { background: #f44336; color: white; }
        button:hover { opacity: 0.8; }
      </style>
    </head>
    <body>
      <h2>🔐 Authorization Request</h2>
      
      <div class="client-info">
        <h3>Application Details</h3>
        <p><strong>Client:</strong> ${client.name || client.id}</p>
        <p><strong>Scope:</strong> ${scope || "basic access"}</p>
        <p><strong>Description:</strong> This application is requesting access to your account.</p>
      </div>
      
      <p>Do you authorize this application to access your account?</p>
      
      <form method="post" action="${currentUrl}">
        <div class="buttons">
          <button type="submit" name="authorize" value="allow" class="allow">
            ✅ Allow Access
          </button>
          <button type="submit" name="authorize" value="deny" class="deny">
            ❌ Deny Access
          </button>
        </div>
      </form>
      
      <p><small>You will be redirected back to the application after making your choice.</small></p>
    </body>
    </html>
  `);
};

// Export authorization handlers
exports.authorization = [
  customAuthorization,
  (req, res, next) => {
    if (req.method === "GET") {
      return renderAuthorizationForm(req, res);
    }
    next();
  },
  customDecision,
];

// Token endpoint - keep using oauth2orize for this
exports.token = [
  passport.authenticate(["basic", "oauth2-client-password"], {
    session: false,
  }),
  server.token(),
  server.errorHandler(),
];

// Utility functions
exports.validateClient = async (clientId, clientSecret) => {
  try {
    const client = await Client.findOne({ id: clientId });
    if (!client) {
      return false;
    }

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(client.secret),
      Buffer.from(clientSecret)
    );
  } catch (err) {
    return false;
  }
};

// Export server for additional configuration if needed
exports.server = server;
