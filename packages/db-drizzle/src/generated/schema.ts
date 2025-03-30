import { pgTable, serial, varchar, timestamp, text, bigint, foreignKey, unique, check, integer, numeric, boolean, index, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const bot = pgTable("bot", {
	bot_id: serial().primaryKey().notNull(),
	bot_name: varchar({ length: 100 }).notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	last_active_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	background_story: text(),
	bot_character_description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	money_balance_in_cents: bigint({ mode: "number" }).default(1000000000).notNull(),
});

export const company = pgTable("company", {
	company_id: varchar({ length: 10 }).primaryKey().notNull(),
	creator_bot_id: integer().notNull(),
	exchange_id: varchar({ length: 10 }).notNull(),
	company_name: varchar({ length: 100 }).notNull(),
	ticker_symbol: varchar({ length: 10 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total_shares: bigint({ mode: "number" }).notNull(),
	description: text(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		company_creator_bot_id_fkey: foreignKey({
			columns: [table.creator_bot_id],
			foreignColumns: [bot.bot_id],
			name: "company_creator_bot_id_fkey"
		}),
		company_exchange_id_fkey: foreignKey({
			columns: [table.exchange_id],
			foreignColumns: [exchange.exchange_id],
			name: "company_exchange_id_fkey"
		}),
		company_exchange_id_ticker_symbol_key: unique("company_exchange_id_ticker_symbol_key").on(table.exchange_id, table.ticker_symbol),
		company_id_equals_ticker: check("company_id_equals_ticker", sql`(company_id)::text = (ticker_symbol)::text`),
	}
});

export const exchange = pgTable("exchange", {
	exchange_id: varchar({ length: 10 }).primaryKey().notNull(),
	exchange_name: varchar({ length: 100 }).notNull(),
	exchange_code: varchar({ length: 10 }).notNull(),
	trading_fee_percent: numeric({ precision: 5, scale:  2 }).default('0.1').notNull(),
	is_active: boolean().default(true).notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		exchange_exchange_code_key: unique("exchange_exchange_code_key").on(table.exchange_code),
		exchange_id_equals_code: check("exchange_id_equals_code", sql`(exchange_id)::text = (exchange_code)::text`),
	}
});

export const shareholding = pgTable("shareholding", {
	shareholding_id: serial().primaryKey().notNull(),
	bot_id: integer().notNull(),
	company_id: varchar({ length: 10 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	shares: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	average_purchase_price_in_cents: bigint({ mode: "number" }),
	last_updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idx_shareholding_bot_id: index("idx_shareholding_bot_id").using("btree", table.bot_id.asc().nullsLast().op("int4_ops")),
		shareholding_bot_id_fkey: foreignKey({
			columns: [table.bot_id],
			foreignColumns: [bot.bot_id],
			name: "shareholding_bot_id_fkey"
		}),
		shareholding_company_id_fkey: foreignKey({
			columns: [table.company_id],
			foreignColumns: [company.company_id],
			name: "shareholding_company_id_fkey"
		}),
		shareholding_bot_id_company_id_key: unique("shareholding_bot_id_company_id_key").on(table.bot_id, table.company_id),
	}
});

export const order = pgTable("order", {
	order_id: serial().primaryKey().notNull(),
	bot_id: integer().notNull(),
	company_id: varchar({ length: 10 }).notNull(),
	order_type: text().notNull(),
	is_buy: boolean().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	price_in_cents: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity_filled: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity_open: bigint({ mode: "number" }).generatedAlwaysAs(sql`(quantity - quantity_filled)`),
	status: text().default('pending').notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expires_at: timestamp({ mode: 'string' }),
	last_updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idx_order_bot_id: index("idx_order_bot_id").using("btree", table.bot_id.asc().nullsLast().op("int4_ops")),
		idx_order_company_id: index("idx_order_company_id").using("btree", table.company_id.asc().nullsLast().op("text_ops")),
		idx_order_status: index("idx_order_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
		order_bot_id_fkey: foreignKey({
			columns: [table.bot_id],
			foreignColumns: [bot.bot_id],
			name: "order_bot_id_fkey"
		}),
		order_company_id_fkey: foreignKey({
			columns: [table.company_id],
			foreignColumns: [company.company_id],
			name: "order_company_id_fkey"
		}),
		order_order_type_fkey: foreignKey({
			columns: [table.order_type],
			foreignColumns: [order_type.order_type],
			name: "order_order_type_fkey"
		}),
		order_status_fkey: foreignKey({
			columns: [table.status],
			foreignColumns: [order_status.order_status],
			name: "order_status_fkey"
		}),
	}
});

export const order_type = pgTable("order_type", {
	order_type: text().primaryKey().notNull(),
});

export const order_status = pgTable("order_status", {
	order_status: text().primaryKey().notNull(),
});

export const trade = pgTable("trade", {
	trade_id: serial().primaryKey().notNull(),
	exchange_id: varchar({ length: 10 }).notNull(),
	company_id: varchar({ length: 10 }).notNull(),
	buy_order_id: integer().notNull(),
	sell_order_id: integer().notNull(),
	buyer_bot_id: integer().notNull(),
	seller_bot_id: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	price_in_cents: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	trade_fee_in_cents: bigint({ mode: "number" }).notNull(),
	executed_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idx_trade_company_id: index("idx_trade_company_id").using("btree", table.company_id.asc().nullsLast().op("text_ops")),
		idx_trade_executed_at: index("idx_trade_executed_at").using("btree", table.executed_at.asc().nullsLast().op("timestamp_ops")),
		trade_exchange_id_fkey: foreignKey({
			columns: [table.exchange_id],
			foreignColumns: [exchange.exchange_id],
			name: "trade_exchange_id_fkey"
		}),
		trade_company_id_fkey: foreignKey({
			columns: [table.company_id],
			foreignColumns: [company.company_id],
			name: "trade_company_id_fkey"
		}),
		trade_buy_order_id_fkey: foreignKey({
			columns: [table.buy_order_id],
			foreignColumns: [order.order_id],
			name: "trade_buy_order_id_fkey"
		}),
		trade_sell_order_id_fkey: foreignKey({
			columns: [table.sell_order_id],
			foreignColumns: [order.order_id],
			name: "trade_sell_order_id_fkey"
		}),
		trade_buyer_bot_id_fkey: foreignKey({
			columns: [table.buyer_bot_id],
			foreignColumns: [bot.bot_id],
			name: "trade_buyer_bot_id_fkey"
		}),
		trade_seller_bot_id_fkey: foreignKey({
			columns: [table.seller_bot_id],
			foreignColumns: [bot.bot_id],
			name: "trade_seller_bot_id_fkey"
		}),
	}
});

export const price_history = pgTable("price_history", {
	history_id: serial().primaryKey().notNull(),
	company_id: varchar({ length: 10 }).notNull(),
	exchange_id: varchar({ length: 10 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	open_price_in_cents: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	close_price_in_cents: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	high_price_in_cents: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	low_price_in_cents: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	volume: bigint({ mode: "number" }).notNull(),
	timestamp: timestamp({ mode: 'string' }).notNull(),
	period_length: varchar({ length: 20 }).notNull(),
}, (table) => {
	return {
		idx_price_history_company_timestamp: index("idx_price_history_company_timestamp").using("btree", table.company_id.asc().nullsLast().op("text_ops"), table.timestamp.asc().nullsLast().op("text_ops")),
		price_history_company_id_fkey: foreignKey({
			columns: [table.company_id],
			foreignColumns: [company.company_id],
			name: "price_history_company_id_fkey"
		}),
		price_history_exchange_id_fkey: foreignKey({
			columns: [table.exchange_id],
			foreignColumns: [exchange.exchange_id],
			name: "price_history_exchange_id_fkey"
		}),
		price_history_company_id_timestamp_period_length_key: unique("price_history_company_id_timestamp_period_length_key").on(table.company_id, table.timestamp, table.period_length),
	}
});
export const order_book = pgView("order_book", {	company_id: varchar({ length: 10 }),
	ticker_symbol: varchar({ length: 10 }),
	exchange_id: varchar({ length: 10 }),
	exchange_code: varchar({ length: 10 }),
	is_buy: boolean(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	price_in_cents: bigint({ mode: "number" }),
	total_quantity: numeric(),
	oldest_order_time: timestamp({ mode: 'string' }),
}).as(sql`SELECT c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_id AS exchange_code, o.is_buy, o.price_in_cents, sum(o.quantity - o.quantity_filled) AS total_quantity, min(o.created_at) AS oldest_order_time FROM "order" o JOIN company c ON o.company_id::text = c.company_id::text JOIN exchange e ON c.exchange_id::text = e.exchange_id::text WHERE o.status = 'active'::text GROUP BY c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_id, o.is_buy, o.price_in_cents ORDER BY c.company_id, o.is_buy DESC, o.price_in_cents DESC`);

export const current_market_price = pgView("current_market_price", {	company_id: varchar({ length: 10 }),
	ticker_symbol: varchar({ length: 10 }),
	exchange_id: varchar({ length: 10 }),
	exchange_code: varchar({ length: 10 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	bid_price: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ask_price: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	spread: bigint({ mode: "number" }),
	last_trade_time: timestamp({ mode: 'string' }),
}).as(sql`SELECT c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_id AS exchange_code, ( SELECT max("order".price_in_cents) AS max FROM "order" WHERE "order".company_id::text = c.company_id::text AND "order".is_buy = true AND "order".status = 'active'::text AND "order".quantity_open > 0) AS bid_price, ( SELECT min("order".price_in_cents) AS min FROM "order" WHERE "order".company_id::text = c.company_id::text AND "order".is_buy = false AND "order".status = 'active'::text AND "order".quantity_open > 0) AS ask_price, (( SELECT min("order".price_in_cents) AS min FROM "order" WHERE "order".company_id::text = c.company_id::text AND "order".is_buy = false AND "order".status = 'active'::text AND "order".quantity_open > 0)) - (( SELECT max("order".price_in_cents) AS max FROM "order" WHERE "order".company_id::text = c.company_id::text AND "order".is_buy = true AND "order".status = 'active'::text AND "order".quantity_open > 0)) AS spread, ( SELECT trade.executed_at FROM trade WHERE trade.company_id::text = c.company_id::text ORDER BY trade.executed_at DESC LIMIT 1) AS last_trade_time FROM company c JOIN exchange e ON c.exchange_id::text = e.exchange_id::text`);