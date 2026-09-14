import type { Area, Tarefa, TarefaMetrica } from "@/lib/db/types"

export type PessoaResumo = {
    id: string
    nome: string | null
    email: string | null
    avatar_url: string | null
}

export type TarefaDaLista = Tarefa & {
    campanha: {
        id: string
        nome: string
        cliente: { id: string; nome: string } | null
    } | null
    area: Pick<Area, "id" | "nome" | "cor"> | null
}

export type MapaMetricas = Map<string, TarefaMetrica>

/** Visões da tela — o mock as apresenta como abas de um mesmo lugar. */
export const VISOES = ["minhas", "board", "lista", "calendario"] as const
export type Visao = (typeof VISOES)[number]

export const VISAO_LABEL: Record<Visao, string> = {
    minhas: "Minhas tarefas",
    board: "Board",
    lista: "Lista",
    calendario: "Calendário",
}

/**
 * Instante em que a tarefa começa, para posicioná-la na grade do calendário.
 *
 * `horario` é nullable e só passou a ser gravado recentemente: tarefa sem hora
 * não tem lugar numa grade por hora e vai para a faixa "Dia inteiro" — sem
 * isso, uma semana cheia renderizaria vazia.
 */
export function instanteDaTarefa(t: Pick<Tarefa, "data_entrega" | "horario">) {
    if (!t.data_entrega) return null
    if (!t.horario) return { dia: t.data_entrega, minutos: null as number | null }
    const [h, m] = t.horario.split(":").map(Number)
    return { dia: t.data_entrega, minutos: h * 60 + (m || 0) }
}
