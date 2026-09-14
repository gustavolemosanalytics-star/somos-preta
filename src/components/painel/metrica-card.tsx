"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Card de métrica do painel.
 *
 * As linhas são fixas de propósito — ícone + número, contexto, rodapé —, e o
 * rodapé é empurrado para baixo com `mt-auto`. Antes cada card tinha as linhas
 * que o dado permitisse, e a fileira ficava com alturas diferentes: o de
 * criadores, com variação E detalhe, crescia e desalinhava a linha inteira.
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
 * Variação entre dois períodos — para número que JÁ É contagem de período
 * ("campanhas criadas no mês").
 *
 * Sem base de comparação não há percentual honesto: devolve null e o card fica
 * só com o número absoluto, em vez de inventar "+100%".
 */
export function variacaoPercentual(atual: number, anterior: number, sufixo = "vs. mês anterior"): Variacao | null {
    if (anterior <= 0) return null
    const pct = Math.round(((atual - anterior) / anterior) * 100)
    if (pct === 0) return { texto: `estável ${sufixo}`, sentido: "estavel" }
    return { texto: `${pct > 0 ? "+" : ""}${pct}% ${sufixo}`, sentido: pct > 0 ? "alta" : "baixa" }
}

/**
 * Crescimento de um ESTOQUE — para número que é total acumulado
 * ("424 criadores na base").
 *
 * Comparar "entraram 0 este mês" com "entraram 12 no mês passado" e estampar
 * −100% em vermelho ao lado de um total que não caiu é a tela mentindo: as duas
 * grandezas não são a mesma. Aqui o percentual descreve o próprio total.
 */
export function variacaoDeEstoque(total: number, novos: number, sufixo = "no último mês"): Variacao | null {
    const base = total - novos
    if (base <= 0) return null
    if (novos === 0) return { texto: `estável ${sufixo}`, sentido: "estavel" }
    const pct = Math.round((novos / base) * 100)
    return { texto: `+${pct}% ${sufixo}`, sentido: "alta" }
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
    /** Linha de apoio ("2 vencem hoje"). Some quando há variação, para o card
     *  não crescer uma linha a mais que os vizinhos. */
    detalhe?: string
    href?: string
    hrefLabel?: string
    onClick?: () => void
    /** Pinta a borda — usado no card de alerta ("Campanha atrasada"). */
    destaque?: "erro" | "atencao"
}) {
    const contexto = variacao
        ? <span className={cn("flex items-center gap-1 font-medium", COR_VARIACAO[variacao.sentido])}>
            <span aria-hidden>{SETA[variacao.sentido]}</span>
            {variacao.texto}
        </span>
        : detalhe
            ? <span className="text-muted-foreground">{detalhe}</span>
            : null

    const conteudo = (
        <CardContent className="flex h-full flex-col p-5">
            <div className="flex items-center gap-3.5">
                <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", cor)}>
                    {icone}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-2xl font-semibold leading-none tracking-tight sm:text-3xl">{valor}</p>
                    <p className="mt-1.5 truncate text-sm text-muted-foreground">{rotulo}</p>
                </div>
                {(href || onClick) && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden />
                )}
            </div>

            {/* Reserva a linha mesmo vazia: é o que mantém a fileira alinhada
                quando um card tem contexto e o vizinho não. */}
            <p className="mt-3 min-h-4 truncate text-xs">{contexto}</p>

            {href && hrefLabel && (
                <p className="mt-auto pt-2 text-xs font-medium text-primary">{hrefLabel}</p>
            )}
        </CardContent>
    )

    const classe = cn(
        "h-full transition-colors",
        (href || onClick) && "hover:border-primary/30",
        destaque === "erro" && "border-status-erro/30",
        destaque === "atencao" && "border-status-atencao/30",
    )

    if (href) {
        return <Link href={href} className="block h-full"><Card className={classe}>{conteudo}</Card></Link>
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
