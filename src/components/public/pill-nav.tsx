"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { gsap } from "gsap"

import { cn } from "@/lib/utils"

/**
 * Navegação em pills, adaptada do PillNav do React Bits.
 *
 * Diferença em relação ao original: as pills não têm fundo — só o efeito de
 * hover, um círculo que sobe de baixo preenchendo a pill enquanto o rótulo
 * desliza para fora e um segundo rótulo entra no lugar. O tamanho do círculo
 * depende da largura de cada pill, então é medido no cliente e recalculado a
 * cada resize e quando as fontes terminam de carregar.
 */

export type PillNavItem = {
    label: string
    href: string
    ariaLabel?: string
    /** id da seção correspondente na home, usado para marcar o item ativo. */
    id?: string
}

type Props = {
    items: PillNavItem[]
    activeHref?: string
    className?: string
    ease?: string
    /** Cor do círculo que preenche a pill no hover. */
    circleColor?: string
    /** Cor do rótulo enquanto o círculo cobre a pill. */
    hoverTextColor?: string
    onItemClick?: (item: PillNavItem) => void
}

export function PillNav({
    items,
    activeHref,
    className,
    ease = "power3.easeOut",
    circleColor = "var(--brand-terracota)",
    hoverTextColor = "#FFFFFF",
    onItemClick,
}: Props) {
    const circleRefs = useRef<(HTMLSpanElement | null)[]>([])
    const tlRefs = useRef<gsap.core.Timeline[]>([])
    const tweenRefs = useRef<(gsap.core.Tween | null)[]>([])

    useEffect(() => {
        const layout = () => {
            circleRefs.current.forEach((circle, index) => {
                const pill = circle?.parentElement
                if (!circle || !pill) return

                const { width: w, height: h } = pill.getBoundingClientRect()
                if (!w || !h) return

                // Raio do círculo que, subindo pela base, cobre a pill inteira.
                const R = ((w * w) / 4 + h * h) / (2 * h)
                const D = Math.ceil(2 * R) + 2
                const delta =
                    Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1

                circle.style.width = `${D}px`
                circle.style.height = `${D}px`
                circle.style.bottom = `-${delta}px`

                gsap.set(circle, {
                    xPercent: -50,
                    scale: 0,
                    transformOrigin: `50% ${D - delta}px`,
                })

                const label = pill.querySelector<HTMLElement>("[data-pill-label]")
                const labelHover =
                    pill.querySelector<HTMLElement>("[data-pill-label-hover]")

                if (label) gsap.set(label, { y: 0 })
                if (labelHover) gsap.set(labelHover, { y: h + 12, opacity: 0 })

                tlRefs.current[index]?.kill()
                const tl = gsap.timeline({ paused: true })
                tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" }, 0)
                if (label) {
                    tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: "auto" }, 0)
                }
                if (labelHover) {
                    gsap.set(labelHover, { y: Math.ceil(h + 100), opacity: 0 })
                    tl.to(labelHover, { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" }, 0)
                }
                tlRefs.current[index] = tl
            })
        }

        layout()
        window.addEventListener("resize", layout)
        // Sem isso as medidas saem erradas quando a fonte troca depois do primeiro paint.
        document.fonts?.ready.then(layout).catch(() => {})

        const timelines = tlRefs.current
        return () => {
            window.removeEventListener("resize", layout)
            timelines.forEach((tl) => tl?.kill())
        }
    }, [items, ease])

    const anima = (i: number, para: "entrada" | "saida") => {
        const tl = tlRefs.current[i]
        if (!tl) return
        tweenRefs.current[i]?.kill()
        tweenRefs.current[i] = tl.tweenTo(para === "entrada" ? tl.duration() : 0, {
            duration: para === "entrada" ? 0.3 : 0.2,
            ease,
            overwrite: "auto",
        })
    }

    return (
        <ul className={cn("flex items-center gap-1", className)}>
            {items.map((item, i) => (
                <li key={item.href} className="flex">
                    <Link
                        href={item.href}
                        aria-label={item.ariaLabel || item.label}
                        aria-current={activeHref === item.href ? "page" : undefined}
                        onMouseEnter={() => anima(i, "entrada")}
                        onMouseLeave={() => anima(i, "saida")}
                        onFocus={() => anima(i, "entrada")}
                        onBlur={() => anima(i, "saida")}
                        onClick={() => onItemClick?.(item)}
                        className={cn(
                            "relative inline-flex h-10 items-center justify-center overflow-hidden rounded-full px-4 text-[15px] font-medium leading-none",
                            activeHref === item.href ? "text-foreground" : "text-foreground/70"
                        )}
                    >
                        <span
                            aria-hidden
                            ref={(el) => {
                                circleRefs.current[i] = el
                            }}
                            className="pointer-events-none absolute left-1/2 bottom-0 z-0 block rounded-full will-change-transform"
                            style={{ background: circleColor }}
                        />
                        {activeHref === item.href && (
                            <span
                                aria-hidden
                                className="absolute -bottom-0.5 left-1/2 z-10 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-brand-coral"
                            />
                        )}
                        <span className="relative z-10 inline-flex items-center gap-1.5 leading-none">
                            <span className="relative inline-block leading-none">
                                <span data-pill-label className="inline-block leading-none will-change-transform">
                                    {item.label}
                                </span>
                                <span
                                    data-pill-label-hover
                                    aria-hidden
                                    className="absolute left-0 top-0 inline-block leading-none will-change-[transform,opacity]"
                                    style={{ color: hoverTextColor }}
                                >
                                    {item.label}
                                </span>
                            </span>
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    )
}
