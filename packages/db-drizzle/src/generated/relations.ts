import { relations } from "drizzle-orm/relations";
import { bot, company, exchange, shareholding, order, trade, price_history } from "./schema";

export const companyRelations = relations(company, ({one, many}) => ({
	bot: one(bot, {
		fields: [company.creator_bot_id],
		references: [bot.bot_id]
	}),
	exchange: one(exchange, {
		fields: [company.exchange_id],
		references: [exchange.exchange_id]
	}),
	shareholdings: many(shareholding),
	orders: many(order),
	trades: many(trade),
	price_histories: many(price_history),
}));

export const botRelations = relations(bot, ({many}) => ({
	companies: many(company),
	shareholdings: many(shareholding),
	orders: many(order),
	trades_buyer_bot_id: many(trade, {
		relationName: "trade_buyer_bot_id_bot_bot_id"
	}),
	trades_seller_bot_id: many(trade, {
		relationName: "trade_seller_bot_id_bot_bot_id"
	}),
}));

export const exchangeRelations = relations(exchange, ({many}) => ({
	companies: many(company),
	trades: many(trade),
	price_histories: many(price_history),
}));

export const shareholdingRelations = relations(shareholding, ({one}) => ({
	bot: one(bot, {
		fields: [shareholding.bot_id],
		references: [bot.bot_id]
	}),
	company: one(company, {
		fields: [shareholding.company_id],
		references: [company.company_id]
	}),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	bot: one(bot, {
		fields: [order.bot_id],
		references: [bot.bot_id]
	}),
	company: one(company, {
		fields: [order.company_id],
		references: [company.company_id]
	}),
	trades_buy_order_id: many(trade, {
		relationName: "trade_buy_order_id_order_order_id"
	}),
	trades_sell_order_id: many(trade, {
		relationName: "trade_sell_order_id_order_order_id"
	}),
}));

export const tradeRelations = relations(trade, ({one}) => ({
	exchange: one(exchange, {
		fields: [trade.exchange_id],
		references: [exchange.exchange_id]
	}),
	company: one(company, {
		fields: [trade.company_id],
		references: [company.company_id]
	}),
	order_buy_order_id: one(order, {
		fields: [trade.buy_order_id],
		references: [order.order_id],
		relationName: "trade_buy_order_id_order_order_id"
	}),
	order_sell_order_id: one(order, {
		fields: [trade.sell_order_id],
		references: [order.order_id],
		relationName: "trade_sell_order_id_order_order_id"
	}),
	bot_buyer_bot_id: one(bot, {
		fields: [trade.buyer_bot_id],
		references: [bot.bot_id],
		relationName: "trade_buyer_bot_id_bot_bot_id"
	}),
	bot_seller_bot_id: one(bot, {
		fields: [trade.seller_bot_id],
		references: [bot.bot_id],
		relationName: "trade_seller_bot_id_bot_bot_id"
	}),
}));

export const price_historyRelations = relations(price_history, ({one}) => ({
	company: one(company, {
		fields: [price_history.company_id],
		references: [company.company_id]
	}),
	exchange: one(exchange, {
		fields: [price_history.exchange_id],
		references: [exchange.exchange_id]
	}),
}));