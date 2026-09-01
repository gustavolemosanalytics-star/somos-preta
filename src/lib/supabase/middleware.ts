import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Rotas públicas (não exigem login). Tudo o que não bater aqui é protegido.
const PUBLIC_PATHS = [
    "/",
    "/blog",
    "/client-portal",
    "/app/login",
    "/app/criar-conta",
    "/app/esqueci-senha",
    "/app/redefinir-senha",
    "/criador/login",
    "/criador/criar-conta",
    "/kit",
    "/engajamento",
]

function isPublic(pathname: string) {
    return PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    )
}

export async function updateSession(request: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // Se o Supabase ainda não estiver configurado (ex.: env não setada na Vercel),
    // não derruba o site inteiro — apenas não aplica autenticação.
    if (!url || !key) return NextResponse.next({ request })

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        url,
        key,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANTE: getUser() revalida o token e mantém a sessão viva.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Não logado tentando acessar rota protegida -> login do hub
    if (!user && !isPublic(pathname)) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/app/login"
        return NextResponse.redirect(redirectUrl)
    }

    // Logado tentando acessar as telas de auth do hub -> dashboard (o gate roteia por papel)
    if (user && (pathname === "/app/login" || pathname === "/app/criar-conta")) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/app/dashboard"
        return NextResponse.redirect(redirectUrl)
    }

    // Logado tentando acessar as telas de auth do creator -> área do creator (o layout roteia por papel)
    if (user && (pathname === "/criador/login" || pathname === "/criador/criar-conta")) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/criador"
        return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
}
