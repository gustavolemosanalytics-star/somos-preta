import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { sincronizarConexao } from "@/lib/instagram/sincronizar"

/**
 * "Atualizar agora" da criadora. Sempre a conexão da sessão — o corpo nunca
 * diz de quem é. A Meta só é consultada de novo depois do intervalo mínimo;
 * antes disso volta o retrato guardado.
 */

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, mensagem: "Sua sessão expirou. Entre de novo." }, { status: 401 })

    const resultado = await sincronizarConexao({ profileId: user.id })
    const http = resultado.ok ? 200 : resultado.status === "limite" ? 429 : resultado.status === "token" ? 409 : 503
    return NextResponse.json(resultado, { status: http })
}
