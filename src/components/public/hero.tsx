"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, BarChart3, MapPin, Sparkles, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { SpecularButton } from "./specular-button"

/**
 * Hero da landing — colagem de recortes sobre off-white.
 *
 * As fotos vivem em /public/hero. Hoje são placeholders SVG; para trocar pelas
 * fotos finais basta manter o nome do arquivo e mudar a extensão em SLOTS.
 * Os prompts de geração estão em docs/hero-imagens.md.
 */

type Peca = {
    src: string
    alt: string
    /** Posição na colagem — só a partir de lg. */
    frame: string
    priority?: boolean
    sizes: string
}

/**
 * A colagem é montada em camadas, de trás para a frente: papel kraft, recortes
 * gráficos e fotos. A ordem do array define o empilhamento junto com o z do frame.
 */
/** Bordas irregulares alternadas, para as fotos lerem como recorte de papel. */
const RECORTES = ["recorte-a", "recorte-b", "recorte-c", "recorte-d"]

const PECAS: Peca[] = [
    {
        src: "/hero/textura-papel.webp",
        alt: "",
        frame: "left-[14%] top-[-3%] w-[50%] h-[62%] z-0",
        sizes: "(max-width: 1024px) 0px, 25vw",
    },
    {
        src: "/hero/recorte-raios.webp",
        alt: "",
        frame: "left-[57%] top-[3%] w-[15%] h-[23%] z-10",
        sizes: "(max-width: 1024px) 0px, 9vw",
    },
    {
        src: "/hero/criador-chapeu.webp",
        alt: "Criador de conteúdo de chapéu de palha sorrindo",
        frame: "left-[0%] top-[8%] w-[27%] h-[46%] z-20 -rotate-1",
        sizes: "(max-width: 1024px) 45vw, 16vw",
    },
    {
        src: "/hero/coqueiros.webp",
        alt: "Coqueiros contra o céu do litoral nordestino",
        frame: "left-[70%] top-[46%] w-[13%] h-[34%] z-20",
        sizes: "(max-width: 1024px) 45vw, 8vw",
    },
    {
        src: "/hero/criadora-cacheada.webp",
        alt: "Criadora de cabelo cacheado olhando para a câmera",
        frame: "left-[56%] top-[27%] w-[19%] h-[57%] z-30",
        sizes: "(max-width: 1024px) 45vw, 12vw",
    },
    {
        src: "/hero/criadora-principal.webp",
        alt: "Criadora de conteúdo do Nordeste com tranças e brincos de leque",
        frame: "left-[16%] top-[2%] w-[45%] h-[94%] z-40",
        priority: true,
        sizes: "(max-width: 1024px) 90vw, 28vw",
    },
    {
        src: "/hero/recorte-palmeira.webp",
        alt: "",
        frame: "left-[17%] top-[71%] w-[17%] h-[27%] z-50",
        sizes: "(max-width: 1024px) 45vw, 10vw",
    },
    {
        src: "/hero/paisagem-falesias.webp",
        alt: "Falésias e mar do litoral nordestino",
        frame: "left-[33%] top-[72%] w-[22%] h-[25%] z-50",
        sizes: "(max-width: 1024px) 45vw, 13vw",
    },
    {
        src: "/hero/recorte-ondas.webp",
        alt: "",
        frame: "left-[54%] top-[80%] w-[21%] h-[16%] z-50",
        sizes: "(max-width: 1024px) 45vw, 12vw",
    },
]

/** Só as fotos entram na grade simplificada de telas pequenas. */
const FOTOS_MOBILE = [
    "/hero/criadora-principal.webp",
    "/hero/criador-chapeu.webp",
    "/hero/criadora-cacheada.webp",
    "/hero/paisagem-falesias.webp",
]

const FEATURES = [
    { icon: Users, label: "Comunidade real" },
    { icon: Sparkles, label: "Curadoria com propósito" },
    { icon: BarChart3, label: "Campanhas que geram impacto" },
]

/** Blocos de texto que pontuam a colagem, como na peça impressa. */
const LEGENDAS = [
    { linhas: ["Da", "nossa", "terra", "para", "o mundo"], frame: "left-[7%] top-[55%]" },
    {
        linhas: ["Território", "Criatividade", "Pessoas", "Potência"],
        frame: "right-[0%] top-[30%]",
    },
    {
        linhas: ["Gente", "Cultura", "Conexões", "Oportunidades", "Realidade"],
        frame: "right-[0%] top-[70%]",
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
                        {/* Sobre o terracota preenchido o realce precisa de mais corpo, e a
                            base acompanha a cor do botão para não virar uma borda cinza. */}
                        <SpecularButton
                            href="/#quem-somos"
                            lineColor="#FFF3EC"
                            baseColor="#C2603F"
                            intensity={2.2}
                            thickness={2.2}
                            shineSize={16}
                            shineFade={38}
                            className="group inline-flex h-14 items-center justify-center rounded-full bg-brand-terracota px-8 text-base font-semibold text-white hover:bg-brand-coral"
                        >
                            Conheça a Somos Preta
                            <ArrowRight
                                className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                aria-hidden
                            />
                        </SpecularButton>
                        <Link
                            href="/creator/criar-conta"
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
            {/* mobile e tablet: só as fotos, em grade simples */}
            <div className="grid grid-cols-3 gap-3 lg:hidden">
                {FOTOS_MOBILE.map((src, i) => {
                    const peca = PECAS.find((p) => p.src === src)!
                    return (
                        <div
                            key={src}
                            className={cn(
                                "relative overflow-hidden rounded-lg bg-muted",
                                i === 3 ? "col-span-3 aspect-[16/9]" : "aspect-[3/4]"
                            )}
                        >
                            <Foto peca={peca} />
                        </div>
                    )
                })}
            </div>

            {/* desktop: a colagem da peça de referência */}
            <div
                className="relative hidden aspect-[900/745] w-full lg:block"
                style={{ marginRight: "calc(-1 * max(0px, (100vw - 1600px) / 2))" }}
            >
                {PECAS.map((peca, i) => (
                    <div key={peca.src} className={cn("absolute", peca.frame)}>
                        <Foto peca={peca} indice={i} />
                    </div>
                ))}

                {LEGENDAS.map((legenda) => (
                    <div
                        key={legenda.linhas.join()}
                        aria-hidden
                        className={cn("absolute z-50 select-none", legenda.frame)}
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
                    className="absolute right-[2%] top-[4%] z-50 max-w-[8ch] -rotate-3 font-manuscrita text-[clamp(1.5rem,2vw,2.2rem)] leading-[1.15] text-brand-coral"
                >
                    Mais vozes Mais nossos
                    <span aria-hidden className="mt-1 block h-[2px] w-20 rounded-full bg-brand-coral" />
                </p>
            </div>
        </motion.div>
    )
}

/**
 * Uma peça da colagem. Os recortes gráficos (papel, palmeira, raios, ondas) já
 * vêm com fundo e bordas rasgadas próprios, então usam `object-contain` e não
 * levam moldura; só as fotos ganham cantos e sombra.
 */
function Foto({ peca, indice = 0 }: { peca: Peca; indice?: number }) {
    const eRecorte = peca.alt === ""

    return (
        <div
            className={cn(
                "relative h-full w-full",
                !eRecorte &&
                    cn(
                        "overflow-hidden shadow-[0_22px_54px_-22px_rgba(31,31,31,0.45)]",
                        RECORTES[indice % RECORTES.length]
                    )
            )}
        >
            <Image
                src={peca.src}
                alt={peca.alt}
                fill
                sizes={peca.sizes}
                priority={peca.priority}
                aria-hidden={eRecorte || undefined}
                className={eRecorte ? "object-contain" : "object-cover"}
            />
        </div>
    )
}
