import type { Formatos, PontoAlcance, PontoHistorico, TipoPost } from "@/lib/instagram/tipos"

/**
 * Gráficos da vitrine em SVG puro, desenhados no servidor.
 *
 * Uma biblioteca de gráficos aqui custaria dezenas de KB de JavaScript a quem
 * só quer ver três números no celular, e não acrescentaria nada: nenhum destes
 * gráficos é interativo. Também saem perfeitos no PDF.
 */

/** Curva de seguidores com área preenchida. `id` precisa ser único na página. */
export function CurvaDeSeguidores({
    pontos,
    id,
    cor = "var(--kit-acento)",
    className,
}: {
    pontos: PontoHistorico[]
    id: string
    cor?: string
    className?: string
}) {
    if (pontos.length < 2) return null

    const valores = pontos.map((p) => p.seguidores)
    const min = Math.min(...valores)
    const max = Math.max(...valores)
    // Sem variação a curva seria uma linha colada no chão; centraliza.
    const faixa = max - min || Math.max(1, max * 0.02)
    const base = max - min ? min : min - faixa / 2

    const largura = 100
    const altura = 40
    const coords = valores.map((v, i) => {
        const x = (i / (valores.length - 1)) * largura
        const y = altura - 4 - ((v - base) / faixa) * (altura - 10)
        return [x, y] as const
    })

    // Curva suave (Catmull-Rom → Bézier): linha quebrada lê como "dado ruim".
    let caminho = `M ${coords[0][0]},${coords[0][1]}`
    for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i - 1] ?? coords[i]
        const p1 = coords[i]
        const p2 = coords[i + 1]
        const p3 = coords[i + 2] ?? p2
        const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
        const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
        caminho += ` C ${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
    }
    const area = `${caminho} L ${largura},${altura} L 0,${altura} Z`
    const ultimo = coords[coords.length - 1]

    return (
        <svg viewBox={`0 0 ${largura} ${altura}`} preserveAspectRatio="none" className={className} aria-hidden>
            <defs>
                <linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={cor} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={cor} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${id}-area)`} />
            <path d={caminho} fill="none" stroke={cor} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
            <circle cx={ultimo[0]} cy={ultimo[1]} r="1.6" fill={cor} />
        </svg>
    )
}

/** Alcance diário em barrinhas — dia a dia, sem pretensão de precisão. */
export function CurvaDeAlcance({ pontos, className }: { pontos: PontoAlcance[]; id?: string; className?: string }) {
    if (pontos.length < 2) return null
    const topo = Math.max(1, ...pontos.map((p) => p.alcance))
    const largura = 100 / pontos.length
    return (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
            {pontos.map((p, i) => {
                const h = Math.max(1.5, (p.alcance / topo) * 30)
                return (
                    <rect
                        key={p.data}
                        x={i * largura + largura * 0.15}
                        y={30 - h}
                        width={largura * 0.7}
                        height={h}
                        rx="0.6"
                        fill="var(--kit-acento)"
                        fillOpacity={i === pontos.length - 1 ? 1 : 0.45}
                    />
                )
            })}
        </svg>
    )
}

/** Medidor circular de engajamento. A escala vai até 10%: acima disso, anel cheio. */
export function MedidorCircular({ valor, teto = 10, className }: { valor: number; teto?: number; className?: string }) {
    const raio = 42
    const circunferencia = 2 * Math.PI * raio
    const fracao = Math.max(0, Math.min(1, valor / teto))

    return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden>
            <circle cx="50" cy="50" r={raio} fill="none" stroke="var(--kit-linha)" strokeWidth="8" />
            <circle
                cx="50"
                cy="50"
                r={raio}
                fill="none"
                stroke="var(--kit-acento)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${circunferencia * fracao} ${circunferencia}`}
                transform="rotate(-90 50 50)"
            />
        </svg>
    )
}

export const ROTULO_DO_FORMATO: Record<TipoPost, string> = {
    reel: "Reels",
    carrossel: "Carrossel",
    foto: "Foto",
    video: "Vídeo",
}

const COR_DO_FORMATO: Record<TipoPost, string> = {
    reel: "var(--kit-acento)",
    carrossel: "var(--kit-acento2)",
    foto: "var(--kit-tinta)",
    video: "var(--kit-suave)",
}

/** Barra empilhada com a mistura de formatos, maior primeiro. */
export function BarraDeFormatos({ formatos }: { formatos: Formatos }) {
    const itens = (Object.entries(formatos) as [TipoPost, number][])
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
    if (itens.length === 0) return null

    return (
        <div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-kit-linha">
                {itens.map(([tipo, v]) => (
                    <span key={tipo} style={{ width: `${v}%`, backgroundColor: COR_DO_FORMATO[tipo] }} className="h-full first:rounded-l-full last:rounded-r-full" />
                ))}
            </div>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {itens.map(([tipo, v]) => (
                    <li key={tipo} className="flex items-center gap-2">
                        <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_DO_FORMATO[tipo] }} />
                        <span className="text-kit-suave">{ROTULO_DO_FORMATO[tipo]}</span>
                        <span className="font-semibold tabular-nums">{v}%</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

/**
 * Selo circular com texto girando em volta — o carimbo do canto da foto.
 * `texto` deve ter ~40 caracteres para fechar a volta sem buraco.
 */
export function SeloGiratorio({ texto, className }: { texto: string; className?: string }) {
    return (
        <svg viewBox="0 0 120 120" className={className} aria-hidden>
            <defs>
                <path id="kit-selo-caminho" d="M 60,60 m -44,0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0" />
            </defs>
            <circle cx="60" cy="60" r="58" fill="var(--kit-botao)" />
            <g className="kit-anima-girar origin-center [transform-box:fill-box]">
                <text fill="var(--kit-sobre-botao)" fontSize="11.5" fontWeight="700" letterSpacing="2.6">
                    <textPath href="#kit-selo-caminho">{texto.toUpperCase()}</textPath>
                </text>
            </g>
            <path
                d="M60 44 l4.2 11.8 11.8 4.2 -11.8 4.2 -4.2 11.8 -4.2 -11.8 -11.8 -4.2 11.8 -4.2 z"
                fill="var(--kit-sobre-botao)"
            />
        </svg>
    )
}
