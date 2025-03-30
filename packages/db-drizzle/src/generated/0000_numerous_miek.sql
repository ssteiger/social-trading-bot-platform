-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "bot" (
	"bot_id" serial PRIMARY KEY NOT NULL,
	"bot_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"background_story" text,
	"bot_character_description" text,
	"money_balance_in_cents" bigint DEFAULT 1000000000 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company" (
	"company_id" varchar(10) PRIMARY KEY NOT NULL,
	"creator_bot_id" integer NOT NULL,
	"exchange_id" varchar(10) NOT NULL,
	"company_name" varchar(100) NOT NULL,
	"ticker_symbol" varchar(10) NOT NULL,
	"total_shares" bigint NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_exchange_id_ticker_symbol_key" UNIQUE("exchange_id","ticker_symbol"),
	CONSTRAINT "company_id_equals_ticker" CHECK ((company_id)::text = (ticker_symbol)::text)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exchange" (
	"exchange_id" varchar(10) PRIMARY KEY NOT NULL,
	"exchange_name" varchar(100) NOT NULL,
	"exchange_code" varchar(10) NOT NULL,
	"trading_fee_percent" numeric(5, 2) DEFAULT '0.1' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exchange_exchange_code_key" UNIQUE("exchange_code"),
	CONSTRAINT "exchange_id_equals_code" CHECK ((exchange_id)::text = (exchange_code)::text)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shareholding" (
	"shareholding_id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"company_id" varchar(10) NOT NULL,
	"shares" bigint DEFAULT 0 NOT NULL,
	"average_purchase_price_in_cents" bigint,
	"last_updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shareholding_bot_id_company_id_key" UNIQUE("bot_id","company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order" (
	"order_id" serial PRIMARY KEY NOT NULL,
	"bot_id" integer NOT NULL,
	"company_id" varchar(10) NOT NULL,
	"order_type" text NOT NULL,
	"is_buy" boolean NOT NULL,
	"price_in_cents" bigint NOT NULL,
	"quantity" bigint NOT NULL,
	"quantity_filled" bigint DEFAULT 0 NOT NULL,
	"quantity_open" bigint GENERATED ALWAYS AS ((quantity - quantity_filled)) STORED,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"last_updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_type" (
	"order_type" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_status" (
	"order_status" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trade" (
	"trade_id" serial PRIMARY KEY NOT NULL,
	"exchange_id" varchar(10) NOT NULL,
	"company_id" varchar(10) NOT NULL,
	"buy_order_id" integer NOT NULL,
	"sell_order_id" integer NOT NULL,
	"buyer_bot_id" integer NOT NULL,
	"seller_bot_id" integer NOT NULL,
	"price_in_cents" bigint NOT NULL,
	"quantity" bigint NOT NULL,
	"trade_fee_in_cents" bigint NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "price_history" (
	"history_id" serial PRIMARY KEY NOT NULL,
	"company_id" varchar(10) NOT NULL,
	"exchange_id" varchar(10) NOT NULL,
	"open_price_in_cents" bigint NOT NULL,
	"close_price_in_cents" bigint NOT NULL,
	"high_price_in_cents" bigint NOT NULL,
	"low_price_in_cents" bigint NOT NULL,
	"volume" bigint NOT NULL,
	"timestamp" timestamp NOT NULL,
	"period_length" varchar(20) NOT NULL,
	CONSTRAINT "price_history_company_id_timestamp_period_length_key" UNIQUE("company_id","timestamp","period_length")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company" ADD CONSTRAINT "company_creator_bot_id_fkey" FOREIGN KEY ("creator_bot_id") REFERENCES "public"."bot"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company" ADD CONSTRAINT "company_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchange"("exchange_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shareholding" ADD CONSTRAINT "shareholding_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "public"."bot"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "shareholding" ADD CONSTRAINT "shareholding_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("company_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order" ADD CONSTRAINT "order_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "public"."bot"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order" ADD CONSTRAINT "order_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("company_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order" ADD CONSTRAINT "order_order_type_fkey" FOREIGN KEY ("order_type") REFERENCES "public"."order_type"("order_type") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order" ADD CONSTRAINT "order_status_fkey" FOREIGN KEY ("status") REFERENCES "public"."order_status"("order_status") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trade" ADD CONSTRAINT "trade_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchange"("exchange_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trade" ADD CONSTRAINT "trade_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("company_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trade" ADD CONSTRAINT "trade_buy_order_id_fkey" FOREIGN KEY ("buy_order_id") REFERENCES "public"."order"("order_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trade" ADD CONSTRAINT "trade_sell_order_id_fkey" FOREIGN KEY ("sell_order_id") REFERENCES "public"."order"("order_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trade" ADD CONSTRAINT "trade_buyer_bot_id_fkey" FOREIGN KEY ("buyer_bot_id") REFERENCES "public"."bot"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trade" ADD CONSTRAINT "trade_seller_bot_id_fkey" FOREIGN KEY ("seller_bot_id") REFERENCES "public"."bot"("bot_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_history" ADD CONSTRAINT "price_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("company_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "price_history" ADD CONSTRAINT "price_history_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "public"."exchange"("exchange_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_shareholding_bot_id" ON "shareholding" USING btree ("bot_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_bot_id" ON "order" USING btree ("bot_id" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_company_id" ON "order" USING btree ("company_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "order" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trade_company_id" ON "trade" USING btree ("company_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trade_executed_at" ON "trade" USING btree ("executed_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_price_history_company_timestamp" ON "price_history" USING btree ("company_id" timestamp_ops,"timestamp" timestamp_ops);--> statement-breakpoint
CREATE VIEW "public"."order_book" AS (SELECT c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_id AS exchange_code, o.is_buy, o.price_in_cents, sum(o.quantity - o.quantity_filled) AS total_quantity, min(o.created_at) AS oldest_order_time FROM "order" o JOIN company c ON o.company_id::text = c.company_id::text JOIN exchange e ON c.exchange_id::text = e.exchange_id::text WHERE o.status = 'active'::text GROUP BY c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_id, o.is_buy, o.price_in_cents ORDER BY c.company_id, o.is_buy DESC, o.price_in_cents DESC);--> statement-breakpoint
CREATE VIEW "public"."current_market_price" AS (SELECT c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_id AS exchange_code, ( SELECT max("order".price_in_cents) AS max FROM "order" WHERE "order".company_id::text = c.company_id::text AND "order".is_buy = true AND "order".status = 'active'::text AND "order".quantity_open > 0) AS bid_price, ( SELECT min("order".price_in_cents) AS min FROM "order" WHERE "order".company_id::text = c.company_id::text AND "order".is_buy = false AND "order".status = 'active'::text AND "order".quantity_open > 0) AS ask_price, (( SELECT min("order".price_in_cents) AS min FROM "order" WHERE "order".company_id::text = c.company_id::text AND "order".is_buy = false AND "order".status = 'active'::text AND "order".quantity_open > 0)) - (( SELECT max("order".price_in_cents) AS max FROM "order" WHERE "order".company_id::text = c.company_id::text AND "order".is_buy = true AND "order".status = 'active'::text AND "order".quantity_open > 0)) AS spread, ( SELECT trade.executed_at FROM trade WHERE trade.company_id::text = c.company_id::text ORDER BY trade.executed_at DESC LIMIT 1) AS last_trade_time FROM company c JOIN exchange e ON c.exchange_id::text = e.exchange_id::text);
*/