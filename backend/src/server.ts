import app from "./app.js";
import { config } from "./config/index.js";
import { prisma } from "./config/prisma.js";

const server = app.listen(config.port, () => {
  console.log(`\n=================================================`);
  console.log(`🚗 RentiGo API Server Started Successfully!`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🚀 Mode: ${config.nodeEnv}`);
  console.log(`📑 Health: http://localhost:${config.port}/api/v1/health`);
  console.log(`=================================================\n`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // Ignored if not connected
    }
    console.log("Closed HTTP server and database connections.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
