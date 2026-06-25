import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Cria uma resposta base que o Supabase vai modificar se precisar atualizar os cookies
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Inicia o cliente do Supabase específico para o servidor (Edge)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 1. Pergunta pro banco: "Quem é o cara que tá tentando acessar?"
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.pathname;

  // ==========================================
  // AS REGRAS DA MURALHA
  // ==========================================

  // REGRA 1: Se tentar acessar qualquer coisa dentro de /admin e NÃO estiver logado -> Chuta pro /login
  if (url.startsWith('/admin') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // REGRA 2: Se o cara JÁ ESTÁ logado e tenta abrir a página de /login de novo -> Manda direto pro Painel
  if (url === '/login' && user) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  // Se passou pelas regras, deixa a requisição seguir o fluxo normal
  return supabaseResponse
}

// Configuração de onde o Middleware deve ficar vigiando
export const config = {
  matcher: [
    /*
     * Vigia todas as rotas de admin e a rota de login.
     * O código abaixo ignora arquivos estáticos (imagens, css, etc) para não deixar o site lento.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}