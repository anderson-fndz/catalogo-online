import { createBrowserClient } from '@supabase/ssr'

// Essa versão 'createBrowserClient' obriga o Supabase a sincronizar o login
// automaticamente com os Cookies do navegador, permitindo que a nossa Muralha (proxy) leia.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)