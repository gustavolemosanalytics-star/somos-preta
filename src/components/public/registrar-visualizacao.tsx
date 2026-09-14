"use client"

import { useEffect, useRef } from "react"

import { createClient } from "@/lib/supabase/client"

/**
 * Conta uma visualização do post no banco.
 *
 * Precisa ser client component: a página do post é estática (revalidate de 60s),
 * então contar no servidor registraria uma visita por regeneração de cache, não
 * por leitor. A gravação passa por RPC security definer — a policy do blog não
 * dá escrita a visitante nenhum.
 *
 * Não renderiza nada e não bloqueia a leitura: se a chamada falhar, o post
 * continua de pé e só a métrica se perde.
 */
export function RegistrarVisualizacao({ slug }: { slug: string }) {
    const jaContou = useRef(false)

    useEffect(() => {
        // O StrictMode monta o efeito duas vezes em desenvolvimento; sem a trava
        // cada leitura valeria por duas.
        if (jaContou.current) return
        jaContou.current = true

        createClient()
            .rpc("somos_preta_blog_registrar_visualizacao", { p_slug: slug })
            .then(() => undefined, () => undefined)
    }, [slug])

    return null
}
