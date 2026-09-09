import type { TarefaStatus, TarefaPrioridade, TarefaEventoTipo } from "@/lib/db/types"

export const TAREFA_STATUS_ORDEM: TarefaStatus[] = [
    "backlog", "a_fazer", "em_andamento", "aguardando_terceiro",
    "aguardando_aprovacao", "bloqueada", "concluida", "cancelada",
]

export const TAREFA_STATUS: Record<TarefaStatus, { label: string; className: string }> = {
    backlog: { label: "Backlog", className: "bg-muted text-muted-foreground" },
    a_fazer: { label: "A fazer", className: "bg-transparent text-foreground/70 border-border" },
    em_andamento: { label: "Em andamento", className: "bg-status-progresso/12 text-status-progresso" },
    aguardando_terceiro: { label: "Aguardando terceiro", className: "bg-status-atencao/12 text-status-atencao" },
    aguardando_aprovacao: { label: "Aguardando aprovação", className: "bg-status-info/12 text-status-info" },
    bloqueada: { label: "Bloqueada", className: "bg-status-erro/12 text-status-erro" },
    concluida: { label: "Concluída", className: "bg-status-sucesso/12 text-status-sucesso" },
    cancelada: { label: "Cancelada", className: "bg-transparent text-status-erro border-status-erro/40" },
}

export const TAREFA_PRIORIDADE: Record<TarefaPrioridade, { label: string; className: string }> = {
    baixa: { label: "Baixa", className: "text-muted-foreground" },
    media: { label: "Média", className: "text-status-info" },
    alta: { label: "Alta", className: "text-status-atencao" },
    urgente: { label: "Urgente", className: "text-status-erro" },
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
    titulo: "alterou o título",
    descricao: "alterou a descrição",
    tags: "alterou as tags",
    campanha: "moveu a tarefa de campanha",
    arquivamento: "alterou o arquivamento",
    evidencia_obrigatoria: "alterou a exigência de evidência",
}

const TAREFA_STATUS_FINALIZADOS: TarefaStatus[] = ["concluida", "cancelada"]

export function tarefaPrazoBadge(t: { data_entrega: string | null; status: TarefaStatus }) {
    if (!t.data_entrega || TAREFA_STATUS_FINALIZADOS.includes(t.status)) return null
    const hoje = new Date().toISOString().slice(0, 10)
    if (t.data_entrega < hoje) return { label: "Atrasada", className: "bg-status-erro/12 text-status-erro" }
    if (t.data_entrega === hoje) return { label: "Vence hoje", className: "bg-status-atencao/12 text-status-atencao" }
    return null
}
