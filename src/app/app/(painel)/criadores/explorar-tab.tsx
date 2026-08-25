"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import type { Influencer } from "@/lib/db/types"
import { UFS } from "@/lib/constants/uf"
import { useCreatorSelection } from "@/lib/stores/creator-selection"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useInstagramSearch, useTikTokSearch } from "@/hooks/use-social-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Search, Filter, Users, MapPin, Loader2, Star, TrendingUp, Instagram, CheckCircle, Lock,
    UserPlus, ImageIcon, Heart, MessageCircle, Zap, Briefcase, Info, Scale,
} from "lucide-react"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

const stateCoordinates: Record<string, { lat: number; lng: number; name: string }> = {
    "BA": { lat: -12.9714, lng: -38.5014, name: "Bahia" },
    "PE": { lat: -8.0476, lng: -34.8770, name: "Pernambuco" },
    "CE": { lat: -3.7172, lng: -38.5433, name: "Ceará" },
    "RN": { lat: -5.7945, lng: -35.2110, name: "Rio Grande do Norte" },
    "PB": { lat: -7.1195, lng: -34.8450, name: "Paraíba" },
    "MA": { lat: -2.5387, lng: -44.2826, name: "Maranhão" },
    "PI": { lat: -5.0920, lng: -42.8038, name: "Piauí" },
    "SE": { lat: -10.9472, lng: -37.0731, name: "Sergipe" },
    "AL": { lat: -9.6658, lng: -35.7350, name: "Alagoas" },
    "AM": { lat: -3.1190, lng: -60.0217, name: "Amazonas" },
    "PA": { lat: -1.4558, lng: -48.4902, name: "Pará" },
}
const states = Object.keys(stateCoordinates)

function formatNumber(n: number): string {
    return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(n)
}

function extrairHandle(input: string): string | null {
    const trimmed = input.trim()
    if (trimmed.startsWith("@") && trimmed.length >= 3) return trimmed
    const m = trimmed.match(/(?:instagram\.com|tiktok\.com)\/@?([a-zA-Z0-9._]+)/i)
    return m ? `@${m[1]}` : null
}

const FAIXA_MAX = { seguidores: 2_000_000, engajamento: 20, views: 1_000_000, cache: 50_000 }

export function ExplorarTab() {
    const [supabase] = useState(() => createClient())
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedState, setSelectedState] = useState<string | null>(null)
    const [isMapLoaded, setIsMapLoaded] = useState(false)
    const [filtrosAbertos, setFiltrosAbertos] = useState(false)
    const [page, setPage] = useState(0)
    const pageSize = 24
    const { selecionados, toggle, limpar } = useCreatorSelection()

    const [filtros, setFiltros] = useState({
        uf: "todos",
        genero: "todos",
        nicho: "",
        jaTrabalhado: "todos" as "todos" | "sim" | "nao",
        seguidores: [0, FAIXA_MAX.seguidores] as [number, number],
        engajamento: [0, FAIXA_MAX.engajamento] as [number, number],
        views: [0, FAIXA_MAX.views] as [number, number],
        cache: [0, FAIXA_MAX.cache] as [number, number],
    })

    const handleBusca = extrairHandle(searchTerm)
    const isSocialQuery = !!handleBusca
    const { data: igProfile, isLoading: igLoading, error: igError } = useInstagramSearch(handleBusca ?? "")
    const { data: ttProfile, isLoading: ttLoading, error: ttError } = useTikTokSearch(handleBusca ?? "")
    const socialLoading = igLoading || ttLoading
    const bothFailed = igError && ttError

    const { data: trabalhadosIds } = useQuery({
        queryKey: ["influencer-ids-trabalhados"],
        queryFn: async () => {
            const { data } = await supabase.from("somos_preta_campanha_influencers").select("influencer_id")
            return new Set((data ?? []).map((d) => d.influencer_id as string))
        },
    })

    const { data: influencers, isLoading } = useQuery({
        queryKey: ["influencers-search", searchTerm, selectedState, filtros],
        queryFn: async () => {
            let q = supabase.from("somos_preta_influencers").select("*").order("followers", { ascending: false })
            if (selectedState) q = q.eq("estado", selectedState)
            if (filtros.uf !== "todos") q = q.eq("estado", filtros.uf)
            if (filtros.genero !== "todos") q = q.eq("genero", filtros.genero)
            if (filtros.nicho.trim()) q = q.contains("nicho", [filtros.nicho.trim()])
            if (searchTerm.trim()) q = q.ilike("nome", `%${searchTerm.trim()}%`)
            q = q.gte("followers", filtros.seguidores[0]).lte("followers", filtros.seguidores[1])
            q = q.gte("engagement", filtros.engajamento[0]).lte("engagement", filtros.engajamento[1])
            q = q.gte("views_medias", filtros.views[0]).lte("views_medias", filtros.views[1])
            const { data } = await q
            return (data as Influencer[]) ?? []
        },
        enabled: !isSocialQuery,
    })

    const filtradosPorTrabalho = useMemo(() => {
        if (!influencers) return []
        if (filtros.jaTrabalhado === "todos" || !trabalhadosIds) return influencers
        return influencers.filter((i) => filtros.jaTrabalhado === "sim" ? trabalhadosIds.has(i.id) : !trabalhadosIds.has(i.id))
    }, [influencers, filtros.jaTrabalhado, trabalhadosIds])

    const paginados = useMemo(
        () => filtradosPorTrabalho.slice(0, (page + 1) * pageSize),
        [filtradosPorTrabalho, page]
    )

    async function adicionarInfluencer() {
        if (!igProfile) return
        const { error } = await supabase.from("somos_preta_influencers").insert({
            nome: igProfile.full_name || igProfile.username,
            username: igProfile.username,
            instagram: `@${igProfile.username}`,
            avatar_url: igProfile.profile_pic_url ?? null,
            bio: igProfile.biography ?? null,
            followers: igProfile.follower_count ?? 0,
            engagement: Number(igProfile.engagement_rate) || 0,
            avg_likes: igProfile.avg_likes ?? 0,
            avg_comments: igProfile.avg_comments ?? 0,
            status: "ativo",
        })
        if (error) toast.error("Não foi possível adicionar")
        else toast.success("Influenciador adicionado à base")
    }

    const creatorsPerState = useMemo(() => {
        if (!influencers) return {}
        const counts: Record<string, number> = {}
        influencers.forEach((inf) => { if (inf.estado) counts[inf.estado] = (counts[inf.estado] || 0) + 1 })
        return counts
    }, [influencers])

    const socialResults = (igProfile ? 1 : 0) + (ttProfile ? 1 : 0)
    const totalCreators = isSocialQuery ? socialResults : filtradosPorTrabalho.length

    return (
        <div className="flex flex-col gap-8 pt-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                        Buscador de <span className="text-primary">Creators</span>
                    </h2>
                    <p className="text-muted-foreground">
                        Encontre talentos do Norte e Nordeste ou busque qualquer perfil com <strong>@usuario</strong> ou uma URL do Instagram/TikTok.
                    </p>
                </div>
                <Card className="border border-border/60 shadow-sm px-6 py-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                            <div className="text-2xl font-semibold tracking-tight">{totalCreators}</div>
                            <div className="text-xs text-muted-foreground">Creators encontrados</div>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 overflow-hidden border border-border/60 shadow-sm rounded-2xl">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="flex items-center gap-2 font-semibold tracking-tight">
                            <MapPin className="h-5 w-5 text-primary" /> Densidade Regional
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 h-[360px] relative">
                        {typeof window !== "undefined" && (
                            <>
                                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossOrigin="" />
                                <MapContainer center={[-8.0, -40.0]} zoom={5} style={{ height: "100%", width: "100%" }} className="rounded-b-2xl" whenReady={() => setIsMapLoaded(true)}>
                                    <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                                    {Object.entries(stateCoordinates).map(([code, coords]) => {
                                        const count = creatorsPerState[code] || 0
                                        if (count === 0) return null
                                        const radius = Math.max(10, Math.min(40, count * 3))
                                        return (
                                            <CircleMarker key={code} center={[coords.lat, coords.lng]} radius={radius} pathOptions={{ color: "#ff6b35", fillColor: "#ff6b35", fillOpacity: 0.6, weight: 2 }}>
                                                <Popup><div className="text-center"><strong className="text-lg">{coords.name}</strong><br /><span className="text-primary font-bold">{count} creators</span></div></Popup>
                                            </CircleMarker>
                                        )
                                    })}
                                </MapContainer>
                            </>
                        )}
                        {!isMapLoaded && <div className="absolute inset-0 flex items-center justify-center bg-muted/50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border border-border/60 shadow-sm rounded-2xl">
                        <CardHeader><CardTitle className="text-lg font-semibold tracking-tight">Filtrar por Estado</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant={selectedState === null ? "default" : "outline"} onClick={() => setSelectedState(null)} className="w-full justify-start rounded-xl">Todos os Estados</Button>
                            <div className="grid grid-cols-3 gap-2">
                                {states.map((s) => (
                                    <Button key={s} variant={selectedState === s ? "default" : "outline"} onClick={() => setSelectedState(s)} size="sm" className="rounded-xl text-xs">
                                        {s}{creatorsPerState[s] && <Badge variant="secondary" className="ml-1 text-[10px] px-1">{creatorsPerState[s]}</Badge>}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border/60 shadow-sm rounded-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, nicho, @usuario ou URL do perfil..."
                        className="pl-10 h-12 border-none bg-muted/50 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Popover open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
                    <PopoverTrigger asChild>
                        <Button className="h-12 px-8 rounded-full" variant="outline"><Filter className="mr-2 h-4 w-4" /> Filtros Avançados</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[340px] space-y-4" align="end">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Estado</label>
                                <Select value={filtros.uf} onValueChange={(v) => setFiltros((f) => ({ ...f, uf: v }))}>
                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        {UFS.map((u) => <SelectItem key={u.sigla} value={u.sigla}>{u.sigla}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Gênero</label>
                                <Select value={filtros.genero} onValueChange={(v) => setFiltros((f) => ({ ...f, genero: v }))}>
                                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="feminino">Feminino</SelectItem>
                                        <SelectItem value="masculino">Masculino</SelectItem>
                                        <SelectItem value="nao_binario">Não-binário</SelectItem>
                                        <SelectItem value="outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Nicho</label>
                            <Input className="h-8" placeholder="ex: moda" value={filtros.nicho} onChange={(e) => setFiltros((f) => ({ ...f, nicho: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Já trabalhado</label>
                            <Select value={filtros.jaTrabalhado} onValueChange={(v) => setFiltros((f) => ({ ...f, jaTrabalhado: v as typeof f.jaTrabalhado }))}>
                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    <SelectItem value="sim">Já trabalhado</SelectItem>
                                    <SelectItem value="nao">Ainda não utilizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Seguidores: {formatNumber(filtros.seguidores[0])} – {formatNumber(filtros.seguidores[1])}</label>
                            <Slider min={0} max={FAIXA_MAX.seguidores} step={10000} value={filtros.seguidores} onValueChange={(v) => setFiltros((f) => ({ ...f, seguidores: v as [number, number] }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Engajamento: {filtros.engajamento[0]}% – {filtros.engajamento[1]}%</label>
                            <Slider min={0} max={FAIXA_MAX.engajamento} step={0.5} value={filtros.engajamento} onValueChange={(v) => setFiltros((f) => ({ ...f, engajamento: v as [number, number] }))} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Views médias: {formatNumber(filtros.views[0])} – {formatNumber(filtros.views[1])}</label>
                            <Slider min={0} max={FAIXA_MAX.views} step={5000} value={filtros.views} onValueChange={(v) => setFiltros((f) => ({ ...f, views: v as [number, number] }))} />
                        </div>
                        <Button variant="ghost" size="sm" className="w-full" onClick={() => { setFiltros({ uf: "todos", genero: "todos", nicho: "", jaTrabalhado: "todos", seguidores: [0, FAIXA_MAX.seguidores], engajamento: [0, FAIXA_MAX.engajamento], views: [0, FAIXA_MAX.views], cache: [0, FAIXA_MAX.cache] }); setPage(0) }}>
                            Limpar filtros
                        </Button>
                    </PopoverContent>
                </Popover>
            </div>

            {isSocialQuery && (
                <>
                    {socialLoading && (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="h-12 w-12 animate-spin text-pink-500 mb-4" />
                            <span className="font-bold tracking-widest text-muted-foreground">BUSCANDO PERFIS...</span>
                        </div>
                    )}
                    {bothFailed && !socialLoading && (
                        <Card className="text-center py-12 border border-border/60 shadow-sm rounded-2xl">
                            <Instagram className="h-12 w-12 text-muted mx-auto mb-4" />
                            <h3 className="text-2xl font-semibold tracking-tight">Perfil não encontrado</h3>
                            <p className="text-muted-foreground mt-2">Não foi possível encontrar <strong>{handleBusca}</strong> no Instagram ou TikTok.</p>
                        </Card>
                    )}
                    {ttProfile && !socialLoading && (
                        <Card className="overflow-hidden border border-border/60 shadow-sm rounded-2xl">
                            <div className="grid md:grid-cols-[300px_1fr] gap-0">
                                <div className="relative aspect-square md:aspect-auto bg-muted flex items-center justify-center">
                                    {ttProfile.profile_pic_url ? (
                                        <Image src={ttProfile.profile_pic_url} alt={ttProfile.full_name || ttProfile.username} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="text-9xl font-bold opacity-10">{(ttProfile.full_name || ttProfile.username).charAt(0).toUpperCase()}</div>
                                    )}
                                    <Badge className="absolute top-4 left-4 bg-black text-white text-xs">TikTok</Badge>
                                </div>
                                <CardContent className="p-8 flex flex-col justify-center gap-6">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-semibold tracking-tight">{ttProfile.full_name || ttProfile.username}</h2>
                                        <p className="text-lg font-semibold text-muted-foreground">@{ttProfile.username}</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><Users className="h-4 w-4 mx-auto mb-1 text-pink-500" /><div className="text-xl font-bold">{formatNumber(ttProfile.follower_count)}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Seguidores</div></div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><UserPlus className="h-4 w-4 mx-auto mb-1 text-purple-500" /><div className="text-xl font-bold">{formatNumber(ttProfile.following_count)}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Seguindo</div></div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><Heart className="h-4 w-4 mx-auto mb-1 text-red-500" /><div className="text-xl font-bold">{formatNumber(ttProfile.total_likes)}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Curtidas Total</div></div>
                                    </div>
                                    <Button className="bg-black text-white rounded-full hover:bg-black/80 w-fit" onClick={() => window.open(`https://tiktok.com/@${ttProfile.username}`, "_blank")}>Ver no TikTok</Button>
                                </CardContent>
                            </div>
                        </Card>
                    )}
                    {igProfile && !socialLoading && (
                        <Card className="overflow-hidden border border-border/60 shadow-sm rounded-2xl">
                            <div className="grid md:grid-cols-[300px_1fr] gap-0">
                                <div className="relative aspect-square md:aspect-auto bg-muted flex items-center justify-center">
                                    {igProfile.profile_pic_url ? (
                                        <Image src={igProfile.profile_pic_url} alt={igProfile.full_name || igProfile.username} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="text-9xl font-bold opacity-10 text-pink-500">{(igProfile.full_name || igProfile.username).charAt(0).toUpperCase()}</div>
                                    )}
                                    {igProfile.is_private && <Badge className="absolute top-4 right-4 bg-yellow-500/90 text-black"><Lock className="h-3 w-3 mr-1" /> Privado</Badge>}
                                </div>
                                <CardContent className="p-8 flex flex-col justify-center gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-semibold tracking-tight">{igProfile.full_name || igProfile.username}</h2>
                                            {igProfile.is_verified && <CheckCircle className="h-6 w-6 text-blue-500 fill-blue-500" />}
                                        </div>
                                        <p className="text-lg text-muted-foreground font-semibold flex items-center gap-2"><Instagram className="h-5 w-5 text-primary" /> @{igProfile.username}</p>
                                        {igProfile.biography && <p className="text-muted-foreground leading-relaxed whitespace-pre-line max-w-xl">{igProfile.biography}</p>}
                                    </div>
                                    {(igProfile.category || igProfile.is_business) && (
                                        <div className="flex flex-wrap gap-2">
                                            {igProfile.is_business && <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20"><Briefcase className="h-3 w-3 mr-1" /> Conta Profissional</Badge>}
                                            {igProfile.category && <Badge variant="outline" className="text-xs uppercase">{igProfile.category}</Badge>}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><Users className="h-4 w-4 mx-auto mb-1 text-pink-500" /><div className="text-xl font-bold">{formatNumber(igProfile.follower_count)}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Seguidores</div></div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><UserPlus className="h-4 w-4 mx-auto mb-1 text-purple-500" /><div className="text-xl font-bold">{formatNumber(igProfile.following_count)}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Seguindo</div></div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><ImageIcon className="h-4 w-4 mx-auto mb-1 text-orange-500" /><div className="text-xl font-bold">{formatNumber(igProfile.posts_count)}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Publicações</div></div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><Heart className="h-4 w-4 mx-auto mb-1 text-red-500" /><div className="text-xl font-bold">{formatNumber(igProfile.avg_likes)}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Curtidas/Post</div></div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><MessageCircle className="h-4 w-4 mx-auto mb-1 text-blue-500" /><div className="text-xl font-bold">{formatNumber(igProfile.avg_comments)}</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Comentários/Post</div></div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl"><Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" /><div className="text-xl font-bold">{igProfile.engagement_rate}%</div><div className="text-[10px] text-muted-foreground uppercase font-bold">Engajamento</div></div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button className="rounded-full" onClick={() => window.open(`https://instagram.com/${igProfile.username}`, "_blank")}><Instagram className="mr-2 h-4 w-4" /> Ver no Instagram</Button>
                                        <Button variant="outline" className="rounded-full" onClick={adicionarInfluencer}><UserPlus className="mr-2 h-4 w-4" /> Adicionar à Plataforma</Button>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    )}
                </>
            )}

            {!isSocialQuery && (
                <>
                    {selecionados.length > 0 && (
                        <div className="flex items-center gap-2 -mb-4">
                            <span className="text-xs text-muted-foreground">{selecionados.length} selecionado(s)</span>
                            <Link href="/app/criadores?tab=comparar"><Button size="sm" variant="outline" className="rounded-xl"><Scale className="h-3.5 w-3.5" /> Comparar</Button></Link>
                            <Button size="sm" variant="ghost" onClick={limpar}>Limpar</Button>
                        </div>
                    )}
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <span className="font-bold tracking-widest text-muted-foreground">MAPEANDO TALENTOS...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {paginados.map((influencer) => (
                                <Card key={influencer.id} className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all rounded-2xl group relative">
                                    <div className="absolute top-3 left-3 z-10">
                                        <Checkbox
                                            checked={selecionados.includes(influencer.id)}
                                            onCheckedChange={() => toggle(influencer.id)}
                                            className="bg-background/80 backdrop-blur"
                                            aria-label={`Selecionar ${influencer.nome}`}
                                        />
                                    </div>
                                    <Link href={`/app/criadores/${influencer.id}`}>
                                        <div className="aspect-square bg-muted relative overflow-hidden">
                                            {influencer.avatar_url ? (
                                                <Image src={influencer.avatar_url} alt={influencer.nome} fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-8xl font-bold opacity-10 text-primary">{influencer.nome.charAt(0)}</div>
                                            )}
                                            {influencer.estado && <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">{influencer.estado}</Badge>}
                                        </div>
                                    </Link>
                                    <CardContent className="pt-6 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-semibold tracking-tight leading-tight">{influencer.nome}</h3>
                                            <p className="text-sm text-muted-foreground font-medium">{influencer.instagram}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {(influencer.nicho ?? []).map((n) => <Badge key={n} variant="outline" className="text-[10px] uppercase">{n}</Badge>)}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1"><Users className="h-3 w-3" /> Seguidores</span>
                                                <div className="font-bold text-lg">{formatNumber(influencer.followers)}</div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3" /> Engaj.
                                                    <Tooltip>
                                                        <TooltipTrigger asChild><Info className="h-3 w-3 cursor-help" /></TooltipTrigger>
                                                        <TooltipContent><p className="max-w-[200px] text-xs">Calculado como (curtidas + comentários médios) / seguidores, com base nos últimos posts coletados.</p></TooltipContent>
                                                    </Tooltip>
                                                </span>
                                                <div className="font-bold text-lg text-primary">{influencer.engagement}%</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {filtradosPorTrabalho.length === 0 && !isLoading && (
                        <Card className="text-center py-24 border border-border/60 shadow-sm rounded-2xl">
                            <Star className="h-12 w-12 text-muted mx-auto mb-4" />
                            <h3 className="text-2xl font-semibold tracking-tight">Nenhum talento encontrado</h3>
                            <p className="text-muted-foreground">Tente ajustar seus filtros ou buscar por outra região.</p>
                        </Card>
                    )}

                    {paginados.length < filtradosPorTrabalho.length && (
                        <div className="flex justify-center">
                            <Button variant="outline" className="rounded-full" onClick={() => setPage((p) => p + 1)}>
                                Carregar mais ({filtradosPorTrabalho.length - paginados.length} restantes)
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
