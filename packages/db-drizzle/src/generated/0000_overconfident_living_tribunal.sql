-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "companies" (
	"company_id" serial PRIMARY KEY NOT NULL,
	"creator_bot_id" integer NOT NULL,
	"exchange_id" integer NOT NULL,
	"company_name" varchar(100) NOT NULL,
	"ticker_symbol" varchar(10) NOT NULL,
	"total_shares" bigint NOT NULL,
	"initial_price" numeric(20, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_exchange_id_ticker_symbol_key" UNIQUE("exchange_id","ticker_symbol")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exchanges" (
	"exchange_id" serial PRIMARY KEY NOT NULL,
	"exchange_name" varchar(100) NOT NULL,
	"exchange_code" varchar(10) NOT NULL,
	"trading_fee_percent" numeric(5, 2) DEFAULT '0.1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exchanges_exchange_code_key" UNIQUE("exchange_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shareholdings" (
	"shareholding_id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"shares" bigint DEFAULT 0 NOT NULL,
	"average_purchase_price" numeric(20, 2),
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shareholdings_bot_id_company_id_key" UNIQUE("bot_id","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"order_id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"order_type_id" integer NOT NULL,
	"is_buy" boolean NOT NULL,
	"price" numeric(20, 2) NOT NULL,
	"quantity" bigint NOT NULL,
	"quantity_filled" bigint DEFAULT 0 NOT NULL,
	"status_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_types" (
	"order_type_id" serial PRIMARY KEY NOT NULL,
	"type_name" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "order_types_type_name_key" UNIQUE("type_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_statuses" (
	"status_id" serial PRIMARY KEY NOT NULL,
	"status_name" varchar(50) NOT NULL,
	"description" text,
	CONSTRAINT "order_statuses_status_name_key" UNIQUE("status_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trades" (
	"trade_id" serial PRIMARY KEY NOT NULL,
	"exchange_id" integer NOT NULL,
	"company_id" integer NOT NULL,
	"buy_order_id" integer NOT NULL,
	"sell_order_id" integer NOT NULL,
	"buyer_bot_id" integer NOT NULL,
	"seller_bot_id" integer NOT NULL,
	"price" numeric(20, 2) NOT NULL,
	"quantity" bigint NOT NULL,
	"trade_fee" numeric(20, 2) NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"exchange_id" integer NOT NULL,
	"open_price" numeric(20, 2) NOT NULL,
	"close_price" numeric(20, 2) NOT NULL,
	"high_price" numeric(20, 2) NOT NULL,
	"low_price" numeric(20, 2) NOT NULL,
	"volume" bigint NOT NULL,
	"timestamp" timestamp NOT NULL,
	"period_length" varchar(20) NOT NULL,
	CONSTRAINT "price_history_company_id_timestamp_period_length_key" UNIQUE("company_id","timestamp","period_length")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bots" (
	"bot_id" serial PRIMARY KEY NOT NULL,
	"bot_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"background_story" text,
	"bot_character_description" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companies" ADD CONSTRAINT "companies_creator_bot_id_fkey" FOREIGN KEY ("creator_bot_id") REFERENCES "public"."bots"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companies" ADD CONSTRAINT "companies_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("exchange_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shareholdings" ADD CONSTRAINT "shareholdings_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shareholdings" ADD CONSTRAINT "shareholdings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("company_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("company_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_order_type_id_fkey" FOREIGN KEY ("order_type_id") REFERENCES "public"."order_types"("order_type_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "public"."order_statuses"("status_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("exchange_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("company_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_buy_order_id_fkey" FOREIGN KEY ("buy_order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_sell_order_id_fkey" FOREIGN KEY ("sell_order_id") REFERENCES "public"."orders"("order_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_buyer_bot_id_fkey" FOREIGN KEY ("buyer_bot_id") REFERENCES "public"."bots"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trades" ADD CONSTRAINT "trades_seller_bot_id_fkey" FOREIGN KEY ("seller_bot_id") REFERENCES "public"."bots"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_history" ADD CONSTRAINT "price_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("company_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_history" ADD CONSTRAINT "price_history_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchanges"("exchange_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shareholdings_bot_id" ON "shareholdings" USING btree ("bot_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_bot_id" ON "orders" USING btree ("bot_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_company_id" ON "orders" USING btree ("company_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_status_id" ON "orders" USING btree ("status_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trades_company_id" ON "trades" USING btree ("company_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trades_executed_at" ON "trades" USING btree ("executed_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_price_history_company_timestamp" ON "price_history" USING btree ("company_id" int4_ops,"timestamp" timestamp_ops);--> statement-breakpoint
CREATE VIEW "public"."current_market_prices" AS (SELECT c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_code, t.price AS current_price, t.executed_at AS last_trade_time FROM companies c JOIN exchanges e ON c.exchange_id = e.exchange_id LEFT JOIN trades t ON c.company_id = t.company_id WHERE t.executed_at = (( SELECT max(trades.executed_at) AS max FROM trades WHERE trades.company_id = c.company_id)));--> statement-breakpoint
CREATE VIEW "public"."order_book" AS (SELECT c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_code, o.is_buy, o.price, sum(o.quantity - o.quantity_filled) AS total_quantity, min(o.created_at) AS oldest_order_time FROM orders o JOIN companies c ON o.company_id = c.company_id JOIN exchanges e ON c.exchange_id = e.exchange_id WHERE o.status_id = (( SELECT order_statuses.status_id FROM order_statuses WHERE order_statuses.status_name::text = 'active'::text)) GROUP BY c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_code, o.is_buy, o.price ORDER BY c.company_id, o.is_buy DESC, o.price DESC);
*/