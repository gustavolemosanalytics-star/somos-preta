"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { BLOG_FILTROS } from "@/lib/constants/blog"
import { MapaTerritorio } from "./mapa-territorio"
import type { PostResumo } from "./blog-hero"

/** Página do blog: abertura, filtros, artigo em destaque e posts recentes. */


const EIXOS = ["Pessoas", "Território", "Cultura", "Autenticidade", "Movimento"]

/** Capas de reserva para posts ainda sem imagem própria. */
const CAPAS = ["/blog/post-1.svg", "/blog/post-2.svg", "/blog/post-3.svg", "/blog/post-4.svg"]

function formatarData(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    })
}

export function BlogPagina({
    posts,
    termoInicial,
}: {
    posts: (PostResumo & { minutos?: number })[]
    termoInicial?: string
}) {
    const [categoria, setCategoria] = useState("Todos")
    const [termo, setTermo] = useState(termoInicial ?? "")

    const filtrados = useMemo(() => {
        let r = posts
        if (categoria !== "Todos") {
            r = r.filter((p) => p.categoria?.toLowerCase() === categoria.toLowerCase())
        }
        const q = termo.trim().toLowerCase()
        if (q) {
            r = r.filter(
                (p) =>
                    p.titulo.toLowerCase().includes(q) ||
                    p.resumo?.toLowerCase().includes(q) ||
                    p.categoria?.toLowerCase().includes(q)
            )
        }
        return r
    }, [posts, categoria, termo])

    const [destaque, ...recentes] = filtrados

    return (
        <div className="flex flex-col">
            {/* ---------- abertura ---------- */}
            <section className="mx-auto w-full max-w-[1600px] px-6 pt-10 lg:pt-12">
                <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                            Blog Somos Preta
                        </p>

                        <h1 className="mt-5 text-[clamp(2.4rem,4.2vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.033em]">
                            Ideias que
                            <br />
                            movem pessoas.
                        </h1>

                        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                            Conteúdo sobre creators, marcas e o mercado de{" "}
                            <span className="font-semibold text-foreground">influência regional</span>{" "}
                            do Norte e Nordeste. Histórias reais, tendências, oportunidades e
                            reflexões para um Brasil mais diverso, potente e representativo.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                        className="relative aspect-[1200/720]"
                    >
                        <div className="absolute inset-0 overflow-hidden rounded-3xl bg-muted">
                            <Image
                                src="/blog/abertura.svg"
                                alt="Criadora de conteúdo ao ar livre, com a serra ao fundo"
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 52vw"
                                unoptimized
                                className="object-cover"
                            />
                        </div>

                        <p
                            aria-hidden
                            className="absolute -top-2 right-[22%] z-10 hidden max-w-[8ch] -rotate-6 font-manuscrita text-[clamp(1.3rem,1.8vw,2rem)] leading-[1.2] text-brand-carvao md:block"
                        >
                            Mais vozes. Mais conquistas.
                            <span aria-hidden className="mt-2 block h-[2px] w-20 rounded-full bg-brand-coral" />
                        </p>

                        <MapaTerritorio
                            aria-hidden
                            className="absolute right-[9%] top-[16%] z-10 hidden h-[36%] w-auto text-brand-areia lg:block"
                        />

                        <ul aria-hidden className="absolute right-0 top-[26%] z-10 hidden space-y-1.5 xl:block">
                            {EIXOS.map((e) => (
                                <li
                                    key={e}
                                    className="text-[10px] font-medium uppercase leading-none tracking-[0.2em] text-muted-foreground"
                                >
                                    {e}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>
            </section>

            {/* ---------- filtros ---------- */}
            <section className="mx-auto w-full max-w-[1600px] px-6 pt-10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <ul className="flex flex-wrap gap-2">
                        {BLOG_FILTROS.map((c) => {
                            const ativa = c === categoria
                            return (
                                <li key={c}>
                                    <button
                                        type="button"
                                        onClick={() => setCategoria(c)}
                                        aria-pressed={ativa}
                                        className={cn(
                                            "h-10 rounded-full border px-5 text-sm font-medium transition-colors",
                                            ativa
                                                ? "border-brand-terracota bg-brand-terracota text-white"
                                                : "border-border text-foreground/70 hover:border-brand-terracota hover:text-foreground"
                                        )}
                                    >
                                        {c}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>

                    <div className="relative w-full lg:w-72">
                        <Search
                            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                            aria-hidden
                        />
                        <input
                            value={termo}
                            onChange={(e) => setTermo(e.target.value)}
                            placeholder="Buscar no blog..."
                            aria-label="Buscar no blog"
                            className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-brand-terracota"
                        />
                    </div>
                </div>
            </section>

            {/* ---------- artigo em destaque ---------- */}
            {destaque ? (
                <section className="mx-auto w-full max-w-[1600px] px-6 pt-8">
                    <article className="grid gap-6 rounded-3xl border border-border bg-card p-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_auto] lg:items-center lg:gap-8 lg:p-5">
                        <Link
                            href={`/blog/${destaque.slug}`}
                            className="group relative block aspect-[900/640] overflow-hidden rounded-2xl bg-muted"
                        >
                            <Image
                                src={destaque.cover_url || "/blog/destaque.svg"}
                                alt={destaque.titulo}
                                fill
                                sizes="(max-width: 1024px) 100vw, 32vw"
                                unoptimized={!destaque.cover_url}
                                className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            />
                            {destaque.categoria && (
                                <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/80 backdrop-blur-sm">
                                    {destaque.categoria}
                                </span>
                            )}
                        </Link>

                        <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                                Artigo em destaque
                            </p>
                            <h2 className="mt-3 text-[clamp(1.5rem,2.2vw,2.1rem)] font-extrabold leading-[1.15] tracking-[-0.025em]">
                                <Link href={`/blog/${destaque.slug}`} className="hover:text-brand-terracota">
                                    {destaque.titulo}
                                </Link>
                            </h2>
                            {destaque.resumo && (
                                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                                    {destaque.resumo}
                                </p>
                            )}
                            <Meta post={destaque} className="mt-5" />
                        </div>

                        <div className="flex items-center gap-8">
                            <Link
                                href={`/blog/${destaque.slug}`}
                                aria-label={`Ler ${destaque.titulo}`}
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:border-brand-terracota hover:bg-brand-terracota hover:text-white"
                            >
                                <ArrowRight className="h-5 w-5" aria-hidden />
                            </Link>

                            <div aria-hidden className="hidden pr-2 xl:block">
                                <ul className="space-y-1.5">
                                    {["Territórios", "Ideias", "Pessoas", "Resultados"].map((e) => (
                                        <li
                                            key={e}
                                            className="text-[10px] font-medium uppercase leading-none tracking-[0.2em] text-muted-foreground"
                                        >
                                            {e}
                                        </li>
                                    ))}
                                </ul>
                                <span className="mt-3 block h-[2px] w-10 rounded-full bg-brand-coral" />
                                <p className="mt-3 text-[10px] font-medium uppercase leading-[1.9] tracking-[0.2em] text-muted-foreground">
                                    Do Norte
                                    <br />
                                    e Nordeste
                                    <br />
                                    para todo
                                    <br />o Brasil.
                                </p>
                            </div>
                        </div>
                    </article>
                </section>
            ) : null}

            {/* ---------- mais recentes ---------- */}
            <section className="mx-auto w-full max-w-[1600px] px-6 py-14 lg:py-16">
                <div className="flex items-center gap-6">
                    <h2 className="shrink-0 text-xl font-bold tracking-tight">Mais recentes</h2>
                    <span aria-hidden className="h-px flex-1 bg-border" />
                    <Link
                        href="/blog"
                        className="group hidden shrink-0 items-center gap-2 text-sm font-medium text-brand-terracota sm:inline-flex"
                    >
                        Ver todos os posts
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                </div>

                {filtrados.length === 0 ? (
                    <div className="mt-8 rounded-3xl border border-dashed border-border py-20 text-center text-muted-foreground">
                        {posts.length === 0
                            ? "Nenhum post publicado ainda."
                            : `Nenhum post em “${categoria}”${termo ? ` para “${termo}”` : ""} por enquanto.`}
                    </div>
                ) : (
                    <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                        {(recentes.length ? recentes : [destaque]).map((p, i) => (
                            <li key={p.slug}>
                                <Link
                                    href={`/blog/${p.slug}`}
                                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
                                >
                                    <span className="relative block aspect-[800/560] overflow-hidden bg-muted">
                                        <Image
                                            src={p.cover_url || CAPAS[i % CAPAS.length]}
                                            alt={p.titulo}
                                            fill
                                            sizes="(max-width: 640px) 92vw, (max-width: 1280px) 46vw, 22vw"
                                            unoptimized={!p.cover_url}
                                            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                                        />
                                        {p.categoria && (
                                            <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/80 backdrop-blur-sm">
                                                {p.categoria}
                                            </span>
                                        )}
                                    </span>

                                    <span className="flex min-w-0 flex-1 flex-col p-5">
                                        <span className="block font-bold leading-snug transition-colors group-hover:text-brand-terracota">
                                            {p.titulo}
                                        </span>
                                        {p.resumo && (
                                            <span className="mt-2 line-clamp-3 block text-[13px] leading-relaxed text-muted-foreground">
                                                {p.resumo}
                                            </span>
                                        )}
                                        <Meta post={p} className="mt-auto pt-4" />
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}

/** Data e tempo de leitura. O schema não guarda o nome do autor, só o id. */
function Meta({
    post,
    className,
}: {
    post: PostResumo & { minutos?: number }
    className?: string
}) {
    const data = formatarData(post.publicado_em)
    if (!data && !post.minutos) return null

    return (
        <span className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
            {data}
            {data && post.minutos ? <span aria-hidden>•</span> : null}
            {post.minutos ? `${post.minutos} min de leitura` : null}
        </span>
    )
}
