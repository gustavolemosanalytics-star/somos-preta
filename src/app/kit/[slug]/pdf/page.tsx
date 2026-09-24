import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { KitVitrine, type DadosVitrine } from "@/components/public/kit-vitrine"
import { AbrirImpressao } from "./abrir-impressao"

/**
 * O Media Kit em folha, para virar PDF.
 *
 * Quem gera o arquivo é o navegador, pelo diálogo de impressão, e não uma
 * biblioteca nossa. A alternativa seria subir um navegador sem interface no
 * servidor só para desenhar esta página — dezenas de megabytes no deploy e
 * mais uma peça para quebrar — e o resultado seria o mesmo PDF que o Chrome já
 * sabe fazer a partir do HTML que ele acabou de renderizar.
 *
 * A folha é a própria vitrine: o que a marca recebe impresso é exatamente o
 * que ela veria na tela, sem versão paralela para manter em dia.
 */

type KitPublico = DadosVitrine & { slug: string; publicado: boolean }

async function buscar(slug: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from("somos_preta_midia_kits_publicos")
        .select("*")
        .eq("slug", slug)
        .single()
    return (data as KitPublico | null) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const kit = await buscar(slug)
    return {
        // O título da aba vira o nome do arquivo sugerido no diálogo de
        // impressão: "Media Kit — Fulana.pdf" é melhor que "kit-fulana".
        title: kit ? `Media Kit — ${kit.nome}` : "Media Kit",
        robots: { index: false, follow: false },
    }
}

export default async function KitEmPdfPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const kit = await buscar(slug)

    if (!kit || !kit.publicado) notFound()

    return (
        <>
            <AbrirImpressao slug={slug} />

            {/* A moldura de tela some na impressão; a vitrine fica. */}
            <div className="mx-auto w-full max-w-[820px] bg-background print:max-w-none">
                <KitVitrine kit={kit} />
            </div>
        </>
    )
}
