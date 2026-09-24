import { NextResponse } from "next/server"
import QRCode from "qrcode"

import { createClient } from "@/lib/supabase/server"
import { SITE_URL } from "@/lib/constants/site"

/**
 * QR Code do Media Kit, em SVG.
 *
 * SVG e não PNG porque o uso real é impresso: crachá de evento, verso de
 * cartão, slide de apresentação. Um PNG de tamanho fixo fica serrilhado no
 * primeiro zoom; o vetor não.
 *
 * O kit precisa estar PUBLICADO. Gerar o código de um rascunho entregaria à
 * criadora um QR que leva para uma página de "não encontrado" — pior que não
 * ter o botão.
 */
export async function GET(_pedido: Request, { params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    const supabase = await createClient()
    const { data } = await supabase
        .from("somos_preta_midia_kits_publicos")
        .select("slug")
        .eq("slug", slug)
        .single()

    if (!data) {
        return NextResponse.json({ error: "Media Kit não encontrado ou ainda não publicado" }, { status: 404 })
    }

    const svg = await QRCode.toString(`${SITE_URL}/kit/${slug}`, {
        type: "svg",
        // A margem de 1 módulo é o mínimo que os leitores exigem para achar as
        // bordas; sem ela, o código colado num fundo colorido às vezes não lê.
        margin: 1,
        // Nível médio de correção: aguenta o borrão de uma impressão caseira
        // sem inchar o desenho a ponto de exigir um quadrado grande demais.
        errorCorrectionLevel: "M",
        color: { dark: "#1F1F1F", light: "#FFFFFF" },
    })

    return new NextResponse(svg, {
        headers: {
            "Content-Type": "image/svg+xml; charset=utf-8",
            "Content-Disposition": `inline; filename="qrcode-${slug}.svg"`,
            // O conteúdo só muda se o endereço mudar, e aí o slug muda junto.
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
    })
}
