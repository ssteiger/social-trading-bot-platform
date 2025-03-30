-- Create table for bots (trading agents)
CREATE TABLE bot (
    bot_id SERIAL PRIMARY KEY,
    bot_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMP NOT NULL DEFAULT NOW(),
    background_story TEXT,
    bot_character_description TEXT,
    money_balance_in_cents BIGINT NOT NULL DEFAULT 1000000000 -- Default 10 million dollars (1 billion cents)
);

-- Add comment explaining the purpose of these fields
COMMENT ON COLUMN bot.background_story IS 'Detailed backstory for the trading bot character';
COMMENT ON COLUMN bot.bot_character_description IS 'Brief description of the bots character traits and trading style';
COMMENT ON COLUMN bot.money_balance_in_cents IS 'The bot''s available cash balance in cents for trading';

-- Create table for stock exchanges
CREATE TABLE exchange (
    exchange_id VARCHAR(10) PRIMARY KEY,
    exchange_name VARCHAR(100) NOT NULL,
    exchange_code VARCHAR(10) NOT NULL UNIQUE,
    trading_fee_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT exchange_id_equals_code CHECK (exchange_id = exchange_code)
);

-- Create table for companies (stocks)
CREATE TABLE company (
    company_id VARCHAR(10) PRIMARY KEY,
    creator_bot_id INTEGER NOT NULL REFERENCES bot(bot_id),
    exchange_id VARCHAR(10) NOT NULL REFERENCES exchange(exchange_id),
    company_name VARCHAR(100) NOT NULL,
    ticker_symbol VARCHAR(10) NOT NULL,
    total_shares BIGINT NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(exchange_id, ticker_symbol),
    CONSTRAINT company_id_equals_ticker CHECK (company_id = ticker_symbol)
);

-- Create table for bot shareholdings
CREATE TABLE shareholding (
    shareholding_id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES bot(bot_id),
    company_id VARCHAR(10) NOT NULL REFERENCES company(company_id),
    shares BIGINT NOT NULL DEFAULT 0,
    average_purchase_price_in_cents BIGINT,
    last_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(bot_id, company_id)
);

-- Create table for order types instead of enum
CREATE TABLE public.order_type (
    order_type text NOT NULL PRIMARY KEY
);

-- Insert order type values
INSERT INTO public.order_type (order_type) VALUES 
    ('market'),
    ('limit'),
    ('stop');

-- Create table for order statuses instead of enum
CREATE TABLE public.order_status (
    order_status text NOT NULL PRIMARY KEY
);

-- Insert order status values
INSERT INTO public.order_status (order_status) VALUES 
    ('pending'),
    ('active'),
    ('filled'),
    ('partially_filled'),
    ('cancelled'),
    ('expired');

-- Update the order table to use the new tables instead of enums
CREATE TABLE "order" (
    order_id SERIAL PRIMARY KEY,
    bot_id INTEGER NOT NULL REFERENCES bot(bot_id),
    company_id VARCHAR(10) NOT NULL REFERENCES company(company_id),
    order_type text NOT NULL REFERENCES public.order_type(order_type),
    is_buy BOOLEAN NOT NULL,
    price_in_cents BIGINT NOT NULL,
    quantity BIGINT NOT NULL,
    quantity_filled BIGINT NOT NULL DEFAULT 0,
    quantity_open BIGINT GENERATED ALWAYS AS (quantity - quantity_filled) STORED,
    status text NOT NULL DEFAULT 'pending' REFERENCES public.order_status(order_status),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    last_updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create table for trades (executed orders)
CREATE TABLE trade (
    trade_id SERIAL PRIMARY KEY,
    exchange_id VARCHAR(10) NOT NULL REFERENCES exchange(exchange_id),
    company_id VARCHAR(10) NOT NULL REFERENCES company(company_id),
    buy_order_id INTEGER NOT NULL REFERENCES "order"(order_id),
    sell_order_id INTEGER NOT NULL REFERENCES "order"(order_id),
    buyer_bot_id INTEGER NOT NULL REFERENCES bot(bot_id),
    seller_bot_id INTEGER NOT NULL REFERENCES bot(bot_id),
    price_in_cents BIGINT NOT NULL,
    quantity BIGINT NOT NULL,
    trade_fee_in_cents BIGINT NOT NULL,
    executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create table for price history
CREATE TABLE price_history (
    history_id SERIAL PRIMARY KEY,
    company_id VARCHAR(10) NOT NULL REFERENCES company(company_id),
    exchange_id VARCHAR(10) NOT NULL REFERENCES exchange(exchange_id),
    open_price_in_cents BIGINT NOT NULL,
    close_price_in_cents BIGINT NOT NULL,
    high_price_in_cents BIGINT NOT NULL,
    low_price_in_cents BIGINT NOT NULL,
    volume BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    period_length VARCHAR(20) NOT NULL,  -- '1min', '5min', '1hour', '1day', etc.
    UNIQUE(company_id, timestamp, period_length)
);

-- Create indexes for performance
CREATE INDEX idx_order_bot_id ON "order"(bot_id);
CREATE INDEX idx_order_company_id ON "order"(company_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_trade_company_id ON trade(company_id);
CREATE INDEX idx_trade_executed_at ON trade(executed_at);
CREATE INDEX idx_shareholding_bot_id ON shareholding(bot_id);
CREATE INDEX idx_price_history_company_timestamp ON price_history(company_id, timestamp);

-- Update the order book view to use exchange_id instead of exchange_code
CREATE VIEW order_book AS
SELECT 
    c.company_id,
    c.ticker_symbol,
    c.exchange_id,
    e.exchange_id as exchange_code,
    o.is_buy,
    o.price_in_cents,
    SUM(o.quantity - o.quantity_filled) as total_quantity,
    MIN(o.created_at) as oldest_order_time
FROM 
    "order" o
JOIN 
    company c ON o.company_id = c.company_id
JOIN 
    exchange e ON c.exchange_id = e.exchange_id
WHERE 
    o.status = 'active'
GROUP BY 
    c.company_id, c.ticker_symbol, c.exchange_id, e.exchange_id, o.is_buy, o.price_in_cents
ORDER BY 
    c.company_id, o.is_buy DESC, o.price_in_cents DESC;

-- Update the current_market_price view to use exchange_id instead of exchange_code
CREATE VIEW current_market_price AS
SELECT 
    c.company_id,
    c.ticker_symbol,
    c.exchange_id,
    e.exchange_id as exchange_code,
    (
        SELECT MAX(price_in_cents)
        FROM "order"
        WHERE company_id = c.company_id
          AND is_buy = TRUE
          AND status = 'active'
          AND quantity_open > 0
    ) as bid_price,
    (
        SELECT MIN(price_in_cents)
        FROM "order"
        WHERE company_id = c.company_id
          AND is_buy = FALSE
          AND status = 'active'
          AND quantity_open > 0
    ) as ask_price,
    (
        SELECT MIN(price_in_cents)
        FROM "order"
        WHERE company_id = c.company_id
          AND is_buy = FALSE
          AND status = 'active'
          AND quantity_open > 0
    ) - (
        SELECT MAX(price_in_cents)
        FROM "order"
        WHERE company_id = c.company_id
          AND is_buy = TRUE
          AND status = 'active'
          AND quantity_open > 0
    ) as spread,
    (
        SELECT executed_at
        FROM trade
        WHERE company_id = c.company_id
        ORDER BY executed_at DESC
        LIMIT 1
    ) as last_trade_time
FROM 
    company c
JOIN 
    exchange e ON c.exchange_id = e.exchange_id;

-- Update the match_orders function to use the new enums
CREATE OR REPLACE FUNCTION match_orders() RETURNS TRIGGER AS $$
DECLARE
    matching_order RECORD;
    trade_quantity BIGINT;
    trade_price_in_cents BIGINT;
    exchange_record RECORD;
    trade_fee_in_cents BIGINT;
BEGIN
    -- Set initial status to active if new order
    IF TG_OP = 'INSERT' THEN
        NEW.status = 'active';
    END IF;
    
    -- Only process active orders
    IF NEW.status <> 'active' THEN
        RETURN NEW;
    END IF;
    
    -- Get exchange information for fee calculation
    SELECT e.* INTO exchange_record
    FROM company c
    JOIN exchange e ON c.exchange_id = e.exchange_id
    WHERE c.company_id = NEW.company_id;
    
    -- Look for matching orders
    -- For buy orders, look for sell orders with price <= buy price
    -- For sell orders, look for buy orders with price >= sell price
    IF NEW.is_buy THEN
        FOR matching_order IN 
            SELECT * FROM "order"
            WHERE company_id = NEW.company_id
              AND is_buy = FALSE
              AND price_in_cents <= NEW.price_in_cents
              AND status = 'active'
              AND bot_id <> NEW.bot_id
              AND (quantity - quantity_filled) > 0
            ORDER BY price_in_cents ASC, created_at ASC
        LOOP
            -- Determine quantity and price for this match
            trade_quantity := LEAST(NEW.quantity - NEW.quantity_filled, matching_order.quantity - matching_order.quantity_filled);
            trade_price_in_cents := matching_order.price_in_cents; -- Use the price from the existing order
            
            -- Calculate the trading fee
            trade_fee_in_cents := (trade_price_in_cents * trade_quantity * exchange_record.trading_fee_percent) / 100;
            
            -- Create a trade record
            INSERT INTO trade (
                exchange_id, company_id, buy_order_id, sell_order_id, 
                buyer_bot_id, seller_bot_id, price_in_cents, quantity, trade_fee_in_cents
            ) VALUES (
                exchange_record.exchange_id, NEW.company_id, NEW.order_id, matching_order.order_id,
                NEW.bot_id, matching_order.bot_id, trade_price_in_cents, trade_quantity, trade_fee_in_cents
            );
            
            -- Update the matched order
            UPDATE "order"
            SET quantity_filled = quantity_filled + trade_quantity,
                status = CASE 
                            WHEN quantity_filled + trade_quantity >= quantity THEN 'filled'
                            ELSE 'partially_filled'
                         END,
                last_updated_at = NOW()
            WHERE order_id = matching_order.order_id;
            
            -- Update the current order
            NEW.quantity_filled := NEW.quantity_filled + trade_quantity;
            
            -- Update bot last active time
            UPDATE bot
            SET last_active_at = NOW()
            WHERE bot_id = NEW.bot_id;
            
            UPDATE bot
            SET last_active_at = NOW()
            WHERE bot_id = matching_order.bot_id;
            
            -- Update bot money balances
            -- Deduct money from buyer (including fee)
            UPDATE bot
            SET money_balance_in_cents = money_balance_in_cents - (trade_price_in_cents * trade_quantity) - trade_fee_in_cents
            WHERE bot_id = NEW.bot_id;
            
            -- Add money to seller (minus fee)
            UPDATE bot
            SET money_balance_in_cents = money_balance_in_cents + (trade_price_in_cents * trade_quantity) - trade_fee_in_cents
            WHERE bot_id = matching_order.bot_id;
            
            -- Update shareholdings
            -- Add shares to buyer's holding
            INSERT INTO shareholding (bot_id, company_id, shares, average_purchase_price_in_cents)
            VALUES (NEW.bot_id, NEW.company_id, trade_quantity, trade_price_in_cents)
            ON CONFLICT (bot_id, company_id) DO UPDATE
            SET shares = shareholding.shares + trade_quantity,
                average_purchase_price_in_cents = (shareholding.average_purchase_price_in_cents * shareholding.shares + trade_price_in_cents * trade_quantity) / (shareholding.shares + trade_quantity),
                last_updated_at = NOW();
            
            -- Reduce shares from seller's holding
            UPDATE shareholding
            SET shares = shares - trade_quantity,
                last_updated_at = NOW()
            WHERE bot_id = matching_order.bot_id AND company_id = NEW.company_id;
            
            -- Stop if the order is fully filled
            IF NEW.quantity_filled >= NEW.quantity THEN
                NEW.status := 'filled';
                EXIT;
            END IF;
        END LOOP;
    ELSE -- This is a sell order
        FOR matching_order IN 
            SELECT * FROM "order"
            WHERE company_id = NEW.company_id
              AND is_buy = TRUE
              AND price_in_cents >= NEW.price_in_cents
              AND status = 'active'
              AND bot_id <> NEW.bot_id
              AND (quantity - quantity_filled) > 0
            ORDER BY price_in_cents DESC, created_at ASC
        LOOP
            -- Determine quantity and price for this match
            trade_quantity := LEAST(NEW.quantity - NEW.quantity_filled, matching_order.quantity - matching_order.quantity_filled);
            trade_price_in_cents := matching_order.price_in_cents; -- Use the price from the existing order
            
            -- Calculate the trading fee
            trade_fee_in_cents := (trade_price_in_cents * trade_quantity * exchange_record.trading_fee_percent) / 100;
            
            -- Create a trade record
            INSERT INTO trade (
                exchange_id, company_id, buy_order_id, sell_order_id, 
                buyer_bot_id, seller_bot_id, price_in_cents, quantity, trade_fee_in_cents
            ) VALUES (
                exchange_record.exchange_id, NEW.company_id, matching_order.order_id, NEW.order_id,
                matching_order.bot_id, NEW.bot_id, trade_price_in_cents, trade_quantity, trade_fee_in_cents
            );
            
            -- Update the matched order
            UPDATE "order"
            SET quantity_filled = quantity_filled + trade_quantity,
                status = CASE 
                            WHEN quantity_filled + trade_quantity >= quantity THEN 'filled'
                            ELSE 'partially_filled'
                         END,
                last_updated_at = NOW()
            WHERE order_id = matching_order.order_id;
            
            -- Update the current order
            NEW.quantity_filled := NEW.quantity_filled + trade_quantity;
            
            -- Update bot last active time
            UPDATE bot
            SET last_active_at = NOW()
            WHERE bot_id = matching_order.bot_id;
            
            UPDATE bot
            SET last_active_at = NOW()
            WHERE bot_id = NEW.bot_id;
            
            -- Update bot money balances
            -- Add money to seller (minus fee)
            UPDATE bot
            SET money_balance_in_cents = money_balance_in_cents + (trade_price_in_cents * trade_quantity) - trade_fee_in_cents
            WHERE bot_id = NEW.bot_id;
            
            -- Deduct money from buyer (including fee)
            UPDATE bot
            SET money_balance_in_cents = money_balance_in_cents - (trade_price_in_cents * trade_quantity) - trade_fee_in_cents
            WHERE bot_id = matching_order.bot_id;
            
            -- Update shareholdings
            -- Add shares to buyer's holding
            INSERT INTO shareholding (bot_id, company_id, shares, average_purchase_price_in_cents)
            VALUES (matching_order.bot_id, NEW.company_id, trade_quantity, trade_price_in_cents)
            ON CONFLICT (bot_id, company_id) DO UPDATE
            SET shares = shareholding.shares + trade_quantity,
                average_purchase_price_in_cents = (shareholding.average_purchase_price_in_cents * shareholding.shares + trade_price_in_cents * trade_quantity) / (shareholding.shares + trade_quantity),
                last_updated_at = NOW();
            
            -- Reduce shares from seller's holding
            UPDATE shareholding
            SET shares = shares - trade_quantity,
                last_updated_at = NOW()
            WHERE bot_id = NEW.bot_id AND company_id = NEW.company_id;
            
            -- Stop if the order is fully filled
            IF NEW.quantity_filled >= NEW.quantity THEN
                NEW.status := 'filled';
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    -- If we've started filling the order but not completely, mark as partially filled
    IF NEW.quantity_filled > 0 AND NEW.quantity_filled < NEW.quantity THEN
        NEW.status := 'partially_filled';
    END IF;
    
    -- Update the last_updated_at field
    NEW.last_updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to execute order matching when orders are inserted or updated
CREATE TRIGGER match_orders_on_insert
AFTER INSERT ON "order"
FOR EACH ROW
EXECUTE FUNCTION match_orders();

CREATE TRIGGER match_orders_on_update
AFTER UPDATE OF status, price_in_cents, quantity ON "order"
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR 
      OLD.price_in_cents IS DISTINCT FROM NEW.price_in_cents OR 
      OLD.quantity IS DISTINCT FROM NEW.quantity)
EXECUTE FUNCTION match_orders();

-- Create a function to update price history after trades
CREATE OR REPLACE FUNCTION update_price_history() RETURNS TRIGGER AS $$
DECLARE
    current_period TIMESTAMP;
    period_exists BOOLEAN;
    current_high_price_in_cents BIGINT;
    current_low_price_in_cents BIGINT;
    current_open_price_in_cents BIGINT;
    current_volume BIGINT;
BEGIN
    -- Round the timestamp to the nearest minute for 1-minute candles
    current_period := date_trunc('minute', NEW.executed_at);
    
    -- Check if we already have a record for this period
    SELECT EXISTS (
        SELECT 1 FROM price_history
        WHERE company_id = NEW.company_id
        AND timestamp = current_period
        AND period_length = '1min'
    ) INTO period_exists;
    
    IF period_exists THEN
        -- Update existing record
        -- Get current high and low
        SELECT ph.high_price_in_cents, ph.low_price_in_cents, ph.open_price_in_cents, ph.volume
        INTO current_high_price_in_cents, current_low_price_in_cents, current_open_price_in_cents, current_volume
        FROM price_history ph
        WHERE company_id = NEW.company_id
        AND timestamp = current_period
        AND period_length = '1min';
        
        -- Update record
        UPDATE price_history
        SET close_price_in_cents = NEW.price_in_cents,
            high_price_in_cents = GREATEST(current_high_price_in_cents, NEW.price_in_cents),
            low_price_in_cents = LEAST(current_low_price_in_cents, NEW.price_in_cents),
            volume = current_volume + NEW.quantity
        WHERE company_id = NEW.company_id
        AND timestamp = current_period
        AND period_length = '1min';
    ELSE
        -- Create a new record
        INSERT INTO price_history (
            company_id, exchange_id, open_price_in_cents, close_price_in_cents, 
            high_price_in_cents, low_price_in_cents, volume, timestamp, period_length
        ) VALUES (
            NEW.company_id, NEW.exchange_id, NEW.price_in_cents, NEW.price_in_cents,
            NEW.price_in_cents, NEW.price_in_cents, NEW.quantity, current_period, '1min'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update price history after trades
CREATE TRIGGER update_price_history_after_trade
AFTER INSERT ON trade
FOR EACH ROW
EXECUTE FUNCTION update_price_history();