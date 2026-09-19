"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { ETAPAS, type ChaveEtapa } from "@/lib/constants/media-kit"

/**
 * A trilha das sete etapas.
 *
 * Substitui a <TabsList> do shadcn, que era o bug relatado: ela é
 * `inline-flex w-fit` com gatilhos `flex-1 whitespace-nowrap`, então seis
 * rótulos passavam de 560px e, abaixo de ~675px de viewport, os nomes se
 * sobrepunham e as últimas abas saíam da tela sem rolagem nenhuma.
 *
 * Aqui a faixa rola de propósito no eixo X, com snap, e a etapa ativa se traz
 * para o campo de visão sozinha — quem chega na etapa 6 pelo teclado não fica
 * olhando para uma trilha parada na etapa 1.
 */
export function TrilhaEtapas({
    atual,
    prontas,
    onIr,
    className,
}: {
    atual: ChaveEtapa
    prontas: Record<ChaveEtapa, boolean>
    onIr: (chave: ChaveEtapa) => void
    className?: string
}) {
    const faixaRef = useRef<HTMLDivElement>(null)
    const movimentoReduzido = useReducedMotion()
    const indiceAtual = ETAPAS.findIndex((e) => e.chave === atual)

    useEffect(() => {
        const ativo = faixaRef.current?.querySelector<HTMLElement>('[data-ativo="true"]')
        ativo?.scrollIntoView({
            // Rolagem suave é movimento, e quem pediu menos movimento no
            // sistema não é atendido pelas regras de CSS do globals aqui.
            behavior: movimentoReduzido ? "auto" : "smooth",
            block: "nearest",
            inline: "center",
        })
    }, [atual, movimentoReduzido])

    return (
        <nav aria-label="Etapas do Media Kit" className={className}>
            <div
                ref={faixaRef}
                className={cn(
                    "flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1",
                    // A barra de rolagem some porque a trilha já se anuncia pelo
                    // corte das fichas na borda; uma barra cinza no meio da tela
                    // só suja o desenho.
                    "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                )}
            >
                {ETAPAS.map((etapa, i) => {
                    const ativa = etapa.chave === atual
                    const pronta = prontas[etapa.chave]
                    const Icone = etapa.icone

                    return (
                        <button
                            key={etapa.chave}
                            type="button"
                            data-ativo={ativa}
                            aria-current={ativa ? "step" : undefined}
                            onClick={() => onIr(etapa.chave)}
                            className={cn(
                                "!min-h-12 group flex shrink-0 snap-start items-center gap-2.5 rounded-full border px-4 text-left",
                                ativa
                                    ? "border-brand-terracota bg-brand-terracota text-white"
                                    : "border-border bg-card hover:border-brand-terracota hover:bg-accent",
                            )}
                        >
                            <span
                                aria-hidden
                                className={cn(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                                    ativa && "bg-white/20 text-white",
                                    !ativa && pronta && "bg-status-sucesso/12 text-status-sucesso",
                                    !ativa && !pronta && "bg-muted text-muted-foreground",
                                )}
                            >
                                {pronta && !ativa ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : etapa.numero}
                            </span>

                            <span className="flex flex-col leading-tight">
                                <span className={cn("text-[13px] font-semibold", !ativa && "text-foreground")}>
                                    {etapa.titulo}
                                </span>
                                <span
                                    className={cn(
                                        // Branco a 75% sobre terracota cai para 2,3:1 e a
                                        // linha que explica a etapa some ao sol. Em branco
                                        // cheio ela acompanha o título da ficha.
                                        "text-[11px]",
                                        ativa ? "text-white" : "text-muted-foreground",
                                    )}
                                >
                                    {etapa.chamada}
                                </span>
                            </span>

                            <Icone
                                aria-hidden
                                className={cn(
                                    "ml-1 h-4 w-4 shrink-0",
                                    ativa ? "text-white/70" : "text-muted-foreground/50",
                                )}
                            />

                            <span className="sr-only">
                                Etapa {i + 1} de {ETAPAS.length}
                                {pronta ? ", concluída" : ", pendente"}
                            </span>
                        </button>
                    )
                })}
            </div>

            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Etapa {indiceAtual + 1} de {ETAPAS.length}
            </p>
        </nav>
    )
}
