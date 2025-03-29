import { join } from "path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env file
config({ path: join(process.cwd(), ".env") });

export default defineConfig({
	schema: "./src/schema/*.ts",
	out: "./src/generated",
	dialect: "postgresql",
	schemaFilter: ["public", "auth", "storage"],
	dbCredentials: {
		url:
			process.env.SUPABASE_DB_URL ||
			"postgres://postgres:postgres@localhost:5432/postgres",
		ssl: false,
	},
	verbose: true,
	strict: true,
});
