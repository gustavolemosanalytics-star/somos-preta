import { NextResponse } from "next/server"

import { chamadaDaRotina } from "@/lib/instagram/acesso"
import { sincronizarLote } from "@/lib/instagram/sincronizar"

/**
 * Rotina diária (vercel.json): atualiza o Instagram de quem está há mais de
 * 20 horas sem coleta, um lote por execução.
 *
 * É ela que faz o gráfico de crescimento existir — sem uma coleta por dia, o
 * histórico só teria os pontos dos dias em que alguém lembrou de apertar
 * "Atualizar" — e que renova as capas dos destaques antes de a Meta trocar
 * as URLs.
 */

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(req: Request) {
    if (!chamadaDaRotina(req)) return NextResponse.json({ ok: false }, { status: 401 })

    const resultado = await sincronizarLote(30)
    console.log("[cron/instagram]", JSON.stringify(resultado))
    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 500 })
}
