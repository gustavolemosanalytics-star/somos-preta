"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowDownRight, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Masonry, type MasonryItem } from "./masonry"

/**
 * Dobra de abertura do blog: título, filtro por categoria e a grade masonry
 * alimentada pelas capas dos posts publicados.
 */

export type PostResumo = {
    slug: string
    titulo: string
    resumo: string | null
    cover_url: string | null
    categoria: string | null
    publicado_em: string | null
}

const CATEGORIAS = ["Todos", "Creators", "Marcas", "Mercado", "Norte e Nordeste", "Cases", "Dicas"]

const EIXOS = ["Ideias", "Estratégias", "Cases", "Pessoas", "Tendências"]

/** Capas de reserva para posts ainda sem imagem própria. */
const CAPAS_RESERVA = [
    "/hero/criadora-principal.webp",
    "/quem-somos/territorio.webp",
    "/hero/criador-chapeu.webp",
    "/quem-somos/cultura.webp",
    "/hero/paisagem-falesias.webp",
    "/quem-somos/talento.webp",
    "/hero/criadora-cacheada.webp",
    "/quem-somos/oportunidades.webp",
]

/**
 * A vitrine é uma faixa de abertura, não a listagem: mantém no mínimo 5 células
 * mesmo com poucos posts e no máximo 8 para não empurrar o resto da página.
 */
const MIN_VITRINE = 5
const MAX_VITRINE = 8

/** Alturas alternadas — o masonry usa metade do valor e precisa de variação. */
const ALTURAS = [400, 300, 460, 330, 420, 350]

export function BlogConteudo({
    posts,
    termoBusca,
    /** Na home a dobra é só vitrine; a listagem completa vive em /blog. */
    mostrarListagem = true,
}: {
    posts: PostResumo[]
    termoBusca?: string
    mostrarListagem?: boolean
}) {
    const [categoria, setCategoria] = useState("Todos")

    const filtrados = useMemo(() => {
        let r = posts
        if (categoria !== "Todos") {
            r = r.filter((p) => p.categoria?.toLowerCase() === categoria.toLowerCase())
        }
        if (termoBusca) {
            const q = termoBusca.toLowerCase()
            r = r.filter(
                (p) =>
                    p.titulo.toLowerCase().includes(q) ||
                    p.resumo?.toLowerCase().includes(q) ||
                    p.categoria?.toLowerCase().includes(q)
            )
        }
        return r
    }, [posts, categoria, termoBusca])

    // A dobra é uma vitrine: com poucos posts publicados a grade ficaria com
    // buracos, então o que faltar para MIN_VITRINE é completado por capas
    // decorativas, que apenas levam de volta à listagem.
    const items: MasonryItem[] = useMemo(() => {
        const doPost: MasonryItem[] = filtrados.map((p, i) => ({
            id: p.slug,
            img: p.cover_url || CAPAS_RESERVA[i % CAPAS_RESERVA.length],
            url: `/blog/${p.slug}`,
            height: ALTURAS[i % ALTURAS.length],
            alt: p.titulo,
            legenda: p.categoria || undefined,
        }))

        const faltam = Math.max(0, MIN_VITRINE - doPost.length)
        const decorativas: MasonryItem[] = Array.from({ length: faltam }, (_, i) => {
            const j = (doPost.length + i) % CAPAS_RESERVA.length
            return {
                id: `vitrine-${i}`,
                img: CAPAS_RESERVA[j],
                url: "/blog",
                height: ALTURAS[(doPost.length + i) % ALTURAS.length],
                alt: "Território e criadores do Norte e Nordeste",
            }
        })

        return [...doPost, ...decorativas].slice(0, MAX_VITRINE)
    }, [filtrados])

    return (
        <section id="conteudos" className="scroll-mt-24 border-t border-border bg-background">
            <div className="mx-auto max-w-[1600px] px-6 py-14 lg:py-16">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12">
                    {/* ---------- texto e filtros ---------- */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-brand-coral">
                            Conteúdo que conecta
                        </p>

                        <h1 className="mt-4 text-[clamp(3rem,5.5vw,5rem)] font-extrabold leading-[1] tracking-[-0.035em]">
                            Blog
                        </h1>

                        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted-foreground">
                            Conteúdo sobre creators, marcas e o mercado de influência regional.
                        </p>

                        <ul className="mt-8 flex flex-wrap gap-2.5">
                            {CATEGORIAS.map((c) => {
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

                        {termoBusca && (
                            <p className="mt-6 text-sm text-muted-foreground">
                                Resultados para <span className="font-medium text-foreground">“{termoBusca}”</span>{" "}
                                — {filtrados.length} {filtrados.length === 1 ? "post" : "posts"}.{" "}
                                <Link href="/blog" className="text-brand-terracota underline-offset-4 hover:underline">
                                    limpar
                                </Link>
                            </p>
                        )}
                    </motion.div>

                    {/* ---------- grade + assinatura ---------- */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="flex gap-5"
                    >
                        <Masonry items={items} className="min-w-0 flex-1" />

                        <div className="hidden w-[12rem] shrink-0 flex-col gap-5 self-start md:flex">
                            <div className="flex aspect-[4/5] flex-col justify-between rounded-xl bg-brand-terracota p-5">
                                <p className="font-manuscrita text-[clamp(1.2rem,1.5vw,1.6rem)] leading-[1.25] text-white">
                                    Do Norte e Nordeste para todo o Brasil.
                                </p>
                                <ArrowDownRight className="h-7 w-7 text-white" aria-hidden />
                            </div>

                            <ul className="space-y-2">
                                {EIXOS.map((e) => (
                                    <li
                                        key={e}
                                        className="text-[11px] font-medium uppercase leading-none tracking-[0.2em] text-muted-foreground"
                                    >
                                        {e}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ---------- listagem, sob o mesmo filtro ---------- */}
            {!mostrarListagem ? (
                <div className="mx-auto w-full max-w-[1600px] px-6 pb-16 lg:pb-20">
                    <Link
                        href="/blog"
                        className="group inline-flex h-13 items-center gap-3 rounded-full border border-border px-7 text-base font-semibold transition-colors hover:border-brand-terracota hover:bg-accent"
                    >
                        Ver todos os conteúdos
                        <ArrowRight
                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                            aria-hidden
                        />
                    </Link>
                </div>
            ) : (
            <div className="mx-auto w-full max-w-[1600px] px-6 pb-16 lg:pb-20">
                {filtrados.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border py-20 text-center text-muted-foreground">
                        {posts.length === 0
                            ? "Nenhum post publicado ainda."
                            : `Nenhum post em “${categoria}”${termoBusca ? ` para “${termoBusca}”` : ""} por enquanto.`}
                    </div>
                ) : (
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filtrados.map((p) => (
                            <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
                                <div className="mb-4 aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-muted">
                                    {p.cover_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={p.cover_url}
                                            alt={p.titulo}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-brand-terracota/10 to-muted" />
                                    )}
                                </div>
                                {p.categoria && (
                                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-brand-terracota">
                                        {p.categoria}
                                    </p>
                                )}
                                <h2 className="text-lg font-semibold leading-snug transition-colors group-hover:text-brand-terracota">
                                    {p.titulo}
                                </h2>
                                {p.resumo && (
                                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.resumo}</p>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            )}
        </section>
    )
}
