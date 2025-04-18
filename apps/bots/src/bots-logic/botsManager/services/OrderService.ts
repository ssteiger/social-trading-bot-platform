import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewOrder } from '../../../types/drizzle'
import type { Database } from '../../../types/supabase'

import type { BotService } from './BotService'
import type { CompanyService } from './CompanyService'
import type { TradingService } from './TradingService'

export class OrderService {
  private supabase: SupabaseClient<Database>

  // Services
  private companyService: CompanyService
  private orderService: OrderService
  private botService: BotService
  private tradingService: TradingService

  /**
   * Creates a new OrderService instance
   * @param supabaseClient The Supabase client to use for database operations
   * @param botService Optional BotService instance
   */
  constructor(supabaseClient: SupabaseClient<Database>, botService: BotService) {
    this.supabase = supabaseClient
    this.botService = botService
  }

  /**
   * Place a new order
   * @param orderData The data for the new order
   * @returns Promise resolving to true if successful, false otherwise
   */
  async placeOrder(orderData: NewOrder): Promise<boolean> {
    try {
      const newOrder = {
        bot_id: orderData.bot_id,
        company_id: orderData.company_id,
        order_type: orderData.order_type,
        is_buy: orderData.is_buy,
        price_in_cents: Number(orderData.price_in_cents),
        quantity: orderData.quantity,
        status: 'active',
      } as NewOrder

      // Place the order
      const { error } = await this.supabase.from('order').insert(newOrder)

      if (error) {
        console.error('Error placing order:', error)
        return false
      }

      return true
    } catch (err) {
      console.error('Error in placeOrder:', err)
      return false
    }
  }

  /**
   * Cancel an active order
   * @param orderId The ID of the order to cancel
   * @returns Promise resolving to true if successful, false otherwise
   */
  async cancelOrder(orderId: number): Promise<boolean> {
    try {
      // Cancel the order by changing its status to cancelled
      const { error } = await this.supabase
        .from('order')
        .update({
          status: 'cancelled',
          last_updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)

      if (error) {
        console.error(`Error cancelling order ${orderId}:`, error)
        return false
      }

      return true
    } catch (error) {
      console.error(`Error in cancelOrder for order ${orderId}:`, error)
      return false
    }
  }

  /**
   * Accept an existing open order by another bot
   * @param botId The ID of the bot accepting the order
   * @param orderId The ID of the order to accept
   * @returns Promise resolving to true if successful, false otherwise
   */
  async acceptOrder(botId: number, orderId: number): Promise<boolean> {
    console.log('acceptOrder', { orderId })
    try {
      // 1. Get the order details
      const { data: orderData, error: orderError } = await this.supabase
        .from('order')
        .select(`
					order_id,
					bot_id,
					company_id,
					is_buy,
					price_in_cents,
					quantity,
					quantity_filled,
					status,
					order_type
				`)
        .eq('order_id', orderId)
        .single()

      if (orderError || !orderData) {
        console.error(`Error fetching order ${orderId}:`, orderError)
        return false
      }

      // 2. Verify that the order is available to be accepted
      // Check if status is pending or active
      if (orderData.status !== 'pending' && orderData.status !== 'active') {
        console.error(`Order ${orderId} is not available (status: ${orderData.status})`)
        return false
      }

      // Check that the accepting bot is not the order creator
      if (orderData.bot_id === botId) {
        console.error(`Bot ${botId} cannot accept its own order ${orderId}`)
        return false
      }

      // 3. Get information about the bot accepting the order
      const acceptingBot = await this.botService.getBotById({ bot_id: botId })
      if (!acceptingBot) {
        console.error(`Bot ${botId} not found`)
        return false
      }

      // 4. Get current holdings of the accepting bot for this company
      const acceptingBotHoldings = await this.botService.getBotShareholdings({
        bot_id: botId,
      })
      const relevantHolding = acceptingBotHoldings.find(
        (h) => h.company_id === orderData.company_id,
      )

      // 5. Check if the accepting bot can fulfill the order
      const remainingQuantity = orderData.quantity - orderData.quantity_filled

      // If the original order is a buy order, the accepting bot must sell
      if (orderData.is_buy) {
        // Check if the accepting bot has enough shares to sell
        if (!relevantHolding || relevantHolding.shares < remainingQuantity) {
          console.error(`Bot ${botId} doesn't have enough shares to fulfill order ${orderId}`)
          return false
        }
      }

      // 6. Get the company data to record the trade properly
      const { data: companyData, error: companyError } = await this.supabase
        .from('company')
        .select('exchange_id')
        .eq('company_id', orderData.company_id)
        .single()

      if (companyError || !companyData) {
        console.error(`Error fetching company ${orderData.company_id}:`, companyError)
        return false
      }

      // 7. Get the exchange information for fees
      const { data: exchangeData, error: exchangeError } = await this.supabase
        .from('exchange')
        .select('trading_fee_percent')
        .eq('exchange_id', companyData.exchange_id)
        .single()

      if (exchangeError || !exchangeData) {
        console.error(`Error fetching exchange ${companyData.exchange_id}:`, exchangeError)
        return false
      }

      // 8. Calculate trade details
      const tradeQuantity = remainingQuantity
      const tradePrice = orderData.price_in_cents
      const tradeFee = Math.round((tradePrice * tradeQuantity * exchangeData.trading_fee_percent) / 100)

      // 9. Start a transaction to process the order acceptance
      const acceptOrderDetails = {
        accepting_bot_id: botId,
        target_order_id: orderId,
        trade_quantity: tradeQuantity,
        trade_fee_in_cents: tradeFee,
      }
      console.log('acceptOrderDetails', acceptOrderDetails)
      const { error: transactionError } = await this.supabase.rpc('accept_order', acceptOrderDetails)

      if (transactionError) {
        console.error(`Transaction error accepting order ${orderId}:`, transactionError)
        return false
      }

      console.log(
        `Bot ${botId} successfully accepted order ${orderId} for ${tradeQuantity} shares at ${tradePrice}`,
      )
      return true
    } catch (error) {
      console.error(`Error in acceptOrder for order ${orderId}:`, error)
      return false
    }
  }

  /**
   * Get active orders for a bot
   * @param botId The ID of the bot to get active orders for
   * @returns Promise resolving to an array of active orders
   */
  async getBotActiveOrders(botId: number) {
    const { data, error } = await this.supabase
      .from('order')
      .select(`
				order_id,
				company_id,
				order_type,
				is_buy,
				price_in_cents,
				quantity,
				quantity_filled,
				status,
				created_at,
				expires_at
			`)
      .eq('bot_id', botId)
      .eq('status', 'active')

    if (error || !data) {
      console.error('Error getting active orders:', error)
      return []
    }

    return data
  }

  /**
   * Get open market orders that can be accepted by a bot
   * @param botId The ID of the bot looking for orders to accept
   * @param options Optional parameters for filtering orders
   * @param options.companyId Optional company ID to filter orders by
   * @param options.isBuy Optional flag to filter for buy or sell orders
   * @returns Array of open orders that can be accepted
   */
  async getOpenMarketOrders(botId: number, options?: { 
    companyId?: number, 
    isBuy?: boolean 
  }) {
    try {
      let query = this.supabase
        .from('order')
        .select(`
          order_id,
          bot_id,
          company_id,
          order_type,
          is_buy,
          price_in_cents,
          quantity,
          quantity_filled,
          quantity_open,
          status,
          created_at,
          expires_at
        `)
        .neq('bot_id', botId)
        .eq('status', 'active')
        .gt('quantity_open', 0);
      
      // Apply optional filters
      if (options?.companyId !== undefined) {
        query = query.eq('company_id', String(options.companyId));
      }
      
      if (options?.isBuy !== undefined) {
        query = query.eq('is_buy', options.isBuy);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching open market orders:', error);
        return [];
      }
      
      // Calculate quantity_open in JavaScript after fetching the data
      const ordersWithOpenQuantity = data?.map(order => ({
        ...order,
        quantity_open: order.quantity - order.quantity_filled
      })) || [];
      
      return ordersWithOpenQuantity;
    } catch (error) {
      console.error('Error in getOpenMarketOrders:', error);
      return [];
    }
  }

  /**
   * Get current market prices for a company
   * @param companyId The ID of the company to get market prices for
   * @returns Promise resolving to market price information or null if not found
   */
  async getCurrentMarketPriceOne(companyId: string) {
    try {
      const { data, error } = await this.supabase
        .from('current_market_price')
        .select(`
          company_id,
          ticker_symbol,
          exchange_id,
          bid_price,
          ask_price,
          spread,
          last_trade_time
        `)
        .eq('company_id', companyId)
        .single();

      if (error) {
        console.error(`Error fetching market price for company ${companyId}:`, error);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`Error in getCurrentMarketPrice for company ${companyId}:`, error);
      return null;
    }
  }

  /**
   * Get current market prices for multiple companies
   * @param companyIds Optional array of company IDs to filter by
   * @returns Promise resolving to an array of market price information
   */
  async getCurrentMarketPriceMany(companyIds?: string[]) {
    try {
      let query = this.supabase
        .from('current_market_price')
        .select(`
          company_id,
          ticker_symbol,
          exchange_id,
          bid_price,
          ask_price,
          spread,
          last_trade_time
        `);
      
      // Apply filter if company IDs are provided
      if (companyIds && companyIds.length > 0) {
        query = query.in('company_id', companyIds);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching market prices:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllMarketPrices:', error);
      return [];
    }
  }
}
