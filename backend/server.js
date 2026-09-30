const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDatabase = require("./config/database");

// Routes
const authRoutes = require("./routes/authRoutes");
const tradingAccountRoutes = require("./routes/tradingAccountRoutes");
const tradeRoutes = require("./routes/tradeRoutes");

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

// --------------------------------------------------
// Security
// --------------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// --------------------------------------------------
// CORS
// --------------------------------------------------

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

// --------------------------------------------------
// Rate Limiting
// --------------------------------------------------

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// --------------------------------------------------
// Body Parser
// --------------------------------------------------

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

// --------------------------------------------------
// Logger
// --------------------------------------------------

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// --------------------------------------------------
// Static Upload Directory
// --------------------------------------------------

app.use(
  "/uploads",
  express.static("uploads")
);

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Trading Journal API is running",

    environment:
      process.env.NODE_ENV,

    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",

    timestamp:
      new Date().toISOString(),
  });
});

// --------------------------------------------------
// Root Route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Welcome to Trading Journal API",
  });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------

// Authentication
app.use(
  "/api/auth",
  authRoutes
);

// Trading Accounts
app.use(
  "/api/accounts",
  tradingAccountRoutes
);

// Trades
app.use(
  "/api/trades",
  tradeRoutes
);

// --------------------------------------------------
// 404 Handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      "API route not found",
    path: req.originalUrl,
  });
});

// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "Server Error:",
      error
    );

    res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
);

// --------------------------------------------------
// Start Application
// --------------------------------------------------

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(
      PORT,
      () => {
        console.log("");
        console.log(
          "======================================"
        );
        console.log(
          "       TRADING JOURNAL BACKEND"
        );
        console.log(
          "======================================"
        );
        console.log(
          `🚀 Server: http://localhost:${PORT}`
        );
        console.log(
          `🌍 Environment: ${process.env.NODE_ENV}`
        );
        console.log(
          "📡 API: http://localhost:" +
            `${PORT}/api`
        );
        console.log(
          "======================================"
        );
        console.log("");
      }
    );
  } catch (error) {
    console.error(
      "❌ Failed to start application:",
      error.message
    );

    process.exit(1);
  }
};

startServer();
