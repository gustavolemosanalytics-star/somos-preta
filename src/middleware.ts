import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

/** Subdomínio dedicado ao painel interno. */
const HOST_PLATAFORMA = "plataforma.somospreta.com"

/** Domínios onde o painel NÃO deve ser servido pelo prefixo /app. */
const HOSTS_SITE = ["www.somospreta.com", "somospreta.com"]

export async function middleware(request: NextRequest) {
    const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase()
    const { pathname } = request.nextUrl

    // ---- plataforma.somospreta.com serve o painel na raiz ----
    // O usuário vê /dashboard; internamente continua sendo /app/dashboard, então
    // nenhuma rota precisou ser movida de lugar.
    if (host === HOST_PLATAFORMA) {
        if (pathname.startsWith("/app")) {
            // /app/x no subdomínio é duplicação: manda para a forma limpa.
            const url = request.nextUrl.clone()
            url.pathname = pathname.replace(/^\/app/, "") || "/"
            return NextResponse.redirect(url)
        }

        // A URL de destino é ancorada em request.url (a origem que de fato
        // atendeu), e não em nextUrl: com o host vindo do header, o rewrite
        // apontaria para outra origem e o Next o degradaria para redirect.
        const alvo = new URL(
            `/app${pathname === "/" ? "" : pathname}${request.nextUrl.search}`,
            request.url
        )

        // A sessão é avaliada sobre o caminho real (/app/...), senão o painel
        // seria tratado como rota pública e passaria sem login.
        const resposta = await updateSession(request, alvo.pathname)

        const destino = resposta.headers.get("location")
        if (destino) {
            // O guard responde em /app/...; aqui a URL do usuário não tem esse
            // prefixo, então ele é removido antes de devolver o redirect.
            const url = new URL(destino, request.url)
            if (url.pathname.startsWith("/app")) {
                url.pathname = url.pathname.replace(/^\/app/, "") || "/"
                return NextResponse.redirect(url, { headers: resposta.headers })
            }
            return resposta
        }

        const rewrite = NextResponse.rewrite(alvo, { request })
        resposta.cookies.getAll().forEach((c) => rewrite.cookies.set(c))
        return rewrite
    }

    // ---- no site, /app passa a viver no subdomínio ----
    if (HOSTS_SITE.includes(host) && pathname.startsWith("/app")) {
        const url = new URL(request.url)
        url.host = HOST_PLATAFORMA
        url.protocol = "https:"
        url.port = ""
        url.pathname = pathname.replace(/^\/app/, "") || "/"
        return NextResponse.redirect(url)
    }

    return await updateSession(request)
}

export const config = {
    // Arquivos estáticos de /public também passam pelo middleware e, por não
    // constarem em PUBLIC_PATHS, eram redirecionados para /app/login — o que
    // quebrava as imagens da landing para quem não estava logado. A extensão
    // no fim do matcher tira todo asset do caminho da autenticação.
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp4|webm|txt|xml|json|pdf)$).*)",
    ],
}
