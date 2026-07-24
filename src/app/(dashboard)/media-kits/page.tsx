"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MidiaKit } from "@/lib/db/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IdCard, Loader2, Search, ExternalLink, MapPin, UserCircle } from "lucide-react"

type KitRow = MidiaKit & { cadastrado: { nome: string | null; email: string | null } | null }

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

export default function MediaKitsPage() {
    const [supabase] = useState(() => createClient())
    const [kits, setKits] = useState<KitRow[]>([])
    const [loading, setLoading] = useState(true)
    const [busca, setBusca] = useState("")

    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from("somos_preta_midia_kits")
                .select("*, cadastrado:somos_preta_profiles(nome, email)")
                .order("created_at", { ascending: false })
            setKits((data as unknown as KitRow[]) ?? [])
            setLoading(false)
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filtrados = useMemo(() => {
        const q = busca.trim().toLowerCase()
        if (!q) return kits
        return kits.filter((k) => k.nome.toLowerCase().includes(q) || (k.nichos ?? []).some((n) => n.toLowerCase().includes(q)))
    }, [kits, busca])

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><IdCard className="h-6 w-6 text-primary" /> Mídia Kits</h1>
                <p className="text-muted-foreground text-sm">Mídia kits criados pelos creators no site. {kits.length} no total.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome ou nicho..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9 rounded-xl" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
            ) : filtrados.length === 0 ? (
                <Card><CardContent className="py-16 text-center text-muted-foreground">
                    <IdCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhum mídia kit ainda</p>
                    <p className="text-sm">Os kits criados pelos creators no site externo aparecem aqui.</p>
                </CardContent></Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtrados.map((k) => (
                        <Card key={k.id} className="overflow-hidden">
                            <div className="h-16 bg-gradient-to-r from-primary/25 to-secondary/25" style={k.cover_url ? { backgroundImage: `url(${k.cover_url})`, backgroundSize: "cover" } : undefined} />
                            <CardHeader className="pb-3 -mt-8">
                                <div className="flex items-end justify-between">
                                    <Avatar className="h-14 w-14 ring-4 ring-background">
                                        <AvatarImage src={k.avatar_url ?? undefined} alt={k.nome} />
                                        <AvatarFallback>{initials(k.nome)}</AvatarFallback>
                                    </Avatar>
                                    {k.publicado ? (
                                        <Badge className="bg-green-500/15 text-green-600" variant="secondary">Publicado</Badge>
                                    ) : (
                                        <Badge variant="secondary">Rascunho</Badge>
                                    )}
                                </div>
                                <div className="pt-2">
                                    <p className="font-semibold">{k.nome}</p>
                                    {(k.cidade || k.estado) && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{[k.cidade, k.estado].filter(Boolean).join(" / ")}</p>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {k.nichos && k.nichos.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {k.nichos.slice(0, 4).map((n) => <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>)}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <UserCircle className="h-3.5 w-3.5" />
                                    Cadastrado por {k.cadastrado?.nome ?? k.cadastrado?.email ?? "creator"}
                                </div>
                                <a href={`/kit/${k.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm inline-flex items-center gap-1 hover:underline">
                                    Ver mídia kit público <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
