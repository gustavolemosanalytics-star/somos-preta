import { NextResponse, type NextRequest } from "next/server"

import { createAdminClient, createClient } from "@/lib/supabase/server"
import { cifrar } from "@/lib/instagram/cofre"
import { contasDoLogin, loginConfigurado, trocarCodigo, urlDeRedirecionamento } from "@/lib/instagram/graph"
import { COOKIE_DO_LOGIN, comRetorno } from "@/lib/instagram/retorno"
import { garantirKit, sincronizarConexao } from "@/lib/instagram/sincronizar"

/**
 * Volta do diálogo de login da Meta.
 *
 * 1. confere o `state` com o cookie e a sessão (é a mesma criadora que saiu);
 * 2. troca o `code` pelo token;
 * 3. descobre qual conta profissional do Instagram ela autorizou;
 * 4. guarda a conexão com o token CIFRADO;
 * 5. faz a primeira coleta já aqui, para ela voltar vendo os próprios números.
 *
 * Qualquer desfecho volta para a tela de onde ela saiu, com ?instagram=<resultado>,
 * que a tela traduz em mensagem (MENSAGEM_DO_RETORNO).
 */

export const dynamic = "force-dynamic"
export const maxDuration = 60

type Cookie = { state: string; voltar: string; uid: string }

export async function GET(req: NextRequest) {
    const url = new URL(req.url)

    let cookie: Cookie | null = null
    try {
        cookie = JSON.parse(req.cookies.get(COOKIE_DO_LOGIN)?.value ?? "null")
    } catch {
        cookie = null
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL("/creator/login", url.origin))

    const voltar = cookie?.uid === user.id ? cookie.voltar : `/creator/${user.id}/metricas`
    const ir = (resultado: string) => {
        const resposta = NextResponse.redirect(new URL(comRetorno(voltar, resultado), url.origin))
        resposta.cookies.delete({ name: COOKIE_DO_LOGIN, path: "/api/instagram" })
        return resposta
    }

    if (url.searchParams.get("error")) return ir("cancelado")
    if (!loginConfigurado()) return ir("nao_configurado")

    const code = (url.searchParams.get("code") ?? "").replace(/#_$/, "")
    const state = url.searchParams.get("state") ?? ""
    // Sem cookie (expirou em 15 min ou outro navegador) ou state diferente: não
    // há como saber se este retorno é mesmo desta criadora.
    if (!cookie || !code || cookie.state !== state || cookie.uid !== user.id) return ir("expirado")

    const troca = await trocarCodigo(code, urlDeRedirecionamento(url.origin))
    if (!troca) return ir("erro")

    const login = await contasDoLogin(troca.token)
    if (login.contas.length === 0) {
        if (login.erro) console.error("[instagram] contas autorizadas:", login.erro)
        return ir("sem_conta")
    }

    const admin = createAdminClient()
    const kit = await garantirKit(user.id)

    // Se ela autorizou mais de uma conta, fica a que já está no kit; senão, a primeira.
    let conta = login.contas[0]
    if (kit && login.contas.length > 1) {
        const { data } = await admin.from("somos_preta_midia_kits").select("redes").eq("id", kit.id).maybeSingle()
        const noKit = String((data?.redes as Record<string, { handle?: string }> | null)?.instagram?.handle ?? "").toLowerCase()
        conta = login.contas.find((c) => c.username === noKit) ?? conta
    }

    // Uma conta do Instagram pertence a um perfil só: sem isto, duas pessoas
    // poderiam exibir os mesmos números como se fossem delas.
    const { data: deOutro } = await admin
        .from("somos_preta_instagram_conexoes")
        .select("profile_id")
        .eq("ig_user_id", conta.id)
        .neq("profile_id", user.id)
        .maybeSingle()
    if (deOutro) return ir("ja_conectada")

    const { error } = await admin.from("somos_preta_instagram_conexoes").upsert(
        {
            profile_id: user.id,
            kit_id: kit?.id ?? null,
            influencer_id: kit?.influencer_id ?? null,
            ig_user_id: conta.id,
            username: conta.username,
            meta_user_id: login.metaUserId,
            client_business_id: login.clientBusinessId,
            token_cifrado: cifrar(troca.token),
            token_expira_em: troca.expiraEm,
            status: "ativa",
            ultimo_erro: null,
            conectado_em: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
        { onConflict: "profile_id" },
    )
    if (error) {
        console.error("[instagram] não consegui guardar a conexão (migration 0025 aplicada?):", error.message)
        return ir("erro")
    }

    const coleta = await sincronizarConexao({ profileId: user.id, forcar: true, preencherKit: true })
    return ir(coleta.ok ? "conectado" : "conectado_sem_coleta")
}
