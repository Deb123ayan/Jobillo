import { defineConfig } from "drizzle-kit";

// Only require DATABASE_URL if using database storage
if (process.env.USE_DATABASE === 'true' && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required when USE_DATABASE=true");
}

// Default config for in-memory storage (no database needed)
export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy",
  },
});
