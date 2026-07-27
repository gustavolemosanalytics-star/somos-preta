"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts"
import { Loader2, DollarSign, Megaphone, Users, CheckCircle2 } from "lucide-react"

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
const brlShort = (v: number) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`

type Data = {
    budgetTotal: number
    campanhasAtivas: number
    influencers: number
    tarefasConcluidas: number
    porCliente: { name: string; budget: number }[]
    topInfluencers: { name: string; engagement: number }[]
}

export default function AnalyticsPage() {
    const [supabase] = useState(() => createClient())
    const [data, setData] = useState<Data | null>(null)

    useEffect(() => {
        (async () => {
            const [{ data: camps }, { data: infl }, tarefas] = await Promise.all([
                supabase.from("somos_preta_campanhas").select("budget, status, cliente:somos_preta_clientes(nome)"),
                supabase.from("somos_preta_influencers").select("nome, engagement, followers"),
                supabase.from("somos_preta_tarefas").select("*", { count: "exact", head: true }).eq("status", "concluida"),
            ])

            const campanhas = (camps as unknown as { budget: number; status: string; cliente: { nome: string } | null }[]) ?? []
            const influencers = (infl as { nome: string; engagement: number; followers: number }[]) ?? []

            const budgetTotal = campanhas.reduce((s, c) => s + Number(c.budget || 0), 0)
            const campanhasAtivas = campanhas.filter((c) => c.status === "ativa").length

            const clienteMap = new Map<string, number>()
            for (const c of campanhas) {
                const nome = c.cliente?.nome ?? "Sem cliente"
                clienteMap.set(nome, (clienteMap.get(nome) ?? 0) + Number(c.budget || 0))
            }
            const porCliente = [...clienteMap.entries()]
                .map(([name, budget]) => ({ name, budget }))
                .sort((a, b) => b.budget - a.budget).slice(0, 6)

            const topInfluencers = [...influencers]
                .sort((a, b) => Number(b.engagement) - Number(a.engagement))
                .slice(0, 5)
                .map((i) => ({ name: i.nome, engagement: Number(i.engagement) }))

            setData({
                budgetTotal,
                campanhasAtivas,
                influencers: influencers.length,
                tarefasConcluidas: tarefas.count ?? 0,
                porCliente,
                topInfluencers,
            })
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!data) {
        return <div className="flex items-center justify-center py-24 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...</div>
    }

    const kpis = [
        { label: "Budget sob gestão", value: brl(data.budgetTotal), icon: <DollarSign className="h-4 w-4" />, border: "border-l-primary" },
        { label: "Campanhas ativas", value: String(data.campanhasAtivas), icon: <Megaphone className="h-4 w-4" />, border: "border-l-blue-500" },
        { label: "Influenciadores", value: String(data.influencers), icon: <Users className="h-4 w-4" />, border: "border-l-orange-500" },
        { label: "Tarefas concluídas", value: String(data.tarefasConcluidas), icon: <CheckCircle2 className="h-4 w-4" />, border: "border-l-green-500" },
    ]

    const tooltipStyle = {
        borderRadius: "12px", border: "1px solid hsl(var(--border))",
        backgroundColor: "hsl(var(--popover))", fontSize: "12px", padding: "8px 12px",
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Analytics & Insights</h2>
                <p className="text-sm text-muted-foreground">Desempenho consolidado a partir dos dados reais do hub.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {kpis.map((k) => (
                    <Card key={k.label} className={`border-l-4 ${k.border} rounded-2xl`}>
                        <CardHeader className="pb-2 p-4">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs">{k.label}</CardDescription>
                                <span className="text-muted-foreground">{k.icon}</span>
                            </div>
                            <CardTitle className="text-xl lg:text-2xl font-bold">{k.value}</CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4 rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base lg:text-lg">Budget por cliente</CardTitle>
                        <CardDescription className="text-xs">Investimento total gerido por conta</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] p-2 sm:p-4 pt-0">
                        {data.porCliente.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem campanhas ainda</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.porCliente} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={brlShort} width={50} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v?: number) => brl(Number(v ?? 0))} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
                                    <Bar dataKey="budget" name="Budget" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3 rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base lg:text-lg">Top influenciadores</CardTitle>
                        <CardDescription className="text-xs">Ranking por engajamento</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] p-2 sm:p-4 pt-0">
                        {data.topInfluencers.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem influenciadores ainda</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.topInfluencers} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={80} tickFormatter={(v: string) => v.length > 12 ? `${v.substring(0, 12)}...` : v} />
                                    <Tooltip contentStyle={tooltipStyle} formatter={(v?: number) => `${Number(v ?? 0)}%`} cursor={{ fill: "hsl(var(--muted)/0.2)" }} />
                                    <Bar dataKey="engagement" name="Engajamento" radius={[0, 4, 4, 0]} barSize={20}>
                                        {data.topInfluencers.map((_, i) => (
                                            <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
