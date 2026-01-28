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
import { Calendar, Download, TrendingUp, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react"
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
        <div className="flex flex-col gap-4 sm:gap-6">
            {/* Header Section */}
            <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Analytics & Insights</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Monitore o desempenho das suas campanhas e o ROI real.</p>
                </div>
                <div className="flex flex-row gap-2 w-full sm:w-auto">
                    <Select defaultValue="6m">
                        <SelectTrigger className="flex-1 sm:flex-none sm:w-[160px] h-9 sm:h-10 text-xs sm:text-sm rounded-xl">
                            <Calendar className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
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
                    <Button variant="outline" className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm rounded-xl">
                        <Download className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Exportar</span>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow rounded-xl sm:rounded-2xl">
                    <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4 lg:p-6">
                        <CardDescription className="text-[10px] sm:text-xs">ROI Consolidado</CardDescription>
                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">3.2x</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                        <div className="flex items-center gap-1 text-emerald-500 text-[10px] sm:text-xs lg:text-sm font-medium flex-wrap">
                            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>+12.5%</span>
                            <span className="text-muted-foreground font-normal hidden sm:inline">vs meses ant.</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow rounded-xl sm:rounded-2xl">
                    <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4 lg:p-6">
                        <CardDescription className="text-[10px] sm:text-xs">Alcance Total</CardDescription>
                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">842k</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                        <div className="flex items-center gap-1 text-emerald-500 text-[10px] sm:text-xs lg:text-sm font-medium flex-wrap">
                            <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>+5.2%</span>
                            <span className="text-muted-foreground font-normal hidden sm:inline">impressões</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow rounded-xl sm:rounded-2xl">
                    <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4 lg:p-6">
                        <CardDescription className="text-[10px] sm:text-xs">CPE Médio</CardDescription>
                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">R$ 0,12</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                        <div className="flex items-center gap-1 text-emerald-500 text-[10px] sm:text-xs lg:text-sm font-medium flex-wrap">
                            <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 shrink-0" />
                            <span>-8.1%</span>
                            <span className="text-muted-foreground font-normal hidden sm:inline">custo/eng.</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow rounded-xl sm:rounded-2xl">
                    <CardHeader className="pb-1 sm:pb-2 p-3 sm:p-4 lg:p-6">
                        <CardDescription className="text-[10px] sm:text-xs">Taxa de Conversão</CardDescription>
                        <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">4.8%</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                        <div className="flex items-center gap-1 text-emerald-500 text-[10px] sm:text-xs lg:text-sm font-medium flex-wrap">
                            <Zap className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>+1.2%</span>
                            <span className="text-muted-foreground font-normal hidden sm:inline">via links</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
                {/* Performance Chart */}
                <Card className="lg:col-span-4 shadow-sm rounded-xl sm:rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-sm sm:text-base lg:text-lg">Evolução de Performance</CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Investimento vs Receita Gerada</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] sm:h-[300px] lg:h-[350px] p-2 sm:p-4 lg:p-6 pt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                    dy={10}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        backgroundColor: 'hsl(var(--popover))',
                                        color: 'hsl(var(--popover-foreground))',
                                        fontSize: '12px',
                                        padding: '8px 12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Receita"
                                    stroke="hsl(var(--primary))"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    strokeWidth={2}
                                    activeDot={{ r: 6 }}
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

                {/* Top Influencers Chart */}
                <Card className="lg:col-span-3 shadow-sm rounded-xl sm:rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-sm sm:text-base lg:text-lg">Top Influencers</CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Ranking por engajamento</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px] sm:h-[300px] lg:h-[350px] p-2 sm:p-4 lg:p-6 pt-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={influencerReach} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                                    width={70}
                                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid hsl(var(--border))',
                                        backgroundColor: 'hsl(var(--popover))',
                                        fontSize: '12px',
                                        padding: '8px 12px'
                                    }}
                                />
                                <Bar dataKey="engagement" radius={[0, 4, 4, 0]} barSize={20}>
                                    {influencerReach.map((_, index) => (
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
