-- Drop columns from bots table
ALTER TABLE bots DROP COLUMN api_key;
ALTER TABLE bots DROP COLUMN balance;

-- Need to modify the match_orders function since it references the balance column
CREATE OR REPLACE FUNCTION match_orders() RETURNS TRIGGER AS $$
DECLARE
    matching_order RECORD;
    trade_quantity BIGINT;
    trade_price DECIMAL(20, 2);
    active_status_id INTEGER;
    filled_status_id INTEGER;
    partially_filled_status_id INTEGER;
    exchange_record RECORD;
    trade_fee DECIMAL(20, 2);
BEGIN
    -- Get status IDs
    SELECT status_id INTO active_status_id FROM order_statuses WHERE status_name = 'active';
    SELECT status_id INTO filled_status_id FROM order_statuses WHERE status_name = 'filled';
    SELECT status_id INTO partially_filled_status_id FROM order_statuses WHERE status_name = 'partially_filled';
    
    -- Set initial status to active if new order
    IF TG_OP = 'INSERT' THEN
        NEW.status_id = active_status_id;
    END IF;
    
    -- Only process active orders
    IF NEW.status_id <> active_status_id THEN
        RETURN NEW;
    END IF;
    
    -- Get exchange information for fee calculation
    SELECT e.* INTO exchange_record
    FROM companies c
    JOIN exchanges e ON c.exchange_id = e.exchange_id
    WHERE c.company_id = NEW.company_id;
    
    -- Look for matching orders
    -- For buy orders, look for sell orders with price <= buy price
    -- For sell orders, look for buy orders with price >= sell price
    IF NEW.is_buy THEN
        FOR matching_order IN 
            SELECT * FROM orders
            WHERE company_id = NEW.company_id
              AND is_buy = FALSE
              AND price <= NEW.price
              AND status_id = active_status_id
              AND bot_id <> NEW.bot_id
              AND (quantity - quantity_filled) > 0
            ORDER BY price ASC, created_at ASC
        LOOP
            -- Determine quantity and price for this match
            trade_quantity := LEAST(NEW.quantity - NEW.quantity_filled, matching_order.quantity - matching_order.quantity_filled);
            trade_price := matching_order.price; -- Use the price from the existing order
            
            -- Calculate the trading fee
            trade_fee := trade_price * trade_quantity * (exchange_record.trading_fee_percent / 100.0);
            
            -- Create a trade record
            INSERT INTO trades (
                exchange_id, company_id, buy_order_id, sell_order_id, 
                buyer_bot_id, seller_bot_id, price, quantity, trade_fee
            ) VALUES (
                exchange_record.exchange_id, NEW.company_id, NEW.order_id, matching_order.order_id,
                NEW.bot_id, matching_order.bot_id, trade_price, trade_quantity, trade_fee
            );
            
            -- Update the matched order
            UPDATE orders
            SET quantity_filled = quantity_filled + trade_quantity,
                status_id = CASE 
                                WHEN quantity_filled + trade_quantity >= quantity THEN filled_status_id
                                ELSE partially_filled_status_id
                            END,
                last_updated_at = NOW()
            WHERE order_id = matching_order.order_id;
            
            -- Update the current order
            NEW.quantity_filled := NEW.quantity_filled + trade_quantity;
            
            -- Update bot last active time (removed balance updates)
            UPDATE bots
            SET last_active_at = NOW()
            WHERE bot_id = NEW.bot_id;
            
            UPDATE bots
            SET last_active_at = NOW()
            WHERE bot_id = matching_order.bot_id;
            
            -- Update shareholdings
            -- Add shares to buyer's holding
            INSERT INTO shareholdings (bot_id, company_id, shares, average_purchase_price)
            VALUES (NEW.bot_id, NEW.company_id, trade_quantity, trade_price)
            ON CONFLICT (bot_id, company_id) DO UPDATE
            SET shares = shareholdings.shares + trade_quantity,
                average_purchase_price = (shareholdings.average_purchase_price * shareholdings.shares + trade_price * trade_quantity) / (shareholdings.shares + trade_quantity),
                last_updated_at = NOW();
            
            -- Reduce shares from seller's holding
            UPDATE shareholdings
            SET shares = shares - trade_quantity,
                last_updated_at = NOW()
            WHERE bot_id = matching_order.bot_id AND company_id = NEW.company_id;
            
            -- Stop if the order is fully filled
            IF NEW.quantity_filled >= NEW.quantity THEN
                NEW.status_id := filled_status_id;
                EXIT;
            END IF;
        END LOOP;
    ELSE -- This is a sell order
        FOR matching_order IN 
            SELECT * FROM orders
            WHERE company_id = NEW.company_id
              AND is_buy = TRUE
              AND price >= NEW.price
              AND status_id = active_status_id
              AND bot_id <> NEW.bot_id
              AND (quantity - quantity_filled) > 0
            ORDER BY price DESC, created_at ASC
        LOOP
            -- Determine quantity and price for this match
            trade_quantity := LEAST(NEW.quantity - NEW.quantity_filled, matching_order.quantity - matching_order.quantity_filled);
            trade_price := matching_order.price; -- Use the price from the existing order
            
            -- Calculate the trading fee
            trade_fee := trade_price * trade_quantity * (exchange_record.trading_fee_percent / 100.0);
            
            -- Create a trade record
            INSERT INTO trades (
                exchange_id, company_id, buy_order_id, sell_order_id, 
                buyer_bot_id, seller_bot_id, price, quantity, trade_fee
            ) VALUES (
                exchange_record.exchange_id, NEW.company_id, matching_order.order_id, NEW.order_id,
                matching_order.bot_id, NEW.bot_id, trade_price, trade_quantity, trade_fee
            );
            
            -- Update the matched order
            UPDATE orders
            SET quantity_filled = quantity_filled + trade_quantity,
                status_id = CASE 
                                WHEN quantity_filled + trade_quantity >= quantity THEN filled_status_id
                                ELSE partially_filled_status_id
                            END,
                last_updated_at = NOW()
            WHERE order_id = matching_order.order_id;
            
            -- Update the current order
            NEW.quantity_filled := NEW.quantity_filled + trade_quantity;
            
            -- Update bot last active time (removed balance updates)
            UPDATE bots
            SET last_active_at = NOW()
            WHERE bot_id = matching_order.bot_id;
            
            UPDATE bots
            SET last_active_at = NOW()
            WHERE bot_id = NEW.bot_id;
            
            -- Update shareholdings
            -- Add shares to buyer's holding
            INSERT INTO shareholdings (bot_id, company_id, shares, average_purchase_price)
            VALUES (matching_order.bot_id, NEW.company_id, trade_quantity, trade_price)
            ON CONFLICT (bot_id, company_id) DO UPDATE
            SET shares = shareholdings.shares + trade_quantity,
                average_purchase_price = (shareholdings.average_purchase_price * shareholdings.shares + trade_price * trade_quantity) / (shareholdings.shares + trade_quantity),
                last_updated_at = NOW();
            
            -- Reduce shares from seller's holding
            UPDATE shareholdings
            SET shares = shares - trade_quantity,
                last_updated_at = NOW()
            WHERE bot_id = NEW.bot_id AND company_id = NEW.company_id;
            
            -- Stop if the order is fully filled
            IF NEW.quantity_filled >= NEW.quantity THEN
                NEW.status_id := filled_status_id;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    -- If we've started filling the order but not completely, mark as partially filled
    IF NEW.quantity_filled > 0 AND NEW.quantity_filled < NEW.quantity THEN
        NEW.status_id := partially_filled_status_id;
    END IF;
    
    -- Update the last_updated_at field
    NEW.last_updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
