import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export const revalidate = 60

export default async function BlogPage() {
    const supabase = await createClient()
    const { data } = await supabase
        .from("somos_preta_blog_posts")
        .select("slug, titulo, resumo, cover_url, categoria, publicado_em")
        .eq("status", "publicado")
        .order("publicado_em", { ascending: false })

    const posts = data ?? []

    return (
        <div className="container mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-3xl mb-14">
                <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Blog</h1>
                <p className="text-muted-foreground text-lg mt-3">Conteúdo sobre creators, marcas e o mercado de influência regional.</p>
            </div>

            {posts.length === 0 ? (
                <div className="border border-dashed border-border rounded-3xl py-20 text-center text-muted-foreground">
                    Nenhum post publicado ainda.
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((p) => (
                        <Link key={p.slug} href={`/blog/${p.slug}`} className="group block">
                            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-muted mb-4 border border-border/60">
                                {p.cover_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.cover_url} alt={p.titulo} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-primary/10 to-muted" />
                                )}
                            </div>
                            {p.categoria && <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1.5">{p.categoria}</p>}
                            <h2 className="text-lg font-semibold leading-snug group-hover:text-primary transition-colors">{p.titulo}</h2>
                            {p.resumo && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.resumo}</p>}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
