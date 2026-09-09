/**
 * Silhueta do Norte + Nordeste, usada como marca d'água nas dobras.
 * Preenchida (não traçada) e herdando `currentColor`, para o consumidor
 * escolher o tom com uma classe `text-*`.
 */
export function MapaTerritorio({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 300 420"
            fill="none"
            aria-hidden
            focusable="false"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fill="currentColor"
                d="M96 8c14-6 26 2 33 14 6 10 4 22 12 30 9 9 24 8 34 16 11 9 14 24 24 34 12 12 30 16 40 30 9 13 8 30 4 45-4 16-13 30-16 46-3 15 1 31-3 46-4 17-16 31-21 48-4 15-3 31-9 45-6 15-20 25-36 27-14 2-28-4-38-14-11-11-16-26-26-38-11-13-27-21-35-36-8-14-8-31-14-46-6-16-18-29-21-46-3-15 3-30 4-45 1-16-3-32 3-46 6-15 21-24 30-37 8-12 11-27 21-38C89 34 82 20 88 12c2-2 5-3 8-4Z"
            />
        </svg>
    )
}
