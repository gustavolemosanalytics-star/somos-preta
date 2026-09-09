"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Elementos fixos da marca.
 */

/**
 * Logo oficial da marca — o wordmark "PRETA".
 *
 * A arte é preta e vem de PNG com transparência, então herda o fundo. Em
 * superfícies escuras use `invertida` para a versão em off-white.
 */
export function LogoPreta({
    className,
    invertida = false,
}: {
    className?: string
    invertida?: boolean
}) {
    return (
        <Image
            src="/marca/preta-wordmark.png"
            alt="Preta"
            width={930}
            height={200}
            priority
            className={cn("h-7 w-auto", invertida && "invert", className)}
        />
    )
}

/**
 * Símbolo compacto — o "P" com a onda, para espaços quadrados onde o wordmark
 * não cabe (sidebar recolhido, avatar da marca).
 */
export function SimboloPreta({
    className,
    invertida = false,
}: {
    className?: string
    invertida?: boolean
}) {
    return (
        <Image
            src="/marca/preta-simbolo.png"
            alt="Preta"
            width={256}
            height={256}
            className={cn("h-8 w-8 shrink-0 object-contain", invertida && "invert", className)}
        />
    )
}

/**
 * Símbolo do território: curvas de nível aninhadas, o desenho de um relevo
 * visto de cima. Acompanha a assinatura "Norte & Nordeste".
 */
export function SimboloTerritorio({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 64 48"
            fill="none"
            aria-hidden
            focusable="false"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 16c5-7 11-9 17-5 4 3 6 8 11 8s7-6 12-6 9 4 12 9" />
                <path d="M7 22c4-6 9-7 14-3 4 3 6 7 11 7s7-5 11-5 8 3 11 7" />
                <path d="M11 28c3-4 7-5 11-2 3 3 5 6 10 6s6-4 10-4 7 3 9 6" />
                <path d="M16 34c2-3 5-4 8-1 2 2 4 4 8 4s5-3 8-3 5 2 7 4" />
                <path d="M22 40c2-2 4-2 6 0 2 1 3 3 6 3s4-2 6-2" />
            </g>
        </svg>
    )
}
