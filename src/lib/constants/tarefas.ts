import type { TarefaStatus, TarefaPrioridade, TarefaEventoTipo } from "@/lib/db/types"

export const TAREFA_STATUS_ORDEM: TarefaStatus[] = [
    "backlog", "a_fazer", "em_andamento", "em_revisao", "aguardando_terceiro",
    "aguardando_aprovacao", "bloqueada", "concluida", "cancelada",
]

export const TAREFA_STATUS: Record<TarefaStatus, { label: string; className: string }> = {
    backlog: { label: "Backlog", className: "bg-muted text-muted-foreground" },
    a_fazer: { label: "A fazer", className: "bg-transparent text-foreground/70 border-border" },
    em_andamento: { label: "Em andamento", className: "bg-status-progresso/12 text-status-progresso" },
    em_revisao: { label: "Em revisão", className: "bg-status-atencao/12 text-status-atencao" },
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

/**
 * As cinco colunas do board, e quais status caem em cada uma.
 *
 * São nove status e cinco colunas de propósito: o board é para enxergar o fluxo
 * de relance, e uma coluna por status viraria uma régua de nove faixas quase
 * sempre vazias. "Bloqueada" e "Aguardando terceiro" ficam em Em andamento —
 * o trabalho começou e não voltou para trás, só está travado.
 *
 * `cancelada` não tem coluna: é saída morta, e mantê-la no board ocuparia
 * espaço com o que ninguém vai puxar. Ela continua acessível pelo filtro de
 * status na visão Lista.
 */
export const TAREFA_BOARD_COLUNAS: { titulo: string; status: TarefaStatus[] }[] = [
    { titulo: "Backlog", status: ["backlog"] },
    { titulo: "A fazer", status: ["a_fazer"] },
    { titulo: "Em andamento", status: ["em_andamento", "bloqueada", "aguardando_terceiro"] },
    { titulo: "Em revisão", status: ["em_revisao", "aguardando_aprovacao"] },
    { titulo: "Concluída", status: ["concluida"] },
]

/** Status para o qual a tarefa vai ao ser solta numa coluna. */
export const STATUS_PADRAO_DA_COLUNA: Record<string, TarefaStatus> = {
    "Backlog": "backlog",
    "A fazer": "a_fazer",
    "Em andamento": "em_andamento",
    "Em revisão": "em_revisao",
    "Concluída": "concluida",
}

/** Status em que a tarefa ainda consome atenção. */
export const TAREFA_STATUS_ABERTOS: TarefaStatus[] = [
    "backlog", "a_fazer", "em_andamento", "em_revisao",
    "aguardando_terceiro", "aguardando_aprovacao", "bloqueada",
]

const TAREFA_STATUS_FINALIZADOS: TarefaStatus[] = ["concluida", "cancelada"]

/**
 * Etiqueta de prazo.
 *
 * `horario` entra no rótulo quando existe: "Hoje · 17:00" diz muito mais do que
 * "Vence hoje" para quem está decidindo o que fazer agora. A coluna existe
 * desde 0007 e nenhuma listagem a lia.
 */
export function tarefaPrazoBadge(t: { data_entrega: string | null; horario?: string | null; status: TarefaStatus }) {
    if (!t.data_entrega || TAREFA_STATUS_FINALIZADOS.includes(t.status)) return null
    const hoje = new Date().toISOString().slice(0, 10)
    const hora = t.horario ? ` · ${t.horario.slice(0, 5)}` : ""
    if (t.data_entrega < hoje) return { label: "Atrasada", className: "bg-status-erro/12 text-status-erro" }
    if (t.data_entrega === hoje) return { label: `Hoje${hora}`, className: "bg-status-atencao/12 text-status-atencao" }
    return null
}
