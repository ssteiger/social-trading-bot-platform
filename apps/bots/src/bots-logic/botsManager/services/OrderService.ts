import type { SupabaseClient } from '@supabase/supabase-js'
import type { BotsManager } from '..'
import type { NewOrder } from '../../../types/drizzle'
import type { Database } from '../../../types/supabase'

export class OrderService {
  private supabase: SupabaseClient<Database>
  private botsManager?: BotsManager

  constructor(supabaseClient: SupabaseClient<Database>, botsManager?: BotsManager) {
    this.supabase = supabaseClient
    this.botsManager = botsManager
  }

  setBotsManager(botsManager: BotsManager) {
    this.botsManager = botsManager
  }

  /**
   * Place a new order
   */
  async placeOrder({
    bot_id,
    orderData,
  }: { bot_id: number; orderData: NewOrder }): Promise<boolean> {
    try {
      const newOrder = {
        bot_id,
        company_id: orderData.company_id,
        order_type: orderData.order_type,
        is_buy: orderData.is_buy,
        price_in_cents: Number(orderData.price_in_cents),
        quantity: orderData.quantity,
        status: 'pending',
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

      console.log(`Successfully cancelled order ${orderId}`)
      return true
    } catch (error) {
      console.error(`Error in cancelOrder for order ${orderId}:`, error)
      return false
    }
  }

  /**
   * Accept an existing open order by another bot
   */
  async acceptOrder(botId: number, orderId: number): Promise<boolean> {
    try {
      if (!this.botsManager) {
        throw new Error('BotsManager not set')
      }

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
      const acceptingBot = await this.botsManager.getBotById({ bot_id: botId })
      if (!acceptingBot) {
        console.error(`Bot ${botId} not found`)
        return false
      }

      // 4. Get current holdings of the accepting bot for this company
      const acceptingBotHoldings = await this.botsManager.getBotShareholdings({
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
      const tradeFee = (tradePrice * tradeQuantity * exchangeData.trading_fee_percent) / 100

      // 9. Start a transaction to process the order acceptance
      const { error: transactionError } = await this.supabase.rpc('accept_order', {
        p_accepting_bot_id: botId,
        p_order_id: orderId,
        p_quantity: tradeQuantity,
        p_trade_fee_in_cents: tradeFee,
      })

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
}
