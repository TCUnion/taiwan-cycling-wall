import { supabase } from './supabase'

export async function 發起Google登入(): Promise<void> {
  const redirectTo = `${window.location.origin}/oauth/callback?provider=google`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    throw new Error(error.message || 'Google 登入啟動失敗')
  }
}
