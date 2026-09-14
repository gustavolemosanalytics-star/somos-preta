import { createClient } from "@/lib/supabase/server"
import { publicarAgendados } from "@/lib/blog-agendados"
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

    await publicarAgendados(supabase)

    const publicados = () => supabase
        .from("somos_preta_blog_posts")
        .select("slug, titulo, resumo, cover_url, categoria, publicado_em, conteudo")
        .eq("status", "publicado")

    const [listagem, { data: categorias }] = await Promise.all([
        publicados()
            // Destaque primeiro: é assim que a redação escolhe o que abre o blog,
            // em vez de o topo ser sempre o post mais recente.
            .order("destaque", { ascending: false })
            .order("publicado_em", { ascending: false, nullsFirst: false }),
        supabase
            .from("somos_preta_blog_categorias")
            .select("nome")
            .order("ordem"),
    ])

    // Enquanto 0018_blog_editorial.sql não for aplicado, a coluna `destaque` não
    // existe e a consulta acima falha inteira. Sem este retorno, o blog ficaria
    // vazio na janela entre subir o código e rodar o SQL.
    const { data } = listagem.error
        ? await publicados().order("publicado_em", { ascending: false })
        : listagem

    const posts = (data ?? []).map(({ conteudo, ...p }) => ({
        ...(p as PostResumo),
        minutos: minutosDeLeitura(conteudo),
    }))

    return (
        <BlogPagina
            posts={posts}
            termoInicial={q}
            categorias={(categorias ?? []).map((c) => c.nome)}
        />
    )
}
