import { TradingStrategy } from './bots-logic/TradingStrategy'
import { BotsManager } from './bots-logic/botsManager'
import { seedDataToDatabase } from './seed-scripts'
import { startBots } from './startBots'
import { startSimpleBots } from './startSimpleBots'
import { createSupabaseClient } from './utils/supabase'

async function startServer() {
  console.log('Starting bots server...')

  try {
    // Create Supabase client
    const supabase = createSupabaseClient()

    // Test connection to Supabase
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw new Error(`Failed to connect to Supabase: ${error.message}`)
    }

    console.log('Successfully connected to Supabase')

    // Initialize bots manager
    const botsManager = new BotsManager(supabase)

    // Reset database on each start
    console.log('Resetting database...')
    await botsManager.resetDatabase()
    console.log('Database reset complete')

    // Create initial data
    await seedDataToDatabase(supabase)

    // Start trading bots
    //await startBots(supabase);
    await startSimpleBots(supabase)

    const bots = await botsManager.getAllBots()

    console.log(`Started ${bots.length} trading bots`)

    // Keep the process running
    process.on('SIGINT', () => {
      console.log('Shutting down bots server...')
      // Stop all bots
      for (const bot of bots) {
        botsManager.stopTradingBot(bot.bot_id)
      }
      process.exit(0)
    })

    // Log trading activity summary every minute
    setInterval(async () => {
      try {
        const { data: trades, error } = await supabase
          .from('trades')
          .select('count(*)')
          .gte('executed_at', new Date(Date.now() - 100).toISOString())

        if (!error && trades) {
          console.log({ trades })
          console.log(`Trading activity in the last minute: ${trades[0]?.count || 0} trades`)
        }
      } catch (error) {
        console.error('Error getting trading activity:', error)
      }
    }, 100)
  } catch (error) {
    console.error('Error starting bots server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()
