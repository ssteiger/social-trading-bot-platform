import type {
	Bot,
	Company,
	CurrentMarketPrice,
	Exchange,
	NewBot,
	NewCompany,
	NewExchange,
	NewOrder,
	NewPriceHistory,
	NewShareholding,
	NewTrade,
	Order,
	OrderBook,
	OrderStatus,
	OrderStatusEnum,
	OrderType,
	OrderTypeEnum,
	PriceHistory,
	Shareholding,
	Trade,
	db,
	schema,
} from "@social-trading-bot-platform/db-drizzle";
import type { BotsManager } from "./botsManager";

/**
 * Creates a trading bot with a specific strategy
 */
export function createBot(
	strategy: string,
	botsManager: BotsManager,
): TradingStrategy {
	switch (strategy.toLowerCase()) {
		case "momentum":
			return new MomentumStrategy(botsManager);
		case "meanreversion":
			return new MeanReversionStrategy(botsManager);
		case "dividend":
			return new DividendStrategy(botsManager);
		default:
			return new RandomStrategy(botsManager);
	}
}

/**
 * Base class for all trading strategies
 */
export class TradingStrategy {
	protected botsManager: BotsManager;
	protected riskTolerance = 0.02; // Default 2% risk per trade
	protected maxPositionSize = 0.2; // Default 20% of portfolio in one position

	constructor(botsManager: BotsManager) {
		this.botsManager = botsManager;
	}

	/**
	 * Execute the trading strategy for a specific bot
	 */
	async executeStrategy(botId: number): Promise<void> {
		try {
			// Get bot details
			const bot = await this.botsManager.getBotById({ bot_id: botId });
			if (!bot) {
				console.error(`Bot ${botId} not found`);
				return;
			}

			// Get all available companies
			const companies = await this.botsManager.getCompanies();
			if (companies.length === 0) {
				console.log(`No companies available for bot ${botId} to trade`);
				return;
			}

			// Get bot's current shareholdings
			const shareholdings = await this.botsManager.getBotShareholdings({
				bot_id: botId,
			});

			// Get bot's active orders
			const activeOrders = await this.botsManager.getBotActiveOrders(botId);

			// Analyze market and make trading decisions
			await this.analyzeAndTrade(bot, companies, shareholdings, activeOrders);

			console.log(`Strategy execution completed for bot ${botId}`);
		} catch (error) {
			console.error(`Error executing strategy for bot ${botId}:`, error);
		}
	}

	/**
	 * Analyze market data and execute trades
	 * This is the main method that should be overridden by specific strategies
	 */
	protected async analyzeAndTrade(
		bot: Bot,
		companies: Company[],
		shareholdings: Shareholding[],
		activeOrders: Order[],
	): Promise<void> {
		// Default implementation - random trading
		const randomCompany =
			companies[Math.floor(Math.random() * companies.length)];

		// Get current market price for the company
		const marketData = await this.botsManager.getCompanyMarketData(
			randomCompany.company_id,
			1,
		);
		const currentPrice = marketData[0].close_price_in_cents;

		const isBuy = Math.random() > 0.5;
		const quantity = Math.floor(Math.random() * 10) + 1;
		const price_in_cents = Math.round(currentPrice * (isBuy ? 0.99 : 1.01)); // Adjust price slightly

		// Place a random order
		await this.placeOrder(
			bot.bot_id,
			randomCompany.company_id,
			isBuy,
			price_in_cents,
			quantity,
		);
	}

	/**
	 * Place a market order
	 */
	protected async placeOrder(
		botId: number,
		companyId: number,
		isBuy: boolean,
		price_in_cents: number,
		quantity: number,
	): Promise<boolean> {
		try {
			// Create order data
			const orderData: NewOrder = {
				bot_id: botId,
				company_id: companyId,
				order_type: "limit", // Assuming 1 is limit order
				status: OrderStatusEnum.ACTIVE,
				is_buy: isBuy,
				price_in_cents,
				quantity: quantity,
			};

			// Place the order
			const result = await this.botsManager.placeOrder({
				bot_id: botId,
				orderData,
			});

			if (result) {
				console.log(
					`Bot ${botId} placed ${isBuy ? "buy" : "sell"} order for ${quantity} shares of company ${companyId} at ${price_in_cents}`,
				);
			} else {
				console.error(`Failed to place order for bot ${botId}`);
			}

			return result;
		} catch (error) {
			console.error("Error placing order:", error);
			return false;
		}
	}

	/**
	 * Calculate simple moving average
	 */
	protected calculateSMA(prices: number[], period: number): number | null {
		if (prices.length < period) return null;

		const sum = prices
			.slice(0, period)
			.reduce((total, price) => total + price, 0);
		return sum / period;
	}

	/**
	 * Calculate relative strength index (RSI)
	 */
	protected calculateRSI(prices: number[], period = 14): number | null {
		if (prices.length < period + 1) return null;

		const changes = [];
		for (let i = 1; i < prices.length; i++) {
			changes.push(prices[i - 1] - prices[i]);
		}

		let gains = 0;
		let losses = 0;

		for (let i = 0; i < period; i++) {
			if (changes[i] >= 0) {
				gains += changes[i];
			} else {
				losses -= changes[i];
			}
		}

		if (losses === 0) return 100;

		const rs = gains / losses;
		return 100 - 100 / (1 + rs);
	}
}

/**
 * Momentum trading strategy
 * Buys stocks that are trending upward and sells when momentum slows
 */
export class MomentumStrategy extends TradingStrategy {
	protected async analyzeAndTrade(
		bot: Bot,
		companies: Company[],
		shareholdings: Shareholding[],
		activeOrders: Order[],
	): Promise<void> {
		// Process each company
		for (const company of companies) {
			// Get historical price data
			const priceHistory = await this.botsManager.getCompanyMarketData(
				company.company_id,
				30,
			);
			if (priceHistory.length < 14) continue; // Need enough data for analysis

			// Get current market price
			const marketData = await this.botsManager.getCompanyMarketData(
				company.company_id,
				1,
			);
			const currentPrice =
				marketData.length > 0 ? marketData[0].close_price_in_cents : 10000; // Default to 100.00 if no market data available

			// Extract close prices
			const closePrices = priceHistory
				.map((p) => p.close_price_in_cents)
				.reverse();

			// Calculate indicators
			const sma5 = this.calculateSMA(closePrices, 5);
			const sma20 = this.calculateSMA(closePrices, 20);
			const rsi = this.calculateRSI(closePrices);

			if (!sma5 || !sma20 || !rsi) continue;

			// Find current shareholding for this company
			const holding = shareholdings.find(
				(h) => h.company_id === company.company_id,
			);
			const currentShares = holding ? holding.shares : 0;

			// Momentum buy signal: Short-term SMA crosses above long-term SMA and RSI < 70
			if (sma5 > sma20 && rsi < 70) {
				// Only buy if we don't already have a large position
				if (currentShares < 100) {
					const quantity = 10;
					const price = (currentPrice * 1.01) / 100; // Convert cents to dollars and adjust
					await this.placeOrder(
						bot.bot_id,
						company.company_id,
						true,
						Math.round(price * 100),
						quantity,
					);
				}
			}
			// Momentum sell signal: Short-term SMA crosses below long-term SMA or RSI > 70
			else if ((sma5 < sma20 || rsi > 70) && currentShares > 0) {
				const quantity = Math.min(currentShares, 10);
				const price = (currentPrice * 0.99) / 100; // Convert cents to dollars and adjust
				await this.placeOrder(
					bot.bot_id,
					company.company_id,
					false,
					Math.round(price * 100),
					quantity,
				);
			}
		}
	}
}

/**
 * Mean reversion strategy
 * Buys oversold stocks and sells overbought stocks
 */
export class MeanReversionStrategy extends TradingStrategy {
	protected async analyzeAndTrade(
		bot: Bot,
		companies: Company[],
		shareholdings: Shareholding[],
		activeOrders: Order[],
	): Promise<void> {
		// Process each company
		for (const company of companies) {
			// Get historical price data
			const priceHistory = await this.botsManager.getCompanyMarketData(
				company.company_id,
				30,
			);
			if (priceHistory.length < 14) continue; // Need enough data for analysis

			// Get current market price
			const marketData = await this.botsManager.getCompanyMarketData(
				company.company_id,
				1,
			);
			const currentPrice =
				marketData.length > 0 ? marketData[0].close_price_in_cents : 10000; // Default to 100.00 if no market data available

			// Extract close prices
			const closePrices = priceHistory
				.map((p) => p.close_price_in_cents)
				.reverse();

			// Calculate RSI
			const rsi = this.calculateRSI(closePrices);
			if (!rsi) continue;

			// Find current shareholding for this company
			const holding = shareholdings.find(
				(h) => h.company_id === company.company_id,
			);
			const currentShares = holding ? holding.shares : 0;

			// Mean reversion buy signal: RSI below 30 (oversold)
			if (rsi < 30) {
				// Only buy if we don't already have a large position
				if (currentShares < 100) {
					const quantity = 10;
					const price = (currentPrice * 1.01) / 100; // Convert cents to dollars and adjust
					await this.placeOrder(
						bot.bot_id,
						company.company_id,
						true,
						Math.round(price * 100),
						quantity,
					);
				}
			}
			// Mean reversion sell signal: RSI above 70 (overbought)
			else if (rsi > 70 && currentShares > 0) {
				const quantity = Math.min(currentShares, 10);
				const price = (currentPrice * 0.99) / 100; // Convert cents to dollars and adjust
				await this.placeOrder(
					bot.bot_id,
					company.company_id,
					false,
					Math.round(price * 100),
					quantity,
				);
			}
		}
	}
}

/**
 * Dividend strategy
 * Focuses on buying and holding dividend-paying stocks
 */
export class DividendStrategy extends TradingStrategy {
	protected async analyzeAndTrade(
		bot: Bot,
		companies: Company[],
		shareholdings: Shareholding[],
		activeOrders: Order[],
	): Promise<void> {
		// For this simple implementation, we'll just buy and hold stocks
		// In a real implementation, we would analyze dividend yields, payout ratios, etc.

		// Process each company
		for (const company of companies) {
			// Get current market price
			const marketData = await this.botsManager.getCompanyMarketData(
				company.company_id,
				1,
			);
			const currentPrice =
				marketData.length > 0 ? marketData[0].close_price_in_cents : 10000; // Default to 100.00 if no market data available

			// Find current shareholding for this company
			const holding = shareholdings.find(
				(h) => h.company_id === company.company_id,
			);
			const currentShares = holding ? holding.shares : 0;

			// Buy signal: We don't have enough shares yet
			if (currentShares < 50) {
				const quantity = 10;
				const price = (currentPrice * 1.01) / 100; // Convert cents to dollars and adjust
				await this.placeOrder(
					bot.bot_id,
					company.company_id,
					true,
					Math.round(price * 100),
					quantity,
				);
			}
			// Sell signal: Only sell if price has increased significantly from our purchase price
			else if (
				holding &&
				currentPrice > holding.average_purchase_price_in_cents * 1.2
			) {
				// Sell 20% of our position if price has increased by 20%
				const quantity = Math.floor(currentShares * 0.2);
				if (quantity > 0) {
					const price = (currentPrice * 0.99) / 100; // Convert cents to dollars and adjust
					await this.placeOrder(
						bot.bot_id,
						company.company_id,
						false,
						Math.round(price * 100),
						quantity,
					);
				}
			}
		}
	}
}

/**
 * Random trading strategy
 * Makes random trading decisions (for testing)
 */
export class RandomStrategy extends TradingStrategy {
	// Uses the default implementation in the base class
}
