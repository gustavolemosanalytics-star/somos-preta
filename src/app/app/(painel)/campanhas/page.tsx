"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Cliente, Campanha, CampanhaStatus } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Megaphone, Plus, Loader2, Search, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

type CampanhaComCliente = Campanha & { cliente: { nome: string } | null }

const STATUS_META: Record<CampanhaStatus, { label: string; className: string }> = {
    rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
    planejamento: { label: "Planejamento", className: "bg-blue-500/15 text-blue-600" },
    ativa: { label: "Ativa", className: "bg-green-500/15 text-green-600" },
    concluida: { label: "Concluída", className: "bg-primary/15 text-primary" },
    cancelada: { label: "Cancelada", className: "bg-red-500/15 text-red-600" },
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function CampaignsPage() {
    const [supabase] = useState(() => createClient())
    const [campanhas, setCampanhas] = useState<CampanhaComCliente[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        cliente_id: "", nome: "", objetivo: "", budget: "",
        data_inicio: "", data_fim: "", status: "rascunho" as CampanhaStatus,
    })

    const [editing, setEditing] = useState<CampanhaComCliente | null>(null)
    const [savingEdit, setSavingEdit] = useState(false)
    const [deleting, setDeleting] = useState<CampanhaComCliente | null>(null)
    const [editForm, setEditForm] = useState({
        cliente_id: "", nome: "", objetivo: "", budget: "",
        data_inicio: "", data_fim: "", status: "rascunho" as CampanhaStatus,
    })

    async function load() {
        setLoading(true)
        const [{ data: camps }, { data: cls }] = await Promise.all([
            supabase.from("somos_preta_campanhas").select("*, cliente:somos_preta_clientes(nome)").order("created_at", { ascending: false }),
            supabase.from("somos_preta_clientes").select("*").order("nome"),
        ])
        setCampanhas((camps as CampanhaComCliente[]) ?? [])
        setClientes((cls as Cliente[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtradas = useMemo(() => {
        const q = busca.trim().toLowerCase()
        if (!q) return campanhas
        return campanhas.filter((c) => c.nome.toLowerCase().includes(q) || (c.cliente?.nome ?? "").toLowerCase().includes(q))
    }, [campanhas, busca])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.nome.trim() || !form.cliente_id) {
            toast.error("Escolha o cliente e informe o nome")
            return
        }
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_campanhas").insert({
            cliente_id: form.cliente_id,
            nome: form.nome.trim(),
            objetivo: form.objetivo || null,
            budget: form.budget ? Number(form.budget) : 0,
            data_inicio: form.data_inicio || null,
            data_fim: form.data_fim || null,
            status: form.status,
            created_by: user?.id ?? null,
        })
        setSaving(false)
        if (error) { toast.error("Não foi possível criar a campanha"); return }
        toast.success("Campanha criada")
        setOpen(false)
        setForm({ cliente_id: "", nome: "", objetivo: "", budget: "", data_inicio: "", data_fim: "", status: "rascunho" })
        load()
    }

    function openEdit(c: CampanhaComCliente) {
        setEditing(c)
        setEditForm({
            cliente_id: c.cliente_id ?? "",
            nome: c.nome,
            objetivo: c.objetivo ?? "",
            budget: c.budget != null ? String(c.budget) : "",
            data_inicio: c.data_inicio ?? "",
            data_fim: c.data_fim ?? "",
            status: c.status,
        })
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!editing) return
        if (!editForm.nome.trim() || !editForm.cliente_id) {
            toast.error("Escolha o cliente e informe o nome")
            return
        }
        setSavingEdit(true)
        const { error } = await supabase.from("somos_preta_campanhas").update({
            cliente_id: editForm.cliente_id,
            nome: editForm.nome.trim(),
            objetivo: editForm.objetivo || null,
            budget: editForm.budget ? Number(editForm.budget) : 0,
            data_inicio: editForm.data_inicio || null,
            data_fim: editForm.data_fim || null,
            status: editForm.status,
        }).eq("id", editing.id)
        setSavingEdit(false)
        if (error) { toast.error("Não foi possível atualizar a campanha"); return }
        toast.success("Campanha atualizada")
        setEditing(null)
        load()
    }

    async function handleDelete() {
        if (!deleting) return
        const { error } = await supabase.from("somos_preta_campanhas").delete().eq("id", deleting.id)
        if (error) { toast.error("Não foi possível excluir a campanha"); return }
        toast.success("Campanha excluída")
        setDeleting(null)
        load()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Megaphone className="h-6 w-6 text-primary" /> Campanhas
                    </h1>
                    <p className="text-muted-foreground text-sm">Cada campanha pertence a um cliente e reúne suas tarefas.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl" disabled={clientes.length === 0}>
                            <Plus className="h-4 w-4" /> Nova campanha
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Nova campanha</DialogTitle>
                                <DialogDescription>Vincule a campanha a um cliente.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Cliente *</Label>
                                    <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                                        <SelectContent>
                                            {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="nome">Nome *</Label>
                                    <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="objetivo">Objetivo</Label>
                                    <Input id="objetivo" value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="budget">Budget (R$)</Label>
                                        <Input id="budget" type="number" min="0" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Status</Label>
                                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CampanhaStatus })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="ini">Início</Label>
                                        <Input id="ini" type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="fim">Fim</Label>
                                        <Input id="fim" type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving} className="rounded-xl">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar campanha"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {clientes.length === 0 && !loading && (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
                    Cadastre um <Link href="/app/clientes" className="text-primary underline">cliente</Link> antes de criar campanhas.
                </div>
            )}

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar campanha ou cliente..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 rounded-xl" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : filtradas.length === 0 ? (
                <Card><CardContent className="py-14 text-center text-muted-foreground">
                    <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhuma campanha ainda</p>
                </CardContent></Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtradas.map((c) => (
                        <div key={c.id} className="relative group">
                            <Link href={`/app/campanhas/${c.id}`}>
                                <Card className="h-full hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base">{c.nome}</CardTitle>
                                            <Badge className={STATUS_META[c.status].className} variant="secondary">{STATUS_META[c.status].label}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{c.cliente?.nome ?? "Sem cliente"}</p>
                                    </CardHeader>
                                    <CardContent className="text-sm">
                                        <p className="font-semibold">{brl(Number(c.budget))}</p>
                                    </CardContent>
                                </Card>
                            </Link>
                            <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-lg border bg-background/80 p-0.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    aria-label="Editar campanha"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(c) }}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-red-600 hover:text-red-600"
                                    aria-label="Excluir campanha"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleting(c) }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null) }}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Editar campanha</DialogTitle>
                            <DialogDescription>Atualize os dados da campanha.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Cliente *</Label>
                                <Select value={editForm.cliente_id} onValueChange={(v) => setEditForm({ ...editForm, cliente_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                                    <SelectContent>
                                        {clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-nome">Nome *</Label>
                                <Input id="edit-nome" value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-objetivo">Objetivo</Label>
                                <Input id="edit-objetivo" value={editForm.objetivo} onChange={(e) => setEditForm({ ...editForm, objetivo: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-budget">Budget (R$)</Label>
                                    <Input id="edit-budget" type="number" min="0" step="0.01" value={editForm.budget} onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as CampanhaStatus })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-ini">Início</Label>
                                    <Input id="edit-ini" type="date" value={editForm.data_inicio} onChange={(e) => setEditForm({ ...editForm, data_inicio: e.target.value })} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-fim">Fim</Label>
                                    <Input id="edit-fim" type="date" value={editForm.data_fim} onChange={(e) => setEditForm({ ...editForm, data_fim: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={savingEdit} className="rounded-xl">
                                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir campanha?</AlertDialogTitle>
                        <AlertDialogDescription>As tarefas vinculadas também serão removidas.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 text-white hover:bg-red-700">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
