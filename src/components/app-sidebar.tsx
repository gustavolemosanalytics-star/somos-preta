"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    LayoutDashboard,
    Users,
    UserSearch,
    Megaphone,
    Building2,
    ClipboardList,
    IdCard,
    Newspaper,
    FileText,
    MessageSquare,
    BarChart3,
    Sparkles,
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
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Clientes", url: "/clientes", icon: Building2 },
    { title: "Campanhas", url: "/campaigns", icon: Megaphone },
    { title: "Tarefas", url: "/tarefas", icon: ClipboardList },
    { title: "Influenciadores", url: "/influencers", icon: Users },
    { title: "Creators", url: "/creators", icon: UserSearch },
    { title: "Mídia Kits", url: "/media-kits", icon: IdCard },
    { title: "Contratos", url: "/contracts", icon: FileText },
    { title: "Mensagens", url: "/messages", icon: MessageSquare },
    { title: "Blog", url: "/blog-admin", icon: Newspaper },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
]

export function AppSidebar({ user, ...props }: { user: NavUserData } & React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { setOpenMobile } = useSidebar()

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
                                <div className="flex aspect-square size-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg shadow-primary/20">
                                    <Sparkles className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold bg-gradient-to-r from-sidebar-foreground to-sidebar-foreground/70 bg-clip-text">Somos Preta</span>
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
                            {navItems.map((item) => {
                                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            tooltip={item.title}
                                            isActive={isActive}
                                            className={cn(
                                                "transition-all duration-200 rounded-xl",
                                                isActive && "bg-gradient-to-r from-primary/20 to-secondary/10 text-primary font-medium shadow-sm"
                                            )}
                                        >
                                            <Link href={item.url} onClick={handleNavClick}>
                                                <item.icon className={cn(
                                                    "transition-colors",
                                                    isActive ? "text-primary" : "text-sidebar-foreground/70"
                                                )} />
                                                <span>{item.title}</span>
                                                {isActive && (
                                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
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
