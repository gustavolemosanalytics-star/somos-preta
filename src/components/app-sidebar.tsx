"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    LayoutDashboard,
    Users,
    Megaphone,
    FileText,
    MessageSquare,
    GraduationCap,
    Users2,
    BarChart3,
    Settings,
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
import { NavUser } from "@/components/nav-user"
import { cn } from "@/lib/utils"

// Navigation items
const navItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Influenciadores",
        url: "/influencers",
        icon: Users,
    },
    {
        title: "Creators",
        url: "/creators",
        icon: Users,
    },
    {
        title: "Campanhas",
        url: "/campaigns",
        icon: Megaphone,
    },
    {
        title: "Contratos",
        url: "/contracts",
        icon: FileText,
    },
    {
        title: "Mensagens",
        url: "/messages",
        icon: MessageSquare,
    },
    {
        title: "Cursos",
        url: "/courses",
        icon: GraduationCap,
    },
    {
        title: "Comunidade",
        url: "/community",
        icon: Users2,
    },
    {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart3,
    },
    {
        title: "Configurações",
        url: "/settings",
        icon: Settings,
    },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
