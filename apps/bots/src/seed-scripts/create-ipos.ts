import type { NewOrder } from "@social-trading-bot-platform/db-drizzle";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BotsManager } from "../bots-logic/botsManager";
import { seedData } from "./data";

async function createIPOs(supabase: SupabaseClient) {
	console.log("Creating ipo orders...");

	// Create a bots manager instance
	const botsManager = new BotsManager(supabase);

	// Get all bots from the database
	const botsFromDB = await botsManager.getAllBots();

	// Fetch all companies from the database
	const { data: companiesFromDB, error: companiesError } = await supabase
		.from("company")
		.select("*");

	if (companiesError) {
		console.error("Error fetching companies:", companiesError);
		return;
	}

	for (const botSeed of seedData) {
		const {
			company: { ipo_order, name: company_name },
			bot_name,
		} = botSeed;

		// Find the matching bot from the database using bot_name
		const matchingBot = botsFromDB.find((bot) => bot.bot_name === bot_name);

		if (!matchingBot) {
			console.error(
				`Bot with name ${bot_name} not found in database. Skipping IPO creation.`,
			);
			continue;
		}

		// Find the matching company from the database using company_name
		const matchingCompany = companiesFromDB.find(
			(company) => company.company_name === company_name,
		);

		if (!matchingCompany) {
			console.error(
				`Company with name ${company_name} not found in database. Skipping IPO creation.`,
			);
			continue;
		}

		const newOrder: NewOrder = {
			bot_id: matchingBot.bot_id,
			company_id: matchingCompany.company_id,
			...ipo_order,
		};

		console.log(`Creating ipo order for ${company_name} by ${bot_name}`);
		console.log({ newOrder });
		const result = await supabase
			.from("order")
			.insert(newOrder)
			.select()
			.single();

		console.log({ result });

		const { data, error, status } = result;

		if (error) {
			console.error("Error creating ipo order:", status);
		} else {
			console.log(`Created ipo order for ${bot_name} successfully.`);
		}
		console.log("Created ipo orders successfully.", { data });
		//return data;
	}
}

export { createIPOs };
