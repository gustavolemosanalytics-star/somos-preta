import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

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
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const origem = searchParams.get("origem")
    const erro = searchParams.get("error_description") ?? searchParams.get("error")

    const telaDeEntrada = origem === "creator" ? "/creator/login" : "/app/login"

    if (erro) {
        return NextResponse.redirect(`${origin}${telaDeEntrada}?erro=oauth`)
    }
    if (!code) {
        return NextResponse.redirect(`${origin}${telaDeEntrada}`)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
        return NextResponse.redirect(`${origin}${telaDeEntrada}?erro=oauth`)
    }

    if (origem === "creator") {
        // Idempotente e restrita ao próprio usuário: promove só quem está
        // 'pendente', então não mexe em quem já é creator nem em staff.
        await supabase.rpc("somos_preta_assumir_papel_creator")
        return NextResponse.redirect(`${origin}/creator`)
    }

    return NextResponse.redirect(`${origin}/app/dashboard`)
}
