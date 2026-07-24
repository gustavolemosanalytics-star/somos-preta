"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Campanha, Tarefa, TarefaStatus, TarefaPrioridade, CampanhaStatus } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Plus, Loader2, ClipboardList, Megaphone } from "lucide-react"
import { toast } from "sonner"

type CampanhaComCliente = Campanha & { cliente: { id: string; nome: string } | null }

const CAMP_STATUS: Record<CampanhaStatus, string> = {
    rascunho: "Rascunho", planejamento: "Planejamento", ativa: "Ativa", concluida: "Concluída", cancelada: "Cancelada",
}
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
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function CampanhaDetalhePage() {
    const params = useParams<{ id: string }>()
    const campanhaId = params.id
    const [supabase] = useState(() => createClient())

    const [campanha, setCampanha] = useState<CampanhaComCliente | null>(null)
    const [tarefas, setTarefas] = useState<Tarefa[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        titulo: "", descricao: "", prioridade: "media" as TarefaPrioridade,
        status: "pendente" as TarefaStatus, data_entrega: "",
    })

    async function load() {
        setLoading(true)
        const [{ data: c }, { data: ts }] = await Promise.all([
            supabase.from("somos_preta_campanhas").select("*, cliente:somos_preta_clientes(id, nome)").eq("id", campanhaId).single(),
            supabase.from("somos_preta_tarefas").select("*").eq("campanha_id", campanhaId).order("ordem").order("created_at", { ascending: false }),
        ])
        setCampanha((c as CampanhaComCliente) ?? null)
        setTarefas((ts as Tarefa[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campanhaId])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.titulo.trim()) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_tarefas").insert({
            campanha_id: campanhaId,
            titulo: form.titulo.trim(),
            descricao: form.descricao || null,
            prioridade: form.prioridade,
            status: form.status,
            data_entrega: form.data_entrega || null,
            created_by: user?.id ?? null,
        })
        setSaving(false)
        if (error) { toast.error("Não foi possível criar a tarefa"); return }
        toast.success("Tarefa criada")
        setOpen(false)
        setForm({ titulo: "", descricao: "", prioridade: "media", status: "pendente", data_entrega: "" })
        load()
    }

    async function mudarStatus(t: Tarefa, status: TarefaStatus) {
        setTarefas((prev) => prev.map((x) => x.id === t.id ? { ...x, status } : x))
        const { error } = await supabase.from("somos_preta_tarefas").update({
            status,
            concluida_em: status === "concluida" ? new Date().toISOString() : null,
        }).eq("id", t.id)
        if (error) { toast.error("Erro ao atualizar"); load() }
    }

    if (loading) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }
    if (!campanha) {
        return (
            <div className="space-y-4">
                <Link href="/campaigns" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Campanhas</Link>
                <p className="text-muted-foreground">Campanha não encontrada.</p>
            </div>
        )
    }

    const feitas = tarefas.filter((t) => t.status === "concluida").length

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/campaigns" className="hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Campanhas</Link>
                {campanha.cliente && (<><span>/</span><Link href={`/clientes/${campanha.cliente.id}`} className="hover:text-primary">{campanha.cliente.nome}</Link></>)}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Megaphone className="h-6 w-6 text-primary" /></div>
                            <div>
                                <CardTitle className="text-xl">{campanha.nome}</CardTitle>
                                <p className="text-sm text-muted-foreground">{campanha.objetivo ?? "—"}</p>
                            </div>
                        </div>
                        <Badge variant="secondary">{CAMP_STATUS[campanha.status]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{brl(Number(campanha.budget))}</span>
                        {(campanha.data_inicio || campanha.data_fim) && <span>{[campanha.data_inicio, campanha.data_fim].filter(Boolean).join(" → ")}</span>}
                        <span>{feitas}/{tarefas.length} tarefas concluídas</span>
                    </div>
                    {campanha.briefing && <p className="text-sm pt-2">{campanha.briefing}</p>}
                </CardHeader>
            </Card>

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Tarefas</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4" /> Nova tarefa</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Nova tarefa</DialogTitle>
                                <DialogDescription>Tarefa da campanha {campanha.nome}.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="titulo">Título *</Label>
                                    <Input id="titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="desc">Descrição</Label>
                                    <Textarea id="desc" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Prioridade</Label>
                                        <Select value={form.prioridade} onValueChange={(v) => setForm({ ...form, prioridade: v as TarefaPrioridade })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(PRIORIDADE).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="entrega">Entrega</Label>
                                        <Input id="entrega" type="date" value={form.data_entrega} onChange={(e) => setForm({ ...form, data_entrega: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving} className="rounded-xl">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar tarefa"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {tarefas.length === 0 ? (
                <Card><CardContent className="py-14 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhuma tarefa ainda</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {tarefas.map((t) => (
                        <Card key={t.id}>
                            <CardContent className="flex items-center gap-3 py-3">
                                <div className="flex-1 min-w-0">
                                    <p className={`font-medium truncate ${t.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</p>
                                    <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-0.5">
                                        <span className={PRIORIDADE[t.prioridade].className}>{PRIORIDADE[t.prioridade].label}</span>
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
