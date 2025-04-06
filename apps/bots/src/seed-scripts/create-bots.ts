import type { SupabaseClient } from '@supabase/supabase-js'
import { seedData } from './data'

async function createBots(supabase: SupabaseClient) {
  for (const bots of seedData) {
    const { company, ...botData } = bots
    const { data, error } = await supabase.from('bot').insert(botData).select().single()

    if (error) {
      console.error('Error creating bot:', error)
    }
  }
}

export { createBots }
