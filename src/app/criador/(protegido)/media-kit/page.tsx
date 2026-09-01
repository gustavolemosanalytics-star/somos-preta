"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MidiaKit } from "@/lib/db/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
    Loader2, RefreshCw, Copy, Plus, Trash2, Upload, ExternalLink,
} from "lucide-react"
import { toast } from "sonner"

type PortfolioItem = { titulo: string; imagem: string; descricao: string; link: string }
type Pacote = { nome: string; preco: string; descricao: string; itens: string[] }
type RedeInfo = { handle: string; followers?: number | null; engagement_rate?: number | null }

const TEMAS = [
    { value: "terracota", label: "Terracota" },
    { value: "oliva", label: "Verde-oliva" },
    { value: "teal", label: "Teal" },
]

const REDES_CONFIG: { key: string; label: string; buscavel: boolean }[] = [
    { key: "instagram", label: "Instagram", buscavel: true },
    { key: "tiktok", label: "TikTok", buscavel: false },
    { key: "youtube", label: "YouTube", buscavel: false },
    { key: "twitter", label: "Twitter", buscavel: false },
]

function gerarSlug(nome: string) {
    return nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
}

export default function MediaKitPage() {
    const [supabase] = useState(() => createClient())
    const [userId, setUserId] = useState<string | null>(null)
    const [kit, setKit] = useState<MidiaKit | null>(null)
    const [loading, setLoading] = useState(true)
    const [erroInicial, setErroInicial] = useState(false)

    const [nome, setNome] = useState("")
    const [bio, setBio] = useState("")
    const [cidade, setCidade] = useState("")
    const [estado, setEstado] = useState("")
    const [nichosInput, setNichosInput] = useState("")

    const [uploadingAvatar, setUploadingAvatar] = useState(false)
    const [uploadingCover, setUploadingCover] = useState(false)
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    const [handles, setHandles] = useState<Record<string, string>>({})
    const [buscandoRede, setBuscandoRede] = useState<string | null>(null)

    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
    const [novoPortfolio, setNovoPortfolio] = useState<PortfolioItem>({ titulo: "", imagem: "", descricao: "", link: "" })

    const [pacotes, setPacotes] = useState<Pacote[]>([])
    const [novoPacote, setNovoPacote] = useState({ nome: "", preco: "", descricao: "", itensText: "" })

    function aplicarKit(k: MidiaKit) {
        setKit(k)
        setNome(k.nome ?? "")
        setBio(k.bio ?? "")
        setCidade(k.cidade ?? "")
        setEstado(k.estado ?? "")
        setNichosInput((k.nichos ?? []).join(", "))
        const redes = (k.redes ?? {}) as Record<string, RedeInfo>
        setHandles(Object.fromEntries(REDES_CONFIG.map((r) => [r.key, redes[r.key]?.handle ?? ""])))
        setPortfolio(Array.isArray(k.portfolio) ? (k.portfolio as PortfolioItem[]) : [])
        setPacotes(Array.isArray(k.pacotes) ? (k.pacotes as Pacote[]) : [])
    }

    // Garante exatamente um media kit por creator. cadastrado_por tem
    // constraint unique no banco (migration 0015), então o upsert com
    // ignoreDuplicates é atômico: sob corrida (ex.: StrictMode montando o
    // componente 2x), a segunda chamada é ignorada em vez de criar duplicata.
    // O retry de slug só entra em ação se o conflito for na constraint de
    // slug (não na de cadastrado_por, já coberta pelo ignoreDuplicates).
    async function garantirKit(uid: string): Promise<MidiaKit | null> {
        const { data: profile } = await supabase
            .from("somos_preta_profiles")
            .select("nome")
            .eq("id", uid)
            .single()

        const nomeBase = profile?.nome || "Criador"
        const slugBase = gerarSlug(nomeBase) || "criador"

        for (let tentativa = 1; tentativa <= 20; tentativa++) {
            const slug = tentativa === 1 ? slugBase : `${slugBase}-${tentativa}`
            const { error } = await supabase
                .from("somos_preta_midia_kits")
                .upsert(
                    { cadastrado_por: uid, nome: nomeBase, slug, publicado: false, tema: "terracota" },
                    { onConflict: "cadastrado_por", ignoreDuplicates: true }
                )

            if (!error) break
            if (error.code !== "23505") return null
        }

        const { data, error } = await supabase
            .from("somos_preta_midia_kits")
            .select("*")
            .eq("cadastrado_por", uid)
            .limit(1)
            .maybeSingle()

        return error ? null : (data as MidiaKit | null)
    }

    async function load() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); setErroInicial(true); return }
        setUserId(user.id)

        const k = await garantirKit(user.id)
        if (!k) { setErroInicial(true); setLoading(false); return }

        aplicarKit(k)
        setLoading(false)
    }

    const carregandoRef = useRef(false)
    useEffect(() => {
        if (carregandoRef.current) return
        carregandoRef.current = true
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function recarregarKit(id: string) {
        const { data } = await supabase.from("somos_preta_midia_kits").select("*").eq("id", id).single()
        if (data) aplicarKit(data as MidiaKit)
    }

    async function atualizar(patch: Partial<MidiaKit>) {
        if (!kit) return
        const { error } = await supabase.from("somos_preta_midia_kits").update(patch).eq("id", kit.id)
        if (error) { toast.error("Erro ao salvar"); return }
        await recarregarKit(kit.id)
    }

    function salvarNome() {
        if (!kit || !nome.trim() || nome === kit.nome) return
        atualizar({ nome: nome.trim() })
    }

    function salvarBio() {
        if (!kit || bio === (kit.bio ?? "")) return
        atualizar({ bio: bio || null })
    }

    function salvarCidade() {
        if (!kit || cidade === (kit.cidade ?? "")) return
        atualizar({ cidade: cidade || null })
    }

    function salvarEstado() {
        if (!kit || estado === (kit.estado ?? "")) return
        atualizar({ estado: estado || null })
    }

    function salvarNichos() {
        if (!kit) return
        const nichos = nichosInput.split(",").map((n) => n.trim()).filter(Boolean)
        if (JSON.stringify(nichos) === JSON.stringify(kit.nichos)) return
        atualizar({ nichos })
    }

    async function handleUpload(file: File, tipo: "avatar" | "cover") {
        if (!userId || !kit) return
        if (file.size > 10 * 1024 * 1024) { toast.error("Imagem muito grande (máx. 10MB)"); return }
        const setUploading = tipo === "avatar" ? setUploadingAvatar : setUploadingCover
        setUploading(true)
        const path = `${userId}/${tipo}-${crypto.randomUUID()}-${file.name}`
        const { error: upErr } = await supabase.storage.from("midia-kit").upload(path, file)
        if (upErr) { toast.error("Erro ao enviar imagem"); setUploading(false); return }
        const { data } = supabase.storage.from("midia-kit").getPublicUrl(path)
        setUploading(false)
        await atualizar(tipo === "avatar" ? { avatar_url: data.publicUrl } : { cover_url: data.publicUrl })
        toast.success(tipo === "avatar" ? "Avatar atualizado" : "Capa atualizada")
    }

    function salvarHandleManual(key: string) {
        if (!kit) return
        const atual = (kit.redes ?? {}) as Record<string, RedeInfo>
        const handle = (handles[key] ?? "").trim()
        if (handle === (atual[key]?.handle ?? "")) return
        atualizar({ redes: { ...atual, [key]: { ...atual[key], handle } } })
    }

    async function buscarDados(key: string) {
        const handle = (handles[key] ?? "").trim().replace(/^@/, "")
        if (!handle) { toast.error("Informe o @usuário"); return }
        setBuscandoRede(key)
        try {
            const res = await fetch(`/api/engajamento?username=${encodeURIComponent(handle)}`)
            const data = await res.json()
            if (!res.ok) { toast.error(data.error || "Erro ao buscar dados"); return }
            const atual = (kit?.redes ?? {}) as Record<string, RedeInfo>
            await atualizar({
                redes: { ...atual, [key]: { handle, followers: data.follower_count, engagement_rate: data.engagement_rate } },
            })
            const seguidores = typeof data.follower_count === "number" ? data.follower_count.toLocaleString("pt-BR") : "?"
            const engajamento = typeof data.engagement_rate === "number" ? `${data.engagement_rate.toFixed(2)}%` : "?"
            toast.success(`${seguidores} seguidores · engajamento ${engajamento}`)
        } catch {
            toast.error("Erro ao buscar dados")
        } finally {
            setBuscandoRede(null)
        }
    }

    async function adicionarPortfolio() {
        if (!novoPortfolio.titulo.trim()) { toast.error("Informe um título"); return }
        const nova = [...portfolio, { ...novoPortfolio, titulo: novoPortfolio.titulo.trim() }]
        await atualizar({ portfolio: nova })
        setNovoPortfolio({ titulo: "", imagem: "", descricao: "", link: "" })
    }

    async function removerPortfolio(index: number) {
        await atualizar({ portfolio: portfolio.filter((_, i) => i !== index) })
    }

    async function adicionarPacote() {
        if (!novoPacote.nome.trim()) { toast.error("Informe um nome"); return }
        const itens = novoPacote.itensText.split("\n").map((i) => i.trim()).filter(Boolean)
        const nova = [...pacotes, { nome: novoPacote.nome.trim(), preco: novoPacote.preco, descricao: novoPacote.descricao, itens }]
        await atualizar({ pacotes: nova })
        setNovoPacote({ nome: "", preco: "", descricao: "", itensText: "" })
    }

    async function removerPacote(index: number) {
        await atualizar({ pacotes: pacotes.filter((_, i) => i !== index) })
    }

    function copiarLink() {
        if (!kit) return
        navigator.clipboard.writeText(`${window.location.origin}/kit/${kit.slug}`)
        toast.success("Link copiado")
    }

    if (loading) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }

    if (erroInicial || !kit) {
        return (
            <Card><CardContent className="py-14 text-center text-muted-foreground">
                <p className="font-medium">Não foi possível carregar seu media kit</p>
                <p className="text-sm">Recarregue a página ou tente novamente em instantes.</p>
            </CardContent></Card>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Media kit</h1>
                <p className="text-sm text-muted-foreground">Monte seu perfil público para marcas e agências.</p>
            </div>

            <Tabs defaultValue="identidade">
                <TabsList>
                    <TabsTrigger value="identidade">Identidade</TabsTrigger>
                    <TabsTrigger value="redes">Redes sociais</TabsTrigger>
                    <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
                    <TabsTrigger value="pacotes">Pacotes</TabsTrigger>
                    <TabsTrigger value="tema">Tema</TabsTrigger>
                    <TabsTrigger value="publicar">Publicar</TabsTrigger>
                </TabsList>

                <TabsContent value="identidade">
                    <Card><CardContent className="pt-6 space-y-5">
                        <div className="flex flex-wrap items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={kit.avatar_url ?? undefined} />
                                <AvatarFallback>{(kit.nome || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1.5">
                                <Label>Avatar</Label>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "avatar"); e.target.value = "" }}
                                />
                                <Button type="button" variant="outline" size="sm" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
                                    {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Enviar imagem
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Capa</Label>
                            {kit.cover_url && (
                                <img src={kit.cover_url} alt="Capa" className="h-32 w-full object-cover rounded-2xl border border-border/60" />
                            )}
                            <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, "cover"); e.target.value = "" }}
                            />
                            <Button type="button" variant="outline" size="sm" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
                                {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Enviar capa
                            </Button>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nome</Label>
                            <Input value={nome} onChange={(e) => setNome(e.target.value)} onBlur={salvarNome} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Bio</Label>
                            <Textarea rows={4} placeholder="Conte sobre você" value={bio} onChange={(e) => setBio(e.target.value)} onBlur={salvarBio} />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Cidade</Label>
                                <Input value={cidade} onChange={(e) => setCidade(e.target.value)} onBlur={salvarCidade} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Estado</Label>
                                <Input value={estado} onChange={(e) => setEstado(e.target.value)} onBlur={salvarEstado} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Nichos</Label>
                            <Input
                                placeholder="ex: moda, beleza, lifestyle (separados por vírgula)"
                                value={nichosInput}
                                onChange={(e) => setNichosInput(e.target.value)}
                                onBlur={salvarNichos}
                            />
                            {kit.nichos.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {kit.nichos.map((n) => (
                                        <Badge key={n} variant="secondary" className="bg-muted text-muted-foreground">{n}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="redes">
                    <Card><CardContent className="pt-6 space-y-5">
                        {REDES_CONFIG.map((r) => {
                            const info = (kit.redes as Record<string, RedeInfo> | null)?.[r.key]
                            return (
                                <div key={r.key} className="space-y-1.5">
                                    <Label>{r.label}</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="@usuario"
                                            value={handles[r.key] ?? ""}
                                            onChange={(e) => setHandles((prev) => ({ ...prev, [r.key]: e.target.value }))}
                                            onBlur={() => salvarHandleManual(r.key)}
                                        />
                                        {r.buscavel && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={buscandoRede === r.key}
                                                onClick={() => buscarDados(r.key)}
                                                className="shrink-0"
                                            >
                                                {buscandoRede === r.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                                Buscar dados
                                            </Button>
                                        )}
                                    </div>
                                    {info && typeof info.followers === "number" && (
                                        <p className="text-xs text-muted-foreground">
                                            {info.followers.toLocaleString("pt-BR")} seguidores
                                            {typeof info.engagement_rate === "number" && ` · engajamento ${info.engagement_rate.toFixed(2)}%`}
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="portfolio">
                    <Card><CardContent className="pt-6 space-y-3">
                        {portfolio.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item no portfólio ainda.</p>}
                        <ul className="space-y-2">
                            {portfolio.map((item, i) => (
                                <li key={i} className="flex items-start gap-3 border rounded-lg px-3 py-2.5">
                                    {item.imagem && <img src={item.imagem} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />}
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <p className="text-sm font-medium truncate">{item.titulo}</p>
                                        {item.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{item.descricao}</p>}
                                        {item.link && (
                                            <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                                                <ExternalLink className="h-3 w-3" /> {item.link}
                                            </a>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600 shrink-0" onClick={() => removerPortfolio(i)} aria-label="Remover item" title="Remover item">
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                        <div className="border rounded-lg p-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Novo item</p>
                            <div className="grid sm:grid-cols-2 gap-2">
                                <Input placeholder="Título" value={novoPortfolio.titulo} onChange={(e) => setNovoPortfolio((p) => ({ ...p, titulo: e.target.value }))} />
                                <Input placeholder="URL da imagem" value={novoPortfolio.imagem} onChange={(e) => setNovoPortfolio((p) => ({ ...p, imagem: e.target.value }))} />
                            </div>
                            <Textarea placeholder="Descrição" rows={2} value={novoPortfolio.descricao} onChange={(e) => setNovoPortfolio((p) => ({ ...p, descricao: e.target.value }))} />
                            <Input placeholder="Link" value={novoPortfolio.link} onChange={(e) => setNovoPortfolio((p) => ({ ...p, link: e.target.value }))} />
                            <Button type="button" size="sm" variant="outline" onClick={adicionarPortfolio}><Plus className="h-4 w-4" /> Adicionar item</Button>
                        </div>
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="pacotes">
                    <Card><CardContent className="pt-6 space-y-3">
                        {pacotes.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pacote cadastrado ainda.</p>}
                        <ul className="space-y-2">
                            {pacotes.map((p, i) => (
                                <li key={i} className="border rounded-lg px-3 py-2.5 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {p.nome}
                                                {p.preco && <span className="text-muted-foreground font-normal"> · {p.preco}</span>}
                                            </p>
                                            {p.descricao && <p className="text-xs text-muted-foreground">{p.descricao}</p>}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600 shrink-0" onClick={() => removerPacote(i)} aria-label="Remover pacote" title="Remover pacote">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    {p.itens.length > 0 && (
                                        <ul className="text-xs text-muted-foreground list-disc list-inside">
                                            {p.itens.map((it, j) => <li key={j}>{it}</li>)}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <div className="border rounded-lg p-3 space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Novo pacote</p>
                            <div className="grid sm:grid-cols-2 gap-2">
                                <Input placeholder="Nome do pacote" value={novoPacote.nome} onChange={(e) => setNovoPacote((p) => ({ ...p, nome: e.target.value }))} />
                                <Input placeholder="Preço (ex: R$ 500)" value={novoPacote.preco} onChange={(e) => setNovoPacote((p) => ({ ...p, preco: e.target.value }))} />
                            </div>
                            <Textarea placeholder="Descrição" rows={2} value={novoPacote.descricao} onChange={(e) => setNovoPacote((p) => ({ ...p, descricao: e.target.value }))} />
                            <Textarea placeholder="Itens inclusos (um por linha)" rows={3} value={novoPacote.itensText} onChange={(e) => setNovoPacote((p) => ({ ...p, itensText: e.target.value }))} />
                            <Button type="button" size="sm" variant="outline" onClick={adicionarPacote}><Plus className="h-4 w-4" /> Adicionar pacote</Button>
                        </div>
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="tema">
                    <Card><CardContent className="pt-6 space-y-1.5 max-w-xs">
                        <Label>Tema visual do media kit</Label>
                        <DropdownSelect value={kit.tema} onValueChange={(v) => atualizar({ tema: v })} options={TEMAS} />
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="publicar">
                    <Card><CardContent className="pt-6 space-y-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <Label htmlFor="publicar-switch">Publicar media kit</Label>
                                <p className="text-xs text-muted-foreground">Quando ativo, seu media kit fica visível publicamente.</p>
                            </div>
                            <Switch id="publicar-switch" checked={kit.publicado} onCheckedChange={(v) => atualizar({ publicado: v })} />
                        </div>
                        {kit.publicado && (
                            <div className="flex items-center gap-2 border border-border/60 rounded-lg px-3 py-2.5 bg-muted/40">
                                <code className="text-sm flex-1 truncate">/kit/{kit.slug}</code>
                                <Button type="button" variant="outline" size="sm" onClick={copiarLink}>
                                    <Copy className="h-4 w-4" /> Copiar link
                                </Button>
                            </div>
                        )}
                    </CardContent></Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
