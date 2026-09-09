"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight, BarChart3, MapPin, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { LogoPreta } from "./marca"
import { MapaTerritorio } from "./mapa-territorio"

/**
 * Dobra do Media Kit: a proposta para criadores, ao lado de um cartão de
 * exemplo do produto. Os dados do cartão são fictícios e servem só de amostra.
 */

const STATS = [
    { icon: MapPin, valor: "11", label: "estados do N/NE", nota: "Criadores em todo o território" },
    { icon: Users, valor: "100%", label: "foco regional", nota: "Mais oportunidades reais" },
    { icon: BarChart3, valor: "1", label: "plataforma", nota: "Tudo o que você precisa em um só lugar" },
]

const REDES = [
    { rede: "Instagram", valor: "125K", unidade: "seguidores" },
    { rede: "TikTok", valor: "82K", unidade: "seguidores" },
    { rede: "YouTube", valor: "24K", unidade: "inscritos" },
]

const NICHOS = ["Cultura", "Lifestyle", "Viagens", "Beleza", "Nordeste"]

const METRICAS = [
    { valor: "+ 1,2M", label: "alcance mensal" },
    { valor: "8,4%", label: "engajamento médio" },
    { valor: "92%", label: "público no N/NE" },
]

/** Portfólio de exemplo: três territórios, sem repetir imagem. */
const GALERIA = [
    { src: "/media-kit/territorio-salvador.webp", alt: "Casario histórico de Salvador" },
    { src: "/media-kit/territorio-manaus.webp", alt: "Encontro das águas, em Manaus" },
    { src: "/media-kit/territorio-sao-luis.webp", alt: "Azulejaria do centro de São Luís" },
]

const fade = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
}

export function MediaKitDobra() {
    return (
        <section
            id="criadores"
            className="relative scroll-mt-24 overflow-hidden border-t border-border bg-background"
        >
            <div className="mx-auto grid max-w-[1600px] items-center gap-12 px-6 py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 lg:py-20">
                {/* ---------- proposta ---------- */}
                <motion.div {...fade}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Para criadores
                    </p>
                    <span aria-hidden className="mt-3 block h-[2px] w-12 rounded-full bg-brand-coral" />

                    <h2 className="mt-6 text-[clamp(2.1rem,3.6vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.032em]">
                        Crie seu
                        <br />
                        Media Kit online
                    </h2>

                    <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                        Aproveite os dados que você já tem na PRETA — redes sociais e portfólio — e
                        monte um perfil profissional pronto para compartilhar com marcas.
                    </p>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/criador/criar-conta"
                            className="group inline-flex h-14 items-center justify-center gap-3 rounded-full bg-brand-terracota px-8 text-base font-semibold text-white transition-colors hover:bg-brand-coral"
                        >
                            Criar meu Media Kit
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                        </Link>
                        <Link
                            href="/kit/exemplo"
                            className="inline-flex h-14 items-center justify-center rounded-full border border-border px-8 text-base font-semibold transition-colors hover:border-brand-terracota hover:bg-accent"
                        >
                            Ver exemplo
                        </Link>
                    </div>

                    <dl className="mt-12 grid gap-6 sm:grid-cols-3 sm:gap-4">
                        {STATS.map((s, i) => (
                            <div key={s.label} className={cn("sm:pl-5", i > 0 && "sm:border-l sm:border-border")}>
                                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-terracota/12 text-brand-terracota">
                                    <s.icon className="h-5 w-5" aria-hidden />
                                </span>
                                <dt className="mt-4 text-[clamp(1.6rem,2.2vw,2rem)] font-extrabold leading-none tracking-tight">
                                    {s.valor}
                                </dt>
                                <dd className="mt-1.5 text-sm text-muted-foreground">{s.label}</dd>
                                <dd className="mt-3 text-[10px] font-medium uppercase leading-[1.7] tracking-[0.16em] text-muted-foreground/80">
                                    {s.nota}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </motion.div>

                {/* ---------- cartão de exemplo ---------- */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="relative"
                >
                    {/* formas de fundo */}
                    <span
                        aria-hidden
                        className="absolute -right-[6%] -top-[8%] hidden h-[45%] w-[45%] rounded-[45%_55%_50%_50%/55%_45%_55%_45%] bg-brand-bege/60 lg:block"
                    />
                    <span
                        aria-hidden
                        className="absolute -left-[4%] top-[6%] hidden h-[30%] w-[26%] rounded-[55%_45%_40%_60%/50%_55%_45%_50%] bg-brand-terracota/15 lg:block"
                    />
                    <MapaTerritorio
                        aria-hidden
                        className="absolute -bottom-[4%] right-[2%] hidden h-[32%] w-auto text-brand-areia lg:block"
                    />

                    <p
                        aria-hidden
                        className="absolute -left-[1%] top-0 z-20 hidden max-w-[7ch] -rotate-6 font-manuscrita text-[clamp(1.4rem,1.8vw,2rem)] leading-[1.2] text-brand-carvao lg:block"
                    >
                        Mais vozes. Mais conquistas.
                        <span aria-hidden className="mt-2 block h-[2px] w-20 rounded-full bg-brand-coral" />
                    </p>

                    <CartaoExemplo />

                    <p
                        aria-hidden
                        className="mt-6 hidden text-right text-[10px] font-medium uppercase leading-[1.9] tracking-[0.2em] text-muted-foreground lg:block"
                    >
                        Do Norte e Nordeste
                        <br />
                        para todo o Brasil.
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

/** Amostra do Media Kit gerado pela plataforma. Dados fictícios. */
function CartaoExemplo() {
    return (
        <article className="relative z-10 rounded-[1.75rem] border border-border bg-card p-5 shadow-[0_30px_80px_-40px_rgba(31,31,31,0.5)] sm:p-6 lg:ml-[12%] lg:rotate-[-1.5deg]">
            <header className="flex items-center justify-between gap-4">
                <LogoPreta className="h-4 w-auto" />
                <span className="flex flex-col items-center">
                    <span className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Media Kit
                    </span>
                    <span aria-hidden className="mt-1.5 h-[2px] w-8 rounded-full bg-brand-coral" />
                </span>
                <span className="text-right text-[9px] font-medium uppercase leading-[1.7] tracking-[0.18em] text-muted-foreground">
                    Ideias que
                    <br />
                    movem
                    <br />
                    pessoas.
                </span>
            </header>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row">
                <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-2xl bg-muted sm:w-[42%]">
                    <Image
                        src="/media-kit/perfil.webp"
                        alt="Retrato da criadora no Media Kit de exemplo"
                        fill
                        sizes="(max-width: 640px) 90vw, 18vw"
                        className="object-cover"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold tracking-tight">Jaminy Santos</h3>
                    <p className="mt-1.5 text-[10px] font-medium uppercase leading-[1.8] tracking-[0.16em] text-muted-foreground">
                        Criadora de conteúdo
                        <br />
                        Salvador - BA
                    </p>
                    <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                        Cultura, identidade e cotidiano em uma comunicação real, que conecta o Norte
                        e Nordeste com o Brasil.
                    </p>

                    <ul className="mt-4 flex flex-wrap gap-2">
                        {REDES.map((r) => (
                            <li
                                key={r.rede}
                                className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5"
                            >
                                <span className="h-5 w-5 shrink-0 rounded-md bg-brand-areia" aria-hidden />
                                <span className="leading-tight">
                                    <span className="block text-xs font-bold">{r.valor}</span>
                                    <span className="block text-[9px] text-muted-foreground">
                                        {r.unidade}
                                    </span>
                                </span>
                                <span className="sr-only">{r.rede}</span>
                            </li>
                        ))}
                    </ul>

                    <ul className="mt-3 flex flex-wrap gap-1.5">
                        {NICHOS.map((n) => (
                            <li
                                key={n}
                                className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-foreground/70"
                            >
                                {n}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-muted/60 px-4 py-4">
                {METRICAS.map((m, i) => (
                    <div key={m.label} className={cn(i > 0 && "border-l border-border pl-3")}>
                        <dt className="text-base font-bold leading-none tracking-tight">{m.valor}</dt>
                        <dd className="mt-1.5 text-[10px] text-muted-foreground">{m.label}</dd>
                    </div>
                ))}
            </dl>

            <ul className="mt-4 grid grid-cols-3 gap-2">
                {GALERIA.map((foto) => (
                    <li key={foto.src} className="relative aspect-[4/5] overflow-hidden rounded-lg bg-muted">
                        <Image
                            src={foto.src}
                            alt={foto.alt}
                            fill
                            sizes="(max-width: 640px) 30vw, 10vw"
                            className="object-cover"
                        />
                    </li>
                ))}
            </ul>
        </article>
    )
}
