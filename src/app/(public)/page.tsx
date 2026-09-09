import { createClient } from "@/lib/supabase/server"
import { Hero } from "@/components/public/hero"
import { QuemSomos } from "@/components/public/quem-somos"
import { BlogConteudo, type PostResumo } from "@/components/public/blog-hero"
import { MediaKitDobra } from "@/components/public/media-kit-dobra"

export const revalidate = 60

export default async function HomePage() {
    // A terceira dobra é a vitrine de conteúdo, alimentada pelos posts publicados.
    const supabase = await createClient()
    const { data } = await supabase
        .from("somos_preta_blog_posts")
        .select("slug, titulo, resumo, cover_url, categoria, publicado_em")
        .eq("status", "publicado")
        .order("publicado_em", { ascending: false })

    return (
        <div className="flex flex-col">
            <Hero />
            <QuemSomos />
            <MediaKitDobra />
            <BlogConteudo posts={(data ?? []) as PostResumo[]} mostrarListagem={false} />
        </div>
    )
}
