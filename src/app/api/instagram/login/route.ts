import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { loginConfigurado, urlDeLogin, urlDeRedirecionamento } from "@/lib/instagram/graph"
import { COOKIE_DO_LOGIN, comRetorno } from "@/lib/instagram/retorno"

/**
 * Começo do "Conectar com Instagram": manda a criadora para o diálogo de
 * login da Meta.
 *
 * `voltar` é para onde ela retorna depois (a tela de onde clicou). Só aceita
 * caminhos da área do criador — sem isso, a rota viraria um redirecionador
 * aberto que qualquer um poderia usar num link de phishing com o nosso domínio.
 *
 * O `state` vai num cookie httpOnly e volta pela Meta; o callback confere os
 * dois. É o que impede alguém de forjar um retorno e plantar a conta DELE no
 * kit de outra pessoa.
 */

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
    const url = new URL(req.url)
    const pedido = url.searchParams.get("voltar") ?? ""

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL("/creator/login", url.origin))

    const padrao = `/creator/${user.id}/metricas`
    const voltar = /^\/creator\/[\w-]+(\/[\w\-/]*)?(\?[\w=&-]*)?$/.test(pedido) ? pedido : padrao

    if (!loginConfigurado()) {
        return NextResponse.redirect(new URL(comRetorno(voltar, "nao_configurado"), url.origin))
    }

    const state = randomBytes(24).toString("base64url")
    const resposta = NextResponse.redirect(
        urlDeLogin({ state, redirectUri: urlDeRedirecionamento(url.origin) }),
    )
    resposta.cookies.set(COOKIE_DO_LOGIN, JSON.stringify({ state, voltar, uid: user.id }), {
        httpOnly: true,
        secure: url.protocol === "https:",
        sameSite: "lax",
        path: "/api/instagram",
        maxAge: 15 * 60,
    })
    return resposta
}
