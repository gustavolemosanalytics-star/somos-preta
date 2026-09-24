"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

/**
 * O endereço público do kit, com o botão de copiar ao lado.
 *
 * O link é o produto desta tela: quem entra aqui quase sempre quer pegá-lo para
 * mandar numa conversa. Por isso ele fica em campo próprio, legível inteiro, e
 * o botão confirma na própria cara dele por dois segundos — sem depender só do
 * toast, que aparece no canto oposto da tela.
 */
export function CopiarLinkDoKit({
    endereco,
    caminho,
    className,
}: {
    /** Como o link é mostrado, sem o esquema: somospreta.com/kit/fulana */
    endereco: string
    /** O caminho relativo, para montar a URL absoluta no clique. */
    caminho: string
    className?: string
}) {
    const [copiado, setCopiado] = useState(false)

    async function copiar() {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}${caminho}`)
            setCopiado(true)
            toast.success("Link copiado")
            setTimeout(() => setCopiado(false), 2000)
        } catch {
            // A promessa do clipboard rejeita em contexto não-seguro e quando a
            // permissão é negada; anunciar sucesso ali seria mentir.
            toast.error("Não consegui copiar — selecione o link e copie na mão")
        }
    }

    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 pl-5",
                className,
            )}
        >
            <code className="min-w-0 flex-1 break-all py-2 text-[15px] text-white/90">{endereco}</code>

            <button
                type="button"
                onClick={copiar}
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-terracota px-5 text-sm font-bold text-white transition-colors hover:bg-brand-coral"
            >
                {copiado ? (
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                ) : (
                    <Copy className="h-4 w-4" aria-hidden />
                )}
                {copiado ? "Copiado" : "Copiar link"}
            </button>
        </div>
    )
}
