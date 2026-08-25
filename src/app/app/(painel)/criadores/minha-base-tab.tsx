"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Influencer, InfluencerStatus } from "@/lib/db/types"
import { useCreatorSelection } from "@/lib/stores/creator-selection"
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
import { Users, Plus, Loader2, Search, Eye, Pencil, Trash2, Star, Scale } from "lucide-react"
import { toast } from "sonner"

const STATUS_META: Record<InfluencerStatus, { label: string; className: string }> = {
    ativo: { label: "Ativo", className: "bg-green-500/15 text-green-600" },
    inativo: { label: "Inativo", className: "bg-muted text-muted-foreground" },
    negociando: { label: "Negociando", className: "bg-blue-500/15 text-blue-600" },
    bloqueado: { label: "Bloqueado", className: "bg-red-500/15 text-red-600" },
}

const fmt = (n: number) => n.toLocaleString("pt-BR")

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
    const [favoritos, setFavoritos] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const { selecionados, toggle, limpar } = useCreatorSelection()

    const [form, setForm] = useState({
        nome: "", instagram: "", tiktok: "", email: "", telefone: "",
        estado: "", cidade: "", nicho: "", followers: "", engagement: "",
        status: "ativo" as InfluencerStatus,
    })

    async function load() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        const [{ data, error }, { data: favs }] = await Promise.all([
            supabase.from("somos_preta_influencers").select("*").order("followers", { ascending: false }),
            user ? supabase.from("somos_preta_favoritos").select("influencer_id").eq("profile_id", user.id) : Promise.resolve({ data: [] as { influencer_id: string }[] }),
        ])
        if (error) toast.error("Erro ao carregar criadores")
        setInfluencers((data as Influencer[]) ?? [])
        setFavoritos(new Set((favs ?? []).map((f) => f.influencer_id)))
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
            (i.estado ?? "").toLowerCase().includes(q) ||
            (i.nicho ?? []).some((n) => n.toLowerCase().includes(q))
        )
    }, [influencers, busca])

    async function toggleFavorito(id: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        if (favoritos.has(id)) {
            await supabase.from("somos_preta_favoritos").delete().eq("influencer_id", id).eq("profile_id", user.id)
            setFavoritos((prev) => { const n = new Set(prev); n.delete(id); return n })
        } else {
            await supabase.from("somos_preta_favoritos").insert({ influencer_id: id, profile_id: user.id })
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
        load()
    }

    return (
        <div className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs w-fit">
                    <Users className="h-3 w-3 mr-1" /> {influencers.length} cadastrados
                </Badge>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4" /> Novo</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nome, @, cidade ou nicho..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 rounded-xl" />
                </div>
                {selecionados.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{selecionados.length} selecionado(s)</span>
                        <Link href="/app/criadores?tab=comparar"><Button size="sm" variant="outline" className="rounded-xl"><Scale className="h-3.5 w-3.5" /> Comparar</Button></Link>
                        <Button size="sm" variant="ghost" onClick={limpar}>Limpar</Button>
                    </div>
                )}
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
                    ) : filtrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                            <p className="font-medium">Nenhum criador ainda</p>
                            <p className="text-sm text-muted-foreground">Cadastre um ou use a aba &quot;Explorar&quot; para buscar por @.</p>
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
                                {filtrados.map((i) => (
                                    <TableRow key={i.id} data-state={selecionados.includes(i.id) ? "selected" : undefined}>
                                        <TableCell><Checkbox checked={selecionados.includes(i.id)} onCheckedChange={() => toggle(i.id)} aria-label={`Selecionar ${i.nome}`} /></TableCell>
                                        <TableCell className="font-medium">
                                            <Link href={`/app/criadores/${i.id}`} className="flex items-center gap-2 hover:text-primary">
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleFavorito(i.id)} aria-label="Favoritar">
                                                    <Star className={`h-4 w-4 ${favoritos.has(i.id) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                                                </Button>
                                                <RowActions row={i} supabase={supabase} reload={load} />
                                            </div>
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
        nome: "", instagram: "", tiktok: "", cidade: "", estado: "",
        followers: "", engagement: "", nicho: "", status: "ativo" as InfluencerStatus,
    })

    function onEditOpenChange(o: boolean) {
        if (o) {
            setEdit({
                nome: row.nome ?? "",
                instagram: row.instagram ?? "",
                tiktok: row.tiktok ?? "",
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
        const { error } = await supabase.from("somos_preta_influencers").update({
            nome: edit.nome.trim(),
            instagram: edit.instagram || null,
            tiktok: edit.tiktok || null,
            estado: edit.estado || null,
            cidade: edit.cidade || null,
            nicho: edit.nicho ? edit.nicho.split(",").map((s) => s.trim()).filter(Boolean) : [],
            followers: edit.followers ? Number(edit.followers) : 0,
            engagement: edit.engagement ? Number(edit.engagement) : 0,
            status: edit.status,
        }).eq("id", row.id)
        setSaving(false)
        if (error) { toast.error("Não foi possível atualizar"); return }
        toast.success("Criador atualizado")
        setEditOpen(false)
        await reload()
    }

    async function handleDelete() {
        const { error } = await supabase.from("somos_preta_influencers").delete().eq("id", row.id)
        if (error) { toast.error("Não foi possível excluir"); return }
        toast.success("Criador excluído")
        await reload()
    }

    return (
        <div className="flex items-center justify-end gap-1">
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ver detalhes"><Eye className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
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
                        <Detail label="Ficha completa" value={<Link href={`/app/criadores/${row.id}`} className="text-primary hover:underline">Ver ficha</Link>} />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={onEditOpenChange}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
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

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir criador?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O criador <span className="font-medium text-foreground">{row.nome}</span> será removido da base.
                        </AlertDialogDescription>
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
