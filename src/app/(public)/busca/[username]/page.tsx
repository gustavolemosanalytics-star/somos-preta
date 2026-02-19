"use client"

import { use } from "react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, MapPin, Users, TrendingUp, Heart, MessageSquare, Share2, DollarSign, BarChart3, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { mockDb } from "@/lib/mock-db"
import { motion } from "framer-motion"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

function formatFollowers(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
}

const engagementHistory = [
    { month: "Jul", engagement: 3.2, followers: 8200 },
    { month: "Ago", engagement: 3.8, followers: 9100 },
    { month: "Set", engagement: 4.1, followers: 10400 },
    { month: "Out", engagement: 3.9, followers: 11200 },
    { month: "Nov", engagement: 4.5, followers: 12800 },
    { month: "Dez", engagement: 4.8, followers: 14100 },
    { month: "Jan", engagement: 5.2, followers: 15800 },
    { month: "Fev", engagement: 4.9, followers: 16500 },
]

const COLORS = ["#e57c4a", "#5a8a5c", "#4db8c7", "#c2955a", "#7c6cb0"]

export default function InfluencerProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params)

    const { data: influencer, isLoading } = useQuery({
        queryKey: ["influencer", username],
        queryFn: () => mockDb.influencer.findUnique({ where: { username } }),
    })

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!influencer) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Influencer não encontrado</h2>
                <p className="text-muted-foreground mb-6">O perfil @{username} não foi encontrado na nossa base.</p>
                <Link href="/busca">
                    <Button className="rounded-xl">Voltar para Busca</Button>
                </Link>
            </div>
        )
    }

    const initials = influencer.name.split(" ").map(n => n[0]).join("").slice(0, 2)

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <Link href="/busca" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
                <ArrowLeft className="h-4 w-4" /> Voltar para busca
            </Link>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Profile Header */}
                <Card className="border-none bg-gradient-to-br from-card to-card/50 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary via-secondary to-accent opacity-20" />
                    <CardContent className="-mt-16 pb-8 px-6 md:px-8">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-3xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h1 className="text-3xl font-bold">{influencer.name}</h1>
                                    <p className="text-muted-foreground">{influencer.instagram}</p>
                                </div>
                                {influencer.bio && (
                                    <p className="text-muted-foreground max-w-xl">{influencer.bio}</p>
                                )}
                                <div className="flex items-center gap-4 flex-wrap">
                                    {influencer.city && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4" />
                                            {influencer.city}, {influencer.state}
                                        </div>
                                    )}
                                    <div className="flex gap-1.5 flex-wrap">
                                        {influencer.niche.map((n) => (
                                            <Badge key={n} variant="secondary" className="rounded-lg">{n}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { icon: Users, label: "Seguidores", value: formatFollowers(influencer.followers), color: "text-blue-500" },
                        { icon: TrendingUp, label: "Engajamento", value: `${influencer.engagement}%`, color: "text-emerald-500" },
                        { icon: DollarSign, label: "Cachê Estimado", value: influencer.cacheValue || "N/D", color: "text-amber-500" },
                        { icon: BarChart3, label: "Crescimento", value: influencer.growthRate ? `+${influencer.growthRate}%/mês` : "N/D", color: "text-purple-500" },
                    ].map((kpi, i) => (
                        <Card key={i} className="border-none bg-card/50">
                            <CardContent className="p-5">
                                <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
                                <p className="text-2xl font-bold">{kpi.value}</p>
                                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Engagement Metrics */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { icon: Heart, label: "Média de Likes", value: influencer.avgLikes ? formatFollowers(influencer.avgLikes) : "N/D" },
                        { icon: MessageSquare, label: "Média de Comentários", value: influencer.avgComments ? formatFollowers(influencer.avgComments) : "N/D" },
                        { icon: Share2, label: "Média de Compartilhamentos", value: influencer.avgShares ? formatFollowers(influencer.avgShares) : "N/D" },
                    ].map((metric, i) => (
                        <Card key={i} className="border-none bg-card/50">
                            <CardContent className="p-5 text-center">
                                <metric.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                                <p className="text-xl font-bold">{metric.value}</p>
                                <p className="text-xs text-muted-foreground">{metric.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Engagement History */}
                    <Card className="border-none bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Histórico de Engajamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={engagementHistory}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="engagement" stroke="#e57c4a" fill="#e57c4a" fillOpacity={0.2} strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Followers Growth */}
                    <Card className="border-none bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Crescimento de Seguidores</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={engagementHistory}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip />
                                    <Bar dataKey="followers" fill="#5a8a5c" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Audience Data */}
                {influencer.audienceData && (
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Age Distribution */}
                        <Card className="border-none bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Faixa Etária</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {influencer.audienceData.ageRanges.map((range) => (
                                    <div key={range.range} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{range.range}</span>
                                            <span className="font-medium">{range.percentage}%</span>
                                        </div>
                                        <Progress value={range.percentage} className="h-2" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Gender Split */}
                        <Card className="border-none bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Gênero do Público</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: "Feminino", value: influencer.audienceData.genderSplit.female },
                                                { name: "Masculino", value: influencer.audienceData.genderSplit.male },
                                                { name: "Outros", value: influencer.audienceData.genderSplit.other },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={75}
                                            dataKey="value"
                                        >
                                            {[COLORS[0], COLORS[1], COLORS[2]].map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex justify-center gap-4 text-xs">
                                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[0] }} /> Feminino</span>
                                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[1] }} /> Masculino</span>
                                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[2] }} /> Outros</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Cities */}
                        <Card className="border-none bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-lg">Principais Cidades</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {influencer.audienceData.topCities.map((city) => (
                                    <div key={city.city} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{city.city}</span>
                                            <span className="font-medium">{city.percentage}%</span>
                                        </div>
                                        <Progress value={city.percentage} className="h-2" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Portfolio */}
                {influencer.portfolio && influencer.portfolio.length > 0 && (
                    <Card className="border-none bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-lg">Portfólio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {influencer.portfolio.map((item, i) => (
                                    <div key={i} className="rounded-xl border border-border/50 bg-muted/30 p-4 hover:border-primary/30 transition-all">
                                        <div className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-3 flex items-center justify-center">
                                            <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                                        </div>
                                        <p className="font-medium text-sm">{item.title}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </motion.div>
        </div>
    )
}
