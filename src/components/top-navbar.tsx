"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, Users, Search, Megaphone, FileText, MessageSquare, BarChart3, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Influenciadores", href: "/influencers", icon: Users },
    { title: "Creators", href: "/creators", icon: Search },
    { title: "Campanhas", href: "/campaigns", icon: Megaphone },
    { title: "Contratos", href: "/contracts", icon: FileText },
    { title: "Mensagens", href: "/messages", icon: MessageSquare },
    { title: "Analytics", href: "/analytics", icon: BarChart3 },
]

export function TopNavbar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-transparent border-none">
            <div className="h-full max-w-[1800px] mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-3">
                    <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                        Somos Preta
                    </span>
                </Link>

                {/* Center Navigation */}
                <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
                    {navItems.slice(0, 5).map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-full transition-all relative",
                                    isActive
                                        ? "text-white"
                                        : "text-white/60 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full" />
                                )}
                                <span className="relative z-10">{item.title}</span>
                                {isActive && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-4">
                    <Link href="/analytics">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer transition-all",
                                pathname === "/analytics" && "text-white bg-white/10"
                            )}
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                        </Button>
                    </Link>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 hover:border-white/20">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-transparent text-white text-sm font-bold">
                                        {session?.user?.name?.charAt(0) || "A"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-[#1a1a2e] border-white/10" align="end">
                            <DropdownMenuLabel className="text-white/80">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{session?.user?.name || "Admin"}</p>
                                    <p className="text-xs text-white/50">{session?.user?.email || "admin@somospreta.com"}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem asChild className="text-white/70 hover:text-white focus:text-white focus:bg-white/5">
                                <Link href="/settings">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Configurações
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    )
}
