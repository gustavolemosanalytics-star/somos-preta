import { NextResponse } from "next/server"

import { exigirEquipe } from "@/lib/instagram/acesso"
import { sincronizarLote } from "@/lib/instagram/sincronizar"

/**
 * "Atualizar a base agora" — o mesmo trabalho da rotina diária, disparado
 * pela equipe em Configurações. Processa um lote por vez para caber no tempo
 * de uma requisição e na cota da Meta.
 */

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function POST() {
    const acesso = await exigirEquipe()
    if (!acesso.ok) return NextResponse.json({ ok: false, mensagem: acesso.mensagem }, { status: acesso.http })

    const resultado = await sincronizarLote(20)
    return NextResponse.json(resultado, { status: resultado.ok ? 200 : 500 })
}
