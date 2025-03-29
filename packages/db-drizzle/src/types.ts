import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as schema from "./generated/schema";

// Export the schema itself
export { schema };

// Re-export useful Drizzle utilities
export { eq, and, or, like, not, desc, asc } from "drizzle-orm";

// Export select types (for fetching data)
export type Company = InferSelectModel<typeof schema.companies>;
export type Exchange = InferSelectModel<typeof schema.exchanges>;
export type Shareholding = InferSelectModel<typeof schema.shareholdings>;
export type Order = InferSelectModel<typeof schema.orders>;
export type OrderType = InferSelectModel<typeof schema.order_types>;
export type OrderStatus = InferSelectModel<typeof schema.order_statuses>;
export type Trade = InferSelectModel<typeof schema.trades>;
export type PriceHistory = InferSelectModel<typeof schema.price_history>;
export type Bot = InferSelectModel<typeof schema.bots>;
export type CurrentMarketPrice = InferSelectModel<
	typeof schema.current_market_prices
>;
export type OrderBook = InferSelectModel<typeof schema.order_book>;

// Export insert types (for creating new records)
export type NewCompany = InferInsertModel<typeof schema.companies>;
export type NewExchange = InferInsertModel<typeof schema.exchanges>;
export type NewShareholding = InferInsertModel<typeof schema.shareholdings>;
export type NewOrder = InferInsertModel<typeof schema.orders>;
export type NewOrderType = InferInsertModel<typeof schema.order_types>;
export type NewOrderStatus = InferInsertModel<typeof schema.order_statuses>;
export type NewTrade = InferInsertModel<typeof schema.trades>;
export type NewPriceHistory = InferInsertModel<typeof schema.price_history>;
export type NewBot = InferInsertModel<typeof schema.bots>;
