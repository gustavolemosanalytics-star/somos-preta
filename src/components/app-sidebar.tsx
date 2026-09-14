"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { NavUser, type NavUserData } from "@/components/nav-user"
import { SimboloPreta } from "@/components/public/marca"
import { Badge } from "@/components/ui/badge"
import { NAV_ADMIN, NAV_PLATAFORMA, rotaLimpa } from "@/lib/constants/navegacao"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function AppSidebar({ user, ...props }: { user: NavUserData } & React.ComponentProps<typeof Sidebar>) {
    // Normaliza /app/... para a forma limpa: o item ativo precisa acender tanto
    // no subdomínio (onde a URL já é limpa) quanto em acesso direto à rota física.
    const pathname = rotaLimpa(usePathname())
    const { setOpenMobile } = useSidebar()

    /**
     * Quantas tarefas pedem atenção hoje — o número que o menu mostra.
     *
     * Consulta só a contagem (head: true), sem trazer linha nenhuma: o menu
     * aparece em toda tela e não pode custar uma listagem a cada navegação.
     */
    const [pendentes, setPendentes] = React.useState(0)

    React.useEffect(() => {
        const supabase = createClient()
        const hoje = new Date().toISOString().slice(0, 10)
        supabase
            .from("somos_preta_tarefas")
            .select("id", { count: "exact", head: true })
            .eq("arquivada", false)
            .not("status", "in", "(concluida,cancelada)")
            .lte("data_entrega", hoje)
            .then(({ count, error }) => { if (!error) setPendentes(count ?? 0) })
    }, [])

    // "Usuários" só aparece para admins
    const items = user.role === "admin"
        ? [...NAV_PLATAFORMA, NAV_ADMIN]
        : NAV_PLATAFORMA

    const handleNavClick = () => {
        // Close mobile sidebar when navigating
        setOpenMobile(false)
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="border-b border-sidebar-border/50">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/50">
                            <Link href="/dashboard" onClick={handleNavClick}>
                                <SimboloPreta className="size-8" />
                                <div className="grid flex-1 text-left leading-tight">
                                    <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                                        Somos Preta
                                    </span>
                                    <span className="truncate text-[9px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
                                        Criadores que movem o Nordeste
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="px-2">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 font-bold">Plataforma</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1">
                            {items.map((item) => {
                                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            isActive={isActive}
                                            className={cn(
                                                "transition-colors rounded-xl",
                                                isActive && "bg-primary/10 text-primary font-medium"
                                            )}
                                        >
                                            <Link href={item.url} onClick={handleNavClick}>
                                                <item.icon className={cn(
                                                    "transition-colors",
                                                    isActive ? "text-primary" : "text-sidebar-foreground/70"
                                                )} />
                                                <span>{item.title}</span>
                                                {item.url === "/tarefas" && pendentes > 0 ? (
                                                    <Badge className="ml-auto h-5 min-w-5 justify-center px-1 bg-primary text-primary-foreground">
                                                        {pendentes > 99 ? "99+" : pendentes}
                                                    </Badge>
                                                ) : isActive ? (
                                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                                ) : null}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border/50">
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
