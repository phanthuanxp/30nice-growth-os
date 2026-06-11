import { defineConfig } from "prisma/config";

// DATABASE_URL is used at runtime for migrations/introspection.
// For `prisma generate`, this is not needed — the schema is read directly.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/30nice_growth_os",
  },
});
