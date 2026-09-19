"use client"

import { useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { NICHOS_SUGERIDOS } from "@/lib/constants/media-kit"

/**
 * Nichos como fichas, não como texto separado por vírgula.
 *
 * O campo antigo era um <Input> em que a criadora digitava "moda, beleza" e
 * torcia: não havia como apagar um nicho sem reescrever a lista inteira, e um
 * espaço a mais virava nicho novo. Aqui cada nicho é uma ficha removível e as
 * sugestões entram com um toque.
 */
export function EntradaNichos({
    id,
    nichos,
    onMudar,
    className,
}: {
    id: string
    nichos: string[]
    onMudar: (nichos: string[]) => void
    className?: string
}) {
    const [rascunho, setRascunho] = useState("")
    const movimentoReduzido = useReducedMotion()

    // Comparação sem acento e sem caixa: quem já tem "Moda" não deve conseguir
    // adicionar "moda" nem "MODA" como se fosse outro nicho.
    const iguais = (a: string, b: string) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" }) === 0

    /**
     * Aceita vários de uma vez. Quem vem do campo antigo — ou do bloco de
     * notas — cola "Moda, Beleza, Lifestyle" inteiro; tratar isso como um
     * nicho só criava uma ficha com as vírgulas dentro, que ia assim para a
     * página pública.
     */
    function adicionar(valor: string) {
        const partes = (valor ?? "").split(",").map((p) => p.trim()).filter(Boolean)
        if (partes.length === 0) {
            setRascunho("")
            return
        }

        const proximos = [...nichos]
        for (const parte of partes) {
            if (proximos.length >= 8) break
            if (proximos.some((n) => iguais(n, parte))) continue
            proximos.push(parte)
        }

        setRascunho("")
        if (proximos.length !== nichos.length) onMudar(proximos)
    }

    function remover(alvo: string) {
        onMudar(nichos.filter((n) => n !== alvo))
    }

    const sugestoes = NICHOS_SUGERIDOS.filter((s) => !nichos.some((n) => iguais(n, s))).slice(0, 8)
    const animacao = movimentoReduzido
        ? {}
        : {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              // A saída é só opacidade, como em todo o resto do produto:
              // encolher a ficha faz as vizinhas darem um salto de layout.
              exit: { opacity: 0 },
              transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
          }

    return (
        <div className={cn("space-y-3", className)}>
            {nichos.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    <AnimatePresence initial={false}>
                        {nichos.map((nicho) => (
                            <motion.li key={nicho} layout={!movimentoReduzido} {...animacao}>
                                {/* O texto é carvão, não terracota: terracota sobre a
                                    ficha de 12%% dá 2,47:1 de contraste, metade do
                                    mínimo da WCAG AA. A cor fica no fundo, que é
                                    onde ela não precisa ser lida. */}
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-terracota/12 py-1.5 pl-3.5 pr-1.5 text-[13px] font-medium text-foreground">
                                    {nicho}
                                    <button
                                        type="button"
                                        onClick={() => remover(nicho)}
                                        aria-label={`Remover o nicho ${nicho}`}
                                        title={`Remover ${nicho}`}
                                        // A área de toque cresce além do
                                        // desenho pelo ::after: o X precisa
                                        // continuar pequeno dentro da ficha,
                                        // mas 21px de alvo faz errar o dedo.
                                        className="!min-h-6 !min-w-6 relative rounded-full text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:bg-brand-terracota/20 hover:text-foreground"
                                    >
                                        <X className="h-3.5 w-3.5" aria-hidden />
                                    </button>
                                </span>
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            )}

            <Input
                id={id}
                value={rascunho}
                disabled={nichos.length >= 8}
                placeholder={nichos.length >= 8 ? "Oito nichos já é bastante" : "Digite um nicho e aperte Enter"}
                autoCapitalize="words"
                className="h-11 rounded-xl"
                onChange={(e) => {
                    // A vírgula também fecha a ficha: é o gesto que quem usou o
                    // campo antigo já tem no dedo.
                    if (e.target.value.includes(",")) adicionar(e.target.value)
                    else setRascunho(e.target.value)
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault()
                        adicionar(rascunho)
                    }
                    if (e.key === "Backspace" && !rascunho && nichos.length) {
                        remover(nichos[nichos.length - 1])
                    }
                }}
                onBlur={() => adicionar(rascunho)}
            />

            {sugestoes.length > 0 && nichos.length < 8 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Sugestões:</span>
                    {sugestoes.map((sugestao) => (
                        <button
                            key={sugestao}
                            type="button"
                            onClick={() => adicionar(sugestao)}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 text-[13px] font-medium text-muted-foreground hover:border-brand-terracota hover:bg-accent hover:text-foreground"
                        >
                            <Plus className="h-3 w-3" aria-hidden /> {sugestao}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
