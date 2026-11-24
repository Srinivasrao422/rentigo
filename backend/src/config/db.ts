import { prisma } from "./prisma.js";

let postgresAvailable: boolean | null = null;

export async function isPostgresConnected(): Promise<boolean> {
  if (postgresAvailable !== null) return postgresAvailable;
  try {
    await prisma.$connect();
    postgresAvailable = true;
    console.log("🐘 Connected to PostgreSQL via Prisma ORM");
  } catch {
    postgresAvailable = false;
    console.log("⚡ PostgreSQL offline, using seamless in-memory dev repository store");
  }
  return postgresAvailable;
}
