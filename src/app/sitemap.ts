import type { MetadataRoute } from "next"

import { createClient } from "@/lib/supabase/server"
import { publicarAgendados } from "@/lib/blog-agendados"
import { SITE_URL } from "@/lib/constants/site"

export const revalidate = 3600

/** Só o que é público: landing, blog, posts publicados e os media kits no ar. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient()

    // Um post que acabou de vencer o agendamento precisa entrar no sitemap na
    // mesma passada, senão fica fora do índice até a próxima geração.
    await publicarAgendados(supabase)

    const [{ data: posts }, { data: kits }] = await Promise.all([
        supabase
            .from("somos_preta_blog_posts")
            .select("slug, updated_at")
            .eq("status", "publicado"),
        // A tabela é fechada para o anônimo desde 0002_hardening_rls.sql, e o
        // sitemap roda sem sessão: consultá-la direto devolvia zero linhas, sem
        // erro, e nenhum media kit jamais entrou no índice. A view pública é o
        // caminho autorizado — e já filtra publicado = true.
        supabase
            .from("somos_preta_midia_kits_publicos")
            .select("slug, updated_at"),
    ])

    const fixas: MetadataRoute.Sitemap = [
        { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
        { url: `${SITE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
        { url: `${SITE_URL}/engajamento`, changeFrequency: "monthly", priority: 0.6 },
    ]

    return [
        ...fixas,
        ...(posts ?? []).map((p) => ({
            url: `${SITE_URL}/blog/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })),
        ...(kits ?? []).map((k) => ({
            url: `${SITE_URL}/kit/${k.slug}`,
            lastModified: k.updated_at ? new Date(k.updated_at) : undefined,
            changeFrequency: "monthly" as const,
            priority: 0.5,
        })),
    ]
}
