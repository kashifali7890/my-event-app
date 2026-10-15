// 1. Rename the import to avoid the naming collision
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 2. Now we can safely name our exported function 'createClient'
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}