import type { TarefaStatus, TarefaPrioridade, TarefaEventoTipo } from "@/lib/db/types"

export const TAREFA_STATUS_ORDEM: TarefaStatus[] = [
    "backlog", "a_fazer", "em_andamento", "aguardando_terceiro",
    "aguardando_aprovacao", "bloqueada", "concluida", "cancelada",
]

export const TAREFA_STATUS: Record<TarefaStatus, { label: string; className: string }> = {
    backlog: { label: "Backlog", className: "bg-muted text-muted-foreground" },
    a_fazer: { label: "A fazer", className: "bg-slate-500/15 text-slate-600" },
    em_andamento: { label: "Em andamento", className: "bg-blue-500/15 text-blue-600" },
    aguardando_terceiro: { label: "Aguardando terceiro", className: "bg-amber-500/15 text-amber-600" },
    aguardando_aprovacao: { label: "Aguardando aprovação", className: "bg-purple-500/15 text-purple-600" },
    bloqueada: { label: "Bloqueada", className: "bg-red-500/15 text-red-600" },
    concluida: { label: "Concluída", className: "bg-green-500/15 text-green-600" },
    cancelada: { label: "Cancelada", className: "bg-zinc-500/15 text-zinc-500" },
}

export const TAREFA_PRIORIDADE: Record<TarefaPrioridade, { label: string; className: string }> = {
    baixa: { label: "Baixa", className: "text-muted-foreground" },
    media: { label: "Média", className: "text-blue-600" },
    alta: { label: "Alta", className: "text-orange-600" },
    urgente: { label: "Urgente", className: "text-red-600" },
}

export const TAREFA_EVENTO_LABEL: Record<TarefaEventoTipo, string> = {
    criacao: "criou a tarefa",
    status: "mudou o status",
    prioridade: "mudou a prioridade",
    prazo: "mudou o prazo",
    responsavel: "mudou o responsável",
    solicitante: "mudou o solicitante",
    colaborador_adicionado: "adicionou um colaborador",
    colaborador_removido: "removeu um colaborador",
    conclusao: "concluiu a tarefa",
    reabertura: "reabriu a tarefa",
}

const TAREFA_STATUS_FINALIZADOS: TarefaStatus[] = ["concluida", "cancelada"]

export function tarefaPrazoBadge(t: { data_entrega: string | null; status: TarefaStatus }) {
    if (!t.data_entrega || TAREFA_STATUS_FINALIZADOS.includes(t.status)) return null
    const hoje = new Date().toISOString().slice(0, 10)
    if (t.data_entrega < hoje) return { label: "Atrasada", className: "bg-red-500/15 text-red-600" }
    if (t.data_entrega === hoje) return { label: "Vence hoje", className: "bg-amber-500/15 text-amber-600" }
    return null
}
