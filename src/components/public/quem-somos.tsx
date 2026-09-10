"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { LINK_CONTATO } from "@/lib/constants/contato"

/**
 * Segunda dobra — quem somos.
 *
 * Os quatro painéis funcionam como um accordion de imagem: o painel sob o
 * cursor (ou com foco pelo teclado) cresce e os outros recuam. O estado vive no
 * React em vez de :hover puro para o teclado abrir o mesmo painel que o mouse.
 */

const PAINEIS = [
    {
        legenda: "Talento",
        src: "/quem-somos/talento.webp",
        alt: "Criador de conteúdo com dreadlocks sorrindo ao ar livre",
        inclinacao: "-rotate-[3.5deg]",
    },
    {
        legenda: "Território",
        src: "/quem-somos/territorio.webp",
        alt: "Farol da Barra e o forte de Santo Antônio, em Salvador",
        inclinacao: "rotate-2",
    },
    {
        legenda: "Cultura",
        src: "/quem-somos/cultura.webp",
        alt: "Criadora de cabelo cacheado rindo diante de uma parede terracota",
        inclinacao: "-rotate-2",
    },
    {
        legenda: "Oportunidades",
        src: "/quem-somos/oportunidades.webp",
        alt: "Criador de chapéu de palha caminhando por uma trilha à beira-mar",
        inclinacao: "rotate-[3.5deg]",
    },
]

/** Trocar por SVGs oficiais em /public/marcas quando o cliente enviar. */
const CONFIAM = ["Coca-Cola", "Fanta", "Absolut", "AdeS", "NegroniWeek"]

const fade = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
}

export function QuemSomos() {
    const [ativo, setAtivo] = useState<number | null>(null)

    return (
        <section id="quem-somos" className="scroll-mt-24 border-t border-border bg-background">
            <div className="mx-auto max-w-[1600px] px-6 py-16 lg:py-20">
                <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
                    {/* ---------- texto ---------- */}
                    <motion.div {...fade}>
                        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-brand-coral">
                            Gente real. Território real.
                        </p>

                        <h2 className="mt-5 text-[clamp(2.1rem,3.4vw,3.4rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
                            Do Norte e Nordeste
                            <br />
                            para <span className="text-brand-terracota">todo o Brasil.</span>
                        </h2>

                        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                            Somos a agência que valoriza os criadores da nossa terra, conectando
                            talentos, marcas e oportunidades para construir histórias que
                            representam o Brasil de verdade.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={LINK_CONTATO}
                                className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-brand-terracota px-8 text-base font-semibold text-white transition-colors hover:bg-brand-coral"
                            >
                                Conheça nossa agência
                                <ArrowRight
                                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                    aria-hidden
                                />
                            </Link>
                            <Link
                                href="/creator/criar-conta"
                                className="inline-flex h-14 items-center justify-center rounded-full border border-border px-8 text-base font-semibold transition-colors hover:border-brand-terracota hover:bg-accent"
                            >
                                Sou criador
                            </Link>
                        </div>
                    </motion.div>

                    {/* ---------- accordion de imagens ---------- */}
                    <motion.div {...fade} transition={{ ...fade.transition, delay: 0.1 }}>
                        <div className="flex items-stretch gap-3 sm:gap-6">
                            <ul
                                className="flex h-[clamp(16rem,23vw,21rem)] min-w-0 flex-1 items-stretch gap-3 sm:gap-4"
                                onMouseLeave={() => setAtivo(null)}
                            >
                                {PAINEIS.map((painel, i) => (
                                    <li
                                        key={painel.legenda}
                                        className={cn(
                                            "min-w-0 transition-[flex-grow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                            ativo === i ? "grow-[1.9]" : "grow"
                                        )}
                                        style={{ flexBasis: 0 }}
                                    >
                                        <Link
                                            href="/#conteudos"
                                            onMouseEnter={() => setAtivo(i)}
                                            onFocus={() => setAtivo(i)}
                                            onBlur={() => setAtivo(null)}
                                            className={cn(
                                                "group flex h-full flex-col transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                                painel.inclinacao,
                                                ativo === i && "rotate-0"
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "relative block min-h-0 flex-1 overflow-hidden rounded-xl bg-muted shadow-[0_18px_44px_-26px_rgba(31,31,31,0.5)] transition-shadow duration-500",
                                                    ativo === i && "shadow-[0_26px_60px_-26px_rgba(31,31,31,0.6)]"
                                                )}
                                            >
                                                <Image
                                                    src={painel.src}
                                                    alt={painel.alt}
                                                    fill
                                                    sizes="(max-width: 1024px) 45vw, 18vw"
                                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                                />
                                            </span>
                                            <span className="mt-3 block shrink-0 truncate font-manuscrita text-[clamp(1.1rem,1.5vw,1.6rem)] leading-none text-foreground">
                                                {painel.legenda}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>

                            <p
                                aria-hidden
                                className="hidden w-[9.5rem] shrink-0 self-start pl-2 pt-2 font-manuscrita text-[clamp(1.2rem,1.5vw,1.7rem)] font-semibold uppercase leading-[1.25] tracking-tight text-foreground xl:block"
                            >
                                Mais criadores
                                <br />
                                Mais histórias
                                <br />
                                Mais Brasil
                                <span aria-hidden className="mt-3 block h-[2px] w-16 rounded-full bg-brand-coral" />
                                <span aria-hidden className="mt-1 block h-[2px] w-11 rounded-full bg-brand-coral" />
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* ---------- prova social ---------- */}
                <motion.div
                    {...fade}
                    transition={{ ...fade.transition, delay: 0.15 }}
                    className="mt-14 flex flex-wrap items-center gap-x-10 gap-y-5 border-t border-border pt-8"
                >
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Confiam na Somos Preta
                    </p>
                    <ul className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-4">
                        {CONFIAM.map((marca) => (
                            <li
                                key={marca}
                                className="text-lg font-semibold tracking-tight text-muted-foreground/70 transition-colors hover:text-foreground"
                            >
                                {marca}
                            </li>
                        ))}
                    </ul>
                    <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        E muitas outras
                    </p>
                </motion.div>
            </div>
        </section>
    )
}
