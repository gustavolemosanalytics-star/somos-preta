"use client"

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { gsap } from "gsap"

import { cn } from "@/lib/utils"

/**
 * Grade masonry animada, portada do Masonry do React Bits.
 *
 * Diferenças em relação ao original, todas para caber neste projeto:
 * - navegação por `router.push` em vez de `window.open`, já que os destinos
 *   são rotas internas do blog;
 * - cada célula renderiza um <img> com alt em vez de background-image, para o
 *   conteúdo do blog continuar acessível e indexável;
 * - as queries do gsap são escopadas ao container, então dois Masonry na mesma
 *   página não disputam os mesmos `data-key`.
 */

export type MasonryItem = {
    id: string
    img: string
    url: string
    /** Altura relativa da célula; o componente usa metade dela, como no original. */
    height: number
    alt: string
    legenda?: string
}

type Props = {
    items: MasonryItem[]
    className?: string
    ease?: string
    duration?: number
    stagger?: number
    animateFrom?: "top" | "bottom" | "left" | "right" | "center"
    scaleOnHover?: boolean
    hoverScale?: number
    blurToFocus?: boolean
}

function useMedia(queries: string[], values: number[], defaultValue: number) {
    // No servidor não existe matchMedia; começar pelo default e corrigir no
    // efeito evita divergência entre o HTML renderizado e a hidratação.
    const [value, setValue] = useState(defaultValue)

    useEffect(() => {
        const ler = () =>
            values[queries.findIndex((q) => window.matchMedia(q).matches)] ?? defaultValue

        setValue(ler())
        const mqls = queries.map((q) => window.matchMedia(q))
        const handler = () => setValue(ler())
        mqls.forEach((m) => m.addEventListener("change", handler))
        return () => mqls.forEach((m) => m.removeEventListener("change", handler))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queries.join(), values.join(), defaultValue])

    return value
}

function useMeasure<T extends HTMLElement>() {
    const ref = useRef<T>(null)
    const [largura, setLargura] = useState(0)

    useLayoutEffect(() => {
        if (!ref.current) return
        const ro = new ResizeObserver(([entry]) => setLargura(entry.contentRect.width))
        ro.observe(ref.current)
        return () => ro.disconnect()
    }, [])

    return [ref, largura] as const
}

const CONSULTAS = ["(min-width:1500px)", "(min-width:1000px)", "(min-width:600px)", "(min-width:400px)"]
const COLUNAS = [4, 3, 2, 2]

export function Masonry({
    items,
    className,
    ease = "power3.out",
    duration = 0.6,
    stagger = 0.05,
    animateFrom = "bottom",
    scaleOnHover = true,
    hoverScale = 0.97,
    blurToFocus = true,
}: Props) {
    const router = useRouter()
    const colunas = useMedia(CONSULTAS, COLUNAS, 1)
    const [containerRef, largura] = useMeasure<HTMLDivElement>()
    const [prontas, setProntas] = useState(false)
    const montou = useRef(false)

    useEffect(() => {
        let vivo = true
        Promise.all(
            items.map(
                (i) =>
                    new Promise<void>((resolve) => {
                        const img = new window.Image()
                        img.src = i.img
                        img.onload = img.onerror = () => resolve()
                    })
            )
        ).then(() => {
            if (vivo) setProntas(true)
        })
        return () => {
            vivo = false
        }
    }, [items])

    const grid = useMemo(() => {
        if (!largura) return []
        const alturasCol = new Array(colunas).fill(0)
        const larguraCol = largura / colunas

        return items.map((item) => {
            const col = alturasCol.indexOf(Math.min(...alturasCol))
            const x = larguraCol * col
            const h = item.height / 2
            const y = alturasCol[col]
            alturasCol[col] += h
            return { ...item, x, y, w: larguraCol, h }
        })
    }, [colunas, items, largura])

    const alturaTotal = useMemo(
        () => grid.reduce((max, i) => Math.max(max, i.y + i.h), 0),
        [grid]
    )

    const posicaoInicial = useCallback(
        (item: (typeof grid)[number]) => {
            const rect = containerRef.current?.getBoundingClientRect()
            if (!rect) return { x: item.x, y: item.y }
            switch (animateFrom) {
                case "top":
                    return { x: item.x, y: -200 }
                case "bottom":
                    return { x: item.x, y: window.innerHeight + 200 }
                case "left":
                    return { x: -200, y: item.y }
                case "right":
                    return { x: window.innerWidth + 200, y: item.y }
                case "center":
                    return { x: rect.width / 2 - item.w / 2, y: rect.height / 2 - item.h / 2 }
                default:
                    return { x: item.x, y: item.y + 100 }
            }
        },
        [animateFrom, containerRef]
    )

    useLayoutEffect(() => {
        if (!prontas || !containerRef.current) return
        const raiz = containerRef.current

        grid.forEach((item, i) => {
            const el = raiz.querySelector<HTMLElement>(`[data-key="${item.id}"]`)
            if (!el) return
            const destino = { x: item.x, y: item.y, width: item.w, height: item.h }

            if (!montou.current) {
                const de = posicaoInicial(item)
                gsap.fromTo(
                    el,
                    {
                        opacity: 0,
                        x: de.x,
                        y: de.y,
                        width: item.w,
                        height: item.h,
                        ...(blurToFocus && { filter: "blur(10px)" }),
                    },
                    {
                        opacity: 1,
                        ...destino,
                        ...(blurToFocus && { filter: "blur(0px)" }),
                        duration: 0.8,
                        ease: "power3.out",
                        delay: i * stagger,
                    }
                )
            } else {
                gsap.to(el, { ...destino, duration, ease, overwrite: "auto" })
            }
        })

        montou.current = true
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [grid, prontas, stagger, animateFrom, blurToFocus, duration, ease])

    const escala = (id: string, para: number) => {
        if (!scaleOnHover || !containerRef.current) return
        const el = containerRef.current.querySelector<HTMLElement>(`[data-key="${id}"]`)
        if (el) gsap.to(el, { scale: para, duration: 0.3, ease: "power2.out" })
    }

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full", className)}
            style={{ height: alturaTotal || undefined }}
        >
            {grid.map((item) => (
                <div
                    key={item.id}
                    data-key={item.id}
                    role="link"
                    tabIndex={0}
                    aria-label={item.alt}
                    onClick={() => router.push(item.url)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            router.push(item.url)
                        }
                    }}
                    onMouseEnter={() => escala(item.id, hoverScale)}
                    onMouseLeave={() => escala(item.id, 1)}
                    onFocus={() => escala(item.id, hoverScale)}
                    onBlur={() => escala(item.id, 1)}
                    className="absolute left-0 top-0 cursor-pointer p-1.5 will-change-[transform,width,height,opacity]"
                >
                    <div className="group relative h-full w-full overflow-hidden rounded-xl bg-muted shadow-[0_16px_44px_-24px_rgba(31,31,31,0.45)] ring-1 ring-brand-carvao/[0.06]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={item.img}
                            alt={item.alt}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                        />
                        {item.legenda && (
                            <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground/80 backdrop-blur-sm">
                                {item.legenda}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
