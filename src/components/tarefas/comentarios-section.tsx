"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { TarefaComentario, TarefaComentarioTipo } from "@/lib/db/types"
import { useProfiles } from "@/hooks/use-profiles"
import { MentionTextarea, TextoComMencoes, extrairMencoes } from "./mention-textarea"
import { UserAvatar } from "./user-picker"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

const TIPO_LABEL: Record<TarefaComentarioTipo, string> = {
    comentario: "Comentário",
    duvida: "Dúvida",
    bloqueio: "Bloqueio",
    atualizacao: "Atualização",
    solicitacao_revisao: "Solicitação de revisão",
}

export function ComentariosSection({ tarefaId }: { tarefaId: string }) {
    const [supabase] = useState(() => createClient())
    const { profiles } = useProfiles()
    const [comentarios, setComentarios] = useState<TarefaComentario[]>([])
    const [texto, setTexto] = useState("")
    const [tipo, setTipo] = useState<TarefaComentarioTipo>("comentario")
    const [enviando, setEnviando] = useState(false)
    const [filtroTipo, setFiltroTipo] = useState<TarefaComentarioTipo | "todos">("todos")

    async function load() {
        const { data } = await supabase
            .from("somos_preta_tarefa_comentarios")
            .select("*")
            .eq("tarefa_id", tarefaId)
            .is("subtarefa_id", null)
            .order("created_at")
        setComentarios((data as TarefaComentario[]) ?? [])
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tarefaId])

    async function enviar() {
        if (!texto.trim()) return
        setEnviando(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase.from("somos_preta_tarefa_comentarios").insert({
            tarefa_id: tarefaId, autor_id: user?.id ?? null, conteudo: texto.trim(), tipo,
        }).select("id").single()

        if (error || !data) { toast.error("Erro ao enviar"); setEnviando(false); return }

        const mencoes = extrairMencoes(texto)
        if (mencoes.length > 0) {
            await supabase.from("somos_preta_tarefa_mencoes").insert(mencoes.map((profile_id) => ({ comentario_id: data.id, profile_id })))
        }

        setTexto("")
        setTipo("comentario")
        setEnviando(false)
        load()
    }

    const profilesById = new Map(profiles.map((p) => [p.id, p]))

    const contagemPorTipo = useMemo(() => {
        const c: Record<string, number> = {}
        comentarios.forEach((com) => { c[com.tipo] = (c[com.tipo] ?? 0) + 1 })
        return c
    }, [comentarios])

    const comentariosFiltrados = filtroTipo === "todos" ? comentarios : comentarios.filter((c) => c.tipo === filtroTipo)

    return (
        <div className="space-y-4">
            {comentarios.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    <Badge
                        variant={filtroTipo === "todos" ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFiltroTipo("todos")}
                    >
                        Todos ({comentarios.length})
                    </Badge>
                    {(Object.keys(TIPO_LABEL) as TarefaComentarioTipo[]).filter((t) => contagemPorTipo[t]).map((t) => (
                        <Badge
                            key={t}
                            variant={filtroTipo === t ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setFiltroTipo(t)}
                        >
                            {TIPO_LABEL[t]} ({contagemPorTipo[t]})
                        </Badge>
                    ))}
                </div>
            )}
            <ul className="space-y-3">
                {comentariosFiltrados.map((c) => {
                    const autor = c.autor_id ? profilesById.get(c.autor_id) : null
                    return (
                        <li key={c.id} className="flex gap-2.5">
                            <UserAvatar profile={autor} className="mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium">{autor?.nome ?? autor?.email ?? "Usuário"}</span>
                                    {c.tipo !== "comentario" && (
                                        <span className="text-[10px] uppercase font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">
                                            {TIPO_LABEL[c.tipo]}
                                        </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                                    </span>
                                </div>
                                <p className="text-sm mt-0.5 whitespace-pre-wrap"><TextoComMencoes texto={c.conteudo} /></p>
                            </div>
                        </li>
                    )
                })}
                {comentariosFiltrados.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {comentarios.length === 0 ? "Nenhuma atualização ainda." : "Nenhuma atualização deste tipo."}
                    </p>
                )}
            </ul>

            <div className="space-y-2">
                <MentionTextarea value={texto} onChange={setTexto} placeholder="Escreva uma atualização... use @ para mencionar alguém" rows={3} />
                <div className="flex items-center justify-between gap-2">
                    <Select value={tipo} onValueChange={(v) => setTipo(v as TarefaComentarioTipo)}>
                        <SelectTrigger className="w-[200px] h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(TIPO_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" onClick={enviar} disabled={enviando || !texto.trim()}>
                        <Send className="h-4 w-4" /> Enviar
                    </Button>
                </div>
            </div>
        </div>
    )
}
