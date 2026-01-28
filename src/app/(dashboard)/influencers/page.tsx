"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns, Influencer } from "./columns"
import { Button } from "@/components/ui/button"
import { Plus, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"

export default function InfluencersPage() {
    const { data, isLoading } = useQuery<Influencer[]>({
        queryKey: ['influencers'],
        queryFn: async () => {
            const res = await fetch('/api/influencers')
            if (!res.ok) throw new Error('Failed to fetch')
            return res.json()
        }
    })

    return (
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
            {/* Header Section */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {data?.length || 0} cadastrados
                        </Badge>
                    </div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Influenciadores
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm lg:text-base max-w-md">
                        Gerencie sua base de criadores de conteúdo do Norte e Nordeste.
                    </p>
                </div>
                <Link href="/influencers/new" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-xl h-9 sm:h-10 px-4 sm:px-6 text-sm shadow-lg shadow-primary/20 transition-all">
                        <Plus className="mr-1.5 sm:mr-2 h-4 w-4" />
                        <span className="sm:inline">Novo Influenciador</span>
                    </Button>
                </Link>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 gap-3">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    <p className="text-xs sm:text-sm text-muted-foreground">Carregando influenciadores...</p>
                </div>
            ) : (
                <DataTable columns={columns} data={data || []} searchKey="name" />
            )}
        </div>
    )
}
