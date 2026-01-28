"use client"
// We change this to client component for now to easily fetch from our mock API 
// or keep as server component and fetch absolute URL if we had one.
// For simplicity in this mock phase, let's use client-side fetching with SWR or React Query
// But wait, we have TanStack Query set up. Let's use it!

import { DataTable } from "@/components/ui/data-table"
import { columns, Influencer } from "./columns" // We need to export Influencer type from columns
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

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
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">
                        <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                            Influenciadores
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        Gerencie sua base de criadores de conteúdo do Norte e Nordeste.
                    </p>
                </div>
                <Link href="/influencers/new">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary rounded-xl h-10 px-6">
                        <Plus className="mr-2 h-4 w-4" /> Novo Influenciador
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <DataTable columns={columns} data={data || []} searchKey="name" />
            )}
        </div>
    )
}
