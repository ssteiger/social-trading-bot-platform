import { parseCookies, setCookie } from '@tanstack/react-start/server'
import { createServerClient } from '@supabase/ssr'

const NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
const NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

export function getSupabaseServerClient() {
  return createServerClient(
    process.env.SUPABASE_URL! || NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY! || NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        // @ts-ignore Wait till Supabase overload works
        getAll() {
          return Object.entries(parseCookies()).map(([name, value]) => ({
            name,
            value,
          }))
        },
        setAll(cookies) {
          cookies.forEach((cookie) => {
            setCookie(cookie.name, cookie.value)
          })
        },
      },
    },
  )
}