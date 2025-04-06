import type { SupabaseClient } from '@supabase/supabase-js'
import { BotFactory, type TradingStrategy } from './bots-logic/TradingStrategy'
import { BotsManager } from './bots-logic/botsManager'
import type { Database } from './types/supabase'

async function startBots(supabase: SupabaseClient<Database>) {
  console.log('Starting trading bots...')

  // Create a bots manager instance
  const botsManager = new BotsManager(supabase)

  // Get all bots from the database
  const bots = await botsManager.getAllBots()

  if (bots.length === 0) {
    console.warn('No bots found in the database!')
    return
  }

  console.log(`Found ${bots.length} bots. Starting trading operations...`)

  // Assign different strategies to bots based on their character
  for (const bot of bots) {
    let strategy: TradingStrategy

    // Assign strategies based on bot name/character
    if (bot.bot_name.includes('Dividend')) {
      strategy = BotFactory.createBot('dividend', botsManager)
      console.log(`Assigned Dividend strategy to ${bot.bot_name}`)
    } else if (bot.bot_name.includes('Phoenix')) {
      strategy = BotFactory.createBot('meanreversion', botsManager)
      console.log(`Assigned Mean Reversion strategy to ${bot.bot_name}`)
    } else if (bot.bot_name.includes('Master')) {
      strategy = BotFactory.createBot('momentum', botsManager)
      console.log(`Assigned Momentum strategy to ${bot.bot_name}`)
    } else {
      strategy = BotFactory.createBot('random', botsManager)
      console.log(`Assigned Random strategy to ${bot.bot_name}`)
    }

    // Start the bot with its strategy
    botsManager.startTradingBot({
      botId: bot.bot_id,
      strategyExecutionIntevalMs: 1000,
    }) // Check every 1 second
  }

  console.log('All bots have been started!')
}

export { startBots }
