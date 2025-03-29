import type { Database } from '@/types/supabase'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient<Database>(
    // biome-ignore lint/style/noNonNullAssertion:
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // biome-ignore lint/style/noNonNullAssertion:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
