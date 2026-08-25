"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Influencer } from "@/lib/db/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Star } from "lucide-react"

const fmt = (n: number) => n.toLocaleString("pt-BR")

export function FavoritosTab() {
    const [supabase] = useState(() => createClient())
    const [favoritos, setFavoritos] = useState<Influencer[]>([])
    const [loading, setLoading] = useState(true)

    async function load() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const { data } = await supabase
            .from("somos_preta_favoritos")
            .select("influencer:somos_preta_influencers(*)")
            .eq("profile_id", user.id)
            .order("created_at", { ascending: false })
        setFavoritos(((data as unknown as { influencer: Influencer }[]) ?? []).map((d) => d.influencer).filter(Boolean))
        setLoading(false)
    }

    useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function remover(id: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        await supabase.from("somos_preta_favoritos").delete().eq("influencer_id", id).eq("profile_id", user.id)
        setFavoritos((prev) => prev.filter((f) => f.id !== id))
    }

    if (loading) {
        return <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }

    if (favoritos.length === 0) {
        return (
            <Card className="text-center py-16 border border-border/60 shadow-sm rounded-2xl mt-4">
                <Star className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium">Nenhum favorito ainda</p>
                <p className="text-sm text-muted-foreground">Clique na estrela de um criador em Explorar ou Minha Base para salvá-lo aqui.</p>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {favoritos.map((i) => (
                <Card key={i.id} className="overflow-hidden border border-border/60 shadow-sm rounded-2xl">
                    <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                                {i.avatar_url && <AvatarImage src={i.avatar_url} alt={i.nome} />}
                                <AvatarFallback>{i.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <Link href={`/app/criadores/${i.id}`} className="font-medium hover:text-primary truncate block">{i.nome}</Link>
                                <p className="text-xs text-muted-foreground truncate">{i.instagram ?? "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span>{fmt(i.followers)} seguidores</span>
                            {i.estado && <Badge variant="secondary">{i.estado}</Badge>}
                        </div>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => remover(i.id)}>
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> Remover dos favoritos
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
