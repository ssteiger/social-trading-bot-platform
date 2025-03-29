import type {
	Bot,
	Company,
	Order,
	Shareholding,
	db,
	schema,
} from "@social-trading-bot-platform/db-drizzle";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

export class BotsManager {
	private supabase: SupabaseClient<Database>;
	private runningBots: Map<number, NodeJS.Timeout> = new Map();

	constructor(supabaseClient: SupabaseClient<Database>) {
		this.supabase = supabaseClient;
	}

	/**
	 * Get bot details by ID
	 */
	async getBotById(botId: number): Promise<Bot | null> {
		const { data, error } = await this.supabase
			.from("bots")
			.select("*")
			.eq("bot_id", botId)
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
	 * Get all available companies
	 */
	async getCompanies(): Promise<Company[]> {
		const { data, error } = await this.supabase.from("companies").select("*");

		if (error || !data) {
			console.error("Error getting companies:", error);
			return [];
		}

		// Get current prices for all companies
		const { data: priceData } = await this.supabase
			.from("current_market_prices")
			.select("*");

		const priceMap = new Map();
		if (priceData) {
			for (const price of priceData) {
				priceMap.set(price.company_id, price.current_price);
			}
		}

		// Add current price to each company
		return data.map((company) => ({
			...company,
			currentPrice: priceMap.get(company.company_id) || company.initial_price,
		}));
	}

	/**
	 * Get shareholdings for a bot
	 */
	async getBotShareholdings(botId: number): Promise<Shareholding[]> {
		const { data, error } = await this.supabase
			.from("shareholdings")
			.select("*")
			.eq("bot_id", botId);

		if (error || !data) {
			console.error("Error getting shareholdings:", error);
			return [];
		}

		return data;
	}

	/**
	 * Place a new order
	 */
	async placeOrder(botId: number, orderData: Partial<Order>): Promise<boolean> {
		try {
			// Determine status ID for pending orders
			const { data: statusData } = await this.supabase
				.from("order_statuses")
				.select("status_id")
				.eq("status_name", "pending")
				.single();

			if (!statusData) {
				throw new Error("Could not determine order status ID");
			}

			// Convert expiresAt Date to ISO string if it exists
			const expiresAtString = orderData.expires_at
				? orderData.expires_at.toISOString()
				: null;

			// Place the order
			const { error } = await this.supabase.from("orders").insert([
				{
					bot_id: botId,
					company_id: orderData.company_id,
					order_type_id: orderData.order_type_id,
					is_buy: orderData.is_buy,
					price: orderData.price,
					quantity: orderData.quantity,
					status_id: statusData.status_id,
					expires_at: expiresAtString,
				},
			]);

			if (error) {
				console.error("Error placing order:", error);
				return false;
			}

			return true;
		} catch (err) {
			console.error("Error in placeOrder:", err);
			return false;
		}
	}

	/**
	 * Get active orders for a bot
	 */
	async getBotActiveOrders(botId: number) {
		const { data: statusData } = await this.supabase
			.from("order_statuses")
			.select("status_id")
			.in("status_name", ["active", "partially_filled", "pending"]);

		if (!statusData || statusData.length === 0) {
			return [];
		}

		const statusIds = statusData.map((s) => s.status_id);

		const { data, error } = await this.supabase
			.from("orders")
			.select(`
        order_id,
        company_id,
        order_type_id,
        is_buy,
        price,
        quantity,
        quantity_filled,
        status_id,
        created_at,
        expires_at
      `)
			.eq("bot_id", botId)
			.in("status_id", statusIds);

		if (error || !data) {
			console.error("Error getting active orders:", error);
			return [];
		}

		return data;
	}

	/**
	 * Get market data for a company
	 */
	async getCompanyMarketData(companyId: number, limit = 100) {
		const { data, error } = await this.supabase
			.from("price_history")
			.select("*")
			.eq("company_id", companyId)
			.eq("period_length", "1min")
			.order("timestamp", { ascending: false })
			.limit(limit);

		if (error || !data) {
			console.error("Error getting market data:", error);
			return [];
		}

		return data;
	}

	/**
	 * Start a simple trading bot with a strategy
	 */
	startTradingBot(botId: number, intervalMs = 1000) {
		// Don't start if already running
		console.log("startTradingBot", { botId: this.runningBots.has(botId) });

		if (this.runningBots.has(botId)) {
			return;
		}

		console.log(`Starting trading bot ${botId} with interval ${intervalMs}ms`);

		const interval = setInterval(async () => {
			try {
				// Get bot details and holdings
				const bot = await this.getBotById(botId);
				if (!bot) {
					console.error(`Bot ${botId} not found`);
					this.stopTradingBot(botId);
					return;
				}

				const holdings = await this.getBotShareholdings(botId);
				const companies = await this.getCompanies();

				// Simple random trading strategy
				for (const company of companies) {
					if (!company.currentPrice) continue;

					// Random decision to buy or sell
					const randomAction = Math.random();

					// Holding this stock? Consider selling
					const holding = holdings.find(
						(h) => h.company_id === company.company_id,
					);

					if (holding && holding.shares > 0 && randomAction > 0.7) {
						// Sell some shares
						const sharesToSell =
							Math.floor(holding.shares * Math.random() * 0.3) + 1;
						if (sharesToSell <= 0) continue;

						await this.placeOrder(botId, {
							company_id: company.company_id,
							order_type_id: 1, // Market order
							is_buy: false,
							price: company.currentPrice,
							quantity: sharesToSell,
						});

						console.log(
							`Bot ${botId} selling ${sharesToSell} shares of ${company.ticker_symbol} at ${company.currentPrice}`,
						);
					}
					// Consider buying
					else if (
						bot.balance > company.currentPrice * 10 &&
						randomAction < 0.3
					) {
						// Buy some shares
						const maxShares = Math.floor(
							(bot.balance * 0.1) / company.currentPrice,
						);
						const sharesToBuy = Math.floor(Math.random() * maxShares) + 1;
						if (sharesToBuy <= 0) continue;

						await this.placeOrder(botId, {
							company_id: company.company_id,
							order_type_id: 1, // Market order
							is_buy: true,
							price: company.currentPrice,
							quantity: sharesToBuy,
						});

						console.log(
							`Bot ${botId} buying ${sharesToBuy} shares of ${company.ticker_symbol} at ${company.currentPrice}`,
						);
					}
				}
			} catch (error) {
				console.error(`Error in trading bot ${botId}:`, error);
			}
		}, intervalMs);

		this.runningBots.set(botId, interval);
	}

	/**
	 * Stop a trading bot
	 */
	stopTradingBot(botId: number) {
		const interval = this.runningBots.get(botId);
		if (interval) {
			clearInterval(interval);
			this.runningBots.delete(botId);
			console.log(`Stopped trading bot ${botId}`);
		}
	}

	async resetDatabase(): Promise<void> {
		try {
			// Delete all bot trades
			await this.supabase.from("trades").delete().not("trade_id", "is", null);

			// Delete all orders
			await this.supabase.from("orders").delete().not("order_id", "is", null);

			// Delete all shareholdings
			await this.supabase
				.from("shareholdings")
				.delete()
				.not("shareholding_id", "is", null);

			// Delete all companies created by bots
			await this.supabase
				.from("companies")
				.delete()
				.not("company_id", "is", null);

			// Delete all bots
			await this.supabase.from("bots").delete().not("bot_id", "is", null);

			console.log("Successfully cleared database tables");
		} catch (error) {
			console.error("Error resetting database:", error);
			throw error;
		}
	}
}

// Re-export the types so they can be imported from this file too
export type { Bot, Company, Order, Shareholding };
