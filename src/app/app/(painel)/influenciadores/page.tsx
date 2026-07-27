"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Influencer, InfluencerStatus } from "@/lib/db/types"
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
import { Users, Plus, Loader2, Search, Instagram } from "lucide-react"
import { toast } from "sonner"

const STATUS_META: Record<InfluencerStatus, { label: string; className: string }> = {
    ativo: { label: "Ativo", className: "bg-green-500/15 text-green-600" },
    inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
    negociando: { label: "Negociando", className: "bg-blue-500/15 text-blue-600" },
    bloqueado: { label: "Bloqueado", className: "bg-red-500/15 text-red-600" },
}

const fmt = (n: number) => n.toLocaleString("pt-BR")

export default function InfluencersPage() {
    const [supabase] = useState(() => createClient())
    const [influencers, setInfluencers] = useState<Influencer[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [form, setForm] = useState({
        nome: "", instagram: "", tiktok: "", email: "", telefone: "",
        estado: "", cidade: "", nicho: "", followers: "", engagement: "",
        status: "ativo" as InfluencerStatus,
    })

    async function load() {
        setLoading(true)
        const { data, error } = await supabase
            .from("somos_preta_influencers")
            .select("*")
            .order("followers", { ascending: false })
        if (error) toast.error("Erro ao carregar influenciadores")
        setInfluencers((data as Influencer[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase()
        if (!q) return influencers
        return influencers.filter((i) =>
            i.nome.toLowerCase().includes(q) ||
            (i.instagram ?? "").toLowerCase().includes(q) ||
            (i.estado ?? "").toLowerCase().includes(q)
        )
    }, [influencers, busca])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!form.nome.trim()) return
        setSaving(true)
        const { error } = await supabase.from("somos_preta_influencers").insert({
            nome: form.nome.trim(),
            instagram: form.instagram || null,
            tiktok: form.tiktok || null,
            email: form.email || null,
            telefone: form.telefone || null,
            estado: form.estado || null,
            cidade: form.cidade || null,
            nicho: form.nicho ? form.nicho.split(",").map((s) => s.trim()).filter(Boolean) : [],
            followers: form.followers ? Number(form.followers) : 0,
            engagement: form.engagement ? Number(form.engagement) : 0,
            status: form.status,
        })
        setSaving(false)
        if (error) { toast.error("Não foi possível salvar"); return }
        toast.success("Influenciador cadastrado")
        setOpen(false)
        setForm({ nome: "", instagram: "", tiktok: "", email: "", telefone: "", estado: "", cidade: "", nicho: "", followers: "", engagement: "", status: "ativo" })
        load()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                            <Users className="h-3 w-3 mr-1" /> {influencers.length} cadastrados
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight mt-1">Influenciadores</h1>
                    <p className="text-muted-foreground text-sm">Sua base de creators do Norte e Nordeste.</p>
                </div>

                <div className="flex gap-2">
                    <Link href="/app/descobrir"><Button variant="outline" className="rounded-xl"><Search className="h-4 w-4" /> Descobrir</Button></Link>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4" /> Novo</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <form onSubmit={handleCreate}>
                                <DialogHeader>
                                    <DialogTitle>Novo influenciador</DialogTitle>
                                    <DialogDescription>Cadastre um creator na base.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="nome">Nome *</Label>
                                        <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label htmlFor="ig">Instagram</Label><Input id="ig" placeholder="@user" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></div>
                                        <div className="grid gap-2"><Label htmlFor="tt">TikTok</Label><Input id="tt" placeholder="@user" value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label htmlFor="cid">Cidade</Label><Input id="cid" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div>
                                        <div className="grid gap-2"><Label htmlFor="uf">Estado (UF)</Label><Input id="uf" maxLength={2} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value.toUpperCase() })} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2"><Label htmlFor="fol">Seguidores</Label><Input id="fol" type="number" min="0" value={form.followers} onChange={(e) => setForm({ ...form, followers: e.target.value })} /></div>
                                        <div className="grid gap-2"><Label htmlFor="eng">Engajamento (%)</Label><Input id="eng" type="number" min="0" step="0.01" value={form.engagement} onChange={(e) => setForm({ ...form, engagement: e.target.value })} /></div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="nicho">Nichos (separados por vírgula)</Label>
                                        <Input id="nicho" placeholder="moda, lifestyle" value={form.nicho} onChange={(e) => setForm({ ...form, nicho: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Status</Label>
                                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as InfluencerStatus })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>{Object.entries(STATUS_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={saving} className="rounded-xl">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar influenciador..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 rounded-xl" />
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
                    ) : filtrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium">Nenhum influenciador ainda</p>
                            <p className="text-sm text-muted-foreground">Cadastre um ou use “Descobrir” para buscar por @.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="hidden sm:table-cell">Instagram</TableHead>
                                    <TableHead className="text-right">Seguidores</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">Eng.</TableHead>
                                    <TableHead className="hidden lg:table-cell">Local</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtrados.map((i) => (
                                    <TableRow key={i.id}>
                                        <TableCell className="font-medium">{i.nome}</TableCell>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                                            {i.instagram ? <span className="inline-flex items-center gap-1"><Instagram className="h-3.5 w-3.5" />{i.instagram}</span> : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">{fmt(i.followers)}</TableCell>
                                        <TableCell className="hidden md:table-cell text-right">{Number(i.engagement)}%</TableCell>
                                        <TableCell className="hidden lg:table-cell text-muted-foreground">{[i.cidade, i.estado].filter(Boolean).join(" / ") || "—"}</TableCell>
                                        <TableCell><Badge className={STATUS_META[i.status].className} variant="secondary">{STATUS_META[i.status].label}</Badge></TableCell>
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
