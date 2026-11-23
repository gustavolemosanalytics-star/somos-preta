import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/server"
import { exigirEquipe } from "@/lib/instagram/acesso"
import { sincronizarConexao } from "@/lib/instagram/sincronizar"

/**
 * A equipe atualiza o Instagram de um criador da base.
 *
 * POST { influencerId }
 *
 * Só existe o que a própria criadora autorizou: a rota acha a CONEXÃO ligada
 * àquele criador e coleta com o token dela. Criador que nunca conectou não tem
 * o que atualizar — a resposta diz isso, e a ficha oferece o convite.
 */

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: Request) {
    const acesso = await exigirEquipe()
    if (!acesso.ok) return NextResponse.json({ ok: false, mensagem: acesso.mensagem }, { status: acesso.http })

    const corpo = (await req.json().catch(() => ({}))) as { influencerId?: unknown }
    const influencerId = typeof corpo.influencerId === "string" ? corpo.influencerId : null
    if (!influencerId) return NextResponse.json({ ok: false, mensagem: "Criador não informado." }, { status: 400 })

    const admin = createAdminClient()
    let { data: conexao } = await admin
        .from("somos_preta_instagram_conexoes")
        .select("profile_id")
        .eq("influencer_id", influencerId)
        .maybeSingle()

    // Conexão feita antes de o kit ganhar vínculo com a base: acha pelo kit.
    if (!conexao) {
        const { data: kit } = await admin.from("somos_preta_midia_kits").select("cadastrado_por").eq("influencer_id", influencerId).maybeSingle()
        if (kit?.cadastrado_por) {
            const r = await admin.from("somos_preta_instagram_conexoes").select("profile_id").eq("profile_id", kit.cadastrado_por).maybeSingle()
            conexao = r.data
        }
    }

    if (!conexao) {
        return NextResponse.json(
            { ok: false, status: "sem_conexao", mensagem: "Este criador ainda não conectou o Instagram pela área dele." },
            { status: 404 },
        )
    }

    const resultado = await sincronizarConexao({ profileId: conexao.profile_id, forcar: true })
    return NextResponse.json(resultado, { status: resultado.ok ? 200 : resultado.status === "limite" ? 429 : 422 })
}
