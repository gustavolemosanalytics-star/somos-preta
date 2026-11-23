import { cn } from "@/lib/utils"
import type { ChaveGrafismo } from "@/lib/constants/media-kit"

/**
 * A camada decorativa atrás do topo e do convite final da vitrine.
 *
 * Tudo aria-hidden e sem clique: é ambiente, não conteúdo. As cores vêm das
 * variáveis da paleta, então o mesmo grafismo funciona no Terracota claro e no
 * Ouro escuro sem uma linha a mais.
 *
 * `intensidade="suave"` é para fundos de cor (o convite de contato), onde o
 * grafismo precisa sussurrar para o texto continuar legível.
 */
export function Grafismo({
    tipo,
    intensidade = "normal",
    className,
}: {
    tipo: ChaveGrafismo
    intensidade?: "normal" | "suave"
    className?: string
}) {
    if (tipo === "liso") return null
    const suave = intensidade === "suave"

    return (
        <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
            {tipo === "aurora" && (
                <>
                    <span
                        className={cn(
                            "kit-anima-deriva absolute -left-[20%] -top-[30%] h-[85%] w-[70%] rounded-full blur-[80px]",
                            suave ? "bg-kit-sobre-botao/15" : "bg-kit-acento/40",
                        )}
                    />
                    <span
                        className={cn(
                            "kit-anima-deriva-lenta absolute -right-[15%] top-[5%] h-[75%] w-[60%] rounded-full blur-[90px]",
                            suave ? "bg-kit-sobre-botao/10" : "bg-kit-acento2/35",
                        )}
                    />
                    <span
                        className={cn(
                            "kit-anima-deriva absolute bottom-[-35%] left-[30%] h-[60%] w-[45%] rounded-full blur-[80px] [animation-delay:-9s]",
                            suave ? "bg-kit-sobre-botao/10" : "bg-kit-acento/25",
                        )}
                    />
                    <span className="kit-grao absolute inset-0" />
                </>
            )}

            {tipo === "aneis" && (
                <svg
                    viewBox="0 0 600 600"
                    className="absolute -right-[18%] -top-[22%] h-[140%] max-h-[900px] w-auto"
                    fill="none"
                >
                    {[60, 110, 160, 210, 260, 290].map((r, i) => (
                        <circle
                            key={r}
                            cx="300"
                            cy="300"
                            r={r}
                            stroke={suave ? "var(--kit-sobre-botao)" : "var(--kit-acento)"}
                            strokeOpacity={suave ? 0.18 : 0.55 - i * 0.07}
                            strokeWidth="1.2"
                        />
                    ))}
                    <g className="kit-anima-girar origin-center [transform-box:fill-box]">
                        <circle
                            cx="300"
                            cy="300"
                            r="185"
                            stroke={suave ? "var(--kit-sobre-botao)" : "var(--kit-acento2)"}
                            strokeOpacity={suave ? 0.3 : 0.9}
                            strokeWidth="2"
                            strokeDasharray="2 14"
                            strokeLinecap="round"
                        />
                    </g>
                    <circle cx="510" cy="300" r="9" fill={suave ? "var(--kit-sobre-botao)" : "var(--kit-acento)"} fillOpacity={suave ? 0.35 : 1} />
                </svg>
            )}


            {tipo === "grade" && (
                <>
                    <span className={cn("kit-grade absolute inset-0", suave && "opacity-30")} />
                    <span
                        className={cn(
                            "absolute right-[8%] top-[12%] h-[45%] w-[35%] rounded-full blur-[90px]",
                            suave ? "bg-kit-sobre-botao/10" : "bg-kit-acento/25",
                        )}
                    />
                </>
            )}

            {tipo === "pontos" && (
                <>
                    <span className={cn("kit-pontos absolute inset-0", suave && "opacity-20")} />
                    <span
                        className={cn(
                            "absolute -left-[10%] bottom-[-20%] h-[60%] w-[45%] rounded-full blur-[90px]",
                            suave ? "bg-kit-sobre-botao/10" : "bg-kit-acento2/30",
                        )}
                    />
                </>
            )}

            {/* Por último, para ficar por cima de TODAS as camadas: o topo
                termina dissolvendo no fundo da página, sem a linha seca onde o
                grafismo acaba e a primeira seção começa. */}
            {!suave && <span className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-kit-fundo" />}
        </div>
    )
}
