import { relations } from "drizzle-orm/relations";
import { bots, companies, exchanges, shareholdings, orders, order_types, order_statuses, trades, price_history } from "./schema";

export const companiesRelations = relations(companies, ({one, many}) => ({
	bot: one(bots, {
		fields: [companies.creator_bot_id],
		references: [bots.bot_id]
	}),
	exchange: one(exchanges, {
		fields: [companies.exchange_id],
		references: [exchanges.exchange_id]
	}),
	shareholdings: many(shareholdings),
	orders: many(orders),
	trades: many(trades),
	price_histories: many(price_history),
}));

export const botsRelations = relations(bots, ({many}) => ({
	companies: many(companies),
	shareholdings: many(shareholdings),
	orders: many(orders),
	trades_buyer_bot_id: many(trades, {
		relationName: "trades_buyer_bot_id_bots_bot_id"
	}),
	trades_seller_bot_id: many(trades, {
		relationName: "trades_seller_bot_id_bots_bot_id"
	}),
}));

export const exchangesRelations = relations(exchanges, ({many}) => ({
	companies: many(companies),
	trades: many(trades),
	price_histories: many(price_history),
}));

export const shareholdingsRelations = relations(shareholdings, ({one}) => ({
	bot: one(bots, {
		fields: [shareholdings.bot_id],
		references: [bots.bot_id]
	}),
	company: one(companies, {
		fields: [shareholdings.company_id],
		references: [companies.company_id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	bot: one(bots, {
		fields: [orders.bot_id],
		references: [bots.bot_id]
	}),
	company: one(companies, {
		fields: [orders.company_id],
		references: [companies.company_id]
	}),
	order_type: one(order_types, {
		fields: [orders.order_type_id],
		references: [order_types.order_type_id]
	}),
	order_status: one(order_statuses, {
		fields: [orders.status_id],
		references: [order_statuses.status_id]
	}),
	trades_buy_order_id: many(trades, {
		relationName: "trades_buy_order_id_orders_order_id"
	}),
	trades_sell_order_id: many(trades, {
		relationName: "trades_sell_order_id_orders_order_id"
	}),
}));

export const order_typesRelations = relations(order_types, ({many}) => ({
	orders: many(orders),
}));

export const order_statusesRelations = relations(order_statuses, ({many}) => ({
	orders: many(orders),
}));

export const tradesRelations = relations(trades, ({one}) => ({
	exchange: one(exchanges, {
		fields: [trades.exchange_id],
		references: [exchanges.exchange_id]
	}),
	company: one(companies, {
		fields: [trades.company_id],
		references: [companies.company_id]
	}),
	order_buy_order_id: one(orders, {
		fields: [trades.buy_order_id],
		references: [orders.order_id],
		relationName: "trades_buy_order_id_orders_order_id"
	}),
	order_sell_order_id: one(orders, {
		fields: [trades.sell_order_id],
		references: [orders.order_id],
		relationName: "trades_sell_order_id_orders_order_id"
	}),
	bot_buyer_bot_id: one(bots, {
		fields: [trades.buyer_bot_id],
		references: [bots.bot_id],
		relationName: "trades_buyer_bot_id_bots_bot_id"
	}),
	bot_seller_bot_id: one(bots, {
		fields: [trades.seller_bot_id],
		references: [bots.bot_id],
		relationName: "trades_seller_bot_id_bots_bot_id"
	}),
}));

export const price_historyRelations = relations(price_history, ({one}) => ({
	company: one(companies, {
		fields: [price_history.company_id],
		references: [companies.company_id]
	}),
	exchange: one(exchanges, {
		fields: [price_history.exchange_id],
		references: [exchanges.exchange_id]
	}),
}));