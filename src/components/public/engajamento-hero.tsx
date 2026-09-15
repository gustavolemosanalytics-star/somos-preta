"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Instagram, Loader2, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Abertura do checador de engajamento — usada na tela /engajamento e, em versão
 * compacta, como dobra da home.
 *
 * O formulário é o mesmo nos dois lugares; na home ele não consulta, apenas
 * leva para a tela com o @ já preenchido, para a análise acontecer onde o
 * resultado cabe.
 */

/**
 * Tira o @ (e os espaços) do que foi digitado ou colado.
 *
 * O @ virou moldura fixa do campo, desenhada ao lado do texto. Sem isso, quem
 * digita o @ por hábito — ou cola "@fulano" — veria "@@fulano" na tela. O valor
 * guardado é sempre o usuário puro, que é o que a API espera.
 */
export function semArroba(entrada: string) {
    return entrada.replace(/@/g, "").replace(/\s+/g, "")
}

type Props = {
    valor: string
    onChange: (v: string) => void
    onSubmit: (e: React.FormEvent) => void
    carregando?: boolean
    /** Na home o envio navega em vez de consultar. */
    compacta?: boolean
    className?: string
}

export function EngajamentoHero({
    valor,
    onChange,
    onSubmit,
    carregando = false,
    compacta = false,
    className,
}: Props) {
    return (
        <section className={cn("relative isolate overflow-hidden bg-background", className)}>
            <div
                className={cn(
                    "mx-auto grid max-w-[1600px] items-center gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]",
                    compacta ? "py-14 lg:py-16" : "pb-10 pt-12 lg:pb-12 lg:pt-14"
                )}
            >
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Ferramenta gratuita
                    </p>

                    <h2
                        className={cn(
                            "mt-5 font-extrabold leading-[1.06] tracking-[-0.032em]",
                            compacta
                                ? "text-[clamp(2rem,3.2vw,3rem)]"
                                : "text-[clamp(2.2rem,3.8vw,3.6rem)]"
                        )}
                    >
                        Descubra o
                        <br />
                        <span className="text-brand-terracota">engajamento</span>
                        <br />
                        de um creator
                    </h2>

                    <p className="mt-5 max-w-md text-[16px] leading-relaxed text-muted-foreground">
                        Digite o @ do Instagram e veja a taxa de engajamento com base nas
                        publicações recentes.
                    </p>

                    <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            {/* O @ fica do lado do texto, não dentro dele: quem digita
                                lê "@fulano" sem nunca ter de escrever o @. */}
                            <div className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
                                <Instagram
                                    className="h-[18px] w-[18px] text-muted-foreground"
                                    aria-hidden
                                />
                                <span
                                    aria-hidden
                                    className={cn(
                                        "text-[15px] leading-none",
                                        valor ? "text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    @
                                </span>
                            </div>
                            <input
                                value={valor}
                                onChange={(e) => onChange(semArroba(e.target.value))}
                                placeholder="seuperfil"
                                aria-label="Perfil do Instagram, sem o @"
                                autoComplete="off"
                                inputMode="text"
                                autoCapitalize="none"
                                spellCheck={false}
                                className="h-14 w-full rounded-2xl border border-border bg-card pl-14 pr-10 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-brand-terracota"
                            />
                            {valor && (
                                <button
                                    type="button"
                                    onClick={() => onChange("")}
                                    aria-label="Limpar"
                                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={carregando || !valor.trim()}
                            className="inline-flex h-14 shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-brand-terracota px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand-coral disabled:opacity-60"
                        >
                            {carregando ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                                <Search className="h-4 w-4" aria-hidden />
                            )}
                            Analisar perfil
                        </button>
                    </form>

                    {compacta ? (
                        <Link
                            href="/engajamento"
                            className="mt-5 inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            Ver como calculamos
                        </Link>
                    ) : null}
                </motion.div>

                <Colagem compacta={compacta} />
            </div>
        </section>
    )
}

/** Colagem de apoio, com as mesmas fotos da landing. */
function Colagem({ compacta }: { compacta: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative hidden aspect-[900/620] lg:block"
        >
            <div className="absolute left-[30%] top-0 h-[92%] w-[40%] overflow-hidden rounded-2xl bg-muted shadow-[0_22px_54px_-24px_rgba(31,31,31,0.45)]">
                <Image
                    src="/quem-somos/cultura.webp"
                    alt="Criadora de conteúdo do Nordeste"
                    fill
                    sizes="(max-width: 1024px) 0px, 20vw"
                    className="object-cover"
                />
            </div>

            <div className="absolute left-[4%] top-[14%] h-[52%] w-[26%] -rotate-3 overflow-hidden rounded-2xl bg-muted shadow-[0_18px_44px_-24px_rgba(31,31,31,0.4)]">
                <Image
                    src="/hero/criadora-cacheada.webp"
                    alt="Criadora de conteúdo"
                    fill
                    sizes="(max-width: 1024px) 0px, 13vw"
                    className="object-cover"
                />
            </div>

            <div className="absolute left-[72%] top-[8%] h-[46%] w-[26%] rotate-2 overflow-hidden rounded-2xl bg-muted shadow-[0_18px_44px_-24px_rgba(31,31,31,0.4)]">
                <Image
                    src="/hero/paisagem-falesias.webp"
                    alt="Litoral do Nordeste"
                    fill
                    sizes="(max-width: 1024px) 0px, 13vw"
                    className="object-cover"
                />
            </div>

            <p
                aria-hidden
                className="absolute left-0 top-[68%] max-w-[10ch] -rotate-3 font-manuscrita text-[clamp(1.1rem,1.5vw,1.5rem)] leading-[1.2] text-brand-carvao"
            >
                Mais dados para melhores conexões.
                <span aria-hidden className="mt-2 block h-[2px] w-16 rounded-full bg-brand-coral" />
            </p>

            {!compacta && (
                <p
                    aria-hidden
                    className="absolute right-[1%] top-[60%] max-w-[9ch] rotate-3 font-manuscrita text-[clamp(1.1rem,1.5vw,1.5rem)] leading-[1.2] text-brand-coral"
                >
                    Creators movem culturas
                </p>
            )}
        </motion.div>
    )
}
