import { randomBytes } from "node:crypto"
import { NextResponse } from "next/server"

import { SITE_URL } from "@/lib/constants/site"
import { lerSignedRequest } from "@/lib/instagram/graph"
import { apagarConexao } from "@/lib/instagram/sincronizar"

/**
 * Callback de exclusão de dados exigido pela Meta (App Dashboard →
 * "URL de solicitação de exclusão de dados").
 *
 * A Meta manda um POST com `signed_request` quando a pessoa remove o app e
 * pede para apagar os dados. A assinatura é conferida com o segredo do app;
 * só então apagamos tudo daquela conta e devolvemos o JSON que a Meta exige:
 * um endereço de acompanhamento e um código de confirmação.
 *
 * O `user_id` que chega é o id que a Meta associa ao nosso app. Ele é casado
 * com o `meta_user_id` guardado no login e, por segurança, também com o id da
 * conta do Instagram.
 */

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
    const form = await req.formData().catch(() => null)
    const dados = lerSignedRequest(String(form?.get("signed_request") ?? ""))
    if (!dados?.user_id) return NextResponse.json({ erro: "signed_request inválido" }, { status: 400 })

    const id = String(dados.user_id)
    const apagadas =
        (await apagarConexao({ metaUserId: id })) + (await apagarConexao({ igUserId: id }))

    const codigo = randomBytes(8).toString("hex")
    console.log(`[instagram] exclusão de dados ${codigo}: ${apagadas} conexão(ões) apagada(s)`)

    return NextResponse.json({
        url: `${SITE_URL}/instagram/exclusao?codigo=${codigo}`,
        confirmation_code: codigo,
    })
}
