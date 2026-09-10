import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { MapaTerritorio } from "@/components/public/mapa-territorio"

export const revalidate = 60

/** Capas de reserva, para post sem imagem própria não abrir com um vazio. */
const CAPAS = ["/blog/post-1.svg", "/blog/post-2.svg", "/blog/post-3.svg", "/blog/post-4.svg"]

/** ~200 palavras por minuto, arredondado para cima. */
function minutosDeLeitura(conteudo: string | null) {
    if (!conteudo) return null
    return Math.max(1, Math.ceil(conteudo.trim().split(/\s+/).length / 200))
}

function formatarData(iso: string | null) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    })
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()
    const { data } = await supabase
        .from("somos_preta_blog_posts")
        .select("titulo, resumo, cover_url")
        .eq("slug", slug)
        .eq("status", "publicado")
        .maybeSingle()

    if (!data) return { title: "Post não encontrado — Somos Preta" }

    return {
        title: `${data.titulo} — Somos Preta`,
        description: data.resumo ?? undefined,
        openGraph: {
            title: data.titulo,
            description: data.resumo ?? undefined,
            images: data.cover_url ? [data.cover_url] : undefined,
        },
    }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: post } = await supabase
        .from("somos_preta_blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .maybeSingle()

    if (!post) notFound()

    // Sugestões do fim do texto: mesma categoria primeiro, sem repetir o atual.
    const { data: relacionados } = await supabase
        .from("somos_preta_blog_posts")
        .select("slug, titulo, resumo, cover_url, categoria")
        .eq("status", "publicado")
        .neq("slug", slug)
        .order("publicado_em", { ascending: false })
        .limit(3)

    const data = formatarData(post.publicado_em)
    const minutos = minutosDeLeitura(post.conteudo)
    const capa = post.cover_url || CAPAS[0]

    return (
        <div className="flex flex-col">
            {/* ---------- abertura ---------- */}
            <header className="mx-auto w-full max-w-[1600px] px-6 pt-10 lg:pt-12">
                <Link
                    href="/blog"
                    className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden />
                    Voltar para o blog
                </Link>

                <div className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div>
                        {post.categoria && (
                            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-brand-coral">
                                {post.categoria}
                            </p>
                        )}

                        <h1 className="mt-5 max-w-2xl text-[clamp(2rem,3.6vw,3.4rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
                            {post.titulo}
                        </h1>

                        {post.resumo && (
                            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                                {post.resumo}
                            </p>
                        )}

                        <p className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                            {data}
                            {data && minutos ? <span aria-hidden>•</span> : null}
                            {minutos ? `${minutos} min de leitura` : null}
                        </p>
                    </div>

                    <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-muted">
                        <Image
                            src={capa}
                            alt={post.titulo}
                            fill
                            priority
                            sizes="(max-width: 1024px) 100vw, 48vw"
                            unoptimized={capa.endsWith(".svg")}
                            className="object-cover"
                        />
                    </div>
                </div>
            </header>

            {/* ---------- corpo ---------- */}
            <article className="mx-auto w-full max-w-[46rem] px-6 py-14 lg:py-16">
                <div className="whitespace-pre-wrap text-[17px] leading-[1.75] text-foreground/90">
                    {post.conteudo}
                </div>

                <div className="mt-14 flex items-center gap-5 border-t border-border pt-8">
                    <MapaTerritorio aria-hidden className="h-12 w-auto shrink-0 text-brand-areia" />
                    <p className="text-[11px] font-medium uppercase leading-[1.8] tracking-[0.2em] text-muted-foreground">
                        Do Norte e Nordeste
                        <br />
                        para todo o Brasil.
                    </p>
                </div>
            </article>

            {/* ---------- leia também ---------- */}
            {relacionados && relacionados.length > 0 && (
                <section className="border-t border-border">
                    <div className="mx-auto w-full max-w-[1600px] px-6 py-14 lg:py-16">
                        <div className="flex items-center gap-6">
                            <h2 className="shrink-0 text-xl font-bold tracking-tight">Leia também</h2>
                            <span aria-hidden className="h-px flex-1 bg-border" />
                            <Link
                                href="/blog"
                                className="group hidden shrink-0 items-center gap-2 text-sm font-medium text-brand-terracota sm:inline-flex"
                            >
                                Ver todos os posts
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                            </Link>
                        </div>

                        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {relacionados.map((p, i) => (
                                <li key={p.slug}>
                                    <Link
                                        href={`/blog/${p.slug}`}
                                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
                                    >
                                        <span className="relative block aspect-[800/560] overflow-hidden bg-muted">
                                            <Image
                                                src={p.cover_url || CAPAS[(i + 1) % CAPAS.length]}
                                                alt={p.titulo}
                                                fill
                                                sizes="(max-width: 640px) 92vw, 30vw"
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
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>
            )}
        </div>
    )
}
