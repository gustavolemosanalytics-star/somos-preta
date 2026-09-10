"use server"

import { revalidatePath } from "next/cache"

/**
 * Limpa o cache das páginas que listam posts.
 *
 * O blog e a home são estáticos com revalidate de 60s, então sem isto o editor
 * publica e não vê a mudança por até um minuto — o que parece falha. O admin
 * chama esta action depois de criar, editar, publicar ou excluir.
 */
export async function revalidarBlog(slug?: string) {
    revalidatePath("/blog")
    revalidatePath("/")
    if (slug) revalidatePath(`/blog/${slug}`)
}
