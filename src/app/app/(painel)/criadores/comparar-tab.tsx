"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import type { Influencer, Campanha } from "@/lib/db/types"
import { useCreatorSelection } from "@/lib/stores/creator-selection"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Scale, X } from "lucide-react"
import { toast } from "sonner"

const fmt = (n: number) => n.toLocaleString("pt-BR")

const METRICAS: { key: keyof Influencer; label: string; formatar?: (v: number) => string }[] = [
    { key: "followers", label: "Seguidores", formatar: fmt },
    { key: "engagement", label: "Taxa de engajamento", formatar: (v) => `${v}%` },
    { key: "views_medias", label: "Views médias", formatar: fmt },
    { key: "growth_rate", label: "Crescimento", formatar: (v) => `${v}%` },
    { key: "cache_value", label: "Cachê", formatar: (v) => (v ? `R$ ${fmt(v)}` : "—") },
]

export function CompararTab() {
    const [supabase] = useState(() => createClient())
    const { selecionados, toggle, limpar } = useCreatorSelection()
    const [influencers, setInfluencers] = useState<Influencer[]>([])
    const [campanhas, setCampanhas] = useState<Campanha[]>([])
    const [campanhaId, setCampanhaId] = useState("")

    useEffect(() => {
        let cancelado = false
        async function run() {
            if (selecionados.length === 0) {
                if (!cancelado) setInfluencers([])
                return
            }
            const { data } = await supabase.from("somos_preta_influencers").select("*").in("id", selecionados)
            if (!cancelado) setInfluencers((data as Influencer[]) ?? [])
        }
        run()
        return () => { cancelado = true }
    }, [selecionados, supabase])

    useEffect(() => {
        supabase.from("somos_preta_campanhas").select("*").order("nome").then(({ data }) => setCampanhas((data as Campanha[]) ?? []))
    }, [supabase])

    async function adicionarACampanha() {
        if (!campanhaId || selecionados.length === 0) return
        const { error } = await supabase.from("somos_preta_campanha_influencers").insert(
            selecionados.map((influencer_id) => ({ campanha_id: campanhaId, influencer_id }))
        )
        if (error) { toast.error("Alguns já estavam na campanha ou houve erro"); return }
        toast.success("Adicionados à campanha")
    }

    if (selecionados.length === 0) {
        return (
            <Card className="text-center py-16 border border-border/60 shadow-sm rounded-2xl mt-4">
                <Scale className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium">Nenhum criador selecionado</p>
                <p className="text-sm text-muted-foreground">Selecione criadores em Explorar ou Minha Base para comparar.</p>
            </Card>
        )
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{influencers.length} criador(es) em comparação</p>
                <div className="flex items-center gap-2">
                    <Select value={campanhaId} onValueChange={setCampanhaId}>
                        <SelectTrigger className="w-[220px] h-9"><SelectValue placeholder="Adicionar à campanha..." /></SelectTrigger>
                        <SelectContent>{campanhas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" disabled={!campanhaId} onClick={adicionarACampanha}>Adicionar</Button>
                    <Button size="sm" variant="ghost" onClick={limpar}>Limpar seleção</Button>
                </div>
            </div>

            <Card className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Criador</TableHead>
                            {influencers.map((i) => (
                                <TableHead key={i.id} className="text-center min-w-[140px]">
                                    <div className="flex flex-col items-center gap-1">
                                        <Avatar className="h-9 w-9">
                                            {i.avatar_url && <AvatarImage src={i.avatar_url} alt={i.nome} />}
                                            <AvatarFallback>{i.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <Link href={`/app/criadores/${i.id}`} className="font-medium hover:text-primary text-xs">{i.nome}</Link>
                                        <button onClick={() => toggle(i.id)} className="text-muted-foreground hover:text-red-600" aria-label={`Remover ${i.nome}`}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {METRICAS.map((m) => (
                            <TableRow key={m.key}>
                                <TableCell className="font-medium text-muted-foreground">{m.label}</TableCell>
                                {influencers.map((i) => {
                                    const raw = i[m.key] as number | null
                                    return <TableCell key={i.id} className="text-center font-semibold">{raw != null ? (m.formatar ? m.formatar(raw) : raw) : "—"}</TableCell>
                                })}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
