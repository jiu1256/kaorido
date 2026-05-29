// src/lib/supabase.js
// SupabaseとReactアプリをつなぐ「接続口」です
// このファイルを1回だけ作れば、どこからでも import して使えます

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// .envの設定が抜けていたらわかりやすいエラーを出す
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '❌ .envファイルに VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
