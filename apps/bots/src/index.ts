import { BotsManager } from "./bots-logic";
import { createSupabaseClient } from "./utils/supabase";

async function startServer() {
	console.log("Starting bots server...");

	try {
		// Create Supabase client
		const supabase = createSupabaseClient();

		// Test connection to Supabase
		const { data, error } = await supabase.auth.getSession();

		if (error) {
			throw new Error(`Failed to connect to Supabase: ${error.message}`);
		}

		console.log("Successfully connected to Supabase");

		// Initialize bots manager
		const botsManager = new BotsManager(supabase);

		// Reset database on each start
		console.log("Resetting database...");
		await botsManager.resetDatabase();
		console.log("Database reset complete");

		// Get or create initial bots
		const bots = await botsManager.getAllBots();

		// Start trading bots with different intervals
		for (const [index, bot] of bots.entries()) {
			// Different intervals to avoid all bots trading at the same time
			const interval = 30000 + index * 10000; // 30s, 40s, 50s, etc.
			botsManager.startTradingBot(bot.botId, interval);
		}

		console.log(`Started ${bots.length} trading bots`);

		// Keep the process running
		process.on("SIGINT", () => {
			console.log("Shutting down bots server...");
			// Stop all bots
			for (const bot of bots) {
				botsManager.stopTradingBot(bot.botId);
			}
			process.exit(0);
		});
	} catch (error) {
		console.error("Error starting bots server:", error);
		process.exit(1);
	}
}

// Start the server
startServer();
