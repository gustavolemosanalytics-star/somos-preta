"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { LogoutButton } from "@/app/creator/logout-button"

/**
 * Casca da área do criador: barra lateral escura fixa e faixa de topo.
 *
 * É client component por um motivo só: o item ativo da navegação depende do
 * caminho atual, e `usePathname` não existe no servidor. O layout continua
 * sendo server component e faz a guarda de sessão antes de chegar aqui.
 */

export type ItemDaCasca = {
    href: string
    rotulo: string
    /** A letra do medalhão quadrado à esquerda do rótulo. */
    sigla: string
}

export function CascaDoCriador({
    itens,
    nome,
    arroba,
    avatar,
    papel,
    children,
}: {
    itens: ItemDaCasca[]
    nome: string
    arroba: string | null
    avatar: string | null
    papel: string
    children: React.ReactNode
}) {
    const caminho = usePathname()
    const iniciais = (nome || "?").slice(0, 2).toUpperCase()

    return (
        <div className="min-h-dvh bg-[#F7F0EC] text-foreground lg:flex">
            {/* ---------- barra lateral ---------- */}
            <aside className="flex shrink-0 flex-col bg-brand-carvao text-white lg:h-dvh lg:w-[232px] lg:sticky lg:top-0">
                <div className="flex items-center gap-3 px-5 py-5">
                    <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-terracota text-[15px] font-bold text-white"
                    >
                        S
                    </span>
                    <span className="text-[15px] font-bold tracking-tight">Somos Preta</span>
                </div>

                <div className="mx-5 border-t border-white/10" />

                <Link
                    href={itens[0]?.href ?? "#"}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/5"
                >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 text-[13px] font-bold">
                        {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                            iniciais
                        )}
                    </span>
                    <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{nome}</span>
                        {arroba && (
                            <span className="block truncate text-[13px] text-white/45">@{arroba}</span>
                        )}
                    </span>
                </Link>

                <div className="mx-5 border-t border-white/10" />

                <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-visible">
                    {itens.map((item) => {
                        // O item do perfil é a raiz da área: comparar por prefixo
                        // deixaria ele aceso em todas as telas de dentro.
                        const ativo =
                            item.href === itens[0]?.href
                                ? caminho === item.href
                                : caminho.startsWith(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={ativo ? "page" : undefined}
                                className={cn(
                                    "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                                    ativo ? "bg-white/[0.07] text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                                )}
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold",
                                        ativo ? "bg-brand-terracota text-white" : "bg-white/10 text-white/60",
                                    )}
                                >
                                    {item.sigla}
                                </span>
                                {item.rotulo}
                            </Link>
                        )
                    })}
                </nav>

                <div className="hidden px-3 pb-5 lg:block">
                    <LogoutButton
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                        icone={<LogOut className="h-4 w-4" aria-hidden />}
                    >
                        Sair
                    </LogoutButton>
                </div>
            </aside>

            {/* ---------- conteúdo ---------- */}
            <div className="min-w-0 flex-1">
                <header className="flex items-center justify-between gap-4 border-b border-brand-carvao/8 px-5 py-4 sm:px-8">
                    <div className="min-w-0">
                        <p className="text-[15px] font-bold tracking-tight">Creator Hub</p>
                        <p className="truncate text-[13px] text-muted-foreground">Perfil e Mídia Kit</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-right sm:block">
                            <span className="block text-sm font-semibold leading-tight">{nome}</span>
                            <span className="block text-[13px] leading-tight text-muted-foreground">{papel}</span>
                        </span>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-areia text-[13px] font-bold text-brand-carvao">
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                                iniciais
                            )}
                        </span>
                        <LogoutButton
                            className="rounded-xl px-2 text-sm font-medium text-muted-foreground hover:text-foreground lg:hidden"
                            icone={<LogOut className="h-4 w-4" aria-hidden />}
                        >
                            <span className="sr-only">Sair</span>
                        </LogoutButton>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10">{children}</main>
            </div>
        </div>
    )
}
