import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { KitVitrine, type DadosVitrine } from "@/components/public/kit-vitrine"

/**
 * Página pública do Media Kit.
 *
 * O desenho vive em <KitVitrine> porque o editor do criador renderiza o MESMO
 * componente como prévia ao vivo. Duplicar o layout aqui faria a prévia mentir
 * na primeira vez que uma das duas cópias mudasse.
 */

type MidiaKitPublico = DadosVitrine & {
    id: string
    slug: string
    publicado: boolean
    created_at: string
}

async function getKit(slug: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("somos_preta_midia_kits_publicos")
        .select("*")
        .eq("slug", slug)
        .single()

    if (error || !data) return null
    return data as MidiaKitPublico
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const kit = await getKit(slug)

    if (!kit || !kit.publicado) {
        return { title: "Media Kit não encontrado" }
    }

    return {
        title: `${kit.nome} — Media Kit`,
        description: kit.bio ?? undefined,
        openGraph: {
            title: `${kit.nome} — Media Kit`,
            description: kit.bio ?? undefined,
            images: kit.cover_url ? [kit.cover_url] : kit.avatar_url ? [kit.avatar_url] : undefined,
        },
    }
}

export default async function MediaKitPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const kit = await getKit(slug)

    if (!kit || !kit.publicado) notFound()

    return <KitVitrine kit={kit} />
}
