"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Cliente, Campanha, CampanhaStatus } from "@/lib/db/types"
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
import { Building2, Plus, Loader2, ArrowLeft, Megaphone, Mail, Phone } from "lucide-react"
import { toast } from "sonner"

const STATUS_META: Record<CampanhaStatus, { label: string; className: string }> = {
    rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
    planejamento: { label: "Planejamento", className: "bg-blue-500/15 text-blue-600" },
    ativa: { label: "Ativa", className: "bg-green-500/15 text-green-600" },
    concluida: { label: "Concluída", className: "bg-primary/15 text-primary" },
    cancelada: { label: "Cancelada", className: "bg-red-500/15 text-red-600" },
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function ClienteDetalhePage() {
    const params = useParams<{ id: string }>()
    const clienteId = params.id
    const [supabase] = useState(() => createClient())

    const [cliente, setCliente] = useState<Cliente | null>(null)
    const [campanhas, setCampanhas] = useState<Campanha[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        nome: "", objetivo: "", briefing: "", budget: "",
        data_inicio: "", data_fim: "", status: "rascunho" as CampanhaStatus,
    })

    async function load() {
        setLoading(true)
        const [{ data: c }, { data: camps }] = await Promise.all([
            supabase.from("somos_preta_clientes").select("*").eq("id", clienteId).single(),
            supabase.from("somos_preta_campanhas").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
        ])
        setCliente((c as Cliente) ?? null)
        setCampanhas((camps as Campanha[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clienteId])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.nome.trim()) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_campanhas").insert({
            cliente_id: clienteId,
            nome: form.nome.trim(),
            objetivo: form.objetivo || null,
            briefing: form.briefing || null,
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
        setForm({ nome: "", objetivo: "", briefing: "", budget: "", data_inicio: "", data_fim: "", status: "rascunho" })
        load()
    }

    if (loading) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }

    if (!cliente) {
        return (
            <div className="space-y-4">
                <Link href="/clientes" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Clientes</Link>
                <p className="text-muted-foreground">Cliente não encontrado.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Link href="/clientes" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Clientes
            </Link>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{cliente.nome}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {[cliente.empresa, cliente.segmento].filter(Boolean).join(" · ") || "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                        {cliente.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {cliente.email}</span>}
                        {cliente.telefone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {cliente.telefone}</span>}
                        {(cliente.cidade || cliente.estado) && <span>{[cliente.cidade, cliente.estado].filter(Boolean).join(" / ")}</span>}
                    </div>
                    {cliente.observacoes && <p className="text-sm pt-2">{cliente.observacoes}</p>}
                </CardHeader>
            </Card>

            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Campanhas</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl"><Plus className="h-4 w-4" /> Nova campanha</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Nova campanha</DialogTitle>
                                <DialogDescription>Campanha para {cliente.nome}.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
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
                                                {Object.entries(STATUS_META).map(([k, m]) => (
                                                    <SelectItem key={k} value={k}>{m.label}</SelectItem>
                                                ))}
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
                                <div className="grid gap-2">
                                    <Label htmlFor="brief">Briefing</Label>
                                    <Textarea id="brief" value={form.briefing} onChange={(e) => setForm({ ...form, briefing: e.target.value })} />
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

            {campanhas.length === 0 ? (
                <Card><CardContent className="py-14 text-center text-muted-foreground">
                    <Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhuma campanha ainda</p>
                    <p className="text-sm">Crie a primeira campanha deste cliente.</p>
                </CardContent></Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {campanhas.map((c) => (
                        <Link key={c.id} href={`/campaigns/${c.id}`}>
                            <Card className="h-full hover:border-primary/50 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-base">{c.nome}</CardTitle>
                                        <Badge className={STATUS_META[c.status].className} variant="secondary">{STATUS_META[c.status].label}</Badge>
                                    </div>
                                    {c.objetivo && <p className="text-sm text-muted-foreground">{c.objetivo}</p>}
                                </CardHeader>
                                <CardContent className="text-sm text-muted-foreground">
                                    <p className="font-semibold text-foreground">{brl(Number(c.budget))}</p>
                                    {(c.data_inicio || c.data_fim) && (
                                        <p className="text-xs mt-1">{[c.data_inicio, c.data_fim].filter(Boolean).join(" → ")}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
