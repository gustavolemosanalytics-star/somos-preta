"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { createClient } from "@/lib/supabase/client"
import type { Notificacao, NotificacaoTipo } from "@/lib/db/types"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

type NotificacaoComTarefa = Notificacao & {
    ator: { nome: string | null; email: string | null } | null
    tarefa: { id: string; titulo: string } | null
}

const NOTIF_LABEL: Record<NotificacaoTipo, (ator: string) => string> = {
    tarefa_atribuida: (a) => `${a} atribuiu uma tarefa a você`,
    mencao: (a) => `${a} mencionou você em uma tarefa`,
    comentario: (a) => `${a} comentou em uma tarefa`,
    solicitacao_revisao: (a) => `${a} pediu revisão em uma tarefa`,
    conclusao: (a) => `${a} concluiu uma tarefa`,
}

export function DashboardHeader() {
    const { setTheme, theme } = useTheme()
    const [supabase] = useState(() => createClient())
    const [notificacoes, setNotificacoes] = useState<NotificacaoComTarefa[]>([])

    async function load() {
        const { data } = await supabase
            .from("somos_preta_notificacoes")
            .select("*, ator:somos_preta_profiles!ator_id(nome, email), tarefa:somos_preta_tarefas(id, titulo)")
            .order("created_at", { ascending: false })
            .limit(20)
        setNotificacoes((data as NotificacaoComTarefa[]) ?? [])
    }

    useEffect(() => {
        load()
        const interval = setInterval(load, 30000)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function marcarLida(n: NotificacaoComTarefa) {
        if (n.lida) return
        setNotificacoes((prev) => prev.map((x) => (x.id === n.id ? { ...x, lida: true } : x)))
        await supabase.from("somos_preta_notificacoes").update({ lida: true }).eq("id", n.id)
    }

    const naoLidas = notificacoes.filter((n) => !n.lida).length

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
            <DropdownMenu onOpenChange={(o) => { if (o) load() }}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative h-9 w-9 rounded-xl"
                    >
                        <Bell className="h-4 w-4" />
                        {naoLidas > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary">
                                {naoLidas > 9 ? "9+" : naoLidas}
                            </Badge>
                        )}
                        <span className="sr-only">Notificações</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 sm:w-80">
                    <div className="p-3 border-b">
                        <p className="font-semibold text-sm">Notificações</p>
                        <p className="text-xs text-muted-foreground">
                            {naoLidas > 0 ? `Você tem ${naoLidas} nova${naoLidas > 1 ? "s" : ""}` : "Tudo em dia"}
                        </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notificacoes.length === 0 && (
                            <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação ainda</p>
                        )}
                        {notificacoes.map((n) => {
                            const atorNome = n.ator?.nome ?? n.ator?.email ?? "Alguém"
                            const href = n.tarefa ? `/app/tarefas/${n.tarefa.id}` : "/app/tarefas"
                            return (
                                <DropdownMenuItem key={n.id} asChild className="p-0">
                                    <Link
                                        href={href}
                                        onClick={() => marcarLida(n)}
                                        className={`flex flex-col gap-1 p-3 cursor-pointer ${!n.lida ? "bg-primary/5" : ""}`}
                                    >
                                        <p className="text-sm font-medium">{NOTIF_LABEL[n.tipo](atorNome)}</p>
                                        {n.tarefa && <p className="text-xs text-muted-foreground truncate">{n.tarefa.titulo}</p>}
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                                        </p>
                                    </Link>
                                </DropdownMenuItem>
                            )
                        })}
                    </div>
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
