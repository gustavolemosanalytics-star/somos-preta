"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    LayoutDashboard,
    Users,
    Megaphone,
    Building2,
    ClipboardList,
    Newspaper,
    FileText,
    MessageSquare,
    BarChart3,
    ShieldCheck,
} from "lucide-react"

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
import { cn } from "@/lib/utils"

// Navegação — hierarquia principal: Cliente > Campanhas > Tarefas
const navItems = [
    { title: "Dashboard", url: "/app/dashboard", icon: LayoutDashboard },
    { title: "Clientes", url: "/app/clientes", icon: Building2 },
    { title: "Campanhas", url: "/app/campanhas", icon: Megaphone },
    { title: "Tarefas", url: "/app/tarefas", icon: ClipboardList },
    { title: "Criadores", url: "/app/criadores", icon: Users },
    { title: "Contratos", url: "/app/contratos", icon: FileText },
    { title: "Mensagens", url: "/app/mensagens", icon: MessageSquare },
    { title: "Blog", url: "/app/blog", icon: Newspaper },
    { title: "Relatórios", url: "/app/relatorios", icon: BarChart3 },
]

export function AppSidebar({ user, ...props }: { user: NavUserData } & React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { setOpenMobile } = useSidebar()

    // "Usuários" só aparece para admins
    const items = user.role === "admin"
        ? [...navItems, { title: "Usuários", url: "/app/usuarios", icon: ShieldCheck }]
        : navItems

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
                            <Link href="/app/dashboard" onClick={handleNavClick}>
                                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <span className="text-xs font-semibold tracking-tight">SP</span>
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold tracking-tight text-sidebar-foreground">Somos Preta</span>
                                    <span className="truncate text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Creator Hub</span>
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
                                                {isActive && (
                                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                                )}
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
