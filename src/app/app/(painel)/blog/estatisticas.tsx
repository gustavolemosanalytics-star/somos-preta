"use client"

import type { ReactNode } from "react"
import { CalendarClock, CalendarDays, Eye, PencilLine } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { PostDaLista } from "./tipos"

const fmt = (n: number) => n.toLocaleString("pt-BR")

function Metrica({ icone, cor, valor, rotulo, variacao }: {
    icone: ReactNode
    cor: string
    valor: string
    rotulo: string
    variacao?: { texto: string; sentido: "alta" | "baixa" | "estavel" } | null
}) {
    return (
        <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl sm:h-12 sm:w-12", cor)}>
                        {icone}
                    </div>
                    <div className="min-w-0">
                        <p className="text-2xl font-semibold leading-none tracking-tight sm:text-3xl">{valor}</p>
                        <p className="mt-1.5 truncate text-sm text-muted-foreground">{rotulo}</p>
                    </div>
                </div>
                {variacao && (
                    <p className={cn(
                        "mt-3 flex items-center gap-1 text-xs font-medium",
                        variacao.sentido === "alta" ? "text-status-sucesso"
                            : variacao.sentido === "baixa" ? "text-status-erro"
                                : "text-muted-foreground"
                    )}>
                        <span aria-hidden>
                            {variacao.sentido === "alta" ? "↑" : variacao.sentido === "baixa" ? "↓" : "→"}
                        </span>
                        {variacao.texto}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

/**
 * Os quatro números do topo da tela.
 *
 * Tudo é derivado da lista já carregada, exceto a audiência, que vem da RPC
 * somos_preta_blog_metricas() — a contagem vive em tabela própria justamente
 * para não marcar o post como editado a cada visita.
 */
export function Estatisticas({ posts, viewsMes, viewsMesAnterior, agora }: {
    posts: PostDaLista[]
    viewsMes: number
    viewsMesAnterior: number
    /** Instante do carregamento. Vem de fora porque ler o relógio durante o
     *  render torna o componente impuro — e o resultado mudaria a cada re-render. */
    agora: number
}) {
    const publicados = posts.filter((p) => p.status === "publicado")
    const rascunhos = posts.filter((p) => p.status === "rascunho").length
    const agendados = posts.filter((p) => p.status === "agendado").length

    // Janela de 30 dias, e não "mês corrente": no dia 1º um recorte por mês
    // civil mostraria zero e pareceria que o blog parou.
    const limite = agora - 30 * 24 * 60 * 60 * 1000
    const noUltimoMes = agora === 0 ? 0 : publicados.filter(
        (p) => p.publicado_em && new Date(p.publicado_em).getTime() >= limite
    ).length

    // Sem mês anterior não há percentual honesto a mostrar — nesse caso o card
    // fica só com o número absoluto.
    const variacaoViews = viewsMesAnterior > 0
        ? Math.round(((viewsMes - viewsMesAnterior) / viewsMesAnterior) * 100)
        : null

    return (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica
                icone={<CalendarDays className="h-5 w-5" />}
                cor="bg-status-sucesso/12 text-status-sucesso"
                valor={fmt(publicados.length)}
                rotulo="Publicados"
                variacao={noUltimoMes > 0 ? { texto: `+${noUltimoMes} no último mês`, sentido: "alta" } : null}
            />
            <Metrica
                icone={<PencilLine className="h-5 w-5" />}
                cor="bg-status-atencao/12 text-status-atencao"
                valor={fmt(rascunhos)}
                rotulo="Rascunhos"
            />
            <Metrica
                icone={<CalendarClock className="h-5 w-5" />}
                cor="bg-status-info/12 text-status-info"
                valor={fmt(agendados)}
                rotulo="Agendados"
            />
            <Metrica
                icone={<Eye className="h-5 w-5" />}
                cor="bg-primary/12 text-primary"
                valor={fmt(viewsMes)}
                rotulo="Visualizações (mês)"
                variacao={variacaoViews === null ? null : variacaoViews === 0 ? {
                    // Empate não é crescimento: pintar de verde com seta para
                    // cima faria o card mentir num mês parado.
                    texto: "estável vs. mês anterior",
                    sentido: "estavel",
                } : {
                    texto: `${variacaoViews > 0 ? "+" : ""}${variacaoViews}% vs. mês anterior`,
                    sentido: variacaoViews > 0 ? "alta" : "baixa",
                }}
            />
        </div>
    )
}
