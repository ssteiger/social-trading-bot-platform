import type { SupabaseClient } from '@supabase/supabase-js'
import type { BotsManager } from '..'
import type { Database } from '../../../types/supabase'
import { TradingStrategy } from '../../TradingStrategy'

export class TradingService {
  private supabase: SupabaseClient<Database>
  private botsManager: BotsManager
  private runningBots: Map<number, NodeJS.Timeout> = new Map()

  constructor(supabaseClient: SupabaseClient<Database>, botsManager: BotsManager) {
    this.supabase = supabaseClient
    this.botsManager = botsManager
  }

  /**
   * Start a simple trading bot with a strategy
   */
  startTradingBot({
    botId,
    strategyExecutionIntevalMs = 1000,
  }: { botId: number; strategyExecutionIntevalMs: number }) {
    // Don't start if already running
    if (this.runningBots.has(botId)) {
      return
    }

    console.log(`Starting trading bot ${botId} with interval ${strategyExecutionIntevalMs}ms`)

    // Create a new trading strategy for this bot
    const strategy = new TradingStrategy(this.botsManager)

    const interval = setInterval(async () => {
      try {
        // Get bot details
        const bot = await this.botsManager.getBotById({ bot_id: botId })
        if (!bot) {
          console.error(`Bot ${botId} not found`)
          this.stopTradingBot(botId)
          return
        }

        // Update bot's last active timestamp
        await this.supabase
          .from('bot')
          .update({ last_active_at: new Date().toISOString() })
          .eq('bot_id', botId)

        // Execute the trading strategy
        await strategy.executeStrategy(botId)
      } catch (error) {
        console.error(`Error in trading bot ${botId}:`, error)
      }
    }, strategyExecutionIntevalMs)

    this.runningBots.set(botId, interval)
  }

  /**
   * Stop a trading bot
   */
  stopTradingBot(botId: number) {
    const interval = this.runningBots.get(botId)
    if (interval) {
      clearInterval(interval)
      this.runningBots.delete(botId)
      console.log(`Stopped trading bot ${botId}`)
    }
  }
}
