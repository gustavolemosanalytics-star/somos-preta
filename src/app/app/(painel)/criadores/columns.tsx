"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Influencer = {
    id: string
    name: string
    email: string
    instagram: string
    followers: number
    engagement: number
    status: "ACTIVE" | "INACTIVE" | "NEGOTIATING" | "BLOCKED"
    state: string
    niche: string[]
}

export const columns: ColumnDef<Influencer>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Nome
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
    },
    {
        accessorKey: "instagram",
        header: "Instagram",
        cell: ({ row }) => <div className="lowercase">{row.getValue("instagram")}</div>,
    },
    {
        accessorKey: "followers",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Seguidores
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("followers"))
            const formatted = new Intl.NumberFormat("pt-BR", {
                maximumSignificantDigits: 3,
                notation: "compact",
            }).format(amount)
            return <div className="font-medium">{formatted}</div>
        },
    },
    {
        accessorKey: "engagement",
        header: "Engajamento",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("engagement"))
            return <div className="font-medium">{amount}%</div>
        },
    },
    {
        accessorKey: "niche",
        header: "Nicho",
        cell: ({ row }) => {
            const niches = row.getValue("niche") as string[]
            return <div className="flex gap-1 flex-wrap">
                {niches.slice(0, 2).map(n => <Badge variant="outline" key={n}>{n}</Badge>)}
                {niches.length > 2 && <span className="text-xs text-muted-foreground">+{niches.length - 2}</span>}
            </div>
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'}>{status}</Badge>
            )
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const influencer = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(influencer.id)}
                        >
                            Copiar ID
                        </DropdownMenuItem>
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
