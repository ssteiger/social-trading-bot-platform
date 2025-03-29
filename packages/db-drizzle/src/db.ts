import { drizzle } from "drizzle-orm/postgres-js";
import * as postgres from "postgres";
import * as schema from "./generated/schema";

// Create connection string with fallback
const connectionString =
	process.env.SUPABASE_DB_URL ||
	"postgres://postgres:postgres@localhost:5432/postgres";

// Configure postgres client with better defaults for production
const client = postgres(connectionString, {
	max: 10, // Increase connection pool size
	idle_timeout: 20, // Shorter idle timeout (seconds)
	connect_timeout: 10, // Connection timeout (seconds)
	prepare: false, // Disable prepared statements for Supabase compatibility
});

// Create and export database instance
export const db = drizzle(client, { schema });

// Export helper for transactions
export const transaction = client.begin;
