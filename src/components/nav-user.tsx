"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { BadgeCheck, LogOut, Settings2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

const ROLE_LABEL: Record<string, string> = {
    admin: "Administrador",
    gestor: "Gestor",
    analista: "Analista",
    creator: "Creator",
}

export type NavUserData = {
    name: string
    email: string
    avatar: string
    role?: string
}

/**
 * Menu da pessoa logada, no canto direito da barra.
 *
 * Era um item de barra lateral e dependia do contexto do `Sidebar`; com a
 * navegação no topo, virou um gatilho de avatar que se vira sozinho — sem
 * contexto externo, o componente passa a caber em qualquer casca.
 */
export function NavUser({ user }: { user: NavUserData }) {
    const router = useRouter()

    const iniciais = user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "U"

    async function sair() {
        await createClient().auth.signOut()
        router.push("/login")
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 rounded-full"
                    aria-label={`Conta de ${user.name}`}
                >
                    <Avatar className="h-8 w-8">
                        {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                        <AvatarFallback className="text-xs">{iniciais}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                            <AvatarFallback className="text-xs">{iniciais}</AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 flex-1 text-left leading-tight">
                            <span className="truncate text-sm font-medium">{user.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>

                {user.role && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>
                            <BadgeCheck className="h-4 w-4" />
                            {ROLE_LABEL[user.role] ?? user.role}
                        </DropdownMenuItem>
                    </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/configuracoes">
                        <Settings2 className="h-4 w-4" /> Configurações
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={sair}>
                    <LogOut className="h-4 w-4" /> Sair
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
