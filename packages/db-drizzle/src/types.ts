import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as schema from "./generated/schema";

// Export the schema itself
export { schema };

// Re-export useful Drizzle utilities
export { eq, and, or, like, not, desc, asc } from "drizzle-orm";

// Export select types (for fetching data)
export type Company = InferSelectModel<typeof schema.company>;
export type Exchange = InferSelectModel<typeof schema.exchange>;
export type Shareholding = InferSelectModel<typeof schema.shareholding>;
export type Order = InferSelectModel<typeof schema.order>;
export type Trade = InferSelectModel<typeof schema.trade>;
export type PriceHistory = InferSelectModel<typeof schema.price_history>;
export type Bot = InferSelectModel<typeof schema.bot>;
export type CurrentMarketPrice = InferSelectModel<
	typeof schema.current_market_price
>;
export type OrderBook = InferSelectModel<typeof schema.order_book>;

// Export insert types (for creating new records)
export type NewCompany = InferInsertModel<typeof schema.company>;
export type NewExchange = InferInsertModel<typeof schema.exchange>;
export type NewShareholding = InferInsertModel<typeof schema.shareholding>;
export type NewOrder = InferInsertModel<typeof schema.order>;
export type NewTrade = InferInsertModel<typeof schema.trade>;
export type NewPriceHistory = InferInsertModel<typeof schema.price_history>;
export type NewBot = InferInsertModel<typeof schema.bot>;
