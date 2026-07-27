"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Contrato, ContratoStatus, Influencer, Campanha } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FileText, Plus, Loader2, ExternalLink, Eye, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

type ContratoRow = Contrato & { influencer: { nome: string } | null; campanha: { nome: string } | null }

const STATUS_META: Record<ContratoStatus, { label: string; className: string }> = {
    pendente: { label: "Pendente", className: "bg-yellow-500/15 text-yellow-600" },
    assinado: { label: "Assinado", className: "bg-green-500/15 text-green-600" },
    expirado: { label: "Expirado", className: "bg-red-500/15 text-red-600" },
    cancelado: { label: "Cancelado", className: "bg-muted text-muted-foreground" },
}

function RowActions({ row, influencers, campanhas, supabase, reload }: {
    row: ContratoRow
    influencers: Influencer[]
    campanhas: Campanha[]
    supabase: ReturnType<typeof createClient>
    reload: () => void
}) {
    const [viewOpen, setViewOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [form, setForm] = useState({
        titulo: row.titulo,
        influencer_id: row.influencer_id ?? "",
        campanha_id: row.campanha_id ?? "",
        status: row.status,
        expira_em: row.expira_em ?? "",
        pdf_url: row.pdf_url ?? "",
    })

    function openEdit() {
        setForm({
            titulo: row.titulo,
            influencer_id: row.influencer_id ?? "",
            campanha_id: row.campanha_id ?? "",
            status: row.status,
            expira_em: row.expira_em ?? "",
            pdf_url: row.pdf_url ?? "",
        })
        setEditOpen(true)
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.titulo.trim()) return
        setSaving(true)
        const { error } = await supabase.from("somos_preta_contratos").update({
            titulo: form.titulo.trim(),
            influencer_id: form.influencer_id || null,
            campanha_id: form.campanha_id || null,
            status: form.status,
            expira_em: form.expira_em || null,
            assinado_em: form.status === "assinado" ? new Date().toISOString() : null,
            pdf_url: form.pdf_url || null,
        }).eq("id", row.id)
        setSaving(false)
        if (error) { toast.error("Não foi possível atualizar o contrato"); return }
        toast.success("Contrato atualizado")
        setEditOpen(false)
        reload()
    }

    async function handleDelete() {
        setDeleting(true)
        const { error } = await supabase.from("somos_preta_contratos").delete().eq("id", row.id)
        setDeleting(false)
        if (error) { toast.error("Não foi possível excluir o contrato"); return }
        toast.success("Contrato excluído")
        setDeleteOpen(false)
        reload()
    }

    return (
        <div className="flex items-center justify-end gap-1">
            {/* Ver */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="rounded-xl" aria-label="Ver contrato"><Eye className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{row.titulo}</DialogTitle>
                        <DialogDescription>Detalhes do contrato.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2 text-sm">
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 p-3">
                            <span className="text-muted-foreground">Título</span>
                            <span className="col-span-2 font-medium">{row.titulo}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 p-3">
                            <span className="text-muted-foreground">Influenciador</span>
                            <span className="col-span-2">{row.influencer?.nome ?? "—"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 p-3">
                            <span className="text-muted-foreground">Campanha</span>
                            <span className="col-span-2">{row.campanha?.nome ?? "—"}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 p-3">
                            <span className="text-muted-foreground">Status</span>
                            <span className="col-span-2"><Badge className={STATUS_META[row.status].className} variant="secondary">{STATUS_META[row.status].label}</Badge></span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 p-3">
                            <span className="text-muted-foreground">Expira em</span>
                            <span className="col-span-2">{row.expira_em ?? "—"}</span>
                        </div>
                        {row.pdf_url ? (
                            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 p-3">
                                <span className="text-muted-foreground">PDF</span>
                                <a href={row.pdf_url} target="_blank" rel="noopener noreferrer" className="col-span-2 text-primary inline-flex items-center gap-1 hover:underline">abrir <ExternalLink className="h-3.5 w-3.5" /></a>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Editar */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <Button variant="ghost" size="icon-sm" className="rounded-xl" aria-label="Editar contrato" onClick={openEdit}><Pencil className="h-4 w-4" /></Button>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Editar contrato</DialogTitle>
                            <DialogDescription>Atualize as informações do contrato.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-titulo-${row.id}`}>Título *</Label>
                                <Input id={`edit-titulo-${row.id}`} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Influenciador</Label>
                                    <Select value={form.influencer_id} onValueChange={(v) => setForm({ ...form, influencer_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                                        <SelectContent>{influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Campanha</Label>
                                    <Select value={form.campanha_id} onValueChange={(v) => setForm({ ...form, campanha_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                                        <SelectContent>{campanhas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContratoStatus })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`edit-exp-${row.id}`}>Expira em</Label>
                                    <Input id={`edit-exp-${row.id}`} type="date" value={form.expira_em} onChange={(e) => setForm({ ...form, expira_em: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`edit-pdf-${row.id}`}>Link do PDF (opcional)</Label>
                                <Input id={`edit-pdf-${row.id}`} type="url" placeholder="https://..." value={form.pdf_url} onChange={(e) => setForm({ ...form, pdf_url: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saving} className="rounded-xl">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Excluir */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="rounded-xl text-destructive hover:text-destructive" aria-label="Excluir contrato"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir contrato?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita. O contrato &quot;{row.titulo}&quot; será removido permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting} className="rounded-xl">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDelete() }} disabled={deleting} className="rounded-xl bg-destructive text-white hover:bg-destructive/90">
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export default function ContractsPage() {
    const [supabase] = useState(() => createClient())
    const [contratos, setContratos] = useState<ContratoRow[]>([])
    const [influencers, setInfluencers] = useState<Influencer[]>([])
    const [campanhas, setCampanhas] = useState<Campanha[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        titulo: "", influencer_id: "", campanha_id: "",
        status: "pendente" as ContratoStatus, expira_em: "", pdf_url: "",
    })

    async function load() {
        setLoading(true)
        const [{ data: cs }, { data: infl }, { data: camps }] = await Promise.all([
            supabase.from("somos_preta_contratos").select("*, influencer:somos_preta_influencers(nome), campanha:somos_preta_campanhas(nome)").order("created_at", { ascending: false }),
            supabase.from("somos_preta_influencers").select("*").order("nome"),
            supabase.from("somos_preta_campanhas").select("*").order("nome"),
        ])
        setContratos((cs as unknown as ContratoRow[]) ?? [])
        setInfluencers((infl as Influencer[]) ?? [])
        setCampanhas((camps as Campanha[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const contagem = useMemo(() => ({
        assinado: contratos.filter((c) => c.status === "assinado").length,
        pendente: contratos.filter((c) => c.status === "pendente").length,
        expirado: contratos.filter((c) => c.status === "expirado").length,
        total: contratos.length,
    }), [contratos])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.titulo.trim()) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_contratos").insert({
            titulo: form.titulo.trim(),
            influencer_id: form.influencer_id || null,
            campanha_id: form.campanha_id || null,
            status: form.status,
            expira_em: form.expira_em || null,
            assinado_em: form.status === "assinado" ? new Date().toISOString() : null,
            pdf_url: form.pdf_url || null,
            created_by: user?.id ?? null,
        })
        setSaving(false)
        if (error) { toast.error("Não foi possível salvar o contrato"); return }
        toast.success("Contrato criado")
        setOpen(false)
        setForm({ titulo: "", influencer_id: "", campanha_id: "", status: "pendente", expira_em: "", pdf_url: "" })
        load()
    }

    const stats = [
        { label: "Assinados", value: contagem.assinado, className: "text-green-600" },
        { label: "Pendentes", value: contagem.pendente, className: "text-yellow-600" },
        { label: "Expirados", value: contagem.expirado, className: "text-red-600" },
        { label: "Total", value: contagem.total, className: "text-primary" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Contratos</h1>
                    <p className="text-muted-foreground text-sm">Acompanhe o status dos contratos com os creators.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4" /> Novo contrato</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Novo contrato</DialogTitle>
                                <DialogDescription>Registre um contrato e seu status.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="titulo">Título *</Label>
                                    <Input id="titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Influenciador</Label>
                                        <Select value={form.influencer_id} onValueChange={(v) => setForm({ ...form, influencer_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                                            <SelectContent>{influencers.map((i) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Campanha</Label>
                                        <Select value={form.campanha_id} onValueChange={(v) => setForm({ ...form, campanha_id: v })}>
                                            <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                                            <SelectContent>{campanhas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Status</Label>
                                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ContratoStatus })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="exp">Expira em</Label>
                                        <Input id="exp" type="date" value={form.expira_em} onChange={(e) => setForm({ ...form, expira_em: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="pdf">Link do PDF (opcional)</Label>
                                    <Input id="pdf" type="url" placeholder="https://..." value={form.pdf_url} onChange={(e) => setForm({ ...form, pdf_url: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving} className="rounded-xl">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar contrato"}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                    <Card key={s.label}><CardContent className="py-4">
                        <p className={`text-2xl font-bold ${s.className}`}>{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                    </CardContent></Card>
                ))}
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
                    ) : contratos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium">Nenhum contrato ainda</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead className="hidden sm:table-cell">Influenciador</TableHead>
                                    <TableHead className="hidden md:table-cell">Campanha</TableHead>
                                    <TableHead className="hidden lg:table-cell">Expira</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">PDF</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {contratos.map((c) => (
                                    <TableRow key={c.id}>
                                        <TableCell className="font-medium">{c.titulo}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground">{c.influencer?.nome ?? "—"}</TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground">{c.campanha?.nome ?? "—"}</TableCell>
                                        <TableCell className="hidden lg:table-cell text-muted-foreground">{c.expira_em ?? "—"}</TableCell>
                                        <TableCell><Badge className={STATUS_META[c.status].className} variant="secondary">{STATUS_META[c.status].label}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            {c.pdf_url ? (
                                                <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary inline-flex items-center gap-1 text-sm hover:underline">
                                                    abrir <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            ) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <RowActions row={c} influencers={influencers} campanhas={campanhas} supabase={supabase} reload={load} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
