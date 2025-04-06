import type { SupabaseClient } from '@supabase/supabase-js'

import type { NewOrder } from '@social-trading-bot-platform/db-drizzle'
import type { Database } from '../../types/supabase'
import { TradingStrategy } from '../TradingStrategy'
import { BotService } from './services/BotService'
import { CompanyService } from './services/CompanyService'
import { DatabaseService } from './services/DatabaseService'
import { OrderService } from './services/OrderService'
import { TradingService } from './services/TradingService'

// Re-export all types
export * from '../../types/enums'

export class BotsManager {
  private supabase: SupabaseClient<Database>
  private runningBots: Map<number, NodeJS.Timeout> = new Map()

  // Services
  public companyService: CompanyService
  public orderService: OrderService
  public botService: BotService
  public tradingService: TradingService
  public databaseService: DatabaseService

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient

    // Initialize services
    this.companyService = new CompanyService(supabaseClient)
    this.orderService = new OrderService(supabaseClient)
    this.botService = new BotService(supabaseClient)
    this.tradingService = new TradingService(supabaseClient, this)
    this.databaseService = new DatabaseService(supabaseClient)
  }

  /**
   * Get bot details by ID
   */
  async getBotById(params: { bot_id: number }) {
    return this.botService.getBotById(params)
  }

  /**
   * Get all bots from the database
   */
  async getAllBots() {
    return this.botService.getAllBots()
  }

  /**
   * Get all available companies
   */
  async getCompanies() {
    return this.companyService.getCompanies()
  }

  /**
   * Get shareholdings for a bot
   */
  async getBotShareholdings(params: { bot_id: number }) {
    return this.botService.getBotShareholdings(params)
  }

  /**
   * Place a new order
   */
  async placeOrder(params: { bot_id: number; orderData: NewOrder }) {
    return this.orderService.placeOrder(params)
  }

  /**
   * Cancel an active order
   */
  async cancelOrder(orderId: number) {
    return this.orderService.cancelOrder(orderId)
  }

  /**
   * Accept an existing open order by another bot
   */
  async acceptOrder(botId: number, orderId: number) {
    return this.orderService.acceptOrder(botId, orderId)
  }

  /**
   * Get active orders for a bot
   */
  async getBotActiveOrders(botId: number) {
    return this.orderService.getBotActiveOrders(botId)
  }

  /**
   * Get market data for a company
   */
  async getCompanyMarketData(companyId: string, limit = 100) {
    return this.companyService.getCompanyMarketData(companyId, limit)
  }

  /**
   * Start a simple trading bot with a strategy
   */
  startTradingBot({
    botId,
    strategyExecutionIntevalMs = 1000,
  }: { botId: number; strategyExecutionIntevalMs: number }) {
    this.tradingService.startTradingBot({ botId, strategyExecutionIntevalMs })
  }

  /**
   * Stop a trading bot
   */
  stopTradingBot(botId: number) {
    this.tradingService.stopTradingBot(botId)
  }

  /**
   * Reset the database (for testing purposes)
   */
  async resetDatabase() {
    return this.databaseService.resetDatabase()
  }
}
