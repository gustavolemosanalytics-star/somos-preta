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
    PieChart,
    Pie
} from "recharts"
import { Button } from "@/components/ui/button"
import { Calendar, Download, TrendingUp, Users, Target, Zap } from "lucide-react"

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
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
                    <p className="text-muted-foreground">Monitore o desempenho das suas campanhas e o ROI real.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Últimos 6 Meses</Button>
                    <Button><Download className="mr-2 h-4 w-4" /> Exportar Dados</Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-l-4 border-l-primary">
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
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription>Alcance Total</CardDescription>
                        <CardTitle className="text-3xl font-bold">842k</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                            <TrendingUp className="h-4 w-4" /> +5.2% <span className="text-muted-foreground font-normal ml-1">impressões únicas</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardDescription>CPE Médio</CardDescription>
                        <CardTitle className="text-3xl font-bold">R$ 0,12</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                            <Target className="h-4 w-4" /> -8.1% <span className="text-muted-foreground font-normal ml-1">custo por engajamento</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
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
                <Card className="md:col-span-4">
                    <CardHeader>
                        <CardTitle>Evolução de Performance</CardTitle>
                        <CardDescription>Investimento vs Receita Gerada (Marketing de Influência)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                                <Area type="monotone" dataKey="spend" stroke="#ef4444" fill="none" strokeWidth={2} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3">
                    <CardHeader>
                        <CardTitle>Top Influencers by Engagement</CardTitle>
                        <CardDescription>Ranking de criadores com maior interação</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={influencerReach} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} width={100} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="engagement" radius={[0, 4, 4, 0]} barSize={20}>
                                    {influencerReach.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? "#8b5cf6" : "#ddd"} />
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
