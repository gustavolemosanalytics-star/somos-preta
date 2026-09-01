"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Loader2, Search, BadgeCheck, Users, Heart, MessageCircle, TrendingUp, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type EngajamentoResult = {
    username: string
    full_name: string
    profile_pic_url: string
    follower_count: number
    following_count: number
    posts_count: number
    is_private: boolean
    is_verified: boolean
    engagement_available: boolean
    avg_likes: number | null
    median_likes: number | null
    avg_comments: number | null
    median_comments: number | null
    engagement_rate: number | null
    source: "hikerapi" | "scraper"
}

const fade = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

function formatCompact(n: number | null): string {
    if (n == null) return "Indisponível"
    return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}

export default function EngajamentoPage() {
    const [username, setUsername] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<EngajamentoResult | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!username.trim() || loading) return

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const res = await fetch(`/api/engajamento?username=${encodeURIComponent(username.trim())}`)
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Erro ao buscar dados do Instagram")
                return
            }

            setResult(data)
        } catch {
            setError("Erro ao buscar dados do Instagram")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col">
            <section className="relative">
                <div className="container mx-auto px-4 pt-16 pb-10 lg:pt-24 lg:pb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-2xl mx-auto text-center space-y-5"
                    >
                        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
                            Consulte a taxa de <span className="text-primary">engajamento</span> de um criador
                        </h1>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Informe um @ do Instagram e calculamos (curtidas + comentários) ÷ seguidores × 100, com base nas publicações recentes.
                        </p>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-md mx-auto mt-9 flex gap-2"
                    >
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@usuario"
                            className="h-12 rounded-xl"
                        />
                        <Button type="submit" disabled={loading} className="h-12 px-6 rounded-xl">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> Consultar</>}
                        </Button>
                    </motion.form>
                </div>
            </section>

            <section className="border-t border-border/60">
                <div className="container mx-auto px-4 py-16">
                    <div className="max-w-2xl mx-auto space-y-6">
                        {error && (
                            <motion.div {...fade}>
                                <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
                                    <CardContent className="px-6 py-5 text-sm text-destructive">
                                        {error}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div {...fade}>
                                <Card className="rounded-3xl border-border/60">
                                    <CardContent className="px-6 py-8 sm:px-8">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-16 w-16 border border-border/60">
                                                <AvatarImage src={result.profile_pic_url} alt={result.username} />
                                                <AvatarFallback>{result.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h2 className="text-lg font-semibold truncate">
                                                        {result.full_name || result.username}
                                                    </h2>
                                                    {result.is_verified && (
                                                        <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">@{result.username}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                                            {[
                                                { icon: Users, label: "Seguidores", value: formatCompact(result.follower_count) },
                                                { icon: Heart, label: "Curtidas médias", value: formatCompact(result.avg_likes) },
                                                { icon: MessageCircle, label: "Comentários médios", value: formatCompact(result.avg_comments) },
                                                { icon: TrendingUp, label: "Taxa de engajamento", value: result.engagement_rate != null ? `${result.engagement_rate}%` : "Indisponível" },
                                            ].map((m) => (
                                                <div key={m.label} className="rounded-2xl border border-border/60 p-4">
                                                    <m.icon className="h-4 w-4 text-primary mb-2" />
                                                    <p className={cn("text-xl font-semibold tracking-tight", m.value === "Indisponível" && "text-base text-muted-foreground")}>
                                                        {m.value}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        {!result.engagement_available && (
                                            <p className="text-xs text-muted-foreground mt-5">
                                                Dados de curtidas/comentários indisponíveis no momento para este perfil.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        <motion.div {...fade}>
                            <Card className="rounded-3xl bg-muted/40 border-border/60">
                                <CardContent className="px-6 py-8 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
                                    <div>
                                        <h3 className="font-semibold text-lg">É criador? Cadastre-se na PRETA e crie seu Media Kit.</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Tenha suas métricas organizadas e visíveis para marcas.</p>
                                    </div>
                                    <Button asChild className="rounded-xl shrink-0">
                                        <Link href="/criador/criar-conta">
                                            Criar minha conta <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    )
}
