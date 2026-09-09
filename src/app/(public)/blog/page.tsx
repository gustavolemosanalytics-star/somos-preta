import { createClient } from "@/lib/supabase/server"
import { BlogPagina } from "@/components/public/blog-pagina"
import type { PostResumo } from "@/components/public/blog-hero"

export const revalidate = 60

/** ~200 palavras por minuto, arredondado para cima. */
function minutosDeLeitura(conteudo: string | null) {
    if (!conteudo) return undefined
    const palavras = conteudo.trim().split(/\s+/).length
    return Math.max(1, Math.ceil(palavras / 200))
}

export default async function BlogPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>
}) {
    const { q } = await searchParams
    const supabase = await createClient()
    const { data } = await supabase
        .from("somos_preta_blog_posts")
        .select("slug, titulo, resumo, cover_url, categoria, publicado_em, conteudo")
        .eq("status", "publicado")
        .order("publicado_em", { ascending: false })

    const posts = (data ?? []).map(({ conteudo, ...p }) => ({
        ...(p as PostResumo),
        minutos: minutosDeLeitura(conteudo),
    }))

    return <BlogPagina posts={posts} termoInicial={q} />
}
