import { NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/server"
import { exigirEquipe } from "@/lib/instagram/acesso"
import { verificarApp } from "@/lib/instagram/graph"

/**
 * Estado da integração com o Instagram, para o cartão de Configurações.
 *
 * Responde o que a equipe precisa para agir: o app está configurado? o
 * segredo confere? quantas criadoras conectaram, quantas perderam o acesso?
 */

export const dynamic = "force-dynamic"

export async function GET() {
    const acesso = await exigirEquipe()
    if (!acesso.ok) return NextResponse.json({ ok: false, mensagem: acesso.mensagem }, { status: acesso.http })

    const app = await verificarApp()

    const admin = createAdminClient()
    const umDia = new Date(Date.now() - 86_400_000).toISOString()
    const contar = (filtro: (q: any) => any) => // eslint-disable-line @typescript-eslint/no-explicit-any
        filtro(admin.from("somos_preta_instagram_conexoes").select("id", { count: "exact", head: true }))
    const [ativas, revogadas, comErro, atualizadas] = await Promise.all([
        contar((q) => q.eq("status", "ativa")),
        contar((q) => q.eq("status", "revogada")),
        contar((q) => q.eq("status", "erro")),
        contar((q) => q.gte("ultima_coleta_em", umDia)),
    ])

    return NextResponse.json({
        app,
        rotina: Boolean(process.env.CRON_SECRET),
        redirecionamento: process.env.INSTAGRAM_REDIRECT_URI ?? null,
        conexoes: {
            // null = tabela ainda não existe (migration 0025 pendente)
            ativas: ativas.error ? null : ativas.count,
            revogadas: revogadas.error ? null : revogadas.count,
            com_erro: comErro.error ? null : comErro.count,
            atualizadas_24h: atualizadas.error ? null : atualizadas.count,
        },
    })
}
