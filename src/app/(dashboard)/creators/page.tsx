"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import type { Influencer } from "@/lib/db/types"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { useInstagramSearch, useTikTokSearch } from "@/hooks/use-social-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Search,
    Filter,
    Users,
    MapPin,
    Loader2,
    Star,
    ExternalLink,
    TrendingUp,
    Instagram,
    CheckCircle,
    Lock,
    UserPlus,
    ImageIcon,
    Heart,
    MessageCircle,
    Zap,
    Briefcase,
} from "lucide-react"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then(mod => mod.MapContainer),
    { ssr: false }
)
const TileLayer = dynamic(
    () => import("react-leaflet").then(mod => mod.TileLayer),
    { ssr: false }
)
const CircleMarker = dynamic(
    () => import("react-leaflet").then(mod => mod.CircleMarker),
    { ssr: false }
)
const Popup = dynamic(
    () => import("react-leaflet").then(mod => mod.Popup),
    { ssr: false }
)

// Regional coordinates for NE/N states
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

const states = ["BA", "PE", "CE", "RN", "PB", "MA", "PI", "SE", "AL", "AM", "PA"]

function formatNumber(n: number): string {
    return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(n)
}

export default function CreatorsSearchPage() {
    const [supabase] = useState(() => createClient())
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedState, setSelectedState] = useState<string | null>(null)
    const [isMapLoaded, setIsMapLoaded] = useState(false)

    const isSocialQuery = searchTerm.startsWith("@") && searchTerm.length >= 3
    const { data: igProfile, isLoading: igLoading, error: igError } = useInstagramSearch(searchTerm)
    const { data: ttProfile, isLoading: ttLoading, error: ttError } = useTikTokSearch(searchTerm)
    const socialLoading = igLoading || ttLoading
    const bothFailed = igError && ttError

    const { data: influencers, isLoading } = useQuery({
        queryKey: ['influencers-search', searchTerm, selectedState],
        queryFn: async () => {
            let q = supabase.from("somos_preta_influencers").select("*").order("followers", { ascending: false })
            if (selectedState) q = q.eq("estado", selectedState)
            if (searchTerm.trim()) q = q.ilike("nome", `%${searchTerm.trim()}%`)
            const { data } = await q
            return (data as Influencer[]) ?? []
        },
        enabled: !isSocialQuery,
    })

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

    // Calculate creators per state for the map
    const creatorsPerState = useMemo(() => {
        if (!influencers) return {}
        const counts: Record<string, number> = {}
        influencers.forEach(inf => {
            if (inf.estado) counts[inf.estado] = (counts[inf.estado] || 0) + 1
        })
        return counts
    }, [influencers])

    // Total creators for all visible states
    const socialResults = (igProfile ? 1 : 0) + (ttProfile ? 1 : 0)
    const totalCreators = isSocialQuery ? socialResults : (influencers?.length || 0)

    return (
        <div className="flex flex-col gap-8 p-6 lg:p-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
                        Buscador de <span className="text-primary">Creators</span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Encontre os talentos mais quentes do Norte e Nordeste ou busque qualquer perfil com <strong>@usuario</strong>.
                    </p>
                </div>
                <div className="flex items-center gap-4">
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
            </div>

            {/* Map & Filters Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Map */}
                <Card className="lg:col-span-2 overflow-hidden border border-border/60 shadow-sm rounded-2xl">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="flex items-center gap-2 font-semibold tracking-tight">
                            <MapPin className="h-5 w-5 text-primary" />
                            Densidade Regional
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 h-[400px] relative">
                        {typeof window !== 'undefined' && (
                            <>
                                <link
                                    rel="stylesheet"
                                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                                    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                                    crossOrigin=""
                                />
                                <MapContainer
                                    center={[-8.0, -40.0]}
                                    zoom={5}
                                    style={{ height: "100%", width: "100%" }}
                                    className="rounded-b-2xl"
                                    whenReady={() => setIsMapLoaded(true)}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                                    />
                                    {Object.entries(stateCoordinates).map(([code, coords]) => {
                                        const count = creatorsPerState[code] || 0
                                        if (count === 0) return null
                                        const radius = Math.max(10, Math.min(40, count * 3))
                                        return (
                                            <CircleMarker
                                                key={code}
                                                center={[coords.lat, coords.lng]}
                                                radius={radius}
                                                pathOptions={{
                                                    color: '#ff6b35',
                                                    fillColor: '#ff6b35',
                                                    fillOpacity: 0.6,
                                                    weight: 2,
                                                }}
                                            >
                                                <Popup>
                                                    <div className="text-center">
                                                        <strong className="text-lg">{coords.name}</strong>
                                                        <br />
                                                        <span className="text-primary font-bold">{count} creators</span>
                                                    </div>
                                                </Popup>
                                            </CircleMarker>
                                        )
                                    })}
                                </MapContainer>
                            </>
                        )}
                        {!isMapLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Filters & Stats */}
                <div className="space-y-6">
                    <Card className="border border-border/60 shadow-sm rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold tracking-tight">Filtrar por Estado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant={selectedState === null ? "default" : "outline"}
                                onClick={() => setSelectedState(null)}
                                className="w-full justify-start rounded-xl"
                            >
                                Todos os Estados
                            </Button>
                            <div className="grid grid-cols-3 gap-2">
                                {states.map(s => (
                                    <Button
                                        key={s}
                                        variant={selectedState === s ? "default" : "outline"}
                                        onClick={() => setSelectedState(s)}
                                        size="sm"
                                        className="rounded-xl text-xs"
                                    >
                                        {s}
                                        {creatorsPerState[s] && (
                                            <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                                                {creatorsPerState[s]}
                                            </Badge>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/60 shadow-sm rounded-2xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="h-6 w-6 text-primary" />
                                <span className="font-semibold tracking-tight">Top Estado</span>
                            </div>
                            <div className="text-3xl font-semibold tracking-tight text-foreground mb-1">Bahia</div>
                            <p className="text-sm text-muted-foreground">Maior concentração de creators</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border/60 shadow-sm rounded-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, nicho ou @usuario (Instagram + TikTok)..."
                        className="pl-10 h-12 border-none bg-muted/50 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {isSocialQuery && (
                        <div className="absolute right-3 top-3 flex gap-1">
                            <Badge variant="secondary" className="text-xs">
                                <Instagram className="h-3 w-3 mr-1" />
                                IG
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                TikTok
                            </Badge>
                        </div>
                    )}
                </div>
                <Button className="h-12 px-8 rounded-full">
                    <Filter className="mr-2 h-4 w-4" /> Filtros Avançados
                </Button>
            </div>

            {/* Social Profile Results */}
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
                            <p className="text-muted-foreground mt-2">
                                Não foi possível encontrar <strong>{searchTerm}</strong> no Instagram ou TikTok.
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">Verifique se o username está correto.</p>
                        </Card>
                    )}

                    {/* TikTok Profile */}
                    {ttProfile && !socialLoading && (
                        <Card className="overflow-hidden border border-border/60 shadow-sm rounded-2xl">
                            <div className="grid md:grid-cols-[300px_1fr] gap-0">
                                <div className="relative aspect-square md:aspect-auto bg-muted flex items-center justify-center">
                                    {ttProfile.profile_pic_url ? (
                                        <Image
                                            src={ttProfile.profile_pic_url}
                                            alt={ttProfile.full_name || ttProfile.username}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="text-9xl font-bold opacity-10">
                                            {(ttProfile.full_name || ttProfile.username).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <Badge className="absolute top-4 left-4 bg-black text-white text-xs">
                                        TikTok
                                    </Badge>
                                </div>
                                <CardContent className="p-8 flex flex-col justify-center gap-6">
                                    <div className="space-y-2">
                                        <h2 className="text-3xl font-semibold tracking-tight">{ttProfile.full_name || ttProfile.username}</h2>
                                        <p className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
                                            @{ttProfile.username}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <Users className="h-4 w-4 mx-auto mb-1 text-pink-500" />
                                            <div className="text-xl font-bold">{formatNumber(ttProfile.follower_count)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Seguidores</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <UserPlus className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                                            <div className="text-xl font-bold">{formatNumber(ttProfile.following_count)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Seguindo</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
                                            <div className="text-xl font-bold">{formatNumber(ttProfile.total_likes)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Curtidas Total</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            className="bg-black text-white rounded-full hover:bg-black/80"
                                            onClick={() => window.open(`https://tiktok.com/@${ttProfile.username}`, "_blank")}
                                        >
                                            Ver no TikTok
                                        </Button>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    )}

                    {/* Instagram Profile */}
                    {igProfile && !socialLoading && (
                        <Card className="overflow-hidden border border-border/60 shadow-sm rounded-2xl">
                            <div className="grid md:grid-cols-[300px_1fr] gap-0">
                                {/* Profile Picture */}
                                <div className="relative aspect-square md:aspect-auto bg-muted flex items-center justify-center">
                                    {igProfile.profile_pic_url ? (
                                        <Image
                                            src={igProfile.profile_pic_url}
                                            alt={igProfile.full_name || igProfile.username}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="text-9xl font-bold opacity-10 text-pink-500">
                                            {(igProfile.full_name || igProfile.username).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {igProfile.is_private && (
                                        <Badge className="absolute top-4 right-4 bg-yellow-500/90 text-black">
                                            <Lock className="h-3 w-3 mr-1" /> Privado
                                        </Badge>
                                    )}
                                </div>

                                {/* Profile Info */}
                                <CardContent className="p-8 flex flex-col justify-center gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-3xl font-semibold tracking-tight">{igProfile.full_name || igProfile.username}</h2>
                                            {igProfile.is_verified && (
                                                <CheckCircle className="h-6 w-6 text-blue-500 fill-blue-500" />
                                            )}
                                        </div>
                                        <p className="text-lg text-muted-foreground font-semibold flex items-center gap-2">
                                            <Instagram className="h-5 w-5 text-primary" />
                                            @{igProfile.username}
                                        </p>
                                        {igProfile.biography && (
                                            <p className="text-muted-foreground leading-relaxed whitespace-pre-line max-w-xl">
                                                {igProfile.biography}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category */}
                                    {(igProfile.category || igProfile.is_business) && (
                                        <div className="flex flex-wrap gap-2">
                                            {igProfile.is_business && (
                                                <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                    <Briefcase className="h-3 w-3 mr-1" /> Conta Profissional
                                                </Badge>
                                            )}
                                            {igProfile.category && (
                                                <Badge variant="outline" className="text-xs uppercase">
                                                    {igProfile.category}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <Users className="h-4 w-4 mx-auto mb-1 text-pink-500" />
                                            <div className="text-xl font-bold">{formatNumber(igProfile.follower_count)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Seguidores</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <UserPlus className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                                            <div className="text-xl font-bold">{formatNumber(igProfile.following_count)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Seguindo</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <ImageIcon className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                                            <div className="text-xl font-bold">{formatNumber(igProfile.posts_count)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Publicações</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <Heart className="h-4 w-4 mx-auto mb-1 text-red-500" />
                                            <div className="text-xl font-bold">{formatNumber(igProfile.avg_likes)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Curtidas/Post</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <MessageCircle className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                                            <div className="text-xl font-bold">{formatNumber(igProfile.avg_comments)}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Comentários/Post</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-2xl">
                                            <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                                            <div className="text-xl font-bold">{igProfile.engagement_rate}%</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-bold">Engajamento</div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <Button
                                            className="rounded-full"
                                            onClick={() => window.open(`https://instagram.com/${igProfile.username}`, "_blank")}
                                        >
                                            <Instagram className="mr-2 h-4 w-4" /> Ver no Instagram
                                        </Button>
                                        <Button variant="outline" className="rounded-full" onClick={adicionarInfluencer}>
                                            <UserPlus className="mr-2 h-4 w-4" /> Adicionar à Plataforma
                                        </Button>
                                    </div>
                                </CardContent>
                            </div>

                            {/* Recent Posts */}
                            {igProfile.recent_posts.length > 0 && (
                                <div className="border-t border-border/50 p-8">
                                    <h3 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5 text-primary" />
                                        Posts Recentes ({igProfile.recent_posts.length})
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                        {igProfile.recent_posts.map((post) => (
                                            <a
                                                key={post.shortcode}
                                                href={`https://instagram.com/p/${post.shortcode}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative aspect-square rounded-xl overflow-hidden bg-muted"
                                            >
                                                {post.thumbnail_url && (
                                                    <Image
                                                        src={post.thumbnail_url}
                                                        alt={post.caption.slice(0, 50) || "Post"}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform"
                                                        unoptimized
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                                    <div className="flex items-center gap-1 text-white text-sm font-bold">
                                                        <Heart className="h-4 w-4 fill-white" /> {formatNumber(post.likes)}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-white text-sm font-bold">
                                                        <MessageCircle className="h-4 w-4 fill-white" /> {formatNumber(post.comments)}
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}
                </>
            )}

            {/* Regular Results Grid */}
            {!isSocialQuery && (
                <>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <span className="font-bold tracking-widest text-muted-foreground">MAPEANDO TALENTOS...</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {influencers?.map((influencer) => (
                                <Card key={influencer.id} className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all rounded-2xl group">
                                    <div className="aspect-square bg-muted relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button className="w-full bg-white text-primary font-semibold rounded-xl hover:bg-white/90">
                                                VER MÍDIA KIT <ExternalLink className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="w-full h-full flex items-center justify-center text-8xl font-bold opacity-10 text-primary">
                                            {influencer.nome.charAt(0)}
                                        </div>
                                        {influencer.estado && <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">{influencer.estado}</Badge>}
                                    </div>
                                    <CardContent className="pt-6 space-y-4">
                                        <div>
                                            <h3 className="text-xl font-semibold tracking-tight leading-tight">{influencer.nome}</h3>
                                            <p className="text-sm text-muted-foreground font-medium">{influencer.instagram}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {(influencer.nicho ?? []).map(n => (
                                                <Badge key={n} variant="outline" className="text-[10px] uppercase">{n}</Badge>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                                    <Users className="h-3 w-3" /> Seguidores
                                                </span>
                                                <div className="font-bold text-lg">
                                                    {formatNumber(influencer.followers)}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                                    <TrendingUp className="h-3 w-3" /> Engaj.
                                                </span>
                                                <div className="font-bold text-lg text-primary">
                                                    {influencer.engagement}%
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {influencers?.length === 0 && !isLoading && (
                        <Card className="text-center py-24 border border-border/60 shadow-sm rounded-2xl">
                            <Star className="h-12 w-12 text-muted mx-auto mb-4" />
                            <h3 className="text-2xl font-semibold tracking-tight">Nenhum talento encontrado</h3>
                            <p className="text-muted-foreground">Tente ajustar seus filtros ou buscar por outra região.</p>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
