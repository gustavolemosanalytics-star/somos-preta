import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { apagarConexao } from "@/lib/instagram/sincronizar"
import { lerConexao } from "@/lib/instagram/conexao"

/**
 * "Desconectar" da criadora: apaga o token e TUDO que veio do Instagram dela
 * (histórico, retrato do kit, imagens copiadas). Desconectar e continuar
 * exibindo os dados seria guardar informação da Meta sem autorização.
 *
 * Para revogar também do lado da Meta, ela remove o app em Configurações do
 * portfólio → Integrações → Apps conectados (a tela avisa).
 */

export const dynamic = "force-dynamic"

/** O estado da conexão da sessão (sem token), para telas de cliente como o editor. */
export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ conexao: null }, { status: 401 })
    return NextResponse.json({ conexao: await lerConexao(user.id) })
}

export async function DELETE() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, mensagem: "Sua sessão expirou. Entre de novo." }, { status: 401 })

    const apagadas = await apagarConexao({ profileId: user.id })
    return NextResponse.json({ ok: true, apagadas })
}
