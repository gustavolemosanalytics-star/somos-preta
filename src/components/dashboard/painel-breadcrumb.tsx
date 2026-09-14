"use client"

import { usePathname } from "next/navigation"

import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { trilhaDoPainel } from "@/lib/constants/navegacao"

/**
 * Breadcrumb do painel, derivado da rota.
 *
 * Precisa ser client component porque o layout que o hospeda é assíncrono e não
 * pode chamar usePathname. Rota desconhecida cai no rótulo genérico em vez de
 * sumir — o cabeçalho tem altura fixa e ficaria torto sem nada aqui.
 */
export function PainelBreadcrumb() {
    const pathname = usePathname()
    const trilha = trilhaDoPainel(pathname)

    return (
        <Breadcrumb className="hidden sm:flex">
            <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                    {trilha ? (
                        <BreadcrumbLink href={trilha.secao.url}>{trilha.secao.title}</BreadcrumbLink>
                    ) : (
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    )}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                    <BreadcrumbPage className="max-w-[150px] truncate sm:max-w-none">
                        {trilha?.pagina ?? "Painel"}
                    </BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )
}
