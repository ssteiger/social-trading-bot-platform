-- Create a function to handle accepting an order as a transaction
CREATE OR REPLACE FUNCTION public.accept_order(
  p_accepting_bot_id INTEGER,
  p_order_id INTEGER,
  p_quantity BIGINT,
  p_trade_fee_in_cents BIGINT
) RETURNS VOID AS $$
DECLARE
  v_order RECORD;
  v_company_id VARCHAR(10);
  v_exchange_id VARCHAR(10);
  v_is_buy BOOLEAN;
  v_price_in_cents BIGINT;
  v_creator_bot_id INTEGER;
  v_completed_status TEXT;
  v_partial_status TEXT;
  v_trade_id INTEGER;
BEGIN
  -- Get the order details
  SELECT o.order_id, o.bot_id, o.company_id, o.is_buy, o.price_in_cents, o.quantity, o.quantity_filled,
         c.exchange_id
  INTO v_order
  FROM "order" o
  JOIN company c ON o.company_id = c.company_id
  WHERE o.order_id = p_order_id;
  
  -- Store values in variables for easier access
  v_company_id := v_order.company_id;
  v_exchange_id := v_order.exchange_id;
  v_is_buy := v_order.is_buy;
  v_price_in_cents := v_order.price_in_cents;
  v_creator_bot_id := v_order.bot_id;
  
  v_completed_status := 'filled';
  v_partial_status := 'partially_filled';
  
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
    CASE WHEN v_is_buy THEN p_order_id ELSE NULL END,
    CASE WHEN v_is_buy THEN NULL ELSE p_order_id END,
    CASE WHEN v_is_buy THEN v_creator_bot_id ELSE p_accepting_bot_id END,
    CASE WHEN v_is_buy THEN p_accepting_bot_id ELSE v_creator_bot_id END,
    v_company_id,
    v_exchange_id,
    v_price_in_cents,
    p_quantity,
    p_trade_fee_in_cents,
    NOW()
  )
  RETURNING trade_id INTO v_trade_id;
  
  -- Update the order's quantity_filled and status
  UPDATE "order"
  SET quantity_filled = quantity_filled + p_quantity,
      status = CASE 
                WHEN (quantity_filled + p_quantity) >= quantity THEN v_completed_status
                ELSE v_partial_status
               END,
      last_updated_at = NOW()
  WHERE order_id = p_order_id;
  
  -- Update bot money balances
  IF v_is_buy THEN
    -- Creator is buying, deduct money
    UPDATE bot
    SET money_balance_in_cents = money_balance_in_cents - (v_price_in_cents * p_quantity) - p_trade_fee_in_cents,
        last_active_at = NOW()
    WHERE bot_id = v_creator_bot_id;
    
    -- Accepting bot is selling, add money
    UPDATE bot
    SET money_balance_in_cents = money_balance_in_cents + (v_price_in_cents * p_quantity) - p_trade_fee_in_cents,
        last_active_at = NOW()
    WHERE bot_id = p_accepting_bot_id;
  ELSE
    -- Creator is selling, add money
    UPDATE bot
    SET money_balance_in_cents = money_balance_in_cents + (v_price_in_cents * p_quantity) - p_trade_fee_in_cents,
        last_active_at = NOW()
    WHERE bot_id = v_creator_bot_id;
    
    -- Accepting bot is buying, deduct money
    UPDATE bot
    SET money_balance_in_cents = money_balance_in_cents - (v_price_in_cents * p_quantity) - p_trade_fee_in_cents,
        last_active_at = NOW()
    WHERE bot_id = p_accepting_bot_id;
  END IF;
  
  -- Update shareholdings for the creator bot
  IF v_is_buy THEN
    -- Creator is buying, increase their shares
    UPDATE shareholding
    SET shares = shares + p_quantity,
        last_updated_at = NOW(),
        average_purchase_price_in_cents = (average_purchase_price_in_cents * shares + v_price_in_cents * p_quantity) / (shares + p_quantity)
    WHERE bot_id = v_creator_bot_id AND company_id = v_company_id;
    
    -- If no existing shareholding, create one
    IF NOT FOUND THEN
      INSERT INTO shareholding (bot_id, company_id, shares, average_purchase_price_in_cents, last_updated_at)
      VALUES (v_creator_bot_id, v_company_id, p_quantity, v_price_in_cents, NOW());
    END IF;
    
    -- Accepting bot is selling, decrease their shares
    UPDATE shareholding
    SET shares = shares - p_quantity,
        last_updated_at = NOW()
    WHERE bot_id = p_accepting_bot_id AND company_id = v_company_id;
  ELSE
    -- Creator is selling, decrease their shares
    UPDATE shareholding
    SET shares = shares - p_quantity,
        last_updated_at = NOW()
    WHERE bot_id = v_creator_bot_id AND company_id = v_company_id;
    
    -- Accepting bot is buying, increase their shares
    UPDATE shareholding
    SET shares = shares + p_quantity,
        last_updated_at = NOW(),
        average_purchase_price_in_cents = (average_purchase_price_in_cents * shares + v_price_in_cents * p_quantity) / (shares + p_quantity)
    WHERE bot_id = p_accepting_bot_id AND company_id = v_company_id;
    
    -- If no existing shareholding, create one
    IF NOT FOUND THEN
      INSERT INTO shareholding (bot_id, company_id, shares, average_purchase_price_in_cents, last_updated_at)
      VALUES (p_accepting_bot_id, v_company_id, p_quantity, v_price_in_cents, NOW());
    END IF;
  END IF;
  
  -- Add price history update (for market data)
  INSERT INTO price_history (
    company_id,
    exchange_id,
    timestamp,
    open_price_in_cents,
    close_price_in_cents,
    high_price_in_cents,
    low_price_in_cents,
    volume,
    period_length
  )
  VALUES (
    v_company_id,
    v_exchange_id,
    date_trunc('minute', NOW()),
    v_price_in_cents,
    v_price_in_cents,
    v_price_in_cents,
    v_price_in_cents,
    p_quantity,
    '1min'
  )
  ON CONFLICT (company_id, timestamp, period_length) 
  DO UPDATE SET
    close_price_in_cents = v_price_in_cents,
    high_price_in_cents = GREATEST(price_history.high_price_in_cents, v_price_in_cents),
    low_price_in_cents = LEAST(price_history.low_price_in_cents, v_price_in_cents),
    volume = price_history.volume + p_quantity;
END;
$$ LANGUAGE plpgsql;