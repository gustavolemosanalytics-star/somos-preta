"use server"

import { revalidatePath } from "next/cache"

/**
 * Invalida o cache das rotas que mostram posts.
 *
 * Hoje é uma rede de segurança, não o que mantém o site atualizado: as rotas
 * públicas leem cookies (exigência do cliente Supabase no servidor), o que as
 * torna dinâmicas — o `revalidate` declarado nelas não vale e cada visita já
 * renderiza do zero. Quando essas rotas passarem a usar um cliente anônimo sem
 * cookies e voltarem a ser ISR, é esta chamada que vai evitar que o editor
 * publique e não veja a mudança.
 *
 * Em ação em massa, chame UMA vez ao final — não uma vez por post.
 */
export async function revalidarBlog(slug?: string) {
    revalidatePath("/blog")
    revalidatePath("/")
    revalidatePath("/sitemap.xml")
    if (slug) revalidatePath(`/blog/${slug}`)
}
