"use client"

import * as React from "react"
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
    Command,
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
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"

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
        icon: Users, // Using Users icon as placeholder, similar to TopNavbar's Search icon or similar
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
    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Somos Preta</span>
                                    <span className="truncate text-xs">Creator Hub</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
