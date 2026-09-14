"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Card de métrica do painel — ícone em quadrado colorido, número grande,
 * rótulo e, opcionalmente, uma variação e um link.
 *
 * Nasceu na tela de blog e virou peça própria porque aparece nas quatro telas:
 * seis deles em Tarefas, quatro em Campanhas, quatro em Clientes, cinco no
 * Dashboard. O KPICard antigo (components/dashboard/kpi-card.tsx) tem outro
 * desenho — ícone à direita, rótulo em caixa alta — e não cabia nos mocks.
 */

export type Variacao = {
    texto: string
    /** "estavel" existe para o empate não ser pintado de verde com seta para cima. */
    sentido: "alta" | "baixa" | "estavel"
}

const SETA: Record<Variacao["sentido"], string> = { alta: "↑", baixa: "↓", estavel: "→" }

const COR_VARIACAO: Record<Variacao["sentido"], string> = {
    alta: "text-status-sucesso",
    baixa: "text-status-erro",
    estavel: "text-muted-foreground",
}

/**
 * Monta a variação a partir de dois números.
 *
 * Sem base de comparação não há percentual honesto — devolve null, e o card
 * fica só com o número absoluto em vez de inventar "+100%".
 */
export function variacaoPercentual(atual: number, anterior: number, sufixo = "vs. mês anterior"): Variacao | null {
    if (anterior <= 0) return null
    const pct = Math.round(((atual - anterior) / anterior) * 100)
    if (pct === 0) return { texto: `estável ${sufixo}`, sentido: "estavel" }
    return { texto: `${pct > 0 ? "+" : ""}${pct}% ${sufixo}`, sentido: pct > 0 ? "alta" : "baixa" }
}

export function MetricaCard({
    icone, cor, valor, rotulo, variacao, detalhe, href, hrefLabel, onClick, destaque,
}: {
    icone: ReactNode
    /** Classes do quadrado do ícone, ex.: "bg-status-sucesso/12 text-status-sucesso". */
    cor: string
    valor: string | number
    rotulo: string
    variacao?: Variacao | null
    /** Linha de apoio abaixo do rótulo ("2 vencem hoje"). */
    detalhe?: string
    href?: string
    hrefLabel?: string
    onClick?: () => void
    /** Pinta a borda — usado no card de alerta ("Campanha atrasada"). */
    destaque?: "erro" | "atencao"
}) {
    const conteudo = (
        <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12", cor)}>
                    {icone}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-2xl font-semibold leading-none tracking-tight sm:text-3xl">{valor}</p>
                    <p className="mt-1.5 truncate text-sm text-muted-foreground">{rotulo}</p>
                </div>
                {(href || onClick) && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
                )}
            </div>

            {variacao && (
                <p className={cn("mt-3 flex items-center gap-1 text-xs font-medium", COR_VARIACAO[variacao.sentido])}>
                    <span aria-hidden>{SETA[variacao.sentido]}</span>
                    {variacao.texto}
                </p>
            )}

            {!variacao && detalhe && (
                <p className="mt-3 truncate text-xs text-muted-foreground">{detalhe}</p>
            )}

            {variacao && detalhe && (
                <p className="mt-1 truncate text-xs text-muted-foreground">{detalhe}</p>
            )}

            {href && hrefLabel && (
                <p className="mt-2 text-xs font-medium text-primary">{hrefLabel}</p>
            )}
        </CardContent>
    )

    const classe = cn(
        "rounded-2xl border-border/60 shadow-sm transition-colors",
        (href || onClick) && "hover:border-primary/40",
        destaque === "erro" && "border-status-erro/40",
        destaque === "atencao" && "border-status-atencao/40",
    )

    if (href) {
        return <Link href={href} className="block"><Card className={classe}>{conteudo}</Card></Link>
    }

    if (onClick) {
        return (
            <Card className={cn(classe, "cursor-pointer")} onClick={onClick}>
                {conteudo}
            </Card>
        )
    }

    return <Card className={classe}>{conteudo}</Card>
}
