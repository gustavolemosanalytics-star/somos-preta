"use client"

import { CalendarClock, CalendarDays, Eye, PencilLine } from "lucide-react"

import {
    MetricaCard, variacaoDeEstoque, variacaoPercentual,
} from "@/components/painel/metrica-card"
import type { PostDaLista } from "./tipos"

const fmt = (n: number) => n.toLocaleString("pt-BR")

/**
 * Os quatro números do topo da tela de blog.
 *
 * Usa o MetricaCard compartilhado — esta tela tinha um card próprio, quase
 * igual, e as duas versões já estavam divergindo em altura e espaçamento.
 *
 * Tudo vem da lista já carregada, exceto a audiência, que sai da RPC
 * somos_preta_blog_metricas(): a contagem vive em tabela separada justamente
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

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricaCard
                icone={<CalendarDays className="h-5 w-5" />}
                cor="bg-status-sucesso/12 text-status-sucesso"
                valor={fmt(publicados.length)}
                rotulo="Publicados"
                // Estoque: o percentual descreve o próprio acervo, e não a
                // diferença entre duas janelas de publicação.
                variacao={variacaoDeEstoque(publicados.length, noUltimoMes)}
                detalhe={noUltimoMes > 0 ? `+${noUltimoMes} no último mês` : undefined}
            />
            <MetricaCard
                icone={<PencilLine className="h-5 w-5" />}
                cor="bg-status-atencao/12 text-status-atencao"
                valor={fmt(rascunhos)}
                rotulo="Rascunhos"
            />
            <MetricaCard
                icone={<CalendarClock className="h-5 w-5" />}
                cor="bg-status-info/12 text-status-info"
                valor={fmt(agendados)}
                rotulo="Agendados"
            />
            <MetricaCard
                icone={<Eye className="h-5 w-5" />}
                cor="bg-primary/12 text-primary"
                valor={fmt(viewsMes)}
                rotulo="Visualizações (mês)"
                // Aqui o número JÁ É contagem de período, então comparar com o
                // mês anterior é a leitura certa.
                variacao={variacaoPercentual(viewsMes, viewsMesAnterior)}
            />
        </div>
    )
}
