import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Instagram, Youtube, Twitter, Music2, AtSign, ExternalLink, MessageCircle } from "lucide-react"

type RedeSocial = {
    handle?: string
    followers?: number
    engagement_rate?: number
}

type Redes = Partial<Record<"instagram" | "tiktok" | "youtube" | "twitter", RedeSocial>>

type PortfolioItem = {
    titulo?: string
    imagem?: string
    descricao?: string
    link?: string
}

type PacoteItem = {
    nome?: string
    preco?: string | number
    descricao?: string
    itens?: string[]
}

type MidiaKitPublico = {
    id: string
    slug: string
    nome: string
    whatsapp: string | null
    bio: string | null
    avatar_url: string | null
    cover_url: string | null
    cidade: string | null
    estado: string | null
    nichos: string[] | null
    tema: string
    redes: Redes | null
    portfolio: PortfolioItem[] | null
    pacotes: PacoteItem[] | null
    publicado: boolean
    influencer_id: string | null
    created_at: string
}

const redeConfig: Record<string, { label: string; icon: typeof Instagram }> = {
    instagram: { label: "Instagram", icon: Instagram },
    tiktok: { label: "TikTok", icon: Music2 },
    youtube: { label: "YouTube", icon: Youtube },
    twitter: { label: "Twitter", icon: Twitter },
}

const accentClasses: Record<string, string> = {
    oliva: "text-secondary",
    teal: "text-accent",
    terracota: "text-primary",
}

function formatNumber(value: number) {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`
    return `${value}`
}

async function getKit(slug: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("somos_preta_midia_kits_publicos")
        .select("*")
        .eq("slug", slug)
        .single()

    if (error || !data) return null
    return data as MidiaKitPublico
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const kit = await getKit(slug)

    if (!kit || !kit.publicado) {
        return { title: "Media Kit não encontrado" }
    }

    return {
        title: `${kit.nome} — Media Kit`,
        description: kit.bio ?? undefined,
    }
}

export default async function MediaKitPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const kit = await getKit(slug)

    if (!kit || !kit.publicado) notFound()

    const accentClass = accentClasses[kit.tema] ?? accentClasses.terracota
    const redes = kit.redes ?? {}
    const redeEntries = Object.entries(redes).filter((entry): entry is [string, RedeSocial] => Boolean(entry[1]))
    const portfolio = Array.isArray(kit.portfolio) ? kit.portfolio : []
    const pacotes = Array.isArray(kit.pacotes) ? kit.pacotes : []
    const whatsappLimpo = kit.whatsapp ? kit.whatsapp.replace(/\D/g, "") : null
    const localizacao = [kit.cidade, kit.estado].filter(Boolean).join(" — ")

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="relative h-48 md:h-64 bg-muted">
                {kit.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={kit.cover_url} alt="" className="h-full w-full object-cover" />
                )}
            </div>

            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto">
                    <Avatar className="-mt-14 md:-mt-16 h-28 w-28 md:h-32 md:w-32 border-4 border-background">
                        <AvatarImage src={kit.avatar_url ?? undefined} alt={kit.nome} />
                        <AvatarFallback className="text-3xl font-semibold bg-muted">
                            {kit.nome.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="mt-5 space-y-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">{kit.nome}</h1>
                            {localizacao && (
                                <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
                                    <MapPin className={cn("h-4 w-4", accentClass)} /> {localizacao}
                                </p>
                            )}
                        </div>

                        {kit.bio && <p className="text-muted-foreground leading-relaxed max-w-2xl">{kit.bio}</p>}

                        {kit.nichos && kit.nichos.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {kit.nichos.map((nicho) => (
                                    <Badge key={nicho} variant="outline">
                                        {nicho}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {redeEntries.length > 0 && (
                        <div className="mt-10">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {redeEntries.map(([key, rede]) => {
                                    const config = redeConfig[key] ?? { label: key, icon: AtSign }
                                    const Icon = config.icon
                                    return (
                                        <Card key={key} className="rounded-2xl">
                                            <CardContent className="px-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon className={cn("h-4 w-4", accentClass)} />
                                                    <span className="text-sm font-medium">{config.label}</span>
                                                </div>
                                                {rede.handle && (
                                                    <p className="text-sm text-muted-foreground truncate">@{rede.handle.replace(/^@/, "")}</p>
                                                )}
                                                {typeof rede.followers === "number" && (
                                                    <p className="text-2xl font-semibold tracking-tight mt-1">{formatNumber(rede.followers)}</p>
                                                )}
                                                {typeof rede.engagement_rate === "number" && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {rede.engagement_rate.toFixed(1)}% de engajamento
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {portfolio.length > 0 && (
                        <div className="mt-14">
                            <h2 className={cn("text-xl font-semibold tracking-tight mb-5", accentClass)}>Portfólio</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {portfolio.map((item, i) => (
                                    <Card key={i} className="rounded-2xl overflow-hidden py-0 gap-0">
                                        {item.imagem && (
                                            <div className="aspect-video bg-muted">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={item.imagem} alt={item.titulo ?? ""} className="h-full w-full object-cover" />
                                            </div>
                                        )}
                                        <CardContent className="p-4">
                                            {item.titulo && <h3 className="font-medium text-sm">{item.titulo}</h3>}
                                            {item.descricao && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.descricao}</p>
                                            )}
                                            {item.link && (
                                                <a
                                                    href={item.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={cn("inline-flex items-center gap-1 text-xs font-medium mt-2 hover:underline", accentClass)}
                                                >
                                                    Ver mais <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {pacotes.length > 0 && (
                        <div className="mt-14">
                            <h2 className={cn("text-xl font-semibold tracking-tight mb-5", accentClass)}>Pacotes</h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pacotes.map((pacote, i) => (
                                    <Card key={i} className="rounded-2xl">
                                        <CardContent className="px-5 flex flex-col gap-3">
                                            {pacote.nome && <h3 className="font-semibold">{pacote.nome}</h3>}
                                            {pacote.preco !== undefined && (
                                                <p className={cn("text-2xl font-semibold tracking-tight", accentClass)}>
                                                    {typeof pacote.preco === "number"
                                                        ? pacote.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                                        : pacote.preco}
                                                </p>
                                            )}
                                            {pacote.descricao && (
                                                <p className="text-sm text-muted-foreground">{pacote.descricao}</p>
                                            )}
                                            {pacote.itens && pacote.itens.length > 0 && (
                                                <ul className="text-sm text-muted-foreground space-y-1.5 mt-1">
                                                    {pacote.itens.map((it, j) => (
                                                        <li key={j} className="flex items-start gap-2">
                                                            <span className={cn("mt-1.5 h-1 w-1 rounded-full shrink-0", accentClass.replace("text-", "bg-"))} />
                                                            {it}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {whatsappLimpo && (
                        <div className="mt-16 mb-20 text-center">
                            <Button asChild size="lg" className="rounded-full px-8 h-12 text-base">
                                <a href={`https://wa.me/${whatsappLimpo}`} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
                                </a>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
