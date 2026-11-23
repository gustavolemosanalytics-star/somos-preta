import { NextResponse } from "next/server"

import { lerSignedRequest } from "@/lib/instagram/graph"
import { apagarConexao } from "@/lib/instagram/sincronizar"

/**
 * Callback de desautorização (App Dashboard → "URL de retorno de chamada para
 * cancelar autorização"). A Meta avisa aqui quando a pessoa remove o app.
 *
 * Sem autorização não há por que manter token nem dados: apaga tudo, como no
 * "Desconectar". Se a Meta não chamar esta rota (o Unified Login não
 * documenta o aviso), a próxima coleta recebe "token inválido", marca a
 * conexão como revogada e a criadora vê o pedido para conectar de novo.
 */

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    const form = await req.formData().catch(() => null)
    const dados = lerSignedRequest(String(form?.get("signed_request") ?? ""))
    if (!dados?.user_id) return NextResponse.json({ ok: false }, { status: 400 })

    const id = String(dados.user_id)
    await apagarConexao({ metaUserId: id })
    await apagarConexao({ igUserId: id })
    return NextResponse.json({ ok: true })
}
