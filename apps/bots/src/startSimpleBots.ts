import type { SupabaseClient } from '@supabase/supabase-js'
import { BotsManager } from './bots-logic/botsManager'
import { OrderStatusEnum, OrderTypeEnum } from './types/enums'
import type { Database } from './types/supabase'
import { createLogger } from './utils/logger'


/*
botsManager:

  async getBotById(params: { bot_id: number })
  async getAllBots()
  async getCompanies()
  async getBotShareholdings(params: { bot_id: number })
  async placeOrder(params: { bot_id: number; orderData: NewOrder })
  async cancelOrder(orderId: number)
  async acceptOrder(botId: number, orderId: number)
  async getBotActiveOrders(botId: number)
  async getCompanyMarketData(companyId: string, limit = 100)

  startTradingBot(botId: number)
  stopTradingBot(botId: number)
  getBotBalanceInCents({ bot_id }; { bot_id: number })
*/

async function startSimpleBots(supabase: SupabaseClient<Database>) {
  console.log('Starting trading bots...')
  
  // Create logger instance
  const logger = createLogger(supabase)
  
  // Log startup to database
  await logger.info('Starting trading bots system')

  // Create a bots manager instance
  const botsManager = new BotsManager(supabase)

  // Get services
  const { 
    companyService,
    orderService,
    botService,
    tradingService,
    databaseService,
  } = botsManager.getServices()

  // Get all bots from the database
  const bots = await botService.getAllBots()

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
          console.log(`Running trading cycle for bot ${bot.bot_name} (ID: ${bot.bot_id})`)
          
          // 1. Get bot's current balance and shareholdings
          const botBalance = await botService.getBotBalanceInCents({ bot_id: bot.bot_id })
          const shareholdings = await botService.getBotShareholdings({ bot_id: bot.bot_id })
          
          // 2. Get all available companies and their current market prices
          const companies = await companyService.getCompanies()
          const marketPrices = await orderService.getCurrentMarketPriceMany()
          
          // 3. Get bot's active orders
          const activeOrders = await orderService.getBotActiveOrders(bot.bot_id)
          
          // 4. Check for open market orders that this bot could accept
          const openMarketOrders = await orderService.getOpenMarketOrders(bot.bot_id)
          
          // 5. Trading decision logic
          
          // Random decision: buy, sell, or accept an order
          const decision = Math.floor(Math.random() * 3)
          let orderPlaced = false;
          let noOrderReason = "";
          
          if (decision === 0 && companies.length > 0 && botBalance && botBalance > 1000) {
            // BUYING STRATEGY
            // Randomly select a company to buy
            const randomCompanyIndex = Math.floor(Math.random() * companies.length)
            const targetCompany = companies[randomCompanyIndex]
            
            // Find current market price for this company
            const companyPrice = marketPrices.find(p => p.company_id === targetCompany.company_id)
            
            if (companyPrice) {
              // Calculate how many shares to buy (random amount, max 10)
              const sharesToBuy = Math.max(1, Math.floor(Math.random() * 10))
              
              // Calculate total cost
              const pricePerShare = companyPrice.ask_price
              const totalCost = pricePerShare * sharesToBuy
              
              // Only place order if bot has enough money
              if (botBalance >= totalCost) {
                await orderService.placeOrder({
                  bot_id: bot.bot_id,
                  company_id: targetCompany.company_id,
                  order_type: 'market',
                  is_buy: true,
                  price_in_cents: pricePerShare,
                  quantity: sharesToBuy,
                })
                
                await logger.botInfo(
                  bot.bot_name, 
                  bot.bot_id, 
                  `Placed buy order for ${sharesToBuy} shares of ${targetCompany.company_id} at ${pricePerShare} cents each`
                )
                orderPlaced = true;
              } else {
                noOrderReason = `Insufficient balance (${botBalance} cents) to buy ${sharesToBuy} shares at ${pricePerShare} cents each (total: ${totalCost} cents)`;
              }
            } else {
              noOrderReason = `No market price available for company ${targetCompany.company_id}`;
            }
          } 
          else if (decision === 1 && shareholdings.length > 0) {
            // SELLING STRATEGY
            // Randomly select a shareholding to sell from
            const randomHoldingIndex = Math.floor(Math.random() * shareholdings.length)
            const targetHolding = shareholdings[randomHoldingIndex]
            
            if (targetHolding.shares > 0) {
              // Find current market price for this company
              const companyPrice = marketPrices.find(p => p.company_id === targetHolding.company_id)
              
              if (companyPrice) {
                // Calculate how many shares to sell (random amount, max = what bot owns)
                const sharesToSell = Math.max(1, Math.floor(Math.random() * targetHolding.shares))
                
                // Calculate sell price (slightly below market to increase chances of selling)
                const pricePerShare = Math.max(1, companyPrice.bid_price - Math.floor(Math.random() * 5))
                
                await orderService.placeOrder({
                  bot_id: bot.bot_id,
                  company_id: targetHolding.company_id,
                  order_type: 'market',
                  is_buy: false,
                  price_in_cents: pricePerShare,
                  quantity: sharesToSell,
                })
                
                await logger.botInfo(
                  bot.bot_name, 
                  bot.bot_id, 
                  `Placed sell order for ${sharesToSell} shares of ${targetHolding.company_id} at ${pricePerShare} cents each`
                )
                orderPlaced = true;
              } else {
                noOrderReason = `No market price available for company ${targetHolding.company_id}`;
              }
            } else {
              noOrderReason = `Selected shareholding for ${targetHolding.company_id} has 0 shares`;
            }
          } 
          else if (decision === 2 && openMarketOrders.length > 0) {
            // ORDER ACCEPTANCE STRATEGY
            // Randomly select an open order to accept
            const randomOrderIndex = Math.floor(Math.random() * openMarketOrders.length)
            const targetOrder = openMarketOrders[randomOrderIndex]
            
            // Check if bot can fulfill this order
            if (targetOrder.is_buy) {
              // This is a buy order, so our bot needs to sell
              const relevantHolding = shareholdings.find(h => h.company_id === targetOrder.company_id)
              
              if (relevantHolding && relevantHolding.shares >= targetOrder.quantity_open) {
                // Bot has enough shares to fulfill this order
                const success = await orderService.acceptOrder(bot.bot_id, targetOrder.order_id)
                
                if (success) {
                  await logger.botInfo(
                    bot.bot_name, 
                    bot.bot_id, 
                    `Accepted order #${targetOrder.order_id} to sell ${targetOrder.quantity_open} shares of ${targetOrder.company_id}`
                  )
                  orderPlaced = true;
                } else {
                  noOrderReason = `Failed to accept order #${targetOrder.order_id}`;
                }
              } else {
                noOrderReason = `Insufficient shares to fulfill buy order #${targetOrder.order_id} for ${targetOrder.company_id}`;
              }
            } else {
              // This is a sell order, so our bot needs to buy
              // Check if bot has enough money
              const totalCost = targetOrder.price_in_cents * targetOrder.quantity_open
              
              if (botBalance && botBalance >= totalCost) {
                // Bot has enough money to fulfill this order
                const success = await orderService.acceptOrder(bot.bot_id, targetOrder.order_id)
                
                if (success) {
                  await logger.botInfo(
                    bot.bot_name, 
                    bot.bot_id, 
                    `Accepted order #${targetOrder.order_id} to buy ${targetOrder.quantity_open} shares of ${targetOrder.company_id}`
                  )
                  orderPlaced = true;
                } else {
                  noOrderReason = `Failed to accept order #${targetOrder.order_id}`;
                }
              } else {
                noOrderReason = `Insufficient balance (${botBalance} cents) to fulfill sell order #${targetOrder.order_id} (cost: ${totalCost} cents)`;
              }
            }
          } else {
            // No decision was made
            if (decision === 0) {
              if (companies.length === 0) {
                noOrderReason = "No companies available to buy from";
              } else if (!botBalance) {
                noOrderReason = "Bot balance could not be determined";
              } else if (botBalance <= 1000) {
                noOrderReason = `Bot balance (${botBalance} cents) too low for buying`;
              }
            } else if (decision === 1) {
              if (shareholdings.length === 0) {
                noOrderReason = "Bot has no shareholdings to sell";
              }
            } else if (decision === 2) {
              if (openMarketOrders.length === 0) {
                noOrderReason = "No open market orders available to accept";
              }
            }
          }
          
          // Log if no order was placed
          if (!orderPlaced) {
            if (!noOrderReason) {
              noOrderReason = `Random decision ${decision} did not result in an order`;
            }
            await logger.botInfo(
              bot.bot_name,
              bot.bot_id,
              `No order placed: ${noOrderReason}`
            );
          }
          
          // 6. Occasionally cancel old orders (20% chance)
          if (activeOrders.length > 0 && Math.random() < 0.2) {
            const oldestOrder = activeOrders[0]
            await orderService.cancelOrder(oldestOrder.order_id)
            await logger.botInfo(
              bot.bot_name, 
              bot.bot_id, 
              `Cancelled old order #${oldestOrder.order_id}`
            )
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
      1000 + Math.random() * 1000,
    ) // Random interval between 1-2 seconds

    console.log(`Started order processing for bot ${bot.bot_name}`)
    await logger.botInfo(bot.bot_name, bot.bot_id, 'Started order processing')
  }

  console.log('All bots have been started!')
  await logger.info('All trading bots have been successfully started')
}

export { startSimpleBots }
