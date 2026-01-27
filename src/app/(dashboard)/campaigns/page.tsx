"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Filter, MoreHorizontal, Calendar, Users, DollarSign, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { mockDb, type Campaign } from "@/lib/mock-db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const columns: ColumnDef<Campaign>[] = [
    {
        accessorKey: "name",
        header: "Nome da Campanha",
        cell: ({ row }) => <div className="font-semibold">{row.getValue("name")}</div>,
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
                    {status}
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
        cell: ({ row }) => (
            <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                {row.getValue("influencersCount")}
            </div>
        ),
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
                    <DropdownMenuItem>Ver Briefing</DropdownMenuItem>
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem>Relatório PDF</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        ),
    },
]

export default function CampaignsPage() {
    const { data: campaigns, isLoading } = useQuery({
        queryKey: ['campaigns'],
        queryFn: () => mockDb.campaign.findMany()
    })

    return (
        <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10">
            <div className="flex items-center justify-between">
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
                    <Button className="bg-gradient-to-r from-primary to-secondary rounded-xl">
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
                        <p className="text-xs text-muted-foreground">6 campanhas em execução</p>
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
        </div>
    )
}
