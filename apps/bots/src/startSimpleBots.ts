import type { SupabaseClient } from '@supabase/supabase-js'
import { BotsManager } from './bots-logic/botsManager'
import { OrderStatusEnum, OrderTypeEnum } from './types/enums'
import type { Database } from './types/supabase'
import { createLogger } from './utils/logger'

async function startSimpleBots(supabase: SupabaseClient<Database>) {
  console.log('Starting trading bots...')
  
  // Create logger instance
  const logger = createLogger(supabase)
  
  // Log startup to database
  await logger.info('Starting trading bots system')

  // Create a bots manager instance
  const botsManager = new BotsManager(supabase)

  // Get all bots from the database
  const bots = await botsManager.getAllBots()

  if (bots.length === 0) {
    console.warn('No bots found in the database!')
    await logger.warn('No bots found in the database. Trading system idle.')
    return
  }

  console.log(`Found ${bots.length} bots. Starting trading operations...`)
  await logger.info(`Found ${bots.length} bots. Starting trading operations.`)

  // Assign different strategies to bots based on their character
  for (const bot of bots) {
    // Log bot startup
    await logger.botInfo(bot.bot_name, bot.bot_id, 'Initializing trading bot')
    
    // Set up a recurring process to generate and match orders
    setInterval(
      async () => {
        try {
          // Get all available companies
          const companies = await botsManager.getCompanies()
          if (companies.length === 0) {
            console.log(`No companies available for bot ${bot.bot_name} to trade`)
            await logger.botInfo(bot.bot_name, bot.bot_id, 'No companies available to trade')
            return
          }

          // Get bot's current shareholdings
          const shareholdings = await botsManager.getBotShareholdings({
            bot_id: bot.bot_id,
          })

          // 1. GENERATE NEW ORDERS
          // Randomly decide whether to create a new order (70% chance)
          if (Math.random() < 0.7) {
            // Select a random company to trade
            const randomCompany = companies[Math.floor(Math.random() * companies.length)]

            // Decide whether to buy or sell
            const isBuy = Math.random() > 0.5

            // If selling, check if the bot has shares of this company
            const holding = shareholdings.find((h) => h.company_id === randomCompany.company_id)

            // Only proceed with sell order if bot has shares, or with buy order
            if (isBuy || (holding && holding.shares > 0)) {
              // Set quantity - for sell orders, don't exceed what the bot owns
              const quantity = isBuy
                ? Math.floor(Math.random() * 10) + 1
                : Math.min(Math.floor(Math.random() * 10) + 1, holding ? holding.shares : 0)

              // Set price - slightly better than market for faster execution
              // Buy slightly below market, sell slightly above
              const priceAdjustment = Math.random() * 0.05 + 0.97 // 0.97 to 1.02
              const price = randomCompany.getCurrentPrice() * priceAdjustment

              if (quantity > 0) {
                console.log('Creating order:', {
                  bot_id: bot.bot_id,
                  company_id: randomCompany.company_id,
                  order_type: OrderTypeEnum.MARKET,
                  is_buy: isBuy,
                  price_in_cents: Math.round(price * 100), // Convert dollars to cents
                  quantity: quantity,
                  status: OrderStatusEnum.ACTIVE,
                })

                // Place the order
                const { error: insertError } = await supabase.from('order').insert({
                  bot_id: bot.bot_id,
                  company_id: randomCompany.company_id,
                  order_type: OrderTypeEnum.MARKET,
                  is_buy: isBuy,
                  price_in_cents: Math.round(price * 100), // Convert dollars to cents
                  quantity: quantity,
                  status: OrderStatusEnum.ACTIVE,
                })

                if (insertError) {
                  console.error(
                    `Error creating ${isBuy ? 'buy' : 'sell'} order for bot ${bot.bot_name}:`,
                    insertError,
                  )
                  await logger.botError(
                    bot.bot_name, 
                    bot.bot_id, 
                    `failed to create ${isBuy ? 'buy' : 'sell'} order for ${quantity} shares of ${randomCompany.ticker_symbol} at $${(price).toFixed(2)}: ${insertError.message}`
                  )
                } else {
                  console.log(
                    `Bot ${bot.bot_name} created a ${isBuy ? 'buy' : 'sell'} order for ${quantity} shares of ${randomCompany.ticker_symbol} at ${price}`,
                  )
                  await logger.botInfo(
                    bot.bot_name, 
                    bot.bot_id, 
                    `created a ${isBuy ? 'buy' : 'sell'} order for ${quantity} shares of ${randomCompany.ticker_symbol} at $${(price).toFixed(2)}`
                  )
                }
              }
            }
          }

          // 2. MATCH EXISTING ORDERS
          // Fetch open orders that this bot could potentially match
          const { data: openOrders, error } = await supabase
            .from('order')
            .select('*')
            .neq('bot_id', bot.bot_id)
            .eq('status', OrderStatusEnum.ACTIVE) // Use enum value instead of string
            .gt('quantity_open', 0)

          if (error) {
            console.error(`Error fetching open orders for bot ${bot.bot_name}:`, error)
            await logger.botError(bot.bot_name, bot.bot_id, `failed to fetch open orders: ${error.message}`)
            return
          }

          if (openOrders && openOrders.length > 0) {
            console.log(`Bot ${bot.bot_name} found ${openOrders.length} open orders to process`)
            await logger.botInfo(bot.bot_name, bot.bot_id, `found ${openOrders.length} open orders to potentially match`)

            // Process each open order
            for (const order of openOrders) {
              //console.log(`Processing order ${order.order_id}`);
              // For sell orders, check if bot has enough cash (simplified)
              // For buy orders, check if bot has enough shares
              const canMatch = order.is_buy
                ? shareholdings.some(
                    (h) => h.company_id === order.company_id && h.shares >= order.quantity_open,
                  )
                : true // Assume bot has enough cash for buy orders

              //console.log(`Can match order ${order.order_id}: ${canMatch}`);
              if (canMatch) {
                console.log(`Creating matching counter-order for order ${order.order_id}`)
                
                // Check if the quantity is valid (greater than 0)
                const quantityToMatch = order.quantity - order.quantity_filled;
                if (quantityToMatch <= 0) {
                  console.log(`Skipping order ${order.order_id} as it has no remaining quantity to match`);
                  await logger.botInfo(bot.bot_name, bot.bot_id, `skipped order ${order.order_id} as it has no remaining quantity to match`)
                  continue;
                }
                
                // Get company info for logging
                const company = companies.find(c => c.company_id === order.company_id);
                const companySymbol = company ? company.ticker_symbol : `Company ID: ${order.company_id}`;
                const priceInDollars = order.price_in_cents / 100;
                
                // Create a matching counter-order
                const { error: insertError } = await supabase.from('order').insert({
                  bot_id: bot.bot_id,
                  company_id: order.company_id,
                  order_type: OrderTypeEnum.MARKET,
                  is_buy: !order.is_buy,
                  price_in_cents: order.price_in_cents,
                  quantity: quantityToMatch,
                  status: OrderStatusEnum.ACTIVE,
                })

                if (insertError) {
                  console.error(
                    `Error creating counter-order for bot ${bot.bot_name}:`,
                    insertError,
                  )
                  await logger.botError(bot.bot_name, bot.bot_id, `failed to create counter-order for order ${order.order_id}: ${insertError.message}`)
                } else {
                  console.log(
                    `Bot ${bot.bot_name} created a matching counter-order for order ${order.order_id}`,
                  )
                  await logger.botInfo(
                    bot.bot_name, 
                    bot.bot_id, 
                    `created a matching ${order.is_buy ? 'sell' : 'buy'} counter-order for ${quantityToMatch} shares of ${companySymbol} at $${priceInDollars.toFixed(2)}`
                  )
                }
              }
            }
          }
        } catch (err) {
          console.error(`Error in bot ${bot.bot_name} order processing:`, err)
          await logger.botError(
            bot.bot_name, 
            bot.bot_id, 
            `encountered an error during order processing: ${err instanceof Error ? err.message : String(err)}`
          )
        }
      },
      5000 + Math.random() * 5000,
    ) // Random interval between 5-10 seconds

    console.log(`Started order processing for bot ${bot.bot_name}`)
    await logger.botInfo(bot.bot_name, bot.bot_id, `Started order processing`)
  }

  console.log('All bots have been started!')
  await logger.info('All trading bots have been successfully started')
}

export { startSimpleBots }
