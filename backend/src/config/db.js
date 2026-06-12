// src/config/db.js
import { PrismaClient } from "@prisma/client";  // 👈 back to this

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("database connected successfully via prisma");
  } catch (error) {
    console.log("database connection failed" + error.message);
    console.error("database error:", error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log("database disconnected successfully via prisma");
  } catch (error) {
    console.log("database disconnection failed" + error.message);
    console.error("database error:", error.message);
    process.exit(1);
  }
};

export { connectDB, disconnectDB, prisma };
