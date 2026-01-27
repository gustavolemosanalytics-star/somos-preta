"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { mockDb, type Influencer } from "@/lib/mock-db"
import { useQuery } from "@tanstack/react-query"
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
    TrendingUp
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

export default function CreatorsSearchPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedState, setSelectedState] = useState<string | null>(null)
    const [isMapLoaded, setIsMapLoaded] = useState(false)

    const { data: influencers, isLoading } = useQuery({
        queryKey: ['influencers-search', searchTerm, selectedState],
        queryFn: () => mockDb.influencer.findMany({
            where: {
                OR: [{ name: { contains: searchTerm } }],
                ...(selectedState ? { state: selectedState } : {})
            }
        })
    })

    // Calculate creators per state for the map
    const creatorsPerState = useMemo(() => {
        if (!influencers) return {}
        const counts: Record<string, number> = {}
        influencers.forEach(inf => {
            counts[inf.state] = (counts[inf.state] || 0) + 1
        })
        return counts
    }, [influencers])

    // Total creators for all visible states
    const totalCreators = influencers?.length || 0

    return (
        <div className="flex flex-col gap-8 p-6 lg:p-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Buscador de Creators
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Encontre os talentos mais quentes do Norte e Nordeste através de métricas auditadas.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-none px-6 py-3 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-primary" />
                            <div>
                                <div className="text-2xl font-bold">{totalCreators}</div>
                                <div className="text-xs text-muted-foreground">Creators encontrados</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Map & Filters Section */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Map */}
                <Card className="lg:col-span-2 overflow-hidden border-none shadow-2xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-xl rounded-3xl">
                    <CardHeader className="border-b border-border/50">
                        <CardTitle className="flex items-center gap-2">
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
                                    className="rounded-b-3xl"
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
                    <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/80 backdrop-blur-xl rounded-3xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Filtrar por Estado</CardTitle>
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

                    <Card className="border-none shadow-xl bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-3xl">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp className="h-6 w-6 text-secondary" />
                                <span className="font-bold">Top Estado</span>
                            </div>
                            <div className="text-3xl font-bold text-secondary mb-1">Bahia</div>
                            <p className="text-sm text-muted-foreground">Maior concentração de creators</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card/80 backdrop-blur-sm border border-white/10 shadow-xl rounded-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, nicho ou @instagram..."
                        className="pl-10 h-12 border-none bg-muted/50 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="h-12 px-8 bg-gradient-to-r from-primary to-secondary rounded-xl">
                    <Filter className="mr-2 h-4 w-4" /> Filtros Avançados
                </Button>
            </div>

            {/* Results Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <span className="font-bold tracking-widest text-muted-foreground">MAPEANDO TALENTOS...</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {influencers?.map((influencer) => (
                        <Card key={influencer.id} className="overflow-hidden border-none shadow-lg hover:shadow-2xl transition-all bg-gradient-to-br from-card to-card/80 backdrop-blur-xl rounded-2xl group">
                            <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button className="w-full bg-white text-primary font-bold rounded-xl hover:bg-white/90">
                                        VER MÍDIA KIT <ExternalLink className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="w-full h-full flex items-center justify-center text-8xl font-bold opacity-10 text-primary">
                                    {influencer.name.charAt(0)}
                                </div>
                                <Badge className="absolute top-4 left-4 bg-secondary text-white">{influencer.state}</Badge>
                            </div>
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-bold leading-tight">{influencer.name}</h3>
                                    <p className="text-sm text-secondary font-bold">{influencer.instagram}</p>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {influencer.niche.map(n => (
                                        <Badge key={n} variant="outline" className="text-[10px] uppercase">{n}</Badge>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                            <Users className="h-3 w-3" /> Seguidores
                                        </span>
                                        <div className="font-bold text-lg">
                                            {new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(influencer.followers)}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" /> Engaj.
                                        </span>
                                        <div className="font-bold text-lg text-secondary">
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
                <Card className="text-center py-24 border-none bg-card/50 rounded-3xl">
                    <Star className="h-12 w-12 text-muted mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">Nenhum talento encontrado</h3>
                    <p className="text-muted-foreground">Tente ajustar seus filtros ou buscar por outra região.</p>
                </Card>
            )}
        </div>
    )
}
