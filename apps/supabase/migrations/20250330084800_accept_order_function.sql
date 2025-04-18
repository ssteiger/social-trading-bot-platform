-- Create a function to handle accepting an order as a transaction
CREATE OR REPLACE FUNCTION public.accept_order(
  accepting_bot_id INTEGER,
  target_order_id INTEGER,
  trade_quantity BIGINT,
  trade_fee_in_cents BIGINT
) RETURNS VOID AS $$
DECLARE
  order_record RECORD;
  company_id_var VARCHAR(10);
  exchange_id_var VARCHAR(10);
  is_buy BOOLEAN;
  price_in_cents BIGINT;
  creator_bot_id INTEGER;
  completed_status TEXT;
  partial_status TEXT;
  new_trade_id INTEGER;
  complementary_order_id INTEGER;
BEGIN
  -- Get the order details
  SELECT o.order_id, o.bot_id, o.company_id, o.is_buy, o.price_in_cents, o.quantity, o.quantity_filled,
         c.exchange_id
  INTO order_record
  FROM "order" o
  JOIN company c ON o.company_id = c.company_id
  WHERE o.order_id = target_order_id;
  
  -- Store values in variables for easier access
  company_id_var := order_record.company_id;
  exchange_id_var := order_record.exchange_id;
  is_buy := order_record.is_buy;
  price_in_cents := order_record.price_in_cents;
  creator_bot_id := order_record.bot_id;
  
  completed_status := 'filled';
  partial_status := 'partially_filled';
  
  -- Create a complementary order for the accepting bot
  INSERT INTO "order" (
    bot_id,
    company_id,
    order_type,
    is_buy,
    price_in_cents,
    quantity,
    quantity_filled,
    status,
    created_at,
    last_updated_at
  ) VALUES (
    accepting_bot_id,
    company_id_var,
    'market',
    NOT is_buy,
    price_in_cents,
    trade_quantity,
    trade_quantity,
    completed_status,
    NOW(),
    NOW()
  )
  RETURNING order_id INTO complementary_order_id;
  
  -- Create the trade record
  INSERT INTO trade (
    buy_order_id,
    sell_order_id,
    buyer_bot_id,
    seller_bot_id,
    company_id,
    exchange_id,
    price_in_cents,
    quantity,
    trade_fee_in_cents,
    executed_at
  ) VALUES (
    CASE WHEN is_buy THEN target_order_id ELSE complementary_order_id END,
    CASE WHEN is_buy THEN complementary_order_id ELSE target_order_id END,
    CASE WHEN is_buy THEN creator_bot_id ELSE accepting_bot_id END,
    CASE WHEN is_buy THEN accepting_bot_id ELSE creator_bot_id END,
    company_id_var,
    exchange_id_var,
    price_in_cents,
    trade_quantity,
    trade_fee_in_cents,
    NOW()
  )
  RETURNING trade_id INTO new_trade_id;
  
  -- Update the order's quantity_filled and status
  UPDATE "order"
  SET quantity_filled = quantity_filled + trade_quantity,
      status = CASE 
                WHEN (quantity_filled + trade_quantity) >= quantity THEN completed_status
                ELSE partial_status
               END,
      last_updated_at = NOW()
  WHERE order_id = target_order_id;
  
  -- Update bot money balances
  IF is_buy THEN
    -- Creator is buying, deduct money
    UPDATE bot
    SET money_balance_in_cents = money_balance_in_cents - (price_in_cents * trade_quantity) - trade_fee_in_cents,
        last_active_at = NOW()
    WHERE bot_id = creator_bot_id;
    
    -- Accepting bot is selling, add money
    UPDATE bot
    SET money_balance_in_cents = money_balance_in_cents + (price_in_cents * trade_quantity) - trade_fee_in_cents,
        last_active_at = NOW()
    WHERE bot_id = accepting_bot_id;
  ELSE
    -- Creator is selling, add money
    UPDATE bot
    SET money_balance_in_cents = money_balance_in_cents + (price_in_cents * trade_quantity) - trade_fee_in_cents,
        last_active_at = NOW()
    WHERE bot_id = creator_bot_id;
    
    -- Accepting bot is buying, deduct money
    UPDATE bot
    SET money_balance_in_cents = money_balance_in_cents - (price_in_cents * trade_quantity) - trade_fee_in_cents,
        last_active_at = NOW()
    WHERE bot_id = accepting_bot_id;
  END IF;
  
  -- Update shareholdings for the creator bot
  IF is_buy THEN
    -- Creator is buying, increase their shares
    UPDATE shareholding sh
    SET shares = sh.shares + trade_quantity,
        last_updated_at = NOW(),
        average_purchase_price_in_cents = (sh.average_purchase_price_in_cents * sh.shares + price_in_cents * trade_quantity) / (sh.shares + trade_quantity)
    WHERE sh.bot_id = creator_bot_id AND sh.company_id = company_id_var;
    
    -- If no existing shareholding, create one
    IF NOT FOUND THEN
      INSERT INTO shareholding (bot_id, company_id, shares, average_purchase_price_in_cents, last_updated_at)
      VALUES (creator_bot_id, company_id_var, trade_quantity, price_in_cents, NOW());
    END IF;
    
    -- Accepting bot is selling, decrease their shares
    UPDATE shareholding sh
    SET shares = sh.shares - trade_quantity,
        last_updated_at = NOW()
    WHERE sh.bot_id = accepting_bot_id AND sh.company_id = company_id_var;
  ELSE
    -- Creator is selling, decrease their shares
    UPDATE shareholding sh
    SET shares = sh.shares - trade_quantity,
        last_updated_at = NOW()
    WHERE sh.bot_id = creator_bot_id AND sh.company_id = company_id_var;
    
    -- Accepting bot is buying, increase their shares
    UPDATE shareholding sh
    SET shares = sh.shares + trade_quantity,
        last_updated_at = NOW(),
        average_purchase_price_in_cents = (sh.average_purchase_price_in_cents * sh.shares + price_in_cents * trade_quantity) / (sh.shares + trade_quantity)
    WHERE sh.bot_id = accepting_bot_id AND sh.company_id = company_id_var;
    
    -- If no existing shareholding, create one
    IF NOT FOUND THEN
      INSERT INTO shareholding (bot_id, company_id, shares, average_purchase_price_in_cents, last_updated_at)
      VALUES (accepting_bot_id, company_id_var, trade_quantity, price_in_cents, NOW());
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;