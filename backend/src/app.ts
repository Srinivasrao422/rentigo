import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { config } from "./config/index.js";
import { ApiError } from "./utils/ApiError.js";

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or matching localhost
      if (!origin || origin.startsWith("http://localhost") || origin === config.corsOrigin) {
        callback(null, true);
      } else {
        callback(null, true); // Dev flexible
      }
    },
    credentials: true,
  })
);

// Logging
if (config.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

// Request parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use("/api", apiRateLimiter);

// API v1 root mount
app.use("/api/v1", routes);

// 404 handler
app.use((req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
});

// Centralized error handler
app.use(errorHandler);

export default app;
