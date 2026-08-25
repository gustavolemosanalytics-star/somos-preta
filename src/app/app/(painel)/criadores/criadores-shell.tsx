"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Compass, Database, ListChecks, Scale, Star } from "lucide-react"
import { ExplorarTab } from "./explorar-tab"
import { MinhaBaseTab } from "./minha-base-tab"
import { ListasTab } from "./listas-tab"
import { CompararTab } from "./comparar-tab"
import { FavoritosTab } from "./favoritos-tab"

const ABAS = [
    { value: "explorar", label: "Explorar", icon: Compass },
    { value: "base", label: "Minha Base", icon: Database },
    { value: "listas", label: "Listas", icon: ListChecks },
    { value: "comparar", label: "Comparar", icon: Scale },
    { value: "favoritos", label: "Favoritos", icon: Star },
] as const

export function CriadoresShell() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const aba = searchParams.get("tab") ?? "explorar"

    function mudarAba(v: string) {
        router.push(`${pathname}?tab=${v}`, { scroll: false })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Compass className="h-6 w-6 text-primary" /> Criadores
                </h1>
                <p className="text-muted-foreground text-sm">Descoberta, base, listas, comparação e favoritos — tudo em um só lugar.</p>
            </div>

            <Tabs value={aba} onValueChange={mudarAba}>
                <TabsList>
                    {ABAS.map((a) => (
                        <TabsTrigger key={a.value} value={a.value}><a.icon className="h-3.5 w-3.5" /> {a.label}</TabsTrigger>
                    ))}
                </TabsList>
                <TabsContent value="explorar"><ExplorarTab /></TabsContent>
                <TabsContent value="base"><MinhaBaseTab /></TabsContent>
                <TabsContent value="listas"><ListasTab /></TabsContent>
                <TabsContent value="comparar"><CompararTab /></TabsContent>
                <TabsContent value="favoritos"><FavoritosTab /></TabsContent>
            </Tabs>
        </div>
    )
}
