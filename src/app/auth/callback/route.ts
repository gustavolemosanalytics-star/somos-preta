import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/constants/site"

/**
 * Callback do login social.
 *
 * O Google devolve o usuário ao Supabase, que redireciona para cá com um
 * `code`. Sem esta rota o code chegava na página de destino sem nunca virar
 * sessão: o server component rodava antes de o cliente trocar o código, via
 * perfil nulo e mandava de volta para o login.
 *
 * Quem chama esta rota são só as telas do criador (/creator/login e
 * /creator/criar-conta) — o login da equipe não tem entrada social. Por isso
 * todo destino daqui é dentro do site: nenhum caminho leva a
 * plataforma.somospreta.com, que é o que fazia o login do criador piscar a área
 * dele e terminar no painel da equipe.
 */
export async function GET(request: NextRequest) {
    const url = new URL(request.url)
    const { searchParams } = url

    // O destino sai de uma origem canônica, não do header Host da requisição —
    // em produção o Host é influenciável e mandaria o usuário para outro lugar.
    // Em desenvolvimento não há domínio configurado, então vale a origem local.
    const base = url.hostname === "localhost" ? url.origin : SITE_URL
    const code = searchParams.get("code")
    const erro = searchParams.get("error_description") ?? searchParams.get("error")

    const telaDeEntrada = `${base}/creator/login`

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
    // /creator resolve o id e leva para a área da própria pessoa.
    return NextResponse.redirect(`${base}/creator`)
}
