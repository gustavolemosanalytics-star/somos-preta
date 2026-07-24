"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Users, Megaphone, ClipboardList, Building2, Loader2, MapPin, TrendingUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Stats = {
    clientes: number
    campanhasAtivas: number
    tarefasPendentes: number
    influencers: number
    regional: { estado: string; count: number; pct: number }[]
    recentes: { id: string; nome: string; status: string; cliente: string }[]
}

const CAMP_STATUS: Record<string, string> = {
    rascunho: "Rascunho", planejamento: "Planejamento", ativa: "Ativa", concluida: "Concluída", cancelada: "Cancelada",
}

export default function AgencyDashboardHome() {
    const [supabase] = useState(() => createClient())
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        (async () => {
            const [clientes, campAtivas, tarefasPend, infl, recentesRes] = await Promise.all([
                supabase.from("somos_preta_clientes").select("*", { count: "exact", head: true }),
                supabase.from("somos_preta_campanhas").select("*", { count: "exact", head: true }).eq("status", "ativa"),
                supabase.from("somos_preta_tarefas").select("*", { count: "exact", head: true }).neq("status", "concluida"),
                supabase.from("somos_preta_influencers").select("estado"),
                supabase.from("somos_preta_campanhas").select("id, nome, status, cliente:somos_preta_clientes(nome)").order("created_at", { ascending: false }).limit(5),
            ])

            const estados = new Map<string, number>()
            for (const row of (infl.data as { estado: string | null }[]) ?? []) {
                if (!row.estado) continue
                estados.set(row.estado, (estados.get(row.estado) ?? 0) + 1)
            }
            const ordenados = [...estados.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)
            const max = ordenados[0]?.[1] ?? 1
            const regional = ordenados.map(([estado, count]) => ({ estado, count, pct: Math.round((count / max) * 100) }))

            const recentes = ((recentesRes.data as unknown as { id: string; nome: string; status: string; cliente: { nome: string } | null }[]) ?? [])
                .map((c) => ({ id: c.id, nome: c.nome, status: c.status, cliente: c.cliente?.nome ?? "—" }))

            setStats({
                clientes: clientes.count ?? 0,
                campanhasAtivas: campAtivas.count ?? 0,
                tarefasPendentes: tarefasPend.count ?? 0,
                influencers: (infl.data as unknown[])?.length ?? 0,
                regional,
                recentes,
            })
            setLoading(false)
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading || !stats) {
        return <div className="flex h-[calc(100vh-140px)] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
    }

    return (
        <div className="flex flex-1 flex-col gap-6 lg:gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">Visão Geral</h1>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 border border-border/60 rounded-xl">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium tracking-wide uppercase text-muted-foreground">Foco: Norte / Nordeste</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-4">
                <Link href="/clientes"><KPICard title="Clientes" value={String(stats.clientes)} description="contas ativas" icon={<Building2 className="h-4 w-4 sm:h-5 sm:w-5" />} trend="neutral" /></Link>
                <Link href="/campaigns"><KPICard title="Campanhas Ativas" value={String(stats.campanhasAtivas)} description="em andamento" icon={<Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />} trend="up" /></Link>
                <Link href="/tarefas"><KPICard title="Tarefas Pendentes" value={String(stats.tarefasPendentes)} description="a concluir" icon={<ClipboardList className="h-4 w-4 sm:h-5 sm:w-5" />} trend="neutral" /></Link>
                <Link href="/influencers"><KPICard title="Influenciadores" value={String(stats.influencers)} description="na base" icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />} trend="up" /></Link>
            </div>

            <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-12">
                <Card className="lg:col-span-8 rounded-2xl overflow-hidden border border-border/60 shadow-sm">
                    <CardHeader className="border-b p-4 sm:p-6">
                        <div>
                            <CardTitle className="font-semibold tracking-tight text-base sm:text-lg text-foreground">Densidade Regional</CardTitle>
                            <CardDescription className="text-xs sm:text-sm mt-1">Influenciadores por estado</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 lg:p-8">
                        {stats.regional.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">Cadastre influenciadores com estado para ver a distribuição.</p>
                        ) : (
                            <div className="space-y-5">
                                {stats.regional.map((item) => (
                                    <div key={item.estado} className="space-y-2 group">
                                        <div className="flex justify-between text-xs sm:text-sm font-medium uppercase tracking-tight">
                                            <span className="group-hover:text-primary transition-colors">{item.estado}</span>
                                            <span className="text-primary">{item.count} creators</span>
                                        </div>
                                        <div className="relative h-2.5 bg-muted/30 rounded-full overflow-hidden">
                                            <div className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700" style={{ width: `${item.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-4 rounded-2xl border border-border/60 shadow-sm">
                    <CardHeader className="border-b p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground">Campanhas Recentes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                        {stats.recentes.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">Nenhuma campanha ainda.</p>
                        ) : (
                            <div className="space-y-1">
                                {stats.recentes.map((c) => (
                                    <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{c.nome}</p>
                                            <p className="text-xs text-muted-foreground truncate">{c.cliente}</p>
                                        </div>
                                        <Badge variant="secondary" className="shrink-0 text-[10px]">{CAMP_STATUS[c.status] ?? c.status}</Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
