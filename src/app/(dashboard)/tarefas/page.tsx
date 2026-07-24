"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Tarefa, TarefaStatus, TarefaPrioridade } from "@/lib/db/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ClipboardList, Loader2 } from "lucide-react"
import { toast } from "sonner"

type TarefaComCampanha = Tarefa & { campanha: { id: string; nome: string } | null }

const TAREFA_STATUS: Record<TarefaStatus, { label: string; className: string }> = {
    pendente: { label: "Pendente", className: "bg-muted text-muted-foreground" },
    em_andamento: { label: "Em andamento", className: "bg-blue-500/15 text-blue-600" },
    concluida: { label: "Concluída", className: "bg-green-500/15 text-green-600" },
    bloqueada: { label: "Bloqueada", className: "bg-red-500/15 text-red-600" },
}
const PRIORIDADE: Record<TarefaPrioridade, { label: string; className: string }> = {
    baixa: { label: "Baixa", className: "text-muted-foreground" },
    media: { label: "Média", className: "text-blue-600" },
    alta: { label: "Alta", className: "text-orange-600" },
    urgente: { label: "Urgente", className: "text-red-600" },
}
const FILTROS: { value: TarefaStatus | "todas"; label: string }[] = [
    { value: "todas", label: "Todas" },
    { value: "pendente", label: "Pendentes" },
    { value: "em_andamento", label: "Em andamento" },
    { value: "concluida", label: "Concluídas" },
    { value: "bloqueada", label: "Bloqueadas" },
]

export default function TarefasPage() {
    const [supabase] = useState(() => createClient())
    const [tarefas, setTarefas] = useState<TarefaComCampanha[]>([])
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState<TarefaStatus | "todas">("todas")

    async function load() {
        setLoading(true)
        const { data } = await supabase
            .from("somos_preta_tarefas")
            .select("*, campanha:somos_preta_campanhas(id, nome)")
            .order("created_at", { ascending: false })
        setTarefas((data as TarefaComCampanha[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtradas = useMemo(
        () => (filtro === "todas" ? tarefas : tarefas.filter((t) => t.status === filtro)),
        [tarefas, filtro]
    )

    async function mudarStatus(t: TarefaComCampanha, status: TarefaStatus) {
        setTarefas((prev) => prev.map((x) => x.id === t.id ? { ...x, status } : x))
        const { error } = await supabase.from("somos_preta_tarefas").update({
            status,
            concluida_em: status === "concluida" ? new Date().toISOString() : null,
        }).eq("id", t.id)
        if (error) { toast.error("Erro ao atualizar"); load() }
    }

    const contagem = (s: TarefaStatus) => tarefas.filter((t) => t.status === s).length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-primary" /> Tarefas
                </h1>
                <p className="text-muted-foreground text-sm">Todas as tarefas das campanhas em um só lugar.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(["pendente", "em_andamento", "concluida", "bloqueada"] as TarefaStatus[]).map((s) => (
                    <Card key={s}><CardContent className="py-4">
                        <p className="text-2xl font-bold">{contagem(s)}</p>
                        <p className="text-xs text-muted-foreground">{TAREFA_STATUS[s].label}</p>
                    </CardContent></Card>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                {FILTROS.map((f) => (
                    <Button key={f.value} variant={filtro === f.value ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setFiltro(f.value)}>
                        {f.label}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : filtradas.length === 0 ? (
                <Card><CardContent className="py-14 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhuma tarefa</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {filtradas.map((t) => (
                        <Card key={t.id}>
                            <CardContent className="flex items-center gap-3 py-3">
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${t.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</p>
                                    <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-0.5">
                                        <span className={PRIORIDADE[t.prioridade].className}>{PRIORIDADE[t.prioridade].label}</span>
                                        {t.campanha && <Link href={`/campanhas/${t.campanha.id}`} className="hover:text-primary">• {t.campanha.nome}</Link>}
                                        {t.data_entrega && <span>• entrega {t.data_entrega}</span>}
                                    </div>
                                </div>
                                <Select value={t.status} onValueChange={(v) => mudarStatus(t, v as TarefaStatus)}>
                                    <SelectTrigger className="w-[150px] h-8">
                                        <Badge className={TAREFA_STATUS[t.status].className} variant="secondary">{TAREFA_STATUS[t.status].label}</Badge>
                                    </SelectTrigger>
                                    <SelectContent>{Object.entries(TAREFA_STATUS).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
