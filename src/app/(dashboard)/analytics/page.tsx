"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Cell,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Calendar, Download, TrendingUp, Target, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const performanceData = [
    { name: "Jan", roi: 2.1, spend: 4000, revenue: 8400 },
    { name: "Fev", roi: 2.5, spend: 3000, revenue: 7500 },
    { name: "Mar", roi: 3.2, spend: 2000, revenue: 6400 },
    { name: "Abr", roi: 2.8, spend: 5000, revenue: 14000 },
    { name: "Mai", roi: 3.5, spend: 4500, revenue: 15750 },
    { name: "Jun", roi: 4.1, spend: 6000, revenue: 24600 },
]

const influencerReach = [
    { name: "Ana Silva", reach: 12500, engagement: 4.5 },
    { name: "Maria Costa", reach: 8200, engagement: 5.8 },
    { name: "João Victor", reach: 45000, engagement: 3.2 },
    { name: "Carlos Tech", reach: 32000, engagement: 3.5 },
    { name: "Bia Estilo", reach: 15000, engagement: 4.1 },
]

export default function AnalyticsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
                    <p className="text-muted-foreground">Monitore o desempenho das suas campanhas e o ROI real.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Select defaultValue="6m">
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Últimos 7 dias</SelectItem>
                            <SelectItem value="30d">Últimos 30 dias</SelectItem>
                            <SelectItem value="3m">Últimos 3 Meses</SelectItem>
                            <SelectItem value="6m">Últimos 6 Meses</SelectItem>
                            <SelectItem value="1y">Este Ano</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4" /> Exportar
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription>ROI Consolidado</CardDescription>
                        <CardTitle className="text-3xl font-bold">3.2x</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                            <TrendingUp className="h-4 w-4" /> +12.5% <span className="text-muted-foreground font-normal ml-1">vs meses ant.</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription>Alcance Total</CardDescription>
                        <CardTitle className="text-3xl font-bold">842k</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                            <ArrowUpRight className="h-4 w-4" /> +5.2% <span className="text-muted-foreground font-normal ml-1">impressões únicas</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription>CPE Médio</CardDescription>
                        <CardTitle className="text-3xl font-bold">R$ 0,12</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                            <ArrowDownRight className="h-4 w-4 text-emerald-500" /> -8.1% <span className="text-muted-foreground font-normal ml-1">custo por engajamento</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <CardDescription>Taxa de Conversão</CardDescription>
                        <CardTitle className="text-3xl font-bold">4.8%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                            <Zap className="h-4 w-4" /> +1.2% <span className="text-muted-foreground font-normal ml-1">através de links</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="md:col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>Evolução de Performance</CardTitle>
                        <CardDescription>Investimento vs Receita Gerada (Marketing de Influência)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    tickFormatter={(value) => `k${value / 1000}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        backgroundColor: 'hsl(var(--popover))',
                                        color: 'hsl(var(--popover-foreground))'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Receita"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    strokeWidth={3}
                                    activeDot={{ r: 8 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="spend"
                                    name="Investimento"
                                    stroke="hsl(var(--destructive))"
                                    fill="none"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>Top Influencers</CardTitle>
                        <CardDescription>Ranking de criadores por engajamento</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={influencerReach} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                    contentStyle={{
                                        borderRadius: 'var(--radius)',
                                        border: '1px solid hsl(var(--border))',
                                        backgroundColor: 'hsl(var(--popover))'
                                    }}
                                />
                                <Bar dataKey="engagement" radius={[0, 4, 4, 0]} barSize={24}>
                                    {influencerReach.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
