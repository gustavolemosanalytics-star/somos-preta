"use client"

/**
 * Elementos fixos da marca Somos Preta.
 */

/** Monograma da marca — círculo terracota com o "S". */
export function Monograma({ className = "h-9 w-9 text-base" }: { className?: string }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-terracota font-bold text-white ${className}`}
            aria-hidden
        >
            S
        </span>
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

/**
 * Assinatura da marca em duas linhas, com o traço em ângulo — o lockup usado
 * nas telas de conta e no cartão de Media Kit.
 */
export function LogoSomosPreta({ className }: { className?: string }) {
    return (
        <span className={`inline-flex items-end gap-1.5 ${className ?? ""}`}>
            <span className="text-[1.35em] font-bold leading-[0.95] tracking-[-0.02em]">
                Somos
                <br />
                Preta
            </span>
            <svg
                viewBox="0 0 24 20"
                fill="none"
                aria-hidden
                focusable="false"
                className="mb-[0.15em] h-[0.9em] w-auto shrink-0 text-brand-terracota"
            >
                <path
                    d="M2 2 22 10 2 18"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    )
}
