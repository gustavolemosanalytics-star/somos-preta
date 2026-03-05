"use client"

import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Filter, MoreHorizontal, Calendar, Users, DollarSign, Loader2, Eye, Share2, FileText, ArrowLeft, ExternalLink, Copy, CheckCircle2, BarChart3, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { mockDb, type Campaign, type CampaignInfluencer } from "@/lib/mock-db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts"

function formatNumber(num: number): string {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
}

function statusLabel(status: string) {
    const map: Record<string, string> = {
        ACTIVE: "Ativa",
        DRAFT: "Rascunho",
        COMPLETED: "Concluída",
        PENDING_APPROVAL: "Pendente",
        CANCELLED: "Cancelada",
    }
    return map[status] || status
}

// ---- Campaign Detail View ----
function CampaignDetail({ campaign, onBack }: { campaign: Campaign; onBack: () => void }) {
    const [copied, setCopied] = useState(false)
    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/client-portal/${campaign.shareToken}`
        : ""

    function copyShareLink() {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-1 flex-col gap-6 p-6 lg:p-10"
        >
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onBack} className="rounded-xl">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{campaign.name}</h1>
                    <p className="text-muted-foreground">{campaign.client} &middot; {campaign.description || "Sem descrição"}</p>
                </div>
                <Badge variant={
                    campaign.status === "ACTIVE" ? "default" :
                        campaign.status === "DRAFT" ? "secondary" :
                            campaign.status === "COMPLETED" ? "outline" : "destructive"
                } className="text-sm px-3 py-1">
                    {statusLabel(campaign.status)}
                </Badge>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaign.budget}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Influencers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaign.influencers?.length || campaign.influencersCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Período</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">{campaign.startDate} — {campaign.endDate}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Objetivo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">{campaign.objective || "—"}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Share Link */}
            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="flex items-center gap-4 py-4">
                    <Share2 className="h-5 w-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Link de compartilhamento para o cliente</p>
                        <p className="text-xs text-muted-foreground truncate">{shareUrl}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyShareLink} className="shrink-0 gap-2">
                        {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copiado!" : "Copiar"}
                    </Button>
                    <Button variant="outline" size="sm" asChild className="shrink-0 gap-2">
                        <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" /> Abrir
                        </a>
                    </Button>
                </CardContent>
            </Card>

            {/* Influencers Table - Spreadsheet style */}
            <Card>
                <CardHeader>
                    <CardTitle>Mapa de Projeto - Conteúdo</CardTitle>
                    <CardDescription>Influencers vinculados a esta campanha</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {campaign.influencers && campaign.influencers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">CREATOR</th>
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">SEGUIDORES</th>
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">NICHO</th>
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">% GEO</th>
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">ALCANCE POR CIDADES</th>
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">TAXA ENGAJ.</th>
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">MÉDIA CURTIDAS</th>
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">MÉDIA COMENT.</th>
                                        <th className="text-left p-3 font-semibold whitespace-nowrap">STATUS BIA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaign.influencers.map((inf, i) => (
                                        <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3">
                                                <a href={`https://instagram.com/${inf.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                                                    {inf.name}
                                                </a>
                                            </td>
                                            <td className="p-3 font-medium">{formatNumber(inf.followers)}</td>
                                            <td className="p-3 text-muted-foreground">{inf.niche}</td>
                                            <td className="p-3 font-medium">{inf.geoPercent}%</td>
                                            <td className="p-3 text-xs text-muted-foreground max-w-[300px] truncate">{inf.topCities}</td>
                                            <td className="p-3 font-medium">{inf.engagementRate}%</td>
                                            <td className="p-3">{formatNumber(inf.avgLikes)}</td>
                                            <td className="p-3">{inf.avgComments}</td>
                                            <td className="p-3">
                                                <Badge variant={
                                                    inf.statusBia === "Aprovado" ? "default" :
                                                        inf.statusBia === "Pendente" ? "secondary" :
                                                            inf.statusBia === "Recusado" ? "destructive" : "outline"
                                                }>
                                                    {inf.statusBia}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            Nenhum influencer vinculado a esta campanha ainda.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Report Dashboard */}
            {campaign.influencers && campaign.influencers.length > 0 && (
                <>
                    <div className="flex items-center gap-3">
                        <BarChart3 className="h-6 w-6 text-primary" />
                        <h2 className="text-2xl font-bold">Relatório da Campanha</h2>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Followers chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Seguidores por Creator</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={campaign.influencers.map(i => ({ name: i.name.slice(0, 12), seguidores: i.followers }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                        <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: string | number) => formatNumber(Number(v))} />
                                        <Tooltip formatter={(v) => formatNumber(Number(v))} />
                                        <Bar dataKey="seguidores" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Engagement chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Taxa de Engajamento (%)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={campaign.influencers.map(i => ({ name: i.name.slice(0, 12), engajamento: i.engagementRate }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="name" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                        <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                                        <Tooltip formatter={(v) => `${v}%`} />
                                        <Bar dataKey="engajamento" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Status BIA Pie */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Status BIA</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const statusCounts = campaign.influencers!.reduce((acc, i) => {
                                        acc[i.statusBia] = (acc[i.statusBia] || 0) + 1
                                        return acc
                                    }, {} as Record<string, number>)
                                    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
                                    const COLORS = { Aprovado: "#22c55e", Pendente: "#f59e0b", Recusado: "#ef4444", "-": "#94a3b8" }
                                    return (
                                        <div className="flex items-center justify-center gap-8">
                                            <ResponsiveContainer width={200} height={200}>
                                                <PieChart>
                                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                                                        {pieData.map((entry, i) => (
                                                            <Cell key={i} fill={COLORS[entry.name as keyof typeof COLORS] || "#94a3b8"} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="space-y-2">
                                                {pieData.map((entry) => (
                                                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                                                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[entry.name as keyof typeof COLORS] || "#94a3b8" }} />
                                                        <span>{entry.name}: {entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })()}
                            </CardContent>
                        </Card>

                        {/* Geo Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Geolocalização Média</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={campaign.influencers.map(i => ({ name: i.name.slice(0, 12), geo: i.geoPercent }))} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                                        <YAxis type="category" dataKey="name" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} width={90} />
                                        <Tooltip formatter={(v) => `${v}%`} />
                                        <Bar dataKey="geo" fill="#06b6d4" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-green-500/5 border-green-500/20">
                            <CardContent className="p-4 text-center">
                                <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{formatNumber(campaign.influencers.reduce((s, i) => s + i.followers, 0))}</p>
                                <p className="text-xs text-muted-foreground">Alcance Total</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-500/5 border-purple-500/20">
                            <CardContent className="p-4 text-center">
                                <BarChart3 className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{(campaign.influencers.reduce((s, i) => s + i.engagementRate, 0) / campaign.influencers.length).toFixed(2)}%</p>
                                <p className="text-xs text-muted-foreground">Engajamento Médio</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-pink-500/5 border-pink-500/20">
                            <CardContent className="p-4 text-center">
                                <Users className="h-6 w-6 text-pink-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{formatNumber(campaign.influencers.reduce((s, i) => s + i.avgLikes, 0))}</p>
                                <p className="text-xs text-muted-foreground">Total Curtidas Médias</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-cyan-500/5 border-cyan-500/20">
                            <CardContent className="p-4 text-center">
                                <DollarSign className="h-6 w-6 text-cyan-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold">{(campaign.influencers.reduce((s, i) => s + i.geoPercent, 0) / campaign.influencers.length).toFixed(1)}%</p>
                                <p className="text-xs text-muted-foreground">Geo Média</p>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </motion.div>
    )
}

// ---- Create Campaign Dialog ----
function CreateCampaignDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: "",
        client: "",
        budget: "",
        startDate: "",
        endDate: "",
        description: "",
        objective: "Brand Awareness",
        status: "DRAFT" as Campaign["status"],
    })

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        await mockDb.campaign.create({
            ...form,
            influencersCount: 0,
            shareToken: `${form.name.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}-${Math.random().toString(36).slice(2, 8)}`,
            influencers: [],
        })
        queryClient.invalidateQueries({ queryKey: ["campaigns"] })
        setLoading(false)
        setForm({ name: "", client: "", budget: "", startDate: "", endDate: "", description: "", objective: "Brand Awareness", status: "DRAFT" })
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Criar Campanha</DialogTitle>
                    <DialogDescription>Preencha os dados para cadastrar uma nova campanha.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label>Nome da Campanha</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="rounded-xl" placeholder="Ex: Lançamento Verão 2025" />
                        </div>
                        <div className="space-y-2">
                            <Label>Cliente / Marca</Label>
                            <Input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} required className="rounded-xl" placeholder="Ex: Cervejaria Bahia" />
                        </div>
                        <div className="space-y-2">
                            <Label>Budget</Label>
                            <Input value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} required className="rounded-xl" placeholder="R$ 25.000,00" />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Início</Label>
                            <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Fim</Label>
                            <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Objetivo</Label>
                            <Select value={form.objective} onValueChange={v => setForm({ ...form, objective: v })}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Brand Awareness">Brand Awareness</SelectItem>
                                    <SelectItem value="Engajamento">Engajamento</SelectItem>
                                    <SelectItem value="Conversão">Conversão</SelectItem>
                                    <SelectItem value="Vendas">Vendas</SelectItem>
                                    <SelectItem value="Alcance Regional">Alcance Regional</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Campaign["status"] })}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                                    <SelectItem value="ACTIVE">Ativa</SelectItem>
                                    <SelectItem value="PENDING_APPROVAL">Pendente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Descrição</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" placeholder="Descrição da campanha..." />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Cancelar</Button>
                        <Button type="submit" disabled={loading} className="rounded-xl bg-gradient-to-r from-primary to-secondary">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Campanha"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ---- Main Page ----
export default function CampaignsPage() {
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
    const [showCreate, setShowCreate] = useState(false)

    const { data: campaigns, isLoading } = useQuery({
        queryKey: ["campaigns"],
        queryFn: () => mockDb.campaign.findMany()
    })

    const columns: ColumnDef<Campaign>[] = [
        {
            accessorKey: "name",
            header: "Nome da Campanha",
            cell: ({ row }) => (
                <button onClick={() => setSelectedCampaign(row.original)} className="font-semibold text-left hover:text-primary transition-colors hover:underline">
                    {row.getValue("name")}
                </button>
            ),
        },
        {
            accessorKey: "client",
            header: "Cliente / Marca",
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                return (
                    <Badge variant={
                        status === "ACTIVE" ? "default" :
                            status === "DRAFT" ? "secondary" :
                                status === "COMPLETED" ? "outline" : "destructive"
                    }>
                        {statusLabel(status)}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "budget",
            header: "Budget",
        },
        {
            accessorKey: "influencersCount",
            header: "Influencers",
            cell: ({ row }) => {
                const c = row.original
                return (
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {c.influencers?.length || c.influencersCount}
                    </div>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setSelectedCampaign(row.original)}>
                            <Eye className="h-4 w-4 mr-2" /> Ver Campanha
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                            const token = row.original.shareToken
                            if (token) window.open(`/client-portal/${token}`, "_blank")
                        }}>
                            <Share2 className="h-4 w-4 mr-2" /> Link do Cliente
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" /> Relatório
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ]

    if (selectedCampaign) {
        return (
            <AnimatePresence mode="wait">
                <CampaignDetail
                    campaign={selectedCampaign}
                    onBack={() => setSelectedCampaign(null)}
                />
            </AnimatePresence>
        )
    }

    return (
        <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Gestão de Campanhas
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-lg">Planeje, execute e monitore suas ativações de marketing.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl">
                        <Filter className="mr-2 h-4 w-4" /> Filtros
                    </Button>
                    <Button className="bg-gradient-to-r from-primary to-secondary rounded-xl" onClick={() => setShowCreate(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Criar Campanha
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Total Ativo</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">R$ 95.400,00</div>
                        <p className="text-xs text-muted-foreground">{campaigns?.filter(c => c.status === "ACTIVE").length || 0} campanhas em execução</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entregas Pendentes</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">14</div>
                        <p className="text-xs text-muted-foreground">Para aprovação nesta semana</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ROI Médio</CardTitle>
                        <Plus className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">3.8x</div>
                        <p className="text-xs text-muted-foreground">+12% vs período anterior</p>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <DataTable columns={columns} data={campaigns || []} searchKey="name" />
            )}

            <CreateCampaignDialog open={showCreate} onClose={() => setShowCreate(false)} />
        </div>
    )
}
