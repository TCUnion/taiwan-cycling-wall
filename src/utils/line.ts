import { supabase } from './supabase'

export async function 發起LINE登入(): Promise<void> {
  const redirectTo = `${window.location.origin}/oauth/callback?provider=line`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'custom:line',
    options: {
      redirectTo,
      scopes: 'openid profile',
    },
  })

  if (error) {
    throw new Error(error.message || 'LINE 登入啟動失敗')
  }
}
