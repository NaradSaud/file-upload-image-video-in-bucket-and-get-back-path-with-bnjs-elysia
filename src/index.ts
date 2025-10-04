import "dotenv/config";
import { Elysia } from "elysia";
// Make sure the file exists at src/media/routes.ts
import { mediaRoutes } from "./media/route"
import { userRoutes } from "./user/routes";
import { homeRoutes } from "./home/route";
import { testDbConnection } from "./db/client";

// Test database connection before starting server
async function startServer() {
  console.log("🔍 Testing database connection...");
  const isDbConnected = await testDbConnection();

  if (!isDbConnected) {
    console.error("💥 Failed to start server: Database connection failed");
    process.exit(1);
  }

  const app = new Elysia()
    .use(mediaRoutes)  // centralized media APIs
    .use(userRoutes)
    .use(homeRoutes)
    .listen(3000);

  console.log("🚀 Server running at http://localhost:3000");
}

// Start the server
startServer().catch((error) => {
  console.error("💥 Failed to start server:", error);
  process.exit(1);
});
