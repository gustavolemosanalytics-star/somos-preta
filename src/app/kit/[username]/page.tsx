import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, Heart, MapPin, MessageCircle } from "lucide-react"

type Redes = { instagram?: string; tiktok?: string; youtube?: string; followers?: string; engagement?: string; avgLikes?: string }
type Item = { title: string; brand: string }
type Pacote = { name: string; price: string; description?: string }

export default async function PublicMediaKitPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params
    const supabase = await createClient()

    const { data: kit } = await supabase
        .from("somos_preta_midia_kits_publicos")
        .select("*")
        .eq("slug", username)
        .maybeSingle()

    if (!kit) notFound()

    const cor: string = kit.tema || "#e57c4a"
    const redes: Redes = (kit.redes ?? {}) as Redes
    const portfolio: Item[] = (kit.portfolio ?? []) as Item[]
    const pacotes: Pacote[] = (kit.pacotes ?? []) as Pacote[]
    const nichos: string[] = kit.nichos ?? []
    const initials = (kit.nome as string).split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    const whatsapp = (kit.whatsapp ?? "").replace(/\D/g, "")

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <div className="h-56 relative" style={{ background: `linear-gradient(135deg, ${cor}, ${cor}99)` }}>
                <div className="container mx-auto px-4 h-full relative">
                    <div className="absolute -bottom-14 left-4 md:left-8">
                        <div className="h-28 w-28 rounded-full border-4 border-background bg-white flex items-center justify-center overflow-hidden shadow-lg">
                            {kit.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={kit.avatar_url} alt={kit.nome} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-4xl font-bold" style={{ color: cor }}>{initials}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 pt-20 pb-16">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                        <div className="max-w-2xl">
                            <h1 className="text-4xl font-bold tracking-tight">{kit.nome}</h1>
                            {redes.instagram && <p className="text-lg text-muted-foreground mt-1">{redes.instagram.startsWith("@") ? redes.instagram : `@${redes.instagram}`}</p>}
                            {(kit.cidade || kit.estado) && (
                                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1"><MapPin className="h-4 w-4" />{[kit.cidade, kit.estado].filter(Boolean).join(", ")}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {nichos.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                            </div>
                            {kit.bio && <p className="mt-6 text-lg leading-relaxed">{kit.bio}</p>}
                        </div>

                        {whatsapp && (
                            <a
                                href={`https://wa.me/${whatsapp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg transition-colors"
                            >
                                <MessageCircle className="h-5 w-5" /> Contratar via WhatsApp
                            </a>
                        )}
                    </div>

                    {/* Métricas */}
                    {(redes.followers || redes.engagement || redes.avgLikes) && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-12">
                            {redes.followers && (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border text-center">
                                    <Users className="h-7 w-7 mx-auto mb-2" style={{ color: cor }} />
                                    <div className="text-3xl font-bold">{redes.followers}</div>
                                    <div className="text-sm text-muted-foreground">Seguidores</div>
                                </div>
                            )}
                            {redes.engagement && (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border text-center">
                                    <TrendingUp className="h-7 w-7 mx-auto mb-2" style={{ color: cor }} />
                                    <div className="text-3xl font-bold">{redes.engagement}%</div>
                                    <div className="text-sm text-muted-foreground">Engajamento</div>
                                </div>
                            )}
                            {redes.avgLikes && (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border text-center">
                                    <Heart className="h-7 w-7 mx-auto mb-2" style={{ color: cor }} />
                                    <div className="text-3xl font-bold">{redes.avgLikes}</div>
                                    <div className="text-sm text-muted-foreground">Média de likes</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pacotes */}
                    {pacotes.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold mb-6">Pacotes</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pacotes.map((p, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border p-6" style={{ borderTopColor: cor, borderTopWidth: 3 }}>
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-bold">{p.name}</h3>
                                            <span className="font-bold" style={{ color: cor }}>{p.price}</span>
                                        </div>
                                        {p.description && <p className="text-sm text-muted-foreground mt-2">{p.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Portfólio */}
                    {portfolio.length > 0 && (
                        <div className="mt-16">
                            <h2 className="text-2xl font-bold mb-6">Portfólio & Cases</h2>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {portfolio.map((item, idx) => (
                                    <div key={idx} className="rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm">
                                        <h3 className="font-semibold">{item.title}</h3>
                                        {item.brand && <p className="text-sm text-muted-foreground">{item.brand}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
