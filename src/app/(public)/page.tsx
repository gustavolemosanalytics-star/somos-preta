import { createClient } from "@/lib/supabase/server"
import { publicarAgendados } from "@/lib/blog-agendados"
import { Hero } from "@/components/public/hero"
import { QuemSomos } from "@/components/public/quem-somos"
import { BlogConteudo, type PostResumo } from "@/components/public/blog-hero"
import { EngajamentoDobra } from "@/components/public/engajamento-dobra"
import { MediaKitDobra } from "@/components/public/media-kit-dobra"

export const revalidate = 60

export default async function HomePage() {
    // A terceira dobra é a vitrine de conteúdo, alimentada pelos posts publicados.
    const supabase = await createClient()

    await publicarAgendados(supabase)

    const publicados = () => supabase
        .from("somos_preta_blog_posts")
        .select("slug, titulo, resumo, cover_url, categoria, publicado_em")
        .eq("status", "publicado")

    const [listagem, { data: categorias }] = await Promise.all([
        publicados()
            .order("destaque", { ascending: false })
            .order("publicado_em", { ascending: false, nullsFirst: false }),
        supabase
            .from("somos_preta_blog_categorias")
            .select("nome")
            .order("ordem"),
    ])

    // Sem 0018_blog_editorial.sql aplicado não existe coluna `destaque`, e a
    // consulta falha por inteiro — a vitrine da home não pode depender disso.
    const { data } = listagem.error
        ? await publicados().order("publicado_em", { ascending: false })
        : listagem

    return (
        <div className="flex flex-col">
            <Hero />
            <QuemSomos />
            <MediaKitDobra />
            <BlogConteudo
                posts={(data ?? []) as PostResumo[]}
                mostrarListagem={false}
                categorias={(categorias ?? []).map((c) => c.nome)}
            />
            <EngajamentoDobra />
        </div>
    )
}
