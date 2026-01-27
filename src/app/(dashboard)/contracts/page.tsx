"use client"

import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { FileText, Plus, Clock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ColumnDef } from "@tanstack/react-table"
import { useQuery } from "@tanstack/react-query"
import { mockDb, type Contract } from "@/lib/mock-db"

const columns: ColumnDef<Contract>[] = [
    {
        accessorKey: "title",
        header: "Título / Objeto",
        cell: ({ row }) => <div className="font-semibold">{row.getValue("title")}</div>,
    },
    {
        accessorKey: "influencer",
        header: "Influenciador",
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={
                    status === "SIGNED" ? "default" :
                        status === "PENDING" ? "secondary" :
                            "destructive"
                }>
                    {status}
                </Badge>
            )
        },
    },
    {
        accessorKey: "createdAt",
        header: "Criado em",
    },
    {
        id: "actions",
        cell: ({ row }) => (
            <Button variant="ghost" size="sm">Download PDF</Button>
        ),
    },
]

export default function ContractsPage() {
    const { data: contracts, isLoading } = useQuery({
        queryKey: ['contracts'],
        queryFn: () => mockDb.contract.findMany()
    })

    return (
        <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-2">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Rastreabilidade de Contratos
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-lg">Gestão centralizada de conformidade e assinaturas digitais.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl">Templates</Button>
                    <Button className="bg-gradient-to-r from-primary to-secondary rounded-xl">
                        <Plus className="mr-2 h-4 w-4" /> Novo Contrato
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-xl">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                        <div className="text-2xl font-bold">42</div>
                        <p className="text-xs text-muted-foreground">Assinados no mês</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-xl">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                        <Clock className="h-8 w-8 text-blue-500 mb-2" />
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Aguardando assinatura</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-xl">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                        <AlertCircle className="h-8 w-8 text-orange-500 mb-2" />
                        <div className="text-2xl font-bold">5</div>
                        <p className="text-xs text-muted-foreground">Expirando em 30 dias</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-none shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-xl">
                    <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                        <FileText className="h-8 w-8 text-primary mb-2" />
                        <div className="text-2xl font-bold">156</div>
                        <p className="text-xs text-muted-foreground">Total no repositório</p>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <DataTable columns={columns} data={contracts || []} searchKey="title" />
            )}
        </div>
    )
}
