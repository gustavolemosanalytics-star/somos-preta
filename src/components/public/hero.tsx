"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, BarChart3, MapPin, Sparkles, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { OndasRecorte, PalmaRecorte, PalmeiraRecorte } from "./hero-recortes"

/**
 * Hero da landing — colagem de recortes sobre off-white.
 *
 * As fotos vivem em /public/hero. Hoje são placeholders SVG; para trocar pelas
 * fotos finais basta manter o nome do arquivo e mudar a extensão em SLOTS.
 * Os prompts de geração estão em docs/hero-imagens.md.
 */

type Slot = {
    src: string
    alt: string
    /** Posição na colagem — só a partir de lg. */
    frame: string
    recorte: string
    priority?: boolean
    sizes: string
}

const SLOTS: Slot[] = [
    {
        src: "/hero/criador-chapeu.svg",
        alt: "Criador de conteúdo de chapéu de palha sorrindo",
        frame: "left-[1%] top-[7%] w-[24%] h-[53%] -rotate-2 z-10",
        recorte: "recorte-b",
        sizes: "(max-width: 1024px) 50vw, 14vw",
    },
    {
        src: "/hero/criadora-principal.svg",
        alt: "Criadora de conteúdo do Nordeste com tranças e brincos de leque",
        frame: "left-[18%] top-[3%] w-[43%] h-[85%] z-20",
        recorte: "recorte-a",
        priority: true,
        sizes: "(max-width: 1024px) 100vw, 26vw",
    },
    {
        src: "/hero/criadora-cacheada.svg",
        alt: "Criadora de cabelo cacheado olhando para a câmera",
        frame: "left-[62%] top-[30%] w-[24%] h-[54%] rotate-1 z-10",
        recorte: "recorte-c",
        sizes: "(max-width: 1024px) 50vw, 14vw",
    },
    {
        src: "/hero/paisagem-litoral.svg",
        alt: "Falésias e mar do litoral nordestino",
        frame: "left-[36%] top-[79%] w-[27%] h-[19%] z-30",
        recorte: "recorte-d",
        sizes: "(max-width: 1024px) 50vw, 16vw",
    },
]

const FEATURES = [
    { icon: Users, label: "Comunidade real" },
    { icon: Sparkles, label: "Curadoria com propósito" },
    { icon: BarChart3, label: "Campanhas que geram impacto" },
]

/** Blocos de texto que pontuam a colagem, como na peça impressa. */
const LEGENDAS = [
    { linhas: ["Da", "nossa", "terra", "para", "o mundo"], frame: "left-[3%] top-[62%]" },
    {
        linhas: ["Território", "Criatividade", "Pessoas", "Potência"],
        frame: "right-[1%] top-[32%]",
    },
    {
        linhas: ["Gente", "Cultura", "Conexões", "Oportunidades", "Realidade"],
        frame: "right-[1%] top-[68%]",
    },
] as const

const surge = {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
}

export function Hero() {
    return (
        <section className="relative isolate overflow-hidden bg-background">
            <div className="relative mx-auto grid max-w-[1600px] items-center gap-12 px-6 pb-10 pt-12 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1.1fr)] lg:gap-10 lg:pb-8 lg:pt-14">
                {/* ---------- coluna de texto ---------- */}
                <motion.div {...surge} className="max-w-[45rem]">
                    <p className="flex items-center gap-2 text-sm font-medium text-brand-terracota">
                        <MapPin className="h-4 w-4" aria-hidden />
                        Norte &amp; Nordeste
                    </p>

                    <h1 className="mt-6 text-[clamp(2.3rem,3.8vw,3.6rem)] font-extrabold leading-[1.06] tracking-[-0.032em]">
                        Creators do
                        <br />
                        <span className="text-brand-terracota">Norte e Nordeste</span>
                        <br />
                        para marcas que
                        <br />
                        querem relevância real.
                    </h1>

                    <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                        Conectamos marcas a criadores que transformam suas realidades em
                        conteúdo, cultura e impacto. Mais que influência, é território em
                        movimento.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/#quem-somos"
                            className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-brand-terracota px-8 text-base font-semibold text-white transition-colors hover:bg-brand-coral"
                        >
                            Conheça a Somos Preta
                            <ArrowRight
                                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                aria-hidden
                            />
                        </Link>
                        <Link
                            href="/criador/criar-conta"
                            className="inline-flex h-14 items-center justify-center rounded-full border border-border px-8 text-base font-semibold transition-colors hover:border-brand-terracota hover:bg-accent"
                        >
                            Sou criador
                        </Link>
                    </div>

                    <ul className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-0 sm:divide-x sm:divide-border">
                        {FEATURES.map((f, i) => (
                            <li
                                key={f.label}
                                className={cn(
                                    "flex items-center gap-2 whitespace-nowrap text-[13px] text-muted-foreground",
                                    i === 0 ? "sm:pr-4" : "sm:px-4"
                                )}
                            >
                                <f.icon className="h-4 w-4 shrink-0 text-brand-terracota" aria-hidden />
                                {f.label}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <Colagem />
            </div>

            {/* ---------- assinatura de rodapé da hero ---------- */}
            <div className="mx-auto max-w-[1600px] px-6">
                <div className="flex flex-col gap-4 border-t border-border py-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[11px] font-medium uppercase leading-[1.7] tracking-[0.22em] text-muted-foreground">
                        Do Norte e Nordeste.
                        <br />
                        Para um Brasil mais real.
                    </p>
                    <p className="flex items-center gap-4">
                        <span aria-hidden className="h-px w-16 bg-brand-coral" />
                        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                            Somos Preta
                        </span>
                    </p>
                </div>
            </div>
        </section>
    )
}

function Colagem() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative"
        >
            {/* mobile e tablet: grade simples, sem sobreposição */}
            <div className="grid grid-cols-3 gap-3 lg:hidden">
                {SLOTS.map((slot, i) => (
                    <div
                        key={slot.src}
                        className={cn(
                            "relative overflow-hidden rounded-lg bg-muted",
                            // os três retratos dividem a linha; a paisagem fecha embaixo
                            i === 3 ? "col-span-3 aspect-[16/9]" : "aspect-[3/4]"
                        )}
                    >
                        <Foto slot={slot} />
                    </div>
                ))}
            </div>

            {/* desktop: a colagem da peça impressa */}
            <div
                className="relative hidden aspect-[1126/890] w-full lg:block"
                style={{ marginRight: "calc(-1 * max(0px, (100vw - 1600px) / 2))" }}
            >
                {/* folha de papel que assenta a colagem */}
                <span
                    aria-hidden
                    className="recorte-a absolute left-[17%] top-0 h-[54%] w-[48%] -rotate-1 bg-brand-areia"
                />

                {/* palma no alto, à direita */}
                <PalmaRecorte className="absolute left-[60%] top-[3%] z-0 h-[23%] w-[12%] rotate-6 text-brand-coral/85" />

                {SLOTS.map((slot) => (
                    <div
                        key={slot.src}
                        className={cn(
                            "absolute overflow-hidden bg-muted shadow-[0_22px_54px_-22px_rgba(31,31,31,0.55)] ring-1 ring-brand-carvao/[0.07]",
                            slot.recorte,
                            slot.frame
                        )}
                    >
                        <Foto slot={slot} />
                    </div>
                ))}

                {/* palmeira recortada sobre papel coral */}
                <span
                    aria-hidden
                    className="recorte-c absolute left-[17%] top-[71%] z-20 flex h-[27%] w-[19%] items-end justify-center bg-brand-coral"
                >
                    <PalmeiraRecorte className="h-[88%] w-auto text-brand-carvao" />
                </span>

                {/* faixas onduladas */}
                <span
                    aria-hidden
                    className="recorte-d absolute left-[56%] top-[83%] z-20 flex h-[15%] w-[28%] items-center bg-brand-offwhite"
                >
                    <OndasRecorte className="h-full w-full text-brand-carvao" />
                </span>

                {LEGENDAS.map((legenda) => (
                    <div
                        key={legenda.linhas.join()}
                        aria-hidden
                        className={cn("absolute z-30 select-none", legenda.frame)}
                    >
                        <ul className="space-y-1.5">
                            {legenda.linhas.map((linha) => (
                                <li
                                    key={linha}
                                    className="text-[10px] font-medium uppercase leading-none tracking-[0.2em] text-muted-foreground"
                                >
                                    {linha}
                                </li>
                            ))}
                        </ul>
                        <span aria-hidden className="mt-3 block h-px w-7 bg-brand-coral" />
                    </div>
                ))}

                <p
                    aria-hidden
                    className="absolute right-[2%] top-[4%] z-30 max-w-[8ch] -rotate-3 font-manuscrita text-[clamp(1.5rem,2vw,2.2rem)] leading-[1.15] text-brand-coral"
                >
                    Mais vozes Mais nossos
                    <span aria-hidden className="mt-1 block h-[2px] w-20 rounded-full bg-brand-coral" />
                </p>
            </div>
        </motion.div>
    )
}

function Foto({ slot }: { slot: Slot }) {
    return (
        <Image
            src={slot.src}
            alt={slot.alt}
            fill
            sizes={slot.sizes}
            priority={slot.priority}
            unoptimized={slot.src.endsWith(".svg")}
            className="object-cover"
        />
    )
}
