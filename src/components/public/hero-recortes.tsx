/**
 * Recortes gráficos da colagem da hero — os elementos que não são foto.
 * Todos herdam cor via `currentColor` para acompanharem os tokens da marca.
 */

/** Leque de folhas de palmeira, o acento gráfico do alto da colagem. */
export function PalmaRecorte({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 200 260"
            fill="none"
            aria-hidden
            focusable="false"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <g fill="currentColor">
                {/* folhas irradiando de um ponto na base, em leque */}
                {[-62, -44, -26, -9, 9, 26, 44, 62].map((angulo, i) => (
                    <path
                        key={angulo}
                        transform={`rotate(${angulo} 100 250)`}
                        d={`M100 250 C ${94 - (i % 3)} 180, ${92 - i} 120, 100 ${34 + (i % 4) * 7} C ${108 + i} 120, ${106 + (i % 3)} 180, 100 250 Z`}
                    />
                ))}
                <path d="M96 252h8v8h-8z" />
            </g>
        </svg>
    )
}

/** Silhueta de palmeira — vai recortada sobre um retângulo de papel coral. */
export function PalmeiraRecorte({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 220 260"
            fill="none"
            aria-hidden
            focusable="false"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <g fill="currentColor">
                {/* tronco levemente curvo */}
                <path d="M104 258c2-58 6-104 12-140l12 2c-8 38-12 82-12 138h-12Z" />
                {/* copa */}
                <path d="M118 118c-26-30-58-40-88-30 24-4 48 2 66 18-14-32-8-62 12-84-8 28-4 54 12 74 6-34 28-56 62-64-28 14-44 36-48 66 22-22 50-30 82-22-34 4-58 20-72 46 26-8 50-2 70 18-24-12-48-12-72 2l-24-24Z" />
            </g>
        </svg>
    )
}

/** Faixas onduladas — o recorte de papel listrado do pé da colagem. */
export function OndasRecorte({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 320 130"
            fill="none"
            aria-hidden
            focusable="false"
            preserveAspectRatio="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <g stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none">
                {[16, 38, 60, 82, 104].map((y) => (
                    <path
                        key={y}
                        d={`M-10 ${y} C 50 ${y - 16}, 90 ${y + 16}, 150 ${y} S 270 ${y - 16}, 330 ${y}`}
                    />
                ))}
            </g>
        </svg>
    )
}
