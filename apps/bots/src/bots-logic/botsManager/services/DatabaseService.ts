import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/supabase";

export class DatabaseService {
	private supabase: SupabaseClient<Database>;

	constructor(supabaseClient: SupabaseClient<Database>) {
		this.supabase = supabaseClient;
	}

	/**
	 * Reset the database (for testing purposes)
	 */
	async resetDatabase(): Promise<void> {
		try {
			// Delete all bot trades
			await this.supabase.from("trade").delete().not("trade_id", "is", null);

			// Delete all orders
			await this.supabase.from("order").delete().not("order_id", "is", null);

			// Delete all shareholdings
			await this.supabase
				.from("shareholding")
				.delete()
				.not("shareholding_id", "is", null);

			// Delete all companies created by bots
			await this.supabase
				.from("company")
				.delete()
				.not("company_id", "is", null);

			// Delete all bots
			await this.supabase.from("bot").delete().not("bot_id", "is", null);

			console.log("Successfully cleared database tables");
		} catch (error) {
			console.error("Error resetting database:", error);
			throw error;
		}
	}
}
