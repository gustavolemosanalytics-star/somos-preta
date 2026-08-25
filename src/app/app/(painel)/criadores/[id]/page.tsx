"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import type { Influencer, Campanha, Mensagem, Contrato } from "@/lib/db/types"
import { useInstagramSearch } from "@/hooks/use-social-search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ArrowLeft, Building2, Calendar, FileText, Image as ImageIcon, Instagram, Loader2,
    Megaphone, Send, Star, TrendingUp,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

const fmt = (n: number) => n.toLocaleString("pt-BR")

type CampanhaVinculada = { campanha: Campanha & { cliente: { nome: string } | null }; pagamento: number; status_bia: string | null }

export default function CreatorProfilePage() {
    const { id } = useParams<{ id: string }>()
    const [supabase] = useState(() => createClient())
    const [influencer, setInfluencer] = useState<Influencer | null>(null)
    const [favorito, setFavorito] = useState(false)
    const [loading, setLoading] = useState(true)

    async function load() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        const [{ data: inf }, { data: fav }] = await Promise.all([
            supabase.from("somos_preta_influencers").select("*").eq("id", id).single(),
            user ? supabase.from("somos_preta_favoritos").select("id").eq("influencer_id", id).eq("profile_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        ])
        setInfluencer((inf as Influencer) ?? null)
        setFavorito(!!fav)
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    async function toggleFavorito() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        if (favorito) {
            await supabase.from("somos_preta_favoritos").delete().eq("influencer_id", id).eq("profile_id", user.id)
        } else {
            await supabase.from("somos_preta_favoritos").insert({ influencer_id: id, profile_id: user.id })
        }
        setFavorito(!favorito)
    }

    if (loading) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }

    if (!influencer) {
        return (
            <div className="space-y-4">
                <Link href="/app/criadores" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Criadores</Link>
                <p className="text-muted-foreground">Criador não encontrado.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Link href="/app/criadores" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Criadores</Link>

            <Card>
                <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-6">
                    <Avatar className="h-16 w-16">
                        {influencer.avatar_url && <AvatarImage src={influencer.avatar_url} alt={influencer.nome} />}
                        <AvatarFallback className="text-lg">{influencer.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight">{influencer.nome}</h1>
                            <Badge variant="secondary" className={influencer.fonte === "app" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}>
                                {influencer.fonte === "app" ? "App" : "Interna"}
                            </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                            {influencer.instagram && <span className="flex items-center gap-1"><Instagram className="h-3.5 w-3.5" /> {influencer.instagram}</span>}
                            {[influencer.cidade, influencer.estado].filter(Boolean).join(" / ") && <span>{[influencer.cidade, influencer.estado].filter(Boolean).join(" / ")}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {(influencer.nicho ?? []).map((n) => <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>)}
                        </div>
                    </div>
                    <div className="flex gap-4 sm:gap-6">
                        <div className="text-center"><div className="text-xl font-bold">{fmt(influencer.followers)}</div><div className="text-[10px] text-muted-foreground uppercase">Seguidores</div></div>
                        <div className="text-center"><div className="text-xl font-bold text-primary">{influencer.engagement}%</div><div className="text-[10px] text-muted-foreground uppercase">Engaj.</div></div>
                    </div>
                    <Button variant="outline" size="icon" onClick={toggleFavorito} aria-label="Favoritar">
                        <Star className={`h-4 w-4 ${favorito ? "fill-amber-400 text-amber-400" : ""}`} />
                    </Button>
                </CardContent>
            </Card>

            <Tabs defaultValue="visao-geral">
                <div className="overflow-x-auto">
                    <TabsList className="w-max gap-1">
                        <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
                        <TabsTrigger value="relatorio">Relatório</TabsTrigger>
                        <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
                        <TabsTrigger value="campanhas">Campanhas</TabsTrigger>
                        <TabsTrigger value="comunicacao">Comunicação</TabsTrigger>
                        <TabsTrigger value="contratos">Contratos</TabsTrigger>
                        <TabsTrigger value="historico">Histórico</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="visao-geral"><VisaoGeralTab influencer={influencer} /></TabsContent>
                <TabsContent value="relatorio"><RelatorioTab influencer={influencer} /></TabsContent>
                <TabsContent value="conteudo"><ConteudoTab influencer={influencer} /></TabsContent>
                <TabsContent value="campanhas"><CampanhasTab influencerId={influencer.id} /></TabsContent>
                <TabsContent value="comunicacao"><ComunicacaoTab influencer={influencer} /></TabsContent>
                <TabsContent value="contratos"><ContratosTab influencerId={influencer.id} /></TabsContent>
                <TabsContent value="historico"><HistoricoTab influencer={influencer} /></TabsContent>
            </Tabs>
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

function VisaoGeralTab({ influencer: i }: { influencer: Influencer }) {
    return (
        <div className="grid md:grid-cols-2 gap-4 pt-4">
            <Card>
                <CardHeader><CardTitle className="text-sm">Contato</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <Detail label="E-mail" value={i.email || "—"} />
                    <Detail label="Telefone" value={i.telefone || "—"} />
                    <Detail label="Instagram" value={i.instagram || "—"} />
                    <Detail label="TikTok" value={i.tiktok || "—"} />
                    <Detail label="YouTube" value={i.youtube || "—"} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-sm">Sobre</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{i.bio || "Sem biografia."}</p>
                    <Detail label="Status" value={i.status} />
                    <Detail label="Cachê" value={i.cache_value ? `R$ ${fmt(i.cache_value)}` : "—"} />
                </CardContent>
            </Card>
        </div>
    )
}

function RelatorioTab({ influencer: i }: { influencer: Influencer }) {
    const [supabase] = useState(() => createClient())
    const [vinculos, setVinculos] = useState<CampanhaVinculada[]>([])

    useEffect(() => {
        supabase
            .from("somos_preta_campanha_influencers")
            .select("pagamento, status_bia, campanha:somos_preta_campanhas(*, cliente:somos_preta_clientes(nome))")
            .eq("influencer_id", i.id)
            .then(({ data }) => setVinculos((data as unknown as CampanhaVinculada[]) ?? []))
    }, [i.id, supabase])

    const audiencia = i.audience_data as { ageRanges?: Record<string, number>; genderSplit?: Record<string, number>; topCities?: string[] } | null
    const totalNegociado = vinculos.reduce((acc, v) => acc + (v.pagamento ?? 0), 0)

    return (
        <div className="space-y-4 pt-4">
            <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Performance</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div><div className="text-lg font-bold">{fmt(i.followers)}</div><div className="text-[10px] text-muted-foreground uppercase">Seguidores</div></div>
                    <div><div className="text-lg font-bold">{i.engagement}%</div><div className="text-[10px] text-muted-foreground uppercase">Engajamento</div></div>
                    <div><div className="text-lg font-bold">{fmt(i.avg_likes)}</div><div className="text-[10px] text-muted-foreground uppercase">Likes médios</div></div>
                    <div><div className="text-lg font-bold">{fmt(i.avg_comments)}</div><div className="text-[10px] text-muted-foreground uppercase">Comentários médios</div></div>
                    <div><div className="text-lg font-bold">{fmt(i.views_medias)}</div><div className="text-[10px] text-muted-foreground uppercase">Views médias</div></div>
                    <div><div className="text-lg font-bold">{fmt(i.avg_shares)}</div><div className="text-[10px] text-muted-foreground uppercase">Compart. médios</div></div>
                    <div><div className="text-lg font-bold">{i.growth_rate}%</div><div className="text-[10px] text-muted-foreground uppercase">Crescimento</div></div>
                </CardContent>
            </Card>

            {audiencia && (audiencia.genderSplit || audiencia.ageRanges || audiencia.topCities) && (
                <Card>
                    <CardHeader><CardTitle className="text-sm">Audiência</CardTitle></CardHeader>
                    <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
                        {audiencia.genderSplit && (
                            <div><p className="text-xs text-muted-foreground uppercase mb-1">Gênero</p>{Object.entries(audiencia.genderSplit).map(([k, v]) => <p key={k}>{k}: {v}%</p>)}</div>
                        )}
                        {audiencia.ageRanges && (
                            <div><p className="text-xs text-muted-foreground uppercase mb-1">Faixa etária</p>{Object.entries(audiencia.ageRanges).map(([k, v]) => <p key={k}>{k}: {v}%</p>)}</div>
                        )}
                        {audiencia.topCities && (
                            <div><p className="text-xs text-muted-foreground uppercase mb-1">Principais cidades</p>{audiencia.topCities.map((c) => <p key={c}>{c}</p>)}</div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader><CardTitle className="text-sm">Histórico PRETA</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <Detail label="Campanhas" value={vinculos.length} />
                    <Detail label="Total negociado" value={`R$ ${fmt(totalNegociado)}`} />
                    {vinculos.map((v, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm border-t pt-2 first:border-t-0 first:pt-0">
                            <span>{v.campanha?.nome} {v.campanha?.cliente && <span className="text-muted-foreground">· {v.campanha.cliente.nome}</span>}</span>
                            <span className="font-medium">R$ {fmt(v.pagamento ?? 0)}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

function ConteudoTab({ influencer: i }: { influencer: Influencer }) {
    const handle = i.instagram ? (i.instagram.startsWith("@") ? i.instagram : `@${i.instagram}`) : ""
    const { data: igProfile, isLoading } = useInstagramSearch(handle)

    if (!i.instagram) {
        return <Card className="mt-4"><CardContent className="py-14 text-center text-muted-foreground"><ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />Sem Instagram cadastrado para buscar conteúdo.</CardContent></Card>
    }
    if (isLoading) {
        return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Buscando posts recentes...</div>
    }
    if (!igProfile || igProfile.recent_posts.length === 0) {
        return <Card className="mt-4"><CardContent className="py-14 text-center text-muted-foreground"><ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />Nenhum post recente disponível.</CardContent></Card>
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-4">
            {igProfile.recent_posts.map((post) => (
                <a key={post.shortcode} href={`https://instagram.com/p/${post.shortcode}`} target="_blank" rel="noopener noreferrer" className="group relative aspect-square rounded-xl overflow-hidden bg-muted">
                    {post.thumbnail_url && <Image src={post.thumbnail_url} alt="" fill unoptimized className="object-cover group-hover:scale-105 transition-transform" />}
                </a>
            ))}
        </div>
    )
}

function CampanhasTab({ influencerId }: { influencerId: string }) {
    const [supabase] = useState(() => createClient())
    const [vinculos, setVinculos] = useState<CampanhaVinculada[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase
            .from("somos_preta_campanha_influencers")
            .select("pagamento, status_bia, campanha:somos_preta_campanhas(*, cliente:somos_preta_clientes(nome))")
            .eq("influencer_id", influencerId)
            .then(({ data }) => { setVinculos((data as unknown as CampanhaVinculada[]) ?? []); setLoading(false) })
    }, [influencerId, supabase])

    if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    if (vinculos.length === 0) return <Card className="mt-4"><CardContent className="py-14 text-center text-muted-foreground"><Megaphone className="h-10 w-10 mx-auto mb-3 opacity-40" />Nenhuma campanha ainda.</CardContent></Card>

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {vinculos.map((v, idx) => (
                <Link key={idx} href={`/app/campanhas/${v.campanha.id}`}>
                    <Card className="hover:shadow-md transition-shadow h-full">
                        <CardContent className="pt-6 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="font-medium">{v.campanha.nome}</p>
                                <Badge variant="secondary">{v.campanha.status}</Badge>
                            </div>
                            {v.campanha.cliente && <p className="text-sm text-muted-foreground flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {v.campanha.cliente.nome}</p>}
                            <p className="text-sm font-medium">R$ {fmt(v.pagamento ?? 0)}</p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    )
}

function ComunicacaoTab({ influencer: i }: { influencer: Influencer }) {
    const [supabase] = useState(() => createClient())
    const [mensagens, setMensagens] = useState<Mensagem[]>([])
    const [texto, setTexto] = useState("")
    const [loading, setLoading] = useState(true)

    async function load() {
        const { data } = await supabase.from("somos_preta_mensagens").select("*").eq("influencer_id", i.id).order("created_at")
        setMensagens((data as Mensagem[]) ?? [])
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i.id])

    async function enviar() {
        if (!texto.trim()) return
        const { error } = await supabase.from("somos_preta_mensagens").insert({
            contato_nome: i.nome, influencer_id: i.id, conteudo: texto.trim(), origem: "eu",
        })
        if (error) { toast.error("Erro ao enviar"); return }
        setTexto("")
        load()
    }

    if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>

    return (
        <Card className="mt-4">
            <CardContent className="p-0 flex flex-col h-[420px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {mensagens.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma mensagem ainda.</p>}
                    {mensagens.map((m) => (
                        <div key={m.id} className={`flex ${m.origem === "eu" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.origem === "eu" ? "bg-primary text-primary-foreground" : "bg-card border"}`}>{m.conteudo}</div>
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2 p-3 border-t">
                    <Input placeholder="Mensagem..." value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") enviar() }} />
                    <Button size="icon" className="rounded-full shrink-0" onClick={enviar}><Send className="h-4 w-4" /></Button>
                </div>
            </CardContent>
        </Card>
    )
}

function ContratosTab({ influencerId }: { influencerId: string }) {
    const [supabase] = useState(() => createClient())
    const [contratos, setContratos] = useState<Contrato[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.from("somos_preta_contratos").select("*").eq("influencer_id", influencerId).order("created_at", { ascending: false })
            .then(({ data }) => { setContratos((data as Contrato[]) ?? []); setLoading(false) })
    }, [influencerId, supabase])

    if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    if (contratos.length === 0) return <Card className="mt-4"><CardContent className="py-14 text-center text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />Nenhum contrato ainda.</CardContent></Card>

    return (
        <div className="space-y-2 pt-4">
            {contratos.map((c) => (
                <Card key={c.id}>
                    <CardContent className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium">{c.titulo}</p>
                            <p className="text-xs text-muted-foreground">{c.assinado_em ? `Assinado em ${c.assinado_em}` : "Não assinado"}</p>
                        </div>
                        <Badge variant="secondary">{c.status}</Badge>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function HistoricoTab({ influencer: i }: { influencer: Influencer }) {
    const [supabase] = useState(() => createClient())
    const [eventos, setEventos] = useState<{ label: string; data: string }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            supabase.from("somos_preta_campanha_influencers").select("created_at, campanha:somos_preta_campanhas(nome)").eq("influencer_id", i.id),
            supabase.from("somos_preta_contratos").select("titulo, created_at, assinado_em").eq("influencer_id", i.id),
        ]).then(([camps, contratos]) => {
            const evs: { label: string; data: string }[] = [{ label: "Criador cadastrado na base", data: i.created_at }]
            for (const c of (camps.data as unknown as { created_at: string; campanha: { nome: string } | null }[]) ?? []) {
                evs.push({ label: `Vinculado à campanha ${c.campanha?.nome ?? ""}`, data: c.created_at })
            }
            for (const c of (contratos.data as unknown as { titulo: string; created_at: string; assinado_em: string | null }[]) ?? []) {
                evs.push({ label: `Contrato criado: ${c.titulo}`, data: c.created_at })
                if (c.assinado_em) evs.push({ label: `Contrato assinado: ${c.titulo}`, data: c.assinado_em })
            }
            evs.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            setEventos(evs)
            setLoading(false)
        })
    }, [i.id, i.created_at, supabase])

    if (loading) return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>

    return (
        <Card className="mt-4">
            <CardContent className="pt-6">
                <ol className="space-y-4">
                    {eventos.map((e, idx) => (
                        <li key={idx} className="flex gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                                <p>{e.label}</p>
                                <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(e.data), { addSuffix: true, locale: ptBR })}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </CardContent>
        </Card>
    )
}
