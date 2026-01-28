"use client"

import { KPICard } from "@/components/dashboard/kpi-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { Users, Megaphone, Target, DollarSign, Loader2, MapPin, TrendingUp, Sparkles } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { mockDb } from "@/lib/mock-db"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AgencyDashboardHome() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['agency-stats'],
        queryFn: async () => {
            const totalInfluencers = await mockDb.influencer.count()
            const activeCampaigns = await mockDb.campaign.count({ where: { status: "ACTIVE" } })

            return {
                totalInfluencers,
                activeCampaigns,
                totalRevenue: "R$ 142.500",
                avgEngagement: "4.8%",
                regionalDensity: [
                    { state: "Bahia", count: 42, percentage: 85 },
                    { state: "Pernambuco", count: 28, percentage: 60 },
                    { state: "Ceará", count: 24, percentage: 55 },
                    { state: "Rio Grande do Norte", count: 18, percentage: 40 },
                ]
            }
        }
    })

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-100px)] items-center justify-center">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-4 sm:gap-6 lg:gap-8 bg-gradient-to-br from-background via-background to-primary/5 min-h-0">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
                <div className="space-y-1 sm:space-y-2">
                    <Badge className="bg-gradient-to-r from-secondary/20 to-accent/20 text-secondary border-secondary/30 backdrop-blur-sm text-[10px] sm:text-xs">
                        AGENCY PANEL v1.0
                    </Badge>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">
                        <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Visão Geral</span>
                    </h1>
                </div>
                <div className="w-full sm:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-card/80 backdrop-blur-sm border border-white/10 shadow-lg shadow-primary/5 rounded-xl sm:rounded-2xl">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary shrink-0" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase truncate">Foco: Norte / Nordeste</span>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-4">
                <KPICard
                    title="Total Influencers"
                    value={stats?.totalInfluencers?.toString() || "0"}
                    description="da base regional"
                    icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
                    trend="up"
                />
                <KPICard
                    title="Campanhas Ativas"
                    value={stats?.activeCampaigns?.toString() || "0"}
                    description="+3 novas esta semana"
                    icon={<Megaphone className="h-4 w-4 sm:h-5 sm:w-5" />}
                    trend="up"
                />
                <KPICard
                    title="Receita Sob Gestão"
                    value={stats?.totalRevenue || "R$ 0"}
                    icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                    trend="up"
                />
                <KPICard
                    title="Efetividade Média"
                    value={stats?.avgEngagement || "0%"}
                    description="Cliques/Alcance"
                    icon={<Target className="h-4 w-4 sm:h-5 sm:w-5" />}
                    trend="neutral"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-12">
                {/* Regional Performance */}
                <Card className="lg:col-span-8 border-none shadow-xl sm:shadow-2xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
                    <CardHeader className="bg-gradient-to-r from-secondary/10 to-transparent border-b border-border/50 relative z-10 p-4 sm:p-6">
                        <div className="flex justify-between items-start sm:items-center gap-3">
                            <div className="min-w-0 flex-1">
                                <CardTitle className="font-bold text-base sm:text-lg lg:text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">DENSIDADE REGIONAL</CardTitle>
                                <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">Distribuição de talentos por estado do Nordeste</CardDescription>
                            </div>
                            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0">
                                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 relative z-10">
                        <div className="grid gap-6 sm:gap-8 lg:gap-12 md:grid-cols-2">
                            {/* Progress Bars */}
                            <div className="space-y-4 sm:space-y-6">
                                {stats?.regionalDensity.map((item) => (
                                    <div key={item.state} className="space-y-1.5 sm:space-y-2 group">
                                        <div className="flex justify-between text-xs sm:text-sm font-bold uppercase tracking-tight">
                                            <span className="group-hover:text-primary transition-colors truncate mr-2">{item.state}</span>
                                            <span className="text-primary shrink-0">{item.count} creators</span>
                                        </div>
                                        <div className="relative h-2 sm:h-3 bg-muted/30 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-1000 group-hover:shadow-lg group-hover:shadow-primary/30"
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Top State Highlight */}
                            <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-muted/30 to-transparent rounded-xl sm:rounded-2xl lg:rounded-3xl border border-dashed border-border/50 relative overflow-hidden group min-h-[180px] sm:min-h-[200px]">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <MapPin className="h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 text-primary/5 absolute -bottom-8 -right-8 sm:-bottom-12 sm:-right-12 group-hover:scale-110 transition-transform" />
                                <div className="text-center relative z-10">
                                    <div className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                                        <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-secondary" />
                                    </div>
                                    <h4 className="font-bold text-base sm:text-lg lg:text-xl mb-1 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">TOP ESTADO: BAHIA</h4>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold">Maior crescimento em 2024</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Activity Feed */}
                <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6 lg:gap-8">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    )
}
