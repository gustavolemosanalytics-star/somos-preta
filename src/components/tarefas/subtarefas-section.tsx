"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Subtarefa } from "@/lib/db/types"
import { UserPicker } from "./user-picker"
import { ErroDeCarregamento } from "@/components/painel/erro-de-carregamento"
import { confirmarEscrita, lidos } from "@/lib/supabase/resultado"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function SubtarefasSection({ tarefaId }: { tarefaId: string }) {
    const [supabase] = useState(() => createClient())
    const [subtarefas, setSubtarefas] = useState<Subtarefa[]>([])
    const [novoTitulo, setNovoTitulo] = useState("")
    const [erroCarga, setErroCarga] = useState(false)

    async function load() {
        const resposta = await supabase
            .from("somos_preta_subtarefas")
            .select("*")
            .eq("tarefa_id", tarefaId)
            .order("ordem")
            .order("created_at")
        const lista = lidos<Subtarefa>(resposta)
        setErroCarga(!lista)
        setSubtarefas(lista ?? [])
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tarefaId])

    async function criar() {
        if (!novoTitulo.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_subtarefas").insert({
            tarefa_id: tarefaId, titulo: novoTitulo.trim(), created_by: user?.id ?? null,
        })
        if (error) { toast.error("Erro ao criar subtarefa"); return }
        setNovoTitulo("")
        load()
    }

    async function atualizar(s: Subtarefa, patch: Partial<Subtarefa>) {
        setSubtarefas((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...patch } : x)))
        const ok = await confirmarEscrita(
            supabase.from("somos_preta_subtarefas").update(patch).eq("id", s.id).select("id"),
            "Não foi possível salvar a subtarefa",
        )
        // Desfaz o otimismo: sem isso a tela guardaria para sempre um prazo que nunca foi gravado.
        if (!ok) load()
    }

    async function toggle(s: Subtarefa, concluida: boolean) {
        await atualizar(s, { concluida, status: concluida ? "concluida" : "a_fazer" })
    }

    async function excluir(id: string) {
        const ok = await confirmarEscrita(
            supabase.from("somos_preta_subtarefas").delete().eq("id", id).select("id"),
            "Não foi possível excluir a subtarefa",
        )
        if (!ok) return
        setSubtarefas((prev) => prev.filter((x) => x.id !== id))
    }

    const concluidas = subtarefas.filter((s) => s.concluida).length
    const progresso = subtarefas.length > 0 ? Math.round((concluidas / subtarefas.length) * 100) : 0

    if (erroCarga) {
        return <ErroDeCarregamento recurso="as subtarefas" onTentarDeNovo={load} />
    }

    return (
        <div className="space-y-3">
            {subtarefas.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">
                        {concluidas} de {subtarefas.length} concluídas · {progresso}%
                    </p>
                    <Progress value={progresso} className="h-1.5" />
                </div>
            )}
            <ul className="space-y-2">
                {subtarefas.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center gap-2 border rounded-lg px-2.5 py-2">
                        <Checkbox checked={s.concluida} onCheckedChange={(v) => toggle(s, v === true)} />
                        <span className={`flex-1 min-w-[120px] text-sm truncate ${s.concluida ? "line-through text-muted-foreground" : ""}`}>
                            {s.titulo}
                        </span>
                        <Input
                            type="date"
                            value={s.prazo ?? ""}
                            onChange={(e) => atualizar(s, { prazo: e.target.value || null })}
                            className="h-7 w-[132px] text-xs"
                        />
                        <div className="w-[160px]">
                            <UserPicker value={s.responsavel_id} onChange={(v) => atualizar(s, { responsavel_id: v })} placeholder="Responsável" allowClear />
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-status-erro" aria-label="Excluir subtarefa" title="Excluir subtarefa">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir subtarefa?</AlertDialogTitle>
                                    <AlertDialogDescription>&quot;{s.titulo}&quot; será removida. Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => excluir(s.id)} className="bg-destructive text-white hover:bg-destructive/90">Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </li>
                ))}
            </ul>
            {subtarefas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma subtarefa ainda.</p>
            )}
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Nova subtarefa..."
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); criar() } }}
                    className="h-8"
                />
                <Button size="sm" variant="outline" onClick={criar}><Plus className="h-4 w-4" /></Button>
            </div>
        </div>
    )
}
