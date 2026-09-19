"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Check, CircleAlert, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * O recibo do salvamento automático.
 *
 * A tela salva sozinha ao sair de cada campo e, antes disto, só falava quando
 * dava errado: a criadora escrevia a bio inteira e não tinha nenhuma prova de
 * que aquilo tinha sido guardado. Como também não existe botão "Salvar", muita
 * gente fechava a aba achando que tinha perdido o trabalho.
 */

export type EstadoSalvamento = "ocioso" | "salvando" | "salvo" | "erro"

export function IndicadorSalvamento({
    estado,
    onTentarDeNovo,
    className,
}: {
    estado: EstadoSalvamento
    onTentarDeNovo?: () => void
    className?: string
}) {
    const movimentoReduzido = useReducedMotion()

    const animacao = movimentoReduzido
        ? {}
        : {
              initial: { opacity: 0, y: -4 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0 },
              transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
          }

    return (
        <div
            aria-live="polite"
            aria-atomic
            className={cn("flex h-7 items-center justify-end text-[13px] font-medium", className)}
        >
            <AnimatePresence mode="wait">
                {estado === "salvando" && (
                    <motion.span key="salvando" {...animacao} className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Salvando…
                    </motion.span>
                )}

                {estado === "salvo" && (
                    <motion.span key="salvo" {...animacao} className="flex items-center gap-1.5 text-status-sucesso">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> Tudo salvo
                    </motion.span>
                )}

                {estado === "erro" && (
                    <motion.span key="erro" {...animacao} className="flex items-center gap-2 text-status-erro">
                        <CircleAlert className="h-3.5 w-3.5" aria-hidden /> Não consegui salvar
                        {onTentarDeNovo && (
                            <button
                                type="button"
                                onClick={onTentarDeNovo}
                                // Sem o override, o alvo global de 44px vale —
                                // e este botão é a saída de um erro de rede, o
                                // pior lugar para errar o toque.
                                className="rounded-full px-3 underline underline-offset-4 hover:text-foreground"
                            >
                                Tentar de novo
                            </button>
                        )}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    )
}
