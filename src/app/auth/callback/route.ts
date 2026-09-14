import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { PLATAFORMA_URL, SITE_URL } from "@/lib/constants/site"

/**
 * Callback do login social.
 *
 * O Google devolve o usuário ao Supabase, que redireciona para cá com um
 * `code`. Sem esta rota o code chegava na página de destino sem nunca virar
 * sessão: o server component rodava antes de o cliente trocar o código, via
 * perfil nulo e mandava de volta para o login.
 *
 * Quando o fluxo vem da área do criador (`origem=creator`), o papel é
 * confirmado aqui. O cadastro por e-mail envia role_hint no signUp, canal que
 * o OAuth não tem — sem isto o usuário do Google nasceria 'pendente' e cairia
 * em /app/sem-acesso.
 */
export async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const { searchParams } = url

    // O destino sai de uma origem canônica, não do header Host da requisição —
    // em produção o Host é influenciável e mandaria o usuário para outro lugar.
    // Em desenvolvimento não há domínio configurado, então vale a origem local.
    const base = url.hostname === "localhost" ? url.origin : SITE_URL
    const code = searchParams.get("code")
    const origem = searchParams.get("origem")
    const erro = searchParams.get("error_description") ?? searchParams.get("error")

    // A equipe entra pelo subdomínio do painel; o criador, pelo site. Guardar a
    // URL inteira (e não só o caminho) é o que permite os dois conviverem.
    const telaDeEntrada = origem === "creator"
        ? `${base}/creator/login`
        : `${url.hostname === "localhost" ? url.origin : PLATAFORMA_URL}/login`

    if (erro) {
        return NextResponse.redirect(`${telaDeEntrada}?erro=oauth`)
    }
    if (!code) {
        return NextResponse.redirect(telaDeEntrada)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        return NextResponse.redirect(`${telaDeEntrada}?erro=oauth`)
    }

    // O papel é decidido na criação do usuário, pelo trigger em auth.users:
    // tentar ajustá-lo aqui esbarraria no guard que só deixa admin mudar `role`.
    if (origem === "creator") {
        return NextResponse.redirect(`${base}/creator`)
    }

    return NextResponse.redirect(`${base}/app/dashboard`)
}
