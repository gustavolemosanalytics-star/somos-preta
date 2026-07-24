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
import { Megaphone, Plus, Loader2, Search } from "lucide-react"
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
                    Cadastre um <Link href="/clientes" className="text-primary underline">cliente</Link> antes de criar campanhas.
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
                        <Link key={c.id} href={`/campanhas/${c.id}`}>
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
                    ))}
                </div>
            )}
        </div>
    )
}
