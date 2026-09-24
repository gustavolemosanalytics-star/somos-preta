"use client"

import { useEffect, useRef } from "react"
import { Printer } from "lucide-react"

import { registrarEventoDoKit } from "@/lib/metricas-kit"

/**
 * Abre o diálogo de impressão assim que a folha termina de carregar, e conta o
 * download.
 *
 * O `window.load` (e não o efeito puro) é obrigatório: chamar print() antes de
 * as imagens chegarem gera um PDF com retângulos cinzas no lugar da foto de
 * perfil e da capa — justamente o que a marca ia olhar primeiro.
 *
 * A barra de cima existe para o caso de o navegador bloquear a abertura
 * automática, o que acontece quando a pessoa chega aqui sem ter clicado em
 * nada. Ela some na impressão.
 */
export function AbrirImpressao({ slug }: { slug: string }) {
    const jaAbriu = useRef(false)

    useEffect(() => {
        if (jaAbriu.current) return
        jaAbriu.current = true

        void registrarEventoDoKit(slug, "download_pdf")

        function imprimir() {
            // Um quadro de folga para o layout assentar depois do load.
            requestAnimationFrame(() => window.print())
        }

        if (document.readyState === "complete") {
            imprimir()
            return
        }
        window.addEventListener("load", imprimir, { once: true })
        return () => window.removeEventListener("load", imprimir)
    }, [slug])

    return (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-brand-carvao px-5 py-3 text-white print:hidden">
            <p className="text-[13px] leading-relaxed text-white/80">
                Escolha <strong className="font-semibold text-white">Salvar como PDF</strong> no destino da
                impressão.
            </p>
            <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand-terracota px-5 text-sm font-bold text-white transition-colors hover:bg-brand-coral"
            >
                <Printer className="h-4 w-4" aria-hidden />
                Abrir impressão
            </button>
        </div>
    )
}
