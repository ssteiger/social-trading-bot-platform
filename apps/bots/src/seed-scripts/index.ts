import type { SupabaseClient } from "@supabase/supabase-js";
import { createBots } from "./create-bots";
import { createCompanies } from "./create-companies";
import { createExchanges } from "./create-exchanges";

async function seedDataToDatabase(supabase: SupabaseClient) {
	try {
		console.log("Starting to seed data...");

		await createExchanges(supabase);
		await createBots(supabase);
		await createCompanies(supabase);

		console.log("Data seeding completed!");
	} catch (error) {
		console.error("Error in seed process:", error);
	}
}

export { seedDataToDatabase };
