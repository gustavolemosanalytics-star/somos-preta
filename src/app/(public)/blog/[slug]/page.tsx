import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"

export const revalidate = 60

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

    const data = post.publicado_em
        ? new Date(post.publicado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
        : null

    return (
        <article className="container mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-2xl mx-auto">
                <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
                    <ArrowLeft className="h-4 w-4" /> Blog
                </Link>

                {post.categoria && <p className="text-xs font-medium text-primary uppercase tracking-wide mb-3">{post.categoria}</p>}
                <h1 className="text-3xl md:text-5xl font-semibold tracking-tight leading-[1.1]">{post.titulo}</h1>
                {data && <p className="text-sm text-muted-foreground mt-4">{data}</p>}

                {post.cover_url && (
                    <div className="aspect-[16/9] rounded-3xl overflow-hidden bg-muted my-10 border border-border/60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.cover_url} alt={post.titulo} className="h-full w-full object-cover" />
                    </div>
                )}

                {post.resumo && <p className="text-xl text-muted-foreground leading-relaxed mt-8">{post.resumo}</p>}

                <div className="prose prose-neutral dark:prose-invert max-w-none mt-8 text-[17px] leading-relaxed whitespace-pre-wrap">
                    {post.conteudo}
                </div>
            </div>
        </article>
    )
}
