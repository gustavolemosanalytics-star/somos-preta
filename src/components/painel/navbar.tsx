"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Menu } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { NavUser, type NavUserData } from "@/components/nav-user"
import { SimboloPreta } from "@/components/public/marca"
import { NAV_ADMIN, NAV_PLATAFORMA, rotaLimpa, type ItemNav } from "@/lib/constants/navegacao"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

/**
 * Barra de navegação do painel.
 *
 * Substituiu a barra lateral. Onze itens numa coluna de 16rem consumiam largura
 * o tempo todo para uma lista que raramente muda — e era justamente essa largura
 * que faltava embaixo, onde a linha de filtros espremia a busca a 50px e cortava
 * o nome de metade dos seletores.
 *
 * Os itens que não cabem vão para "Mais", em vez de a barra virar uma régua
 * rolável: a lista é estável, então saber onde cada coisa está vale mais do que
 * ter tudo à vista.
 */

/** Quantos itens ficam na barra antes do menu "Mais", por largura. */
const VISIVEIS_POR_LARGURA = [
    { minimo: 1536, n: 8 },
    { minimo: 1280, n: 6 },
    { minimo: 1024, n: 4 },
]

function useItensVisiveis(total: number) {
    // Começa em 0 e o valor real só chega depois da montagem: medir a janela
    // durante o render quebraria a hidratação, que roda sem DOM no servidor.
    const [n, setN] = React.useState(0)

    React.useEffect(() => {
        function medir() {
            const largura = window.innerWidth
            const faixa = VISIVEIS_POR_LARGURA.find((f) => largura >= f.minimo)
            setN(faixa ? Math.min(faixa.n, total) : 0)
        }
        medir()
        window.addEventListener("resize", medir)
        return () => window.removeEventListener("resize", medir)
    }, [total])

    return n
}

function ItemBarra({ item, ativo, contagem, onClick }: {
    item: ItemNav
    ativo: boolean
    contagem?: number
    onClick?: () => void
}) {
    return (
        <Link
            href={item.url}
            onClick={onClick}
            aria-current={ativo ? "page" : undefined}
            className={cn(
                "flex h-9 items-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm transition-colors",
                ativo
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
        >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.title}
            {contagem ? (
                <Badge className="h-5 min-w-5 justify-center bg-primary px-1 text-primary-foreground">
                    {contagem > 99 ? "99+" : contagem}
                </Badge>
            ) : null}
        </Link>
    )
}

export function Navbar({ user }: { user: NavUserData }) {
    const pathname = rotaLimpa(usePathname())
    const [aberto, setAberto] = React.useState(false)
    const [pendentes, setPendentes] = React.useState(0)

    const itens = React.useMemo(
        () => (user.role === "admin" ? [...NAV_PLATAFORMA, NAV_ADMIN] : NAV_PLATAFORMA),
        [user.role]
    )

    const visiveis = useItensVisiveis(itens.length)
    const naBarra = itens.slice(0, visiveis)
    const noMenu = itens.slice(visiveis)

    /**
     * Quantas tarefas pedem atenção hoje.
     *
     * Só a contagem (head: true), sem trazer linha nenhuma: a barra aparece em
     * toda tela e não pode custar uma listagem a cada navegação.
     */
    React.useEffect(() => {
        const hoje = new Date().toISOString().slice(0, 10)
        createClient()
            .from("somos_preta_tarefas")
            .select("id", { count: "exact", head: true })
            .eq("arquivada", false)
            .not("status", "in", "(concluida,cancelada)")
            .lte("data_entrega", hoje)
            .then(({ count, error }) => {
                if (!error) setPendentes(count ?? 0)
            })
    }, [])

    const ehAtivo = (url: string) => pathname === url || pathname.startsWith(`${url}/`)
    const algumNoMenuAtivo = noMenu.some((i) => ehAtivo(i.url))

    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
            <div className="flex h-14 items-center gap-2 px-4 sm:h-16 lg:px-6">
                {/* ---------- marca ---------- */}
                <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
                    <SimboloPreta className="size-8" />
                    <span className="hidden leading-tight sm:grid">
                        <span className="text-sm font-semibold tracking-tight">Somos Preta</span>
                        <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                            Creator Hub
                        </span>
                    </span>
                </Link>

                {/* ---------- navegação ---------- */}
                <nav className="ml-2 hidden min-w-0 flex-1 items-center gap-0.5 lg:flex">
                    {naBarra.map((item) => (
                        <ItemBarra
                            key={item.url}
                            item={item}
                            ativo={ehAtivo(item.url)}
                            contagem={item.url === "/tarefas" ? pendentes : undefined}
                        />
                    ))}

                    {noMenu.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "h-9 gap-1 px-3 text-sm font-normal",
                                        algumNoMenuAtivo ? "text-primary" : "text-muted-foreground",
                                    )}
                                >
                                    Mais
                                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52">
                                {noMenu.map((item) => (
                                    <DropdownMenuItem key={item.url} asChild>
                                        <Link href={item.url} className={cn(ehAtivo(item.url) && "text-primary")}>
                                            <item.icon className="h-4 w-4" />
                                            {item.title}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </nav>

                <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
                    <DashboardHeader />
                    <NavUser user={user} />

                    {/* ---------- menu em telas estreitas ---------- */}
                    <Sheet open={aberto} onOpenChange={setAberto}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                            <SheetHeader className="border-b px-4 py-3">
                                <SheetTitle className="text-left text-sm">Navegação</SheetTitle>
                            </SheetHeader>
                            <nav className="flex flex-col gap-1 p-3">
                                {itens.map((item) => (
                                    <ItemBarra
                                        key={item.url}
                                        item={item}
                                        ativo={ehAtivo(item.url)}
                                        contagem={item.url === "/tarefas" ? pendentes : undefined}
                                        onClick={() => setAberto(false)}
                                    />
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
