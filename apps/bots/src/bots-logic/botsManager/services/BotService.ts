import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../types/supabase";
import type { Bot, Shareholding } from "../types";

export class BotService {
	private supabase: SupabaseClient<Database>;

	constructor(supabaseClient: SupabaseClient<Database>) {
		this.supabase = supabaseClient;
	}

	/**
	 * Get bot details by ID
	 */
	async getBotById({ bot_id }: { bot_id: number }): Promise<Bot | null> {
		const { data, error } = await this.supabase
			.from("bots")
			.select("*")
			.eq("bot_id", bot_id)
			.single();

		if (error || !data) {
			console.error("Error getting bot:", error);
			return null;
		}

		return data;
	}

	/**
	 * Get all bots from the database
	 */
	async getAllBots(): Promise<Bot[]> {
		const { data, error } = await this.supabase.from("bots").select("*");

		if (error || !data) {
			console.error("Error getting bots:", error);
			return [];
		}

		return data;
	}

	/**
	 * Get shareholdings for a bot
	 */
	async getBotShareholdings({
		bot_id,
	}: { bot_id: number }): Promise<Shareholding[]> {
		const { data, error } = await this.supabase
			.from("shareholdings")
			.select("*")
			.eq("bot_id", bot_id);

		if (error || !data) {
			console.error("Error getting shareholdings:", error);
			return [];
		}

		// Convert average_purchase_price_in_cents to string to match the expected type
		return data.map((holding) => ({
			...holding,
		}));
	}
}
