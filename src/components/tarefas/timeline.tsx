"use client"

import type { TarefaEvento, TarefaStatus, TarefaPrioridade, Profile } from "@/lib/db/types"
import { TAREFA_EVENTO_LABEL, TAREFA_STATUS, TAREFA_PRIORIDADE } from "@/lib/constants/tarefas"
import { UserAvatar } from "./user-picker"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

type Campanha = { id: string; nome: string }

const COM_TRANSICAO: TarefaEvento["tipo"][] = [
    "status", "prioridade", "prazo", "responsavel", "solicitante", "titulo", "descricao", "tags", "campanha",
]
const EVENTO_SIMPLES: TarefaEvento["tipo"][] = ["arquivamento", "evidencia_obrigatoria"]

function nomeDe(id: string | null, profilesById: Map<string, Profile>) {
    if (!id) return "ninguém"
    const p = profilesById.get(id)
    return p?.nome ?? p?.email ?? "alguém"
}

function descreverValor(
    tipo: TarefaEvento["tipo"],
    valor: string | null,
    profilesById: Map<string, Profile>,
    campanhasById: Map<string, Campanha>
) {
    if (valor === null) return "—"
    switch (tipo) {
        case "status":
            return TAREFA_STATUS[valor as TarefaStatus]?.label ?? valor
        case "prioridade":
            return TAREFA_PRIORIDADE[valor as TarefaPrioridade]?.label ?? valor
        case "prazo":
            try { return format(new Date(`${valor}T00:00:00`), "dd/MM/yyyy") } catch { return valor }
        case "responsavel":
        case "solicitante":
        case "colaborador_adicionado":
        case "colaborador_removido":
            return nomeDe(valor, profilesById)
        case "campanha":
            return campanhasById.get(valor)?.nome ?? valor
        case "evidencia_obrigatoria":
            return valor === "true" ? "Sim" : "Não"
        case "arquivamento":
            return valor === "true" ? "Arquivada" : "Ativa"
        case "descricao":
            return valor.length > 80 ? `${valor.slice(0, 80)}…` : valor
        default:
            return valor
    }
}

export function Timeline({ eventos, profiles, campanhas = [] }: { eventos: TarefaEvento[]; profiles: Profile[]; campanhas?: Campanha[] }) {
    const profilesById = new Map(profiles.map((p) => [p.id, p]))
    const campanhasById = new Map(campanhas.map((c) => [c.id, c]))

    if (eventos.length === 0) {
        return <p className="text-sm text-muted-foreground py-6 text-center">Nenhum evento ainda.</p>
    }

    return (
        <ol className="space-y-4">
            {eventos.map((e) => {
                const autor = e.autor_id ? profilesById.get(e.autor_id) : null
                return (
                    <li key={e.id} className="flex gap-3 text-sm">
                        <UserAvatar profile={autor} className="mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <p>
                                <span className="font-medium">{autor?.nome ?? autor?.email ?? "Sistema"}</span>{" "}
                                <span className="text-muted-foreground">{TAREFA_EVENTO_LABEL[e.tipo]}</span>
                                {COM_TRANSICAO.includes(e.tipo) && (
                                    <>
                                        {" "}<span className="text-muted-foreground">de</span>{" "}
                                        <span className="font-medium">{descreverValor(e.tipo, e.valor_anterior, profilesById, campanhasById)}</span>{" "}
                                        <span className="text-muted-foreground">para</span>{" "}
                                        <span className="font-medium">{descreverValor(e.tipo, e.valor_novo, profilesById, campanhasById)}</span>
                                    </>
                                )}
                                {(e.tipo === "colaborador_adicionado" || e.tipo === "colaborador_removido") && (
                                    <> <span className="font-medium">{descreverValor(e.tipo, e.valor_novo ?? e.valor_anterior, profilesById, campanhasById)}</span></>
                                )}
                                {EVENTO_SIMPLES.includes(e.tipo) && (
                                    <> <span className="font-medium">{descreverValor(e.tipo, e.valor_novo, profilesById, campanhasById)}</span></>
                                )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR })}
                                {" · "}
                                {format(new Date(e.created_at), "dd/MM/yyyy 'às' HH:mm")}
                            </p>
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}
