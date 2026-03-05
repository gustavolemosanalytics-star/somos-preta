"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { use } from "react"
import {
    ExternalLink,
    MessageSquare,
    Users,
    DollarSign,
    Target,
    Calendar,
    Loader2,
    BarChart3,
} from "lucide-react"
import { mockDb, type Campaign } from "@/lib/mock-db"

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
}

export default function ClientPortalPage({ params }: { params: Promise<{ campaignId: string }> }) {
    const { campaignId } = use(params)
    const [campaign, setCampaign] = useState<Campaign | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            // Try by shareToken first, then by id
            let found = await mockDb.campaign.findByShareToken(campaignId)
            if (!found) found = await mockDb.campaign.findById(campaignId)
            setCampaign(found)
            setLoading(false)
        }
        load()
    }, [campaignId])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Card className="max-w-md">
                    <CardContent className="p-8 text-center">
                        <h2 className="text-xl font-bold mb-2">Campanha não encontrada</h2>
                        <p className="text-muted-foreground">O link de compartilhamento pode estar incorreto ou a campanha foi removida.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const totalInfluencers = campaign.influencers?.length || campaign.influencersCount
    const approved = campaign.influencers?.filter(i => i.statusBia === "Aprovado").length || 0
    const progress = totalInfluencers > 0 ? Math.round((approved / totalInfluencers) * 100) : 0
    const totalReach = campaign.influencers?.reduce((sum, i) => sum + i.followers, 0) || 0
    const avgEngagement = campaign.influencers && campaign.influencers.length > 0
        ? (campaign.influencers.reduce((sum, i) => sum + i.engagementRate, 0) / campaign.influencers.length).toFixed(2)
        : "0"

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="mx-auto max-w-7xl space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border">
                    <div>
                        <Badge className="mb-2">Portal do Cliente</Badge>
                        <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                        <p className="text-muted-foreground">
                            Monitoramento em tempo real para: <strong>{campaign.client}</strong>
                        </p>
                        {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline"><MessageSquare className="mr-2 h-4 w-4" /> Falar com Agência</Button>
                        <Button><ExternalLink className="mr-2 h-4 w-4" /> Exportar Relatório</Button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-500" /> Progresso
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold mb-2">{progress}%</div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">{approved} de {totalInfluencers} aprovados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" /> Alcance Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatNumber(totalReach)}</div>
                            <p className="text-xs text-muted-foreground mt-2">Seguidores combinados</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-green-500" /> Engajamento Médio
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{avgEngagement}%</div>
                            <p className="text-xs text-muted-foreground mt-2">Taxa média dos creators</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-orange-500" /> Budget
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{campaign.budget}</div>
                            <p className="text-xs text-muted-foreground mt-2">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {campaign.startDate} — {campaign.endDate}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Influencers Table */}
                {campaign.influencers && campaign.influencers.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Creators da Campanha</CardTitle>
                            <CardDescription>Lista de influencers participantes e suas métricas</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-3 font-semibold">CREATOR</th>
                                            <th className="text-left p-3 font-semibold">SEGUIDORES</th>
                                            <th className="text-left p-3 font-semibold">NICHO</th>
                                            <th className="text-left p-3 font-semibold">% GEO</th>
                                            <th className="text-left p-3 font-semibold">ALCANCE CIDADES</th>
                                            <th className="text-left p-3 font-semibold">ENGAJ.</th>
                                            <th className="text-left p-3 font-semibold">CURTIDAS</th>
                                            <th className="text-left p-3 font-semibold">COMENT.</th>
                                            <th className="text-left p-3 font-semibold">STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaign.influencers.map((inf, i) => (
                                            <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                                                <td className="p-3 font-medium">{inf.name}</td>
                                                <td className="p-3">{formatNumber(inf.followers)}</td>
                                                <td className="p-3 text-muted-foreground text-xs">{inf.niche}</td>
                                                <td className="p-3">{inf.geoPercent}%</td>
                                                <td className="p-3 text-xs text-muted-foreground max-w-[250px] truncate">{inf.topCities}</td>
                                                <td className="p-3 font-medium">{inf.engagementRate}%</td>
                                                <td className="p-3">{formatNumber(inf.avgLikes)}</td>
                                                <td className="p-3">{inf.avgComments}</td>
                                                <td className="p-3">
                                                    <Badge variant={
                                                        inf.statusBia === "Aprovado" ? "default" :
                                                            inf.statusBia === "Pendente" ? "secondary" : "destructive"
                                                    }>
                                                        {inf.statusBia}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
