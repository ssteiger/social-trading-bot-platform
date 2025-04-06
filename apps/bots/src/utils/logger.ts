import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

/**
 * Logger utility for inserting log messages into the database
 */
export class Logger {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  /**
   * Log an informational message to the database
   * @param message The message to log
   */
  async info(message: string): Promise<void> {
    await this.log(message)
  }

  /**
   * Log an error message to the database
   * @param message The error message to log
   */
  async error(message: string): Promise<void> {
    await this.log(`ERROR: ${message}`)
  }

  /**
   * Log a warning message to the database
   * @param message The warning message to log
   */
  async warn(message: string): Promise<void> {
    await this.log(`WARNING: ${message}`)
  }

  /**
   * Log a bot-specific message to the database
   * @param botName The name of the bot
   * @param botId The ID of the bot
   * @param message The message to log
   */
  async botInfo(botName: string, botId: string, message: string): Promise<void> {
    await this.log(`Bot ${botName} (ID: ${botId}): ${message}`)
  }

  /**
   * Log a bot-specific error to the database
   * @param botName The name of the bot
   * @param botId The ID of the bot
   * @param message The error message to log
   */
  async botError(botName: string, botId: string, message: string): Promise<void> {
    await this.log(`ERROR: Bot ${botName} (ID: ${botId}) ${message}`)
  }

  /**
   * Insert a log message into the database
   * @param message The message to log
   * @private
   */
  private async log(message: string): Promise<void> {
    try {
      await this.supabase.from('logs').insert({ message })
    } catch (error) {
      // If logging to the database fails, at least log to console
      console.error('Failed to write to logs table:', error)
      console.log('Original log message:', message)
    }
  }
}

/**
 * Create a new logger instance
 * @param supabase The Supabase client
 */
export function createLogger(supabase: SupabaseClient<Database>): Logger {
  return new Logger(supabase)
}
