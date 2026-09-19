import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

/**
 * O painel é servido na RAIZ de um subdomínio próprio: o usuário navega em
 * /dashboard, /clientes, /tarefas.
 *
 * As rotas, porém, moram em src/app/app/(painel)/ e não podem sair de lá: o
 * /blog do painel colidiria com o /blog do site público, e duas páginas
 * resolvendo o mesmo caminho é erro de build no Next. O prefixo é, então, um
 * detalhe físico que este middleware esconde — ele reescreve /clientes para
 * /app/clientes na entrada e tira o /app de qualquer redirect na saída.
 *
 * Qualquer host cujo primeiro rótulo seja "plataforma" conta como painel. Isso
 * cobre produção (plataforma.somospreta.com), previews com subdomínio próprio e
 * o desenvolvimento local em plataforma.localhost:3000 — que é como se abre o
 * painel na máquina, já que localhost:3000 continua servindo o site.
 *
 * O caminho contrário NÃO existe: nada em somospreta.com manda o visitante para
 * plataforma.somospreta.com. Havia aqui um redirecionamento que capturava
 * /login, /criadores, /dashboard e outros primeiros segmentos do site e os
 * jogava no subdomínio do painel — era ele que, somado ao guard de papel da
 * área do criador, fazia o login do criador piscar /creator e terminar no
 * painel da equipe. Quem pedir um caminho do painel no site agora recebe 404,
 * que é a resposta honesta: aquele caminho não existe neste domínio.
 */
function ehHostDaPlataforma(host: string) {
    return host === "plataforma" || host.startsWith("plataforma.")
}

export async function middleware(request: NextRequest) {
    const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase()
    const { pathname } = request.nextUrl

    // ---- o subdomínio serve o painel na raiz ----
    if (ehHostDaPlataforma(host)) {
        // O callback do OAuth é da aplicação inteira, não do painel: reescrevê-lo
        // para /app/auth/callback daria 404 e o login social morreria em silêncio
        // caso alguém chegue por aqui.
        if (pathname.startsWith("/auth/")) {
            return await updateSession(request)
        }

        if (pathname.startsWith("/app")) {
            // /app/x aqui é duplicação: manda para a forma limpa, que é a canônica.
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

    return await updateSession(request)
}

export const config = {
    // Arquivos estáticos de /public também passam pelo middleware e, por não
    // constarem em PUBLIC_PATHS, eram redirecionados para o login — o que
    // quebrava as imagens da landing para quem não estava logado. A extensão
    // no fim do matcher tira todo asset do caminho da autenticação.
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp4|webm|txt|xml|json|pdf)$).*)",
    ],
}
