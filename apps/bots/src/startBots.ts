import type { SupabaseClient } from "@supabase/supabase-js";
import { BotsManager } from "./bots-logic";
import type { Database } from "./types/supabase";

async function startBots(supabase: SupabaseClient<Database>) {
	console.log("Starting trading bots...");

	// Create a bots manager instance
	const botsManager = new BotsManager(supabase);

	// Get all bots from the database
	const bots = await botsManager.getAllBots();

	if (bots.length === 0) {
		console.warn("No bots found in the database!");
		return;
	}

	console.log(`Found ${bots.length} bots. Starting trading operations...`);

	// Start each bot with different intervals to avoid concurrent operations
	bots.forEach((bot, index) => {
		// Stagger bot starting times slightly
		const interval = 5000 + index * 1000;

		console.log(
			`Starting bot ${bot.bot_name} (ID: ${bot.bot_id}) with interval ${interval}ms`,
		);

		// Start the trading bot
		botsManager.startTradingBot(bot.bot_id, interval);
	});

	console.log("All bots have been started!");
}

export { startBots };
