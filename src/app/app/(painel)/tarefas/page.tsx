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
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ClipboardList, Loader2, Pencil, Trash2 } from "lucide-react"
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

function TarefaAcoes({ t, supabase, reload }: {
    t: TarefaComCampanha
    supabase: ReturnType<typeof createClient>
    reload: () => Promise<void>
}) {
    const [editOpen, setEditOpen] = useState(false)
    const [titulo, setTitulo] = useState(t.titulo)
    const [descricao, setDescricao] = useState(t.descricao ?? "")
    const [prioridade, setPrioridade] = useState<TarefaPrioridade>(t.prioridade)
    const [dataEntrega, setDataEntrega] = useState(t.data_entrega ?? "")
    const [saving, setSaving] = useState(false)

    function resetForm() {
        setTitulo(t.titulo)
        setDescricao(t.descricao ?? "")
        setPrioridade(t.prioridade)
        setDataEntrega(t.data_entrega ?? "")
    }

    async function salvar() {
        setSaving(true)
        const { error } = await supabase.from("somos_preta_tarefas").update({
            titulo,
            descricao: descricao || null,
            prioridade,
            data_entrega: dataEntrega || null,
        }).eq("id", t.id)
        setSaving(false)
        if (error) { toast.error("Erro ao salvar"); return }
        setEditOpen(false)
        await reload()
        toast.success("Tarefa atualizada")
    }

    async function excluir() {
        const { error } = await supabase.from("somos_preta_tarefas").delete().eq("id", t.id)
        if (error) { toast.error("Erro ao excluir"); return }
        await reload()
        toast.success("Tarefa excluída")
    }

    return (
        <div className="flex items-center gap-1">
            <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (o) resetForm() }}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Pencil className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar tarefa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor={`titulo-${t.id}`}>Título</Label>
                            <Input id={`titulo-${t.id}`} value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor={`descricao-${t.id}`}>Descrição</Label>
                            <Textarea id={`descricao-${t.id}`} rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Prioridade</Label>
                                <Select value={prioridade} onValueChange={(v) => setPrioridade(v as TarefaPrioridade)}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>{Object.entries(PRIORIDADE).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor={`entrega-${t.id}`}>Entrega</Label>
                                <Input id={`entrega-${t.id}`} type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                        <Button onClick={salvar} disabled={saving || !titulo.trim()}>
                            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A tarefa &quot;{t.titulo}&quot; será removida permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={excluir} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

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
                                        {t.campanha && <Link href={`/app/campanhas/${t.campanha.id}`} className="hover:text-primary">• {t.campanha.nome}</Link>}
                                        {t.data_entrega && <span>• entrega {t.data_entrega}</span>}
                                    </div>
                                </div>
                                <Select value={t.status} onValueChange={(v) => mudarStatus(t, v as TarefaStatus)}>
                                    <SelectTrigger className="w-[150px] h-8">
                                        <Badge className={TAREFA_STATUS[t.status].className} variant="secondary">{TAREFA_STATUS[t.status].label}</Badge>
                                    </SelectTrigger>
                                    <SelectContent>{Object.entries(TAREFA_STATUS).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <TarefaAcoes t={t} supabase={supabase} reload={load} />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
