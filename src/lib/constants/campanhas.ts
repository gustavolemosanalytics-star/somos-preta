import type { Campanha, CampanhaEtapa, CampanhaStatus, ClienteStatus } from "@/lib/db/types"

/**
 * Vocabulário de campanhas e clientes — fonte única.
 *
 * O mapa de status estava copiado em três telas (campanhas, campanhas/[id] e
 * clientes/[id]) e já tinha começado a divergir. Com ele aqui, acrescentar um
 * status é uma edição só, e o TypeScript aponta quem esqueceu de tratá-lo.
 */

export const CAMPANHA_STATUS_ORDEM: CampanhaStatus[] = [
    "rascunho", "planejamento", "em_aprovacao", "ativa", "concluida", "cancelada",
]

export const CAMPANHA_STATUS: Record<CampanhaStatus, { label: string; className: string }> = {
    rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
    planejamento: { label: "Planejamento", className: "bg-status-info/12 text-status-info" },
    em_aprovacao: { label: "Em aprovação", className: "bg-status-atencao/12 text-status-atencao" },
    ativa: { label: "Em andamento", className: "bg-status-sucesso/12 text-status-sucesso" },
    concluida: { label: "Concluída", className: "bg-primary/15 text-primary" },
    cancelada: { label: "Cancelada", className: "bg-status-erro/12 text-status-erro" },
}

/** Status que contam como campanha viva nas métricas do topo. */
export const CAMPANHA_STATUS_ATIVOS: CampanhaStatus[] = ["planejamento", "em_aprovacao", "ativa"]

// ----------------------------------------------------------------------------
// Etapas (o stepper do card)
// ----------------------------------------------------------------------------

/**
 * A etapa é ORTOGONAL ao status: uma campanha "ativa" pode estar em Mapeamento
 * ou em Produção. Status é o estado administrativo do registro; etapa é onde a
 * entrega está.
 */
export const CAMPANHA_ETAPA_ORDEM: CampanhaEtapa[] = [
    "briefing", "mapeamento", "aprovacao", "producao", "relatorio",
]

export const CAMPANHA_ETAPA_LABEL: Record<CampanhaEtapa, string> = {
    briefing: "Briefing",
    mapeamento: "Mapeamento",
    aprovacao: "Aprovação",
    producao: "Produção",
    relatorio: "Relatório",
}

export function indiceDaEtapa(etapa: CampanhaEtapa) {
    return CAMPANHA_ETAPA_ORDEM.indexOf(etapa)
}

// ----------------------------------------------------------------------------
// Clientes
// ----------------------------------------------------------------------------

export const CLIENTE_STATUS_ORDEM: ClienteStatus[] = ["prospeccao", "ativo", "pausado", "encerrado"]

export const CLIENTE_STATUS: Record<ClienteStatus, { label: string; className: string; ponto: string }> = {
    prospeccao: { label: "Prospecção", className: "bg-status-info/12 text-status-info", ponto: "bg-status-info" },
    ativo: { label: "Ativo", className: "bg-status-sucesso/12 text-status-sucesso", ponto: "bg-status-sucesso" },
    pausado: { label: "Pausado", className: "bg-status-atencao/12 text-status-atencao", ponto: "bg-status-atencao" },
    encerrado: { label: "Encerrado", className: "bg-muted text-muted-foreground", ponto: "bg-muted-foreground" },
}

// ----------------------------------------------------------------------------
// Dinheiro
// ----------------------------------------------------------------------------

export const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

type OrcamentoCampanha = Pick<
    Campanha,
    "orcamento_estimado" | "orcamento_aprovado" | "orcamento_final" | "budget"
>

/**
 * Qual dos três números mostrar, e com que nome.
 *
 * O card escreve "Orçamento aprovado", "estimado" ou "final" conforme o que a
 * campanha já tem — chamar de aprovado um valor que ainda é chute seria a tela
 * mentindo. A ordem é do mais definitivo para o mais provisório; `budget` é o
 * campo legado e fecha a fila.
 */
export function orcamentoDaCampanha(c: OrcamentoCampanha) {
    if (c.orcamento_final != null) return { rotulo: "Orçamento final", valor: c.orcamento_final }
    if (c.orcamento_aprovado != null) return { rotulo: "Orçamento aprovado", valor: c.orcamento_aprovado }
    if (c.orcamento_estimado != null) return { rotulo: "Orçamento estimado", valor: c.orcamento_estimado }
    if (c.budget) return { rotulo: "Orçamento", valor: c.budget }
    return null
}
