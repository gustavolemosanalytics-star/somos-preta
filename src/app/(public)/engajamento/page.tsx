"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { Loader2, BadgeCheck, Users, Heart, MessageCircle, TrendingUp, ArrowRight, HelpCircle, ChevronDown } from "lucide-react"
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
    const [showFormula, setShowFormula] = useState(false)
    const reduceMotion = useReducedMotion()

    // erro e resultado entram assim que chegam (não dependem de scroll como o whileInView)
    const appear = {
        initial: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] as const },
    }

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
            <section className="relative overflow-hidden">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[40rem] max-w-[130%] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
                />

                <div className="container relative mx-auto px-4 pt-14 pb-12 sm:pt-16 lg:pt-24 lg:pb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-2xl mx-auto space-y-4 text-left sm:text-center"
                    >
                        <h1 className="text-[2.5rem] leading-[1.08] sm:text-5xl font-semibold tracking-tight text-balance">
                            Descubra o <span className="text-primary">engajamento</span> de um criador
                        </h1>
                        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed text-pretty">
                            Digite o @ do Instagram e veja a taxa de engajamento com base nas publicações recentes.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-xl mx-auto mt-8 sm:mt-10"
                    >
                        <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm sm:p-8">
                            <div className="flex items-center gap-2 text-primary">
                                <TrendingUp className="h-4 w-4 shrink-0" />
                                <span className="text-[12px] font-medium uppercase tracking-[0.14em]">
                                    Calculadora de engajamento
                                </span>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
                                <label htmlFor="username" className="sr-only">
                                    @ do Instagram
                                </label>
                                <Input
                                    id="username"
                                    name="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="@nomedocriador"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    className="h-[52px] w-full rounded-lg bg-background px-4 text-[16px] sm:h-12 sm:flex-1 md:text-[16px] dark:bg-background/50"
                                />
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="h-[52px] w-full rounded-lg px-6 text-[16px] font-medium has-[>svg]:px-6 sm:h-12 sm:w-auto"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" /> Analisando...
                                        </>
                                    ) : (
                                        <>
                                            <TrendingUp className="h-4 w-4" /> Analisar perfil
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-5 border-t border-border/60 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowFormula((v) => !v)}
                                    aria-expanded={showFormula}
                                    aria-controls="como-calculamos"
                                    className="flex w-full items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <HelpCircle className="h-4 w-4 shrink-0" />
                                    <span className="flex-1 text-left">Como calculamos?</span>
                                    <motion.span
                                        animate={{ rotate: showFormula ? 180 : 0 }}
                                        transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                                        className="flex shrink-0"
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </motion.span>
                                </button>

                                <div id="como-calculamos">
                                    <AnimatePresence initial={false}>
                                        {showFormula && (
                                            <motion.div
                                                key="formula"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <p className="pt-3 text-sm leading-relaxed text-muted-foreground">
                                                    Somamos curtidas e comentários das publicações recentes, dividimos pelo total de seguidores e multiplicamos por 100.
                                                </p>
                                                <p className="mt-3 overflow-x-auto rounded-lg border border-border/60 bg-background px-3.5 py-2.5 text-[13px] whitespace-nowrap text-foreground/80 dark:bg-background/50">
                                                    (curtidas + comentários) ÷ seguidores × 100
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="border-t border-border/60">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <div className="max-w-2xl mx-auto space-y-6" aria-live="polite">
                        {error && (
                            <motion.div {...appear} role="alert">
                                <Card className="rounded-3xl border-destructive/30 bg-destructive/5">
                                    <CardContent className="px-6 py-5 text-sm text-destructive">
                                        {error}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {result && (
                            <motion.div {...appear}>
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
                                                <div key={m.label} className="rounded-lg border border-border/60 p-4">
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
                                    <Button asChild className="w-full shrink-0 rounded-lg sm:w-auto">
                                        <Link href="/creator/criar-conta">
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
