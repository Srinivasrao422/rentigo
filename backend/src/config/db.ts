import { prisma } from "./prisma.js";
import { config } from "./index.js";

let postgresAvailable: boolean | null = null;

export async function isPostgresConnected(): Promise<boolean> {
  if (postgresAvailable !== null) return postgresAvailable;
  try {
    await prisma.$connect();
    postgresAvailable = true;
    console.log("🐘 Connected to PostgreSQL via Prisma ORM");
  } catch (error) {
    postgresAvailable = false;
    if (config.nodeEnv === "production") {
      console.error("🚨 CRITICAL: PostgreSQL connection failed in production! In-memory store fallback is prohibited in production.");
    } else {
      console.log("⚡ PostgreSQL offline, using seamless in-memory dev repository store (development only)");
    }
  }
  return postgresAvailable;
}
