"use client"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Sparkles, MapPin, Users, TrendingUp, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { mockDb, type Influencer } from "@/lib/mock-db"

function formatFollowers(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
}

function InfluencerCard({ influencer }: { influencer: Influencer }) {
    return (
        <Link href={`/busca/${influencer.username}`}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group flex items-start gap-4 p-4 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
            >
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-lg">
                        {influencer.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{influencer.name}</h3>
                        <span className="text-sm text-muted-foreground">{influencer.instagram}</span>
                    </div>
                    {influencer.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{influencer.bio}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span className="font-medium">{formatFollowers(influencer.followers)}</span> seguidores
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span className="font-medium">{influencer.engagement}%</span> engajamento
                        </div>
                        {influencer.city && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {influencer.city}, {influencer.state}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                        {influencer.niche.map((n) => (
                            <Badge key={n} variant="secondary" className="text-[10px] px-2 py-0.5 rounded-lg">
                                {n}
                            </Badge>
                        ))}
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}

export default function BuscaPage() {
    const [query, setQuery] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    const { data: results, isLoading } = useQuery({
        queryKey: ["busca", searchTerm],
        queryFn: () => {
            if (!searchTerm) return Promise.resolve([])
            return mockDb.influencer.findMany({
                where: {
                    OR: [{ name: { contains: searchTerm } }],
                },
            })
        },
        enabled: searchTerm.length > 0,
    })

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSearchTerm(query.replace("@", ""))
    }

    const hasResults = searchTerm && results && results.length > 0
    const noResults = searchTerm && results && results.length === 0 && !isLoading

    return (
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
            <AnimatePresence mode="wait">
                {!searchTerm ? (
                    <motion.div
                        key="search-home"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="flex-1 flex items-center justify-center"
                    >
                        <div className="w-full max-w-2xl mx-auto px-4 text-center space-y-8">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/20">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold">
                                Buscar{" "}
                                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    Influencers
                                </span>
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Pesquise pelo @ ou nome de qualquer influencer e descubra suas métricas, público e desempenho.
                            </p>
                            <form onSubmit={handleSearch} className="relative">
                                <div className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Digite o @ ou nome do influencer..."
                                        className="h-16 pl-14 pr-32 text-lg rounded-2xl border-2 border-border/50 focus:border-primary/50 bg-card/50 shadow-lg"
                                    />
                                    <Button
                                        type="submit"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-6 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-bold"
                                    >
                                        Buscar
                                    </Button>
                                </div>
                            </form>
                            <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                                <span>Populares:</span>
                                {["@anasilva", "@jumar", "@camilafortal", "@isabelasantos"].map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => { setQuery(tag); setSearchTerm(tag.replace("@", "")) }}
                                        className="px-3 py-1 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="search-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex-1"
                    >
                        <div className="container mx-auto px-4 py-8">
                            {/* Search bar - compact */}
                            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Digite o @ ou nome do influencer..."
                                        className="h-12 pl-12 pr-24 rounded-2xl border-2 border-border/50 focus:border-primary/50 bg-card/50"
                                    />
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                                    >
                                        Buscar
                                    </Button>
                                </div>
                            </form>

                            {isLoading && (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            )}

                            {hasResults && (
                                <div className="max-w-2xl mx-auto">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {results.length} resultado{results.length !== 1 && "s"} para &quot;{searchTerm}&quot;
                                    </p>
                                    <div className="space-y-3">
                                        {results.map((influencer) => (
                                            <InfluencerCard key={influencer.id} influencer={influencer} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {noResults && (
                                <div className="text-center py-20">
                                    <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-muted-foreground">
                                        Nenhum resultado encontrado
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Tente buscar por outro @ ou nome de influencer.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4 rounded-xl"
                                        onClick={() => { setQuery(""); setSearchTerm("") }}
                                    >
                                        Limpar busca
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
