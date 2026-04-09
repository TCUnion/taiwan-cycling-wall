import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('缺少 Supabase 環境變數：請確認 .env 中有設定 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export async function 取得目前AuthUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user?.id ?? null
}
