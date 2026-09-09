"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, Menu, X } from "lucide-react"

import { PillNav, type PillNavItem } from "@/components/public/pill-nav"
import { LogoPreta, SimboloTerritorio } from "@/components/public/marca"
import { LINK_CONTATO } from "@/lib/constants/contato"

// A ordem aqui espelha a ordem das dobras na home, de cima para baixo.
const navItems: PillNavItem[] = [
    { label: "Início", href: "/", id: "topo" },
    { label: "Quem somos", href: "/#quem-somos", id: "quem-somos" },
    { label: "Sou criador", href: "/#criadores", id: "criadores" },
    { label: "Blog", href: "/#conteudos", id: "conteudos" },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [menuMobile, setMenuMobile] = useState(false)
    const [itemAtivo, setItemAtivo] = useState("/")



    // Os itens do menu apontam para dobras da home, então o item ativo vem da
    // seção visível, não da rota. Fora da home nenhum deles fica marcado.
    useEffect(() => {
        if (pathname !== "/") return
        const secoes = navItems
            .map((i) => (i.id === "topo" ? null : document.getElementById(i.id!)))
            .filter((el): el is HTMLElement => Boolean(el))

        const obs = new IntersectionObserver(
            (entries) => {
                const visivel = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
                if (visivel) {
                    const item = navItems.find((i) => i.id === visivel.target.id)
                    if (item) setItemAtivo(item.href)
                } else if (window.scrollY < 200) {
                    setItemAtivo("/")
                }
            },
            { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
        )
        secoes.forEach((el) => obs.observe(el))

        const aoRolar = () => {
            if (window.scrollY < 200) setItemAtivo("/")
        }
        window.addEventListener("scroll", aoRolar, { passive: true })
        return () => {
            obs.disconnect()
            window.removeEventListener("scroll", aoRolar)
        }
    }, [pathname])

    if (pathname?.startsWith("/login")) {
        return <>{children}</>
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
                <nav className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between gap-6 px-6">
                    {/* assinatura */}
                    <div className="flex shrink-0 items-center gap-4">
                        <Link href="/" aria-label="Somos Preta — início" className="flex items-center gap-3">
                            <LogoPreta className="h-7 w-auto" priority />
                        </Link>

                        <span aria-hidden className="hidden h-7 w-px bg-border xl:block" />

                        <span className="hidden items-center gap-2.5 xl:flex">
                            <SimboloTerritorio className="h-5 w-7 text-brand-terracota" />
                            <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                Norte &amp; Nordeste
                            </span>
                        </span>
                    </div>

                    {/* navegação */}
                    <div className="hidden lg:block">
                        <PillNav items={navItems} activeHref={pathname === "/" ? itemAtivo : undefined} />
                    </div>

                    {/* ações */}
                    <div className="flex shrink-0 items-center gap-2">

                        <Link
                            href="/criador/login"
                            className="hidden h-10 items-center rounded-full px-4 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
                        >
                            Entrar
                        </Link>

                        <Link
                            href={LINK_CONTATO}
                            className="group hidden h-11 items-center gap-2 rounded-full border border-brand-terracota px-6 text-sm font-semibold text-brand-terracota transition-colors hover:bg-brand-terracota hover:text-white sm:inline-flex"
                        >
                            Fale com a gente
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </Link>

                        <button
                            type="button"
                            onClick={() => setMenuMobile((v) => !v)}
                            aria-label={menuMobile ? "Fechar menu" : "Abrir menu"}
                            aria-expanded={menuMobile}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border lg:hidden"
                        >
                            {menuMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </nav>

                {menuMobile && (
                    <div className="border-t border-border px-6 pb-6 pt-4 lg:hidden">
                        <ul className="space-y-1">
                            {navItems.map((item) => (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setMenuMobile(false)}
                                        className="block rounded-xl px-2 py-2.5 text-[15px] text-foreground/80"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
                            <Link
                                href="/criador/login"
                                onClick={() => setMenuMobile(false)}
                                className="flex h-12 items-center justify-center rounded-full border border-border text-sm font-medium"
                            >
                                Entrar
                            </Link>
                            <Link
                                href={LINK_CONTATO}
                                onClick={() => setMenuMobile(false)}
                                className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-terracota text-sm font-semibold text-white"
                            >
                                Fale com a gente
                                <ArrowRight className="h-4 w-4" aria-hidden />
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-1">{children}</main>

            <footer className="border-t border-border">
                <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
                    <div className="flex items-center gap-2.5">
                        <LogoPreta className="h-6 w-auto" />
                    </div>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <Link href="/blog" className="transition-colors hover:text-foreground">
                            Blog
                        </Link>
                        <Link href="/engajamento" className="transition-colors hover:text-foreground">
                            Checar engajamento
                        </Link>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Ideias que movem pessoas.
                    </p>
                </div>
            </footer>
        </div>
    )
}
