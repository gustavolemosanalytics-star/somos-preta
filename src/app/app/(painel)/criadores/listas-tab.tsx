"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Lista, ListaCriador, Influencer, PipelineEtapa, Cliente, Campanha } from "@/lib/db/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, ListChecks, Loader2, Plus, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

export const PIPELINE_ETAPAS: PipelineEtapa[] = [
    "mapeado", "em_analise", "contatado", "interessado", "negociacao",
    "aprovado_preta", "enviado_cliente", "aprovado_cliente", "contratado", "publicado",
]

export const PIPELINE_LABEL: Record<PipelineEtapa, string> = {
    mapeado: "Mapeado",
    em_analise: "Em análise",
    contatado: "Contatado",
    interessado: "Interessado",
    negociacao: "Negociação",
    aprovado_preta: "Aprovado PRETA",
    enviado_cliente: "Enviado ao cliente",
    aprovado_cliente: "Aprovado pelo cliente",
    contratado: "Contratado",
    publicado: "Publicado",
}

type ListaComContagem = Lista & { total: number; cliente: { nome: string } | null; campanha: { nome: string } | null }

function ListaDetalhe({ lista, onVoltar }: { lista: Lista; onVoltar: () => void }) {
    const [supabase] = useState(() => createClient())
    const [membros, setMembros] = useState<(ListaCriador & { influencer: Influencer })[]>([])
    const [loading, setLoading] = useState(true)
    const [adicionarOpen, setAdicionarOpen] = useState(false)
    const [busca, setBusca] = useState("")
    const [resultados, setResultados] = useState<Influencer[]>([])

    async function load() {
        setLoading(true)
        const { data } = await supabase
            .from("somos_preta_lista_criadores")
            .select("*, influencer:somos_preta_influencers(*)")
            .eq("lista_id", lista.id)
            .order("added_at", { ascending: false })
        setMembros((data as unknown as (ListaCriador & { influencer: Influencer })[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lista.id])

    async function buscar(q: string) {
        setBusca(q)
        if (q.trim().length < 2) { setResultados([]); return }
        const { data } = await supabase.from("somos_preta_influencers").select("*").ilike("nome", `%${q.trim()}%`).limit(8)
        setResultados((data as Influencer[]) ?? [])
    }

    async function adicionar(influencer_id: string) {
        const { error } = await supabase.from("somos_preta_lista_criadores").insert({ lista_id: lista.id, influencer_id })
        if (error) { toast.error("Já está nesta lista ou houve erro"); return }
        toast.success("Adicionado à lista")
        setAdicionarOpen(false)
        setBusca("")
        setResultados([])
        load()
    }

    async function mudarEtapa(membroId: string, etapa: PipelineEtapa) {
        setMembros((prev) => prev.map((m) => (m.id === membroId ? { ...m, etapa } : m)))
        await supabase.from("somos_preta_lista_criadores").update({ etapa }).eq("id", membroId)
    }

    async function remover(membroId: string) {
        await supabase.from("somos_preta_lista_criadores").delete().eq("id", membroId)
        setMembros((prev) => prev.filter((m) => m.id !== membroId))
    }

    const porEtapa = useMemo(() => {
        const c: Record<string, number> = {}
        membros.forEach((m) => { c[m.etapa] = (c[m.etapa] ?? 0) + 1 })
        return c
    }, [membros])

    return (
        <div className="space-y-4 pt-4">
            <button onClick={onVoltar} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="h-4 w-4" /> Listas
            </button>

            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-xl font-semibold">{lista.nome}</h3>
                    {lista.descricao && <p className="text-sm text-muted-foreground">{lista.descricao}</p>}
                </div>
                <Dialog open={adicionarOpen} onOpenChange={setAdicionarOpen}>
                    <DialogTrigger asChild><Button size="sm" className="rounded-xl"><UserPlus className="h-4 w-4" /> Adicionar criador</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Adicionar criador à lista</DialogTitle></DialogHeader>
                        <Input placeholder="Buscar por nome..." value={busca} onChange={(e) => buscar(e.target.value)} />
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                            {resultados.map((r) => (
                                <button key={r.id} onClick={() => adicionar(r.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-left">
                                    <Avatar className="h-6 w-6">{r.avatar_url && <AvatarImage src={r.avatar_url} alt={r.nome} />}<AvatarFallback className="text-[10px]">{r.nome.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                    {r.nome}
                                </button>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-wrap gap-2">
                {PIPELINE_ETAPAS.map((e) => (
                    <Badge key={e} variant="secondary" className="text-xs">{PIPELINE_LABEL[e]}: {porEtapa[e] ?? 0}</Badge>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : membros.length === 0 ? (
                <Card><CardContent className="py-14 text-center text-muted-foreground">Nenhum criador nesta lista ainda.</CardContent></Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Criador</TableHead><TableHead>Etapa</TableHead><TableHead className="text-right">Ações</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {membros.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell>
                                        <Link href={`/app/criadores/${m.influencer.id}`} className="flex items-center gap-2 hover:text-primary font-medium">
                                            <Avatar className="h-7 w-7">{m.influencer.avatar_url && <AvatarImage src={m.influencer.avatar_url} alt={m.influencer.nome} />}<AvatarFallback className="text-[10px]">{m.influencer.nome.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                                            {m.influencer.nome}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Select value={m.etapa} onValueChange={(v) => mudarEtapa(m.id, v as PipelineEtapa)}>
                                            <SelectTrigger className="w-[190px] h-8"><SelectValue /></SelectTrigger>
                                            <SelectContent>{PIPELINE_ETAPAS.map((e) => <SelectItem key={e} value={e}>{PIPELINE_LABEL[e]}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => remover(m.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    )
}

export function ListasTab() {
    const [supabase] = useState(() => createClient())
    const [listas, setListas] = useState<ListaComContagem[]>([])
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [campanhas, setCampanhas] = useState<Campanha[]>([])
    const [loading, setLoading] = useState(true)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [ativa, setAtiva] = useState<Lista | null>(null)
    const [form, setForm] = useState({ nome: "", descricao: "", cliente_id: "", campanha_id: "" })

    async function load() {
        setLoading(true)
        const [{ data: ls }, { data: cs }, { data: camps }] = await Promise.all([
            supabase.from("somos_preta_listas").select("*, cliente:somos_preta_clientes(nome), campanha:somos_preta_campanhas(nome)").order("created_at", { ascending: false }),
            supabase.from("somos_preta_clientes").select("*").order("nome"),
            supabase.from("somos_preta_campanhas").select("*").order("nome"),
        ])
        const listasBase = (ls as (Lista & { cliente: { nome: string } | null; campanha: { nome: string } | null })[]) ?? []
        const comContagem = await Promise.all(listasBase.map(async (l) => {
            const { count } = await supabase.from("somos_preta_lista_criadores").select("id", { count: "exact", head: true }).eq("lista_id", l.id)
            return { ...l, total: count ?? 0 }
        }))
        setListas(comContagem)
        setClientes((cs as Cliente[]) ?? [])
        setCampanhas((camps as Campanha[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function criar() {
        if (!form.nome.trim()) return
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from("somos_preta_listas").insert({
            nome: form.nome.trim(),
            descricao: form.descricao || null,
            cliente_id: form.cliente_id || null,
            campanha_id: form.campanha_id || null,
            criado_por: user?.id ?? null,
        })
        setSaving(false)
        if (error) { toast.error("Erro ao criar lista"); return }
        toast.success("Lista criada")
        setOpen(false)
        setForm({ nome: "", descricao: "", cliente_id: "", campanha_id: "" })
        load()
    }

    if (ativa) return <ListaDetalhe lista={ativa} onVoltar={() => { setAtiva(null); load() }} />

    return (
        <div className="space-y-4 pt-4">
            <div className="flex items-center justify-end">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4" /> Nova lista</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova lista</DialogTitle>
                            <DialogDescription>Mapeamento por campanha, cliente, região ou finalidade.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1.5">
                                <Label>Nome *</Label>
                                <Input placeholder="ex: Coca-Cola Retornável Zero — Salvador" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Descrição</Label>
                                <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Cliente</Label>
                                    <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                                        <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Campanha</Label>
                                    <Select value={form.campanha_id} onValueChange={(v) => setForm({ ...form, campanha_id: v })}>
                                        <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                                        <SelectContent>{campanhas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={criar} disabled={saving || !form.nome.trim()}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Criar</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : listas.length === 0 ? (
                <Card className="text-center py-16 border border-border/60 shadow-sm rounded-2xl">
                    <ListChecks className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-medium">Nenhuma lista ainda</p>
                    <p className="text-sm text-muted-foreground">Crie mapeamentos por campanha, cliente, região ou finalidade.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listas.map((l) => (
                        <Card key={l.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setAtiva(l)}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">{l.nome}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {l.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{l.descricao}</p>}
                                <div className="flex flex-wrap gap-1.5">
                                    {l.cliente && <Badge variant="outline">{l.cliente.nome}</Badge>}
                                    {l.campanha && <Badge variant="outline">{l.campanha.nome}</Badge>}
                                </div>
                                <p className="text-sm font-medium">{l.total} criador(es)</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
