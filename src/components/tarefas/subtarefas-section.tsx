"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Subtarefa } from "@/lib/db/types"
import { UserPicker } from "./user-picker"
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

    async function load() {
        const { data } = await supabase
            .from("somos_preta_subtarefas")
            .select("*")
            .eq("tarefa_id", tarefaId)
            .order("ordem")
            .order("created_at")
        setSubtarefas((data as Subtarefa[]) ?? [])
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
        const { error } = await supabase.from("somos_preta_subtarefas").update(patch).eq("id", s.id)
        if (error) { toast.error("Erro ao salvar"); load() }
    }

    async function toggle(s: Subtarefa, concluida: boolean) {
        await atualizar(s, { concluida, status: concluida ? "concluida" : "a_fazer" })
    }

    async function excluir(id: string) {
        const { error } = await supabase.from("somos_preta_subtarefas").delete().eq("id", id)
        if (error) { toast.error("Erro ao excluir"); return }
        setSubtarefas((prev) => prev.filter((x) => x.id !== id))
    }

    const concluidas = subtarefas.filter((s) => s.concluida).length
    const progresso = subtarefas.length > 0 ? Math.round((concluidas / subtarefas.length) * 100) : 0

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
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600" onClick={() => excluir(s.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    </li>
                ))}
            </ul>
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
