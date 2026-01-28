"use client"

import { Bell, Search, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
    const { setTheme, theme } = useTheme()

    return (
        <div className="flex items-center gap-2 sm:gap-3">
            {/* Search - hidden on mobile, visible on tablet+ */}
            <div className="hidden md:flex relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-9 w-[180px] lg:w-[240px] h-9 bg-muted/50 border-transparent focus:border-primary/50 rounded-xl transition-all"
                />
            </div>

            {/* Mobile search button */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 rounded-xl"
            >
                <Search className="h-4 w-4" />
                <span className="sr-only">Buscar</span>
            </Button>

            {/* Notifications */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 rounded-xl"
                    >
                        <Bell className="h-4 w-4" />
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary">
                            3
                        </Badge>
                        <span className="sr-only">Notificações</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 sm:w-80">
                    <div className="p-3 border-b">
                        <p className="font-semibold text-sm">Notificações</p>
                        <p className="text-xs text-muted-foreground">Você tem 3 novas notificações</p>
                    </div>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Nova campanha aprovada</p>
                            <p className="text-xs text-muted-foreground">Campanha "Verão 2024" foi aprovada</p>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Novo influenciador</p>
                            <p className="text-xs text-muted-foreground">Maria Silva se cadastrou na plataforma</p>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-3 cursor-pointer">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium">Relatório disponível</p>
                            <p className="text-xs text-muted-foreground">O relatório mensal está pronto</p>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme toggle */}
            <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
            </Button>
        </div>
    )
}
