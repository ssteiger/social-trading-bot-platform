import { pgTable, serial, varchar, timestamp, text, bigint, foreignKey, unique, integer, numeric, boolean, index, pgView } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const bots = pgTable("bots", {
	bot_id: serial().primaryKey().notNull(),
	bot_name: varchar({ length: 100 }).notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	last_active_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	background_story: text(),
	bot_character_description: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	money_balance_in_cents: bigint({ mode: "number" }).default(1000000000).notNull(),
});

export const companies = pgTable("companies", {
	company_id: serial().primaryKey().notNull(),
	creator_bot_id: integer().notNull(),
	exchange_id: integer().notNull(),
	company_name: varchar({ length: 100 }).notNull(),
	ticker_symbol: varchar({ length: 10 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	total_shares: bigint({ mode: "number" }).notNull(),
	description: text(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		companies_creator_bot_id_fkey: foreignKey({
			columns: [table.creator_bot_id],
			foreignColumns: [bots.bot_id],
			name: "companies_creator_bot_id_fkey"
		}),
		companies_exchange_id_fkey: foreignKey({
			columns: [table.exchange_id],
			foreignColumns: [exchanges.exchange_id],
			name: "companies_exchange_id_fkey"
		}),
		companies_exchange_id_ticker_symbol_key: unique("companies_exchange_id_ticker_symbol_key").on(table.exchange_id, table.ticker_symbol),
	}
});

export const exchanges = pgTable("exchanges", {
	exchange_id: serial().primaryKey().notNull(),
	exchange_name: varchar({ length: 100 }).notNull(),
	exchange_code: varchar({ length: 10 }).notNull(),
	trading_fee_percent: numeric({ precision: 5, scale:  2 }).default('0.1').notNull(),
	is_active: boolean().default(true).notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		exchanges_exchange_code_key: unique("exchanges_exchange_code_key").on(table.exchange_code),
	}
});

export const shareholdings = pgTable("shareholdings", {
	shareholding_id: serial().primaryKey().notNull(),
	bot_id: integer().notNull(),
	company_id: integer().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	shares: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	average_purchase_price_in_cents: bigint({ mode: "number" }),
	last_updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idx_shareholdings_bot_id: index("idx_shareholdings_bot_id").using("btree", table.bot_id.asc().nullsLast().op("int4_ops")),
		shareholdings_bot_id_fkey: foreignKey({
			columns: [table.bot_id],
			foreignColumns: [bots.bot_id],
			name: "shareholdings_bot_id_fkey"
		}),
		shareholdings_company_id_fkey: foreignKey({
			columns: [table.company_id],
			foreignColumns: [companies.company_id],
			name: "shareholdings_company_id_fkey"
		}),
		shareholdings_bot_id_company_id_key: unique("shareholdings_bot_id_company_id_key").on(table.bot_id, table.company_id),
	}
});

export const orders = pgTable("orders", {
	order_id: serial().primaryKey().notNull(),
	bot_id: integer().notNull(),
	company_id: integer().notNull(),
	order_type_id: integer().notNull(),
	is_buy: boolean().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	price_in_cents: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity: bigint({ mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity_filled: bigint({ mode: "number" }).default(0).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	quantity_open: bigint({ mode: "number" }).generatedAlwaysAs(sql`(quantity - quantity_filled)`),
	status_id: integer().notNull(),
	created_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
	expires_at: timestamp({ mode: 'string' }),
	last_updated_at: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => {
	return {
		idx_orders_bot_id: index("idx_orders_bot_id").using("btree", table.bot_id.asc().nullsLast().op("int4_ops")),
		idx_orders_company_id: index("idx_orders_company_id").using("btree", table.company_id.asc().nullsLast().op("int4_ops")),
		idx_orders_status_id: index("idx_orders_status_id").using("btree", table.status_id.asc().nullsLast().op("int4_ops")),
		orders_bot_id_fkey: foreignKey({
			columns: [table.bot_id],
			foreignColumns: [bots.bot_id],
			name: "orders_bot_id_fkey"
		}),
		orders_company_id_fkey: foreignKey({
			columns: [table.company_id],
			foreignColumns: [companies.company_id],
			name: "orders_company_id_fkey"
		}),
		orders_order_type_id_fkey: foreignKey({
			columns: [table.order_type_id],
			foreignColumns: [order_types.order_type_id],
			name: "orders_order_type_id_fkey"
		}),
		orders_status_id_fkey: foreignKey({
			columns: [table.status_id],
			foreignColumns: [order_statuses.status_id],
			name: "orders_status_id_fkey"
		}),
	}
});

export const order_types = pgTable("order_types", {
	order_type_id: serial().primaryKey().notNull(),
	type_name: varchar({ length: 50 }).notNull(),
	description: text(),
}, (table) => {
	return {
		order_types_type_name_key: unique("order_types_type_name_key").on(table.type_name),
	}
});

export const order_statuses = pgTable("order_statuses", {
	status_id: serial().primaryKey().notNull(),
	status_name: varchar({ length: 50 }).notNull(),
	description: text(),
}, (table) => {
	return {
		order_statuses_status_name_key: unique("order_statuses_status_name_key").on(table.status_name),
	}
});

export const trades = pgTable("trades", {
	trade_id: serial().primaryKey().notNull(),
	exchange_id: integer().notNull(),
	company_id: integer().notNull(),
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
		idx_trades_company_id: index("idx_trades_company_id").using("btree", table.company_id.asc().nullsLast().op("int4_ops")),
		idx_trades_executed_at: index("idx_trades_executed_at").using("btree", table.executed_at.asc().nullsLast().op("timestamp_ops")),
		trades_exchange_id_fkey: foreignKey({
			columns: [table.exchange_id],
			foreignColumns: [exchanges.exchange_id],
			name: "trades_exchange_id_fkey"
		}),
		trades_company_id_fkey: foreignKey({
			columns: [table.company_id],
			foreignColumns: [companies.company_id],
			name: "trades_company_id_fkey"
		}),
		trades_buy_order_id_fkey: foreignKey({
			columns: [table.buy_order_id],
			foreignColumns: [orders.order_id],
			name: "trades_buy_order_id_fkey"
		}),
		trades_sell_order_id_fkey: foreignKey({
			columns: [table.sell_order_id],
			foreignColumns: [orders.order_id],
			name: "trades_sell_order_id_fkey"
		}),
		trades_buyer_bot_id_fkey: foreignKey({
			columns: [table.buyer_bot_id],
			foreignColumns: [bots.bot_id],
			name: "trades_buyer_bot_id_fkey"
		}),
		trades_seller_bot_id_fkey: foreignKey({
			columns: [table.seller_bot_id],
			foreignColumns: [bots.bot_id],
			name: "trades_seller_bot_id_fkey"
		}),
	}
});

export const price_history = pgTable("price_history", {
	history_id: serial().primaryKey().notNull(),
	company_id: integer().notNull(),
	exchange_id: integer().notNull(),
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
		idx_price_history_company_timestamp: index("idx_price_history_company_timestamp").using("btree", table.company_id.asc().nullsLast().op("int4_ops"), table.timestamp.asc().nullsLast().op("timestamp_ops")),
		price_history_company_id_fkey: foreignKey({
			columns: [table.company_id],
			foreignColumns: [companies.company_id],
			name: "price_history_company_id_fkey"
		}),
		price_history_exchange_id_fkey: foreignKey({
			columns: [table.exchange_id],
			foreignColumns: [exchanges.exchange_id],
			name: "price_history_exchange_id_fkey"
		}),
		price_history_company_id_timestamp_period_length_key: unique("price_history_company_id_timestamp_period_length_key").on(table.company_id, table.timestamp, table.period_length),
	}
});
export const current_market_prices = pgView("current_market_prices", {	company_id: integer(),
	ticker_symbol: varchar({ length: 10 }),
	exchange_id: integer(),
	exchange_code: varchar({ length: 10 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	current_price_in_cents: bigint({ mode: "number" }),
	last_trade_time: timestamp({ mode: 'string' }),
}).as(sql`SELECT c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_code, t.price_in_cents AS current_price_in_cents, t.executed_at AS last_trade_time FROM companies c JOIN exchanges e ON c.exchange_id = e.exchange_id LEFT JOIN trades t ON c.company_id = t.company_id WHERE t.executed_at = (( SELECT max(trades.executed_at) AS max FROM trades WHERE trades.company_id = c.company_id))`);

export const order_book = pgView("order_book", {	company_id: integer(),
	ticker_symbol: varchar({ length: 10 }),
	exchange_id: integer(),
	exchange_code: varchar({ length: 10 }),
	is_buy: boolean(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	price_in_cents: bigint({ mode: "number" }),
	total_quantity: numeric(),
	oldest_order_time: timestamp({ mode: 'string' }),
}).as(sql`SELECT c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_code, o.is_buy, o.price_in_cents, sum(o.quantity - o.quantity_filled) AS total_quantity, min(o.created_at) AS oldest_order_time FROM orders o JOIN companies c ON o.company_id = c.company_id JOIN exchanges e ON c.exchange_id = e.exchange_id WHERE o.status_id = (( SELECT order_statuses.status_id FROM order_statuses WHERE order_statuses.status_name::text = 'active'::text)) GROUP BY c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_code, o.is_buy, o.price_in_cents ORDER BY c.company_id, o.is_buy DESC, o.price_in_cents DESC`);