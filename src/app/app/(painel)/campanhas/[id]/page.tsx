"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Campanha, Tarefa, TarefaStatus, TarefaPrioridade, CampanhaStatus } from "@/lib/db/types"
import { TAREFA_STATUS, TAREFA_STATUS_ORDEM, TAREFA_PRIORIDADE as PRIORIDADE, tarefaPrazoBadge } from "@/lib/constants/tarefas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ErroDeCarregamento } from "@/components/painel/erro-de-carregamento"
import { ArrowLeft, Plus, Loader2, ClipboardList, Megaphone, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CAMPANHA_STATUS, brl, orcamentoDaCampanha } from "@/lib/constants/campanhas"
import { confirmarEscrita, lido, lidos } from "@/lib/supabase/resultado"

type CampanhaComCliente = Campanha & { cliente: { id: string; nome: string } | null }

const STATUS_LABEL: Record<CampanhaStatus, string> =
    Object.fromEntries(
        (Object.keys(CAMPANHA_STATUS) as CampanhaStatus[]).map((s) => [s, CAMPANHA_STATUS[s].label])
    ) as Record<CampanhaStatus, string>

export default function CampanhaDetalhePage() {
    const params = useParams<{ id: string }>()
    const campanhaId = params.id
    const [supabase] = useState(() => createClient())

    const [campanha, setCampanha] = useState<CampanhaComCliente | null>(null)
    const [tarefas, setTarefas] = useState<Tarefa[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [erroCampanha, setErroCampanha] = useState(false)
    const [erroTarefas, setErroTarefas] = useState(false)
    const [excluindo, setExcluindo] = useState<Tarefa | null>(null)

    const [form, setForm] = useState({
        titulo: "", descricao: "", prioridade: "media" as TarefaPrioridade,
        status: "backlog" as TarefaStatus, data_entrega: "",
    })

    async function load() {
        setLoading(true)
        // maybeSingle: campanha inexistente é data null, não erro — assim "não achei"
        // não se confunde com "não consegui ler".
        const [respostaCampanha, respostaTarefas] = await Promise.all([
            supabase.from("somos_preta_campanhas").select("*, cliente:somos_preta_clientes(id, nome)").eq("id", campanhaId).maybeSingle(),
            supabase.from("somos_preta_tarefas").select("*").eq("campanha_id", campanhaId).eq("arquivada", false).order("ordem").order("created_at", { ascending: false }),
        ])

        const leitura = lido<CampanhaComCliente>(respostaCampanha)
        setErroCampanha(!leitura.ok)
        setCampanha(leitura.ok ? leitura.valor : null)

        const lista = lidos<Tarefa>(respostaTarefas)
        setErroTarefas(lista === null)
        setTarefas(lista ?? [])

        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campanhaId])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.titulo.trim()) { toast.error("Informe o título da tarefa"); return }
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
        setForm({ titulo: "", descricao: "", prioridade: "media", status: "backlog", data_entrega: "" })
        load()
    }

    async function mudarStatus(t: Tarefa, status: TarefaStatus) {
        if (status === "concluida" && t.evidencia_obrigatoria) {
            toast.error("Esta tarefa exige evidência de conclusão — abra-a para concluir")
            return
        }
        // Otimista: o badge responde no clique; se não gravou, o load() abaixo desfaz.
        setTarefas((prev) => prev.map((x) => x.id === t.id ? { ...x, status } : x))
        const ok = await confirmarEscrita(
            supabase.from("somos_preta_tarefas").update({
                status,
                concluida_em: status === "concluida" ? new Date().toISOString() : null,
            }).eq("id", t.id).select("id"),
            "Não foi possível mudar o status",
        )
        if (!ok) { load(); return }
        toast.success(`Movida para ${TAREFA_STATUS[status].label}`)
    }

    async function excluirTarefa(t: Tarefa) {
        const ok = await confirmarEscrita(
            supabase.from("somos_preta_tarefas").delete().eq("id", t.id).select("id"),
            "Não foi possível excluir a tarefa",
        )
        setExcluindo(null)
        if (!ok) return
        toast.success("Tarefa excluída")
        load()
    }

    if (loading) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }
    if (erroCampanha) {
        return (
            <div className="space-y-4">
                <Link href="/campanhas" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Campanhas</Link>
                <ErroDeCarregamento recurso="a campanha" onTentarDeNovo={load} />
            </div>
        )
    }
    if (!campanha) {
        return (
            <div className="space-y-4">
                <Link href="/campanhas" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Campanhas</Link>
                <p className="text-muted-foreground">Campanha não encontrada.</p>
            </div>
        )
    }

    const feitas = tarefas.filter((t) => t.status === "concluida").length
    const orcamento = orcamentoDaCampanha(campanha)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/campanhas" className="hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Campanhas</Link>
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
                        <Badge variant="secondary">{STATUS_LABEL[campanha.status]}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                        {orcamento
                            ? <span>{orcamento.rotulo} <span className="font-semibold text-foreground">{brl(orcamento.valor)}</span></span>
                            : <span>Orçamento não definido</span>}
                        {(campanha.data_inicio || campanha.data_fim) && <span>{[campanha.data_inicio, campanha.data_fim].filter(Boolean).join(" → ")}</span>}
                        {!erroTarefas && <span>{feitas}/{tarefas.length} tarefas concluídas</span>}
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

            {erroTarefas ? (
                <ErroDeCarregamento recurso="as tarefas" onTentarDeNovo={load} />
            ) : tarefas.length === 0 ? (
                <Card><CardContent className="py-14 text-center text-muted-foreground">
                    <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhuma tarefa ainda</p>
                </CardContent></Card>
            ) : (
                <div className="space-y-2">
                    {tarefas.map((t) => {
                        const prazo = tarefaPrazoBadge(t)
                        return (
                            <Card key={t.id}>
                                <CardContent className="flex items-center gap-3 py-3">
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/tarefas/${t.id}`} className="hover:text-primary">
                                            <p className={`font-medium truncate ${t.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{t.titulo}</p>
                                        </Link>
                                        <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-0.5">
                                            <span className={PRIORIDADE[t.prioridade].className}>{PRIORIDADE[t.prioridade].label}</span>
                                            {t.data_entrega && <span>• entrega {t.data_entrega}</span>}
                                            {prazo && <Badge className={prazo.className} variant="secondary">{prazo.label}</Badge>}
                                        </div>
                                    </div>
                                    <Select value={t.status} onValueChange={(v) => mudarStatus(t, v as TarefaStatus)}>
                                        <SelectTrigger className="w-[180px] h-8">
                                            <Badge className={TAREFA_STATUS[t.status].className} variant="secondary">{TAREFA_STATUS[t.status].label}</Badge>
                                        </SelectTrigger>
                                        <SelectContent>{TAREFA_STATUS_ORDEM.map((s) => <SelectItem key={s} value={s}>{TAREFA_STATUS[s].label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        onClick={() => setExcluindo(t)}
                                        aria-label={`Excluir tarefa ${t.titulo}`}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &quot;{excluindo?.titulo}&quot; será removida — e com ela as subtarefas,
                            comentários e anexos vinculados, em cascata.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => excluindo && excluirTarefa(excluindo)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            Excluir mesmo assim
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
