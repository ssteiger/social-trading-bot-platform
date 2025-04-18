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
    this.botService = new BotService(supabaseClient)
    this.orderService = new OrderService(supabaseClient, this.botService)
    this.tradingService = new TradingService(supabaseClient, this.botService)
    this.databaseService = new DatabaseService(supabaseClient)
  }

  getServices() {
    return {
      companyService: this.companyService,
      orderService: this.orderService,
      botService: this.botService,
      tradingService: this.tradingService,
      databaseService: this.databaseService
    }
  }
}
