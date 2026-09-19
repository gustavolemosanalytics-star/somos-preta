"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Influencer, InfluencerStatus } from "@/lib/db/types"
import { useCreatorSelection } from "@/lib/stores/creator-selection"
import { ORDENACAO_OPCOES, type OrdenacaoValor } from "@/lib/constants/criadores"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
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
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Users, Plus, Loader2, Search, Eye, Pencil, Trash2, Star, Scale, TrendingUp, Sparkles, MapPin } from "lucide-react"
import { toast } from "sonner"
import { confirmarEscrita, lidos } from "@/lib/supabase/resultado"
import { ErroDeCarregamento } from "@/components/painel/erro-de-carregamento"
import { Paginacao } from "@/components/painel/paginacao"

const STATUS_META: Record<InfluencerStatus, { label: string; className: string }> = {
    ativo: { label: "Ativo", className: "bg-status-sucesso/12 text-status-sucesso" },
    inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
    negociando: { label: "Negociando", className: "bg-status-progresso/12 text-status-progresso" },
    bloqueado: { label: "Bloqueado", className: "bg-status-erro/12 text-status-erro" },
}

const fmt = (n: number) => n.toLocaleString("pt-BR")

/**
 * Cada opção de ordenação vira coluna e direção no servidor: com a lista
 * paginada por range, ordenar no cliente reordenaria só a página visível.
 */
const ORDENACAO_COLUNA: Record<OrdenacaoValor, { coluna: string; ascendente: boolean }> = {
    seguidores: { coluna: "followers", ascendente: false },
    engajamento: { coluna: "engagement", ascendente: false },
    views: { coluna: "views_medias", ascendente: false },
    crescimento: { coluna: "growth_rate", ascendente: false },
    recente: { coluna: "created_at", ascendente: false },
    nome: { coluna: "nome", ascendente: true },
}

const DIAS_NOVOS = 30

/**
 * Vírgula, parênteses e aspas são a gramática do `.or()` do PostgREST: mandar
 * cru o que o usuário digitou transforma uma busca comum em filtro inválido.
 */
function termoDeBusca(busca: string) {
    return busca.replace(/[,()"*\\]/g, " ").trim()
}

function plataformas(i: Influencer) {
    const p: string[] = []
    if (i.instagram) p.push("Instagram")
    if (i.tiktok) p.push("TikTok")
    if (i.youtube) p.push("YouTube")
    if (i.twitter) p.push("Twitter")
    return p
}

function CreatorAvatar({ i }: { i: Pick<Influencer, "nome" | "avatar_url"> }) {
    return (
        <Avatar className="h-8 w-8">
            {i.avatar_url && <AvatarImage src={i.avatar_url} alt={i.nome} />}
            <AvatarFallback className="text-xs">{i.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
    )
}

export function MinhaBaseTab() {
    const [supabase] = useState(() => createClient())
    const [influencers, setInfluencers] = useState<Influencer[]>([])
    const [totalFiltrado, setTotalFiltrado] = useState(0)
    const [totalDaBase, setTotalDaBase] = useState<number | null>(null)
    const [novos, setNovos] = useState<number | null>(null)
    const [maiorCrescimento, setMaiorCrescimento] = useState<string | null>(null)
    const [favoritos, setFavoritos] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [erroCarga, setErroCarga] = useState(false)
    const [favoritosIndisponiveis, setFavoritosIndisponiveis] = useState(false)
    const [busca, setBusca] = useState("")
    const [buscaAplicada, setBuscaAplicada] = useState("")
    const [ordenacao, setOrdenacao] = useState<OrdenacaoValor>("seguidores")
    const [pagina, setPagina] = useState(1)
    const [porPagina, setPorPagina] = useState(10)
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const { selecionados, toggle, limpar } = useCreatorSelection()
    // Cada troca de página, busca ou ordenação dispara uma consulta: a resposta
    // de um pedido antigo chegando atrasada pintaria a tela com o que já passou.
    const pedido = useRef(0)

    const [form, setForm] = useState({
        nome: "", instagram: "", tiktok: "", email: "", telefone: "",
        estado: "", cidade: "", nicho: "", followers: "", engagement: "",
        status: "ativo" as InfluencerStatus,
    })

    /**
     * A lista vem uma página por vez. Sem `range`, o teto de 1000 linhas do
     * PostgREST cortava a leitura em silêncio — e a tela dava a amostra como
     * se fosse a base inteira.
     */
    async function carregarPagina() {
        setLoading(true)
        const meu = ++pedido.current
        const termo = termoDeBusca(buscaAplicada)
        const { coluna, ascendente } = ORDENACAO_COLUNA[ordenacao]
        const inicio = (pagina - 1) * porPagina

        let consulta = supabase.from("somos_preta_influencers").select("*", { count: "exact" })
        if (termo) {
            // A busca também é do servidor: filtrar no cliente filtraria só a
            // página carregada, e paginar sobre isso devolve página vazia.
            const alvo = `%${termo}%`
            consulta = consulta.or(
                `nome.ilike.${alvo},instagram.ilike.${alvo},cidade.ilike.${alvo},estado.ilike.${alvo}`,
            )
        }

        const resposta = await consulta
            .order(coluna, { ascending: ascendente })
            .range(inicio, inicio + porPagina - 1)
        if (meu !== pedido.current) return

        const base = lidos(resposta) as Influencer[] | null
        const total = resposta.count ?? 0
        // Excluir as últimas linhas deixa a página atual fora do intervalo: sem
        // voltar para a primeira, a tela diria "nenhum criador" com a base cheia.
        if (base !== null && base.length === 0 && total > 0 && pagina > 1) { setPagina(1); return }

        setErroCarga(base === null)
        setInfluencers(base ?? [])
        setTotalFiltrado(total)
        setLoading(false)
    }

    /**
     * Os cards de insight não olham a página: contagem exata no servidor não
     * sofre o teto de linhas, então "Total da base" e "Novos" valem para a base
     * toda, independentemente de busca e de quantos itens cabem na tela.
     */
    async function carregarInsights() {
        const desde = new Date()
        desde.setDate(desde.getDate() - DIAS_NOVOS)
        const [respostaTotal, respostaNovos, respostaCrescimento] = await Promise.all([
            supabase.from("somos_preta_influencers").select("id", { count: "exact", head: true }),
            supabase.from("somos_preta_influencers")
                .select("id", { count: "exact", head: true })
                .gte("created_at", desde.toISOString()),
            supabase.from("somos_preta_influencers")
                .select("nome").order("growth_rate", { ascending: false }).limit(1),
        ])
        setTotalDaBase(respostaTotal.error ? null : (respostaTotal.count ?? 0))
        setNovos(respostaNovos.error ? null : (respostaNovos.count ?? 0))
        const topo = lidos(respostaCrescimento) as { nome: string }[] | null
        setMaiorCrescimento(topo?.[0]?.nome ?? null)
    }

    async function carregarFavoritos() {
        const { data: { user } } = await supabase.auth.getUser()
        // Sem a leitura dos favoritos a estrela apagada seria um palpite: some o botão
        // em vez de convidar a favoritar de novo o que já é favorito.
        if (!user) { setFavoritosIndisponiveis(true); setFavoritos(new Set()); return }
        const favs = lidos(
            await supabase.from("somos_preta_favoritos").select("influencer_id").eq("profile_id", user.id),
        ) as { influencer_id: string }[] | null
        setFavoritosIndisponiveis(favs === null)
        setFavoritos(new Set((favs ?? []).map((f) => f.influencer_id)))
    }

    /** Cadastrar ou excluir muda a página E os totais da base. */
    async function recarregar() {
        await Promise.all([carregarPagina(), carregarInsights()])
    }

    useEffect(() => {
        carregarPagina()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [buscaAplicada, ordenacao, pagina, porPagina])

    useEffect(() => {
        carregarInsights()
        carregarFavoritos()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Sem a espera, cada tecla digitada viraria uma consulta paginada; a busca
    // nova também recomeça da primeira página, senão cai fora do intervalo.
    useEffect(() => {
        const id = setTimeout(() => { setBuscaAplicada(busca); setPagina(1) }, 300)
        return () => clearTimeout(id)
    }, [busca])

    /**
     * Média de engajamento e distribuição por estado pedem agregação, que o
     * PostgREST não faz sem RPC. O que dá para calcular aqui é o recorte da
     * página — e o rótulo diz isso, em vez de vender amostra como retrato.
     */
    const daPagina = useMemo(() => {
        const erMedio = influencers.length > 0
            ? influencers.reduce((acc, i) => acc + Number(i.engagement), 0) / influencers.length
            : 0
        const porEstado = new Map<string, number>()
        influencers.forEach((i) => { if (i.estado) porEstado.set(i.estado, (porEstado.get(i.estado) ?? 0) + 1) })
        const topEstados = Array.from(porEstado.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
        return { erMedio, topEstados }
    }, [influencers])

    async function toggleFavorito(id: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { toast.error("Faça login novamente para favoritar"); return }
        if (favoritos.has(id)) {
            const ok = await confirmarEscrita(
                supabase.from("somos_preta_favoritos").delete().eq("influencer_id", id).eq("profile_id", user.id).select("id"),
                "Não foi possível remover dos favoritos",
            )
            if (!ok) return
            setFavoritos((prev) => { const n = new Set(prev); n.delete(id); return n })
        } else {
            const ok = await confirmarEscrita(
                supabase.from("somos_preta_favoritos").insert({ influencer_id: id, profile_id: user.id }).select("id"),
                "Não foi possível favoritar",
            )
            if (!ok) return
            setFavoritos((prev) => new Set(prev).add(id))
        }
    }

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
        toast.success("Criador cadastrado")
        setOpen(false)
        setForm({ nome: "", instagram: "", tiktok: "", email: "", telefone: "", estado: "", cidade: "", nicho: "", followers: "", engagement: "", status: "ativo" })
        recarregar()
    }

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4" /> Novo</Button></DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>Novo criador</DialogTitle>
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
                                    <div className="grid gap-2"><Label htmlFor="mail">E-mail</Label><Input id="mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                                    <div className="grid gap-2"><Label htmlFor="tel">Telefone</Label><Input id="tel" type="tel" inputMode="tel" autoComplete="off" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div>
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card><CardContent className="py-4">
                    <p className="text-2xl font-bold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> {totalDaBase === null ? "—" : fmt(totalDaBase)}</p>
                    <p className="text-xs text-muted-foreground">Total da base</p>
                </CardContent></Card>
                <Card><CardContent className="py-4">
                    <p className="text-2xl font-bold">{daPagina.erMedio.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">ER médio (página atual)</p>
                </CardContent></Card>
                <Card><CardContent className="py-4">
                    <p className="text-2xl font-bold text-status-sucesso">{novos === null ? "—" : `+${fmt(novos)}`}</p>
                    <p className="text-xs text-muted-foreground">Novos (30 dias)</p>
                </CardContent></Card>
                <Card><CardContent className="py-4">
                    <p className="text-sm font-medium flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-primary" /> {maiorCrescimento ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">Maior crescimento</p>
                </CardContent></Card>
            </div>

            {daPagina.topEstados.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> Top estados (página atual):
                    {daPagina.topEstados.map(([uf, count]) => <Badge key={uf} variant="outline">{uf} · {count}</Badge>)}
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nome, @, cidade ou UF..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 rounded-xl" />
                </div>
                <Select value={ordenacao} onValueChange={(v) => { setOrdenacao(v as OrdenacaoValor); setPagina(1) }}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{ORDENACAO_OPCOES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                {selecionados.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{selecionados.length} selecionado(s)</span>
                        <Link href="/criadores?tab=comparar"><Button size="sm" variant="outline" className="rounded-xl"><Scale className="h-3.5 w-3.5" /> Comparar</Button></Link>
                        <Button size="sm" variant="ghost" onClick={limpar}>Limpar</Button>
                    </div>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
                    ) : erroCarga ? (
                        <ErroDeCarregamento recurso="os criadores" onTentarDeNovo={carregarPagina} />
                    ) : influencers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium">{buscaAplicada.trim() ? "Nenhum criador encontrado" : "Nenhum criador ainda"}</p>
                            <p className="text-sm text-muted-foreground">
                                {buscaAplicada.trim()
                                    ? "Tente outro nome, @, cidade ou UF."
                                    : "Cadastre um ou use a aba “Explorar” para buscar por @."}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="hidden lg:table-cell">Local</TableHead>
                                    <TableHead className="hidden md:table-cell">Nicho</TableHead>
                                    <TableHead className="hidden sm:table-cell">Plataforma</TableHead>
                                    <TableHead className="text-right">Seguidores</TableHead>
                                    <TableHead className="hidden md:table-cell text-right">Eng.</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {influencers.map((i) => (
                                    <TableRow key={i.id} data-state={selecionados.includes(i.id) ? "selected" : undefined}>
                                        <TableCell><Checkbox checked={selecionados.includes(i.id)} onCheckedChange={() => toggle(i.id)} aria-label={`Selecionar ${i.nome}`} /></TableCell>
                                        <TableCell className="font-medium">
                                            <Link href={`/criadores/${i.id}`} className="flex items-center gap-2 hover:text-primary">
                                                <CreatorAvatar i={i} />
                                                <span className="truncate">
                                                    {i.nome}
                                                    {i.instagram && <span className="block text-xs text-muted-foreground font-normal">{i.instagram}</span>}
                                                </span>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-muted-foreground">{[i.cidade, i.estado].filter(Boolean).join(" / ") || "—"}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                {(i.nicho ?? []).slice(0, 2).map((n) => <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {plataformas(i).map((p) => <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>)}
                                                {plataformas(i).length === 0 && "—"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{fmt(i.followers)}</TableCell>
                                        <TableCell className="hidden md:table-cell text-right">{Number(i.engagement)}%</TableCell>
                                        <TableCell><Badge className={STATUS_META[i.status].className} variant="secondary">{STATUS_META[i.status].label}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-0.5">
                                                {!favoritosIndisponiveis && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFavorito(i.id)} aria-label="Favoritar">
                                                        <Star className={`h-4 w-4 ${favoritos.has(i.id) ? "fill-brand-coral text-brand-coral" : "text-muted-foreground"}`} />
                                                    </Button>
                                                )}
                                                <RowActions row={i} supabase={supabase} reload={recarregar} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Paginacao
                total={totalFiltrado}
                pagina={pagina}
                porPagina={porPagina}
                onPagina={setPagina}
                onPorPagina={(n) => { setPorPagina(n); setPagina(1) }}
                substantivo={["criador", "criadores"]}
            />
        </div>
    )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2 last:border-b-0 last:pb-0">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="text-right font-medium">{value}</span>
        </div>
    )
}

function RowActions({ row, supabase, reload }: {
    row: Influencer
    supabase: ReturnType<typeof createClient>
    reload: () => Promise<void> | void
}) {
    const [viewOpen, setViewOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [edit, setEdit] = useState({
        nome: "", instagram: "", tiktok: "", email: "", telefone: "", cidade: "", estado: "",
        followers: "", engagement: "", nicho: "", status: "ativo" as InfluencerStatus,
    })
    const [alertOpen, setAlertOpen] = useState(false)
    const [vinculosCampanha, setVinculosCampanha] = useState<number | null>(null)

    function onEditOpenChange(o: boolean) {
        if (o) {
            setEdit({
                nome: row.nome ?? "",
                instagram: row.instagram ?? "",
                tiktok: row.tiktok ?? "",
                email: row.email ?? "",
                telefone: row.telefone ?? "",
                cidade: row.cidade ?? "",
                estado: row.estado ?? "",
                followers: row.followers != null ? String(row.followers) : "",
                engagement: row.engagement != null ? String(row.engagement) : "",
                nicho: (row.nicho ?? []).join(", "),
                status: row.status,
            })
        }
        setEditOpen(o)
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!edit.nome.trim()) return
        setSaving(true)
        const ok = await confirmarEscrita(
            supabase.from("somos_preta_influencers").update({
                nome: edit.nome.trim(),
                instagram: edit.instagram || null,
                tiktok: edit.tiktok || null,
                email: edit.email || null,
                telefone: edit.telefone || null,
                estado: edit.estado || null,
                cidade: edit.cidade || null,
                nicho: edit.nicho ? edit.nicho.split(",").map((s) => s.trim()).filter(Boolean) : [],
                followers: edit.followers ? Number(edit.followers) : 0,
                engagement: edit.engagement ? Number(edit.engagement) : 0,
                status: edit.status,
            }).eq("id", row.id).select("id"),
            "Não foi possível atualizar o criador",
        )
        setSaving(false)
        if (!ok) return
        toast.success("Criador atualizado")
        setEditOpen(false)
        await reload()
    }

    async function onAlertOpenChange(o: boolean) {
        setAlertOpen(o)
        if (!o) return
        // O que o cascade leva junto precisa estar no texto ANTES do "Excluir"; até a
        // contagem chegar, o aviso genérico já diz que existe perda além do criador.
        setVinculosCampanha(null)
        const { count, error } = await supabase
            .from("somos_preta_campanha_influencers")
            .select("id", { count: "exact", head: true })
            .eq("influencer_id", row.id)
        setVinculosCampanha(error ? null : count)
    }

    async function handleDelete() {
        const ok = await confirmarEscrita(
            supabase.from("somos_preta_influencers").delete().eq("id", row.id).select("id"),
            "Não foi possível excluir o criador",
        )
        if (!ok) return
        toast.success("Criador excluído")
        await reload()
    }

    return (
        <div className="flex items-center justify-end gap-1">
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ver detalhes"><Eye className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{row.nome}</DialogTitle>
                        <DialogDescription>Detalhes do criador.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2 text-sm">
                        <Detail label="Instagram" value={row.instagram || "—"} />
                        <Detail label="TikTok" value={row.tiktok || "—"} />
                        <Detail label="Seguidores" value={fmt(row.followers)} />
                        <Detail label="Engajamento" value={`${Number(row.engagement)}%`} />
                        <Detail
                            label="Nichos"
                            value={row.nicho?.length ? (
                                <span className="flex flex-wrap justify-end gap-1">
                                    {row.nicho.map((n) => <Badge key={n} variant="secondary" className="bg-muted text-muted-foreground">{n}</Badge>)}
                                </span>
                            ) : "—"}
                        />
                        <Detail label="Local" value={[row.cidade, row.estado].filter(Boolean).join(" / ") || "—"} />
                        <Detail label="Status" value={<Badge className={STATUS_META[row.status].className} variant="secondary">{STATUS_META[row.status].label}</Badge>} />
                        <Detail label="Fonte" value={row.fonte === "app" ? "App" : "Interna"} />
                        {row.email ? <Detail label="E-mail" value={row.email} /> : null}
                        {row.telefone ? <Detail label="Telefone" value={row.telefone} /> : null}
                        <Detail label="Ficha completa" value={<Link href={`/criadores/${row.id}`} className="text-primary hover:underline">Ver ficha</Link>} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={onEditOpenChange}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <form onSubmit={handleUpdate}>
                        <DialogHeader>
                            <DialogTitle>Editar criador</DialogTitle>
                            <DialogDescription>Atualize os dados do creator.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`e-nome-${row.id}`}>Nome *</Label>
                                <Input id={`e-nome-${row.id}`} value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor={`e-ig-${row.id}`}>Instagram</Label><Input id={`e-ig-${row.id}`} placeholder="@user" value={edit.instagram} onChange={(e) => setEdit({ ...edit, instagram: e.target.value })} /></div>
                                <div className="grid gap-2"><Label htmlFor={`e-tt-${row.id}`}>TikTok</Label><Input id={`e-tt-${row.id}`} placeholder="@user" value={edit.tiktok} onChange={(e) => setEdit({ ...edit, tiktok: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor={`e-mail-${row.id}`}>E-mail</Label><Input id={`e-mail-${row.id}`} type="email" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
                                <div className="grid gap-2"><Label htmlFor={`e-tel-${row.id}`}>Telefone</Label><Input id={`e-tel-${row.id}`} value={edit.telefone} onChange={(e) => setEdit({ ...edit, telefone: e.target.value })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor={`e-cid-${row.id}`}>Cidade</Label><Input id={`e-cid-${row.id}`} value={edit.cidade} onChange={(e) => setEdit({ ...edit, cidade: e.target.value })} /></div>
                                <div className="grid gap-2"><Label htmlFor={`e-uf-${row.id}`}>Estado (UF)</Label><Input id={`e-uf-${row.id}`} maxLength={2} value={edit.estado} onChange={(e) => setEdit({ ...edit, estado: e.target.value.toUpperCase() })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2"><Label htmlFor={`e-fol-${row.id}`}>Seguidores</Label><Input id={`e-fol-${row.id}`} type="number" min="0" value={edit.followers} onChange={(e) => setEdit({ ...edit, followers: e.target.value })} /></div>
                                <div className="grid gap-2"><Label htmlFor={`e-eng-${row.id}`}>Engajamento (%)</Label><Input id={`e-eng-${row.id}`} type="number" min="0" step="0.01" value={edit.engagement} onChange={(e) => setEdit({ ...edit, engagement: e.target.value })} /></div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`e-nicho-${row.id}`}>Nichos (separados por vírgula)</Label>
                                <Input id={`e-nicho-${row.id}`} placeholder="moda, lifestyle" value={edit.nicho} onChange={(e) => setEdit({ ...edit, nicho: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v as InfluencerStatus })}>
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

            <AlertDialog open={alertOpen} onOpenChange={onAlertOpenChange}>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir criador?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O criador <span className="font-medium text-foreground">{row.nome}</span> será removido da base.
                            {vinculosCampanha === null
                                ? " Os vínculos de campanha dele e os valores de pagamento registrados são removidos junto."
                                : vinculosCampanha > 0
                                    ? ` Isso também remove ${vinculosCampanha} vínculo(s) de campanha e os valores de pagamento registrados neles.`
                                    : ""}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
