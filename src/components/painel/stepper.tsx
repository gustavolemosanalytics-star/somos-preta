"use client"

import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Trilha de etapas do card de campanha: Briefing → … → Relatório.
 *
 * A linha de ligação fica ATRÁS das bolinhas, num elemento próprio com largura
 * proporcional ao progresso — desenhá-la como borda de cada item deixaria
 * pontas soltas nas extremidades.
 */
export function Stepper({ etapas, atual, className }: {
    etapas: string[]
    /** Índice da etapa corrente; -1 quando nem começou. */
    atual: number
    className?: string
}) {
    const ultimo = etapas.length - 1
    // A linha vai do centro da primeira bolinha ao centro da última, por isso o
    // percentual é calculado sobre os intervalos, não sobre a contagem.
    const progresso = ultimo > 0 ? Math.max(0, Math.min(atual, ultimo)) / ultimo : 0

    return (
        <div className={cn("w-full", className)}>
            <div className="relative">
                <div
                    className="absolute top-2.5 h-0.5 bg-border"
                    style={{ left: `${50 / etapas.length}%`, right: `${50 / etapas.length}%` }}
                    aria-hidden
                />
                <div
                    className="absolute top-2.5 h-0.5 bg-status-sucesso transition-[width]"
                    style={{
                        left: `${50 / etapas.length}%`,
                        width: `${(100 - 100 / etapas.length) * progresso}%`,
                    }}
                    aria-hidden
                />

                <ol className="relative flex">
                    {etapas.map((etapa, i) => {
                        const concluida = i < atual
                        const corrente = i === atual
                        return (
                            <li key={etapa} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                                <span
                                    className={cn(
                                        "flex h-5 w-5 items-center justify-center rounded-full border-2 bg-card transition-colors",
                                        concluida && "border-status-sucesso bg-status-sucesso text-white",
                                        corrente && "border-primary bg-primary text-white",
                                        !concluida && !corrente && "border-border",
                                    )}
                                    aria-hidden
                                >
                                    {concluida && <Check className="h-3 w-3" strokeWidth={3} />}
                                </span>
                                <span
                                    className={cn(
                                        "w-full truncate text-center text-[11px] leading-tight",
                                        corrente ? "font-medium text-foreground" : "text-muted-foreground",
                                    )}
                                    title={etapa}
                                >
                                    {etapa}
                                </span>
                            </li>
                        )
                    })}
                </ol>
            </div>
        </div>
    )
}
