"use client"

import { useEffect, useRef } from "react"
import { MessageCircle } from "lucide-react"

import { registrarEventoDoKit, primeiraVezNaSessao } from "@/lib/metricas-kit"

/**
 * Conta uma visualização da página pública do kit.
 *
 * Roda no cliente, e não no servidor, de propósito: contar no render do
 * servidor somaria cada prefetch do Next, cada passada de robô e cada geração
 * de prévia de link — e o número que a criadora vê como "marcas que abriram
 * meu kit" seria, na maior parte, máquina.
 */
export function ContarVisualizacao({ slug }: { slug: string }) {
    const jaContou = useRef(false)

    useEffect(() => {
        if (jaContou.current) return
        jaContou.current = true
        if (!primeiraVezNaSessao(`kit-visto:${slug}`)) return
        void registrarEventoDoKit(slug, "visualizacao")
    }, [slug])

    return null
}

/**
 * O botão de WhatsApp da página pública.
 *
 * É o único CTA do kit, então é o clique que de fato importa medir: dizer
 * "148 pessoas viram" é bem menos útil que "22 quiseram te chamar".
 *
 * O registro não segura a navegação. Esperar a resposta do banco para só então
 * abrir o WhatsApp colocaria a nossa métrica na frente da conversa da marca
 * com a criadora, e num 3G ruim isso é meio segundo de nada acontecendo depois
 * do toque.
 */
export function BotaoWhatsapp({
    slug,
    numero,
    className,
}: {
    slug: string
    numero: string
    className?: string
}) {
    return (
        <a
            href={`https://wa.me/${numero}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void registrarEventoDoKit(slug, "clique_contato")}
            className={className}
        >
            <MessageCircle className="h-5 w-5" aria-hidden /> Falar no WhatsApp
        </a>
    )
}
