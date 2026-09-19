"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    ExternalLink,
    FileText,
    Heart,
    Info,
    MessageCircle,
    Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { EngajamentoHero, semArroba } from "@/components/public/engajamento-hero"
import {
    FAIXAS_ENGAJAMENTO,
    LEITURA_POR_FAIXA,
    faixaDaTaxa,
} from "@/lib/constants/engajamento"

type Destaque = {
    id: string
    thumb: string | null
    likes: number
    comentarios: number
    link: string | null
}

type Resultado = {
    username: string
    full_name: string
    profile_pic_url: string
    follower_count: number
    posts_count: number
    is_verified: boolean
    engagement_available: boolean
    avg_likes: number | null
    avg_comments: number | null
    engagement_rate: number | null
    analisados: number
    destaques: Destaque[]
}

const compacto = (n: number | null) =>
    n == null
        ? "—"
        : new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(n)

/**
 * O Suspense com `fallback={null}` saiu daqui.
 *
 * Ele existia só para atender ao `useSearchParams`, e o preço era a página não
 * ter HTML nenhum: quem abria /engajamento num 4G do interior via tela em
 * branco até todo o JS baixar e hidratar. O `?perfil=` é lido uma vez só,
 * dentro do efeito, direto de `window.location` — o que dispensa o hook,
 * dispensa o Suspense e devolve a marcação ao servidor.
 */
export default function EngajamentoPage() {
    return <Checador />
}

function Checador() {
    const [username, setUsername] = useState("")
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [resultado, setResultado] = useState<Resultado | null>(null)

    const consultar = useCallback(async (alvo: string) => {
        setCarregando(true)
        setErro(null)
        setResultado(null)

        try {
            const res = await fetch(`/api/engajamento?username=${encodeURIComponent(alvo)}`)
            const json = await res.json()
            if (!res.ok) {
                setErro(json?.error ?? "Não foi possível analisar este perfil.")
            } else {
                setResultado(json as Resultado)
            }
        } catch {
            setErro("Não foi possível analisar este perfil agora. Tente de novo.")
        } finally {
            setCarregando(false)
        }
    }, [])

    async function analisar(e: React.FormEvent) {
        e.preventDefault()
        const alvo = semArroba(username)
        if (alvo) await consultar(alvo)
    }

    // O campo da home navega para cá com ?perfil=; a análise dispara sozinha,
    // uma única vez, para o visitante não precisar clicar de novo.
    const jaAnalisou = useRef(false)
    useEffect(() => {
        if (jaAnalisou.current) return
        const perfil = new URLSearchParams(window.location.search).get("perfil")
        if (!perfil) return
        jaAnalisou.current = true
        // O link da home pode trazer ?perfil=@fulano; o campo já desenha o @,
        // então o estado guarda só o usuário.
        const alvo = semArroba(perfil)
        setUsername(alvo)
        void consultar(alvo)
    }, [consultar])

    return (
        <div className="flex flex-col">
            <EngajamentoHero
                valor={username}
                onChange={setUsername}
                onSubmit={analisar}
                carregando={carregando}
            />

            <div className="mx-auto w-full max-w-[1600px] px-6">
                {erro && (
                    <p
                        role="alert"
                        className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive"
                    >
                        {erro}
                    </p>
                )}

                <AnimatePresence>
                    {resultado && <Resultado dados={resultado} />}
                </AnimatePresence>
            </div>

            <ConviteCreator />
        </div>
    )
}

function Resultado({ dados }: { dados: Resultado }) {
    const faixa = faixaDaTaxa(dados.engagement_rate)
    const interacoes =
        dados.avg_likes != null && dados.avg_comments != null
            ? dados.avg_likes + dados.avg_comments
            : null

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-3xl border border-border bg-card"
        >
            {/* ---------- identificação ---------- */}
            <header className="flex flex-wrap items-center gap-5 border-b border-border p-6 sm:p-8">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                    {dados.profile_pic_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={dados.profile_pic_url}
                            alt={dados.username}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : null}
                </span>

                <div className="min-w-0 flex-1">
                    {/* wrap-anywhere: um @ longo era cortado em silêncio pelo
                                    overflow-hidden do cartão. */}
                                <p className="flex items-center gap-2 text-xl font-bold tracking-tight wrap-anywhere">
                        @{dados.username}
                        {dados.is_verified && (
                            <BadgeCheck className="h-5 w-5 shrink-0 text-status-info" aria-label="Perfil verificado" />
                        )}
                    </p>
                    {dados.full_name && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{dados.full_name}</p>
                    )}
                </div>

                <a
                    href={`https://www.instagram.com/${dados.username}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:border-brand-terracota hover:bg-accent"
                >
                    Ver perfil no Instagram
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
            </header>

            {/* ---------- métricas ---------- */}
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
                <Metrica
                    icone={BarChart3}
                    valor={dados.engagement_rate != null ? `${dados.engagement_rate}%` : "—"}
                    rotulo="Taxa de engajamento"
                    destaque
                />
                <Metrica icone={Users} valor={compacto(dados.follower_count)} rotulo="Seguidores" />
                <Metrica
                    icone={Heart}
                    valor={compacto(interacoes)}
                    rotulo="Média de interações por publicação"
                />
                <Metrica
                    icone={FileText}
                    valor={dados.analisados > 0 ? String(dados.analisados) : "—"}
                    rotulo="Publicações analisadas"
                />
            </div>

            {/* ---------- leitura e régua ---------- */}
            {faixa && (
                <div className="grid gap-px border-t border-border bg-border lg:grid-cols-2">
                    <div className="bg-card p-6 sm:p-8">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-status-sucesso/12 text-status-sucesso">
                            <BarChart3 className="h-5 w-5" aria-hidden />
                        </span>
                        <h3 className="mt-4 text-lg font-bold text-status-sucesso">
                            Engajamento {faixa.toLowerCase()}
                        </h3>
                        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                            {LEITURA_POR_FAIXA[faixa]}
                        </p>
                    </div>

                    <div className="bg-card p-6 sm:p-8">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                            Como esse perfil se compara?
                            <span
                                title="Faixas usuais de mercado para perfis de creator no Instagram."
                                className="text-muted-foreground"
                            >
                                <Info className="h-4 w-4" aria-hidden />
                            </span>
                        </p>

                        <ul className="mt-6 grid grid-cols-5 gap-2">
                            {FAIXAS_ENGAJAMENTO.map((f) => {
                                const ativa = f.nome === faixa
                                return (
                                    <li key={f.nome} className="min-w-0">
                                        <span
                                            aria-hidden
                                            className={cn(
                                                "block h-1.5 rounded-full",
                                                ativa ? "bg-status-sucesso" : "bg-muted"
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                // Sem truncate: em 360px a coluna da régua tem 49px e "Muito baixo"
                                                // virava "Muito ba…". Quebrar em duas linhas mostra o rótulo inteiro.
                                                "mt-2 block text-[11px] leading-[1.15] hyphens-auto break-words",
                                                ativa
                                                    ? "font-semibold text-foreground"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {f.nome}
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            )}

            {!dados.engagement_available && (
                <p className="border-t border-border bg-muted/40 px-6 py-5 text-sm text-muted-foreground sm:px-8">
                    Não foi possível ler as publicações recentes deste perfil, então a taxa de
                    engajamento não pôde ser calculada. Os dados de seguidores seguem válidos.
                </p>
            )}

            {/* ---------- destaques ---------- */}
            {dados.destaques.length > 0 && (
                <div className="border-t border-border p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <h3 className="font-bold tracking-tight">Destaques das últimas publicações</h3>
                        <a
                            href={`https://www.instagram.com/${dados.username}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="group hidden items-center gap-2 text-sm font-medium text-brand-terracota sm:inline-flex"
                        >
                            Ver mais no Instagram
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                        </a>
                    </div>

                    <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        {dados.destaques.map((d) => (
                            <li key={d.id} className="relative overflow-hidden rounded-xl bg-muted">
                                <a
                                    href={d.link ?? `https://www.instagram.com/${dados.username}/`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group block"
                                >
                                    <span className="relative block aspect-square">
                                        {d.thumb ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={d.thumb}
                                                alt=""
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : null}
                                    </span>
                                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-brand-carvao/80 to-transparent px-3 pb-2.5 pt-8 text-[11px] font-medium text-white">
                                        <span className="inline-flex items-center gap-1">
                                            <Heart className="h-3 w-3" aria-hidden />
                                            {compacto(d.likes)}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <MessageCircle className="h-3 w-3" aria-hidden />
                                            {compacto(d.comentarios)}
                                        </span>
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </motion.section>
    )
}

function Metrica({
    icone: Icone,
    valor,
    rotulo,
    destaque = false,
}: {
    icone: React.ElementType
    valor: string
    rotulo: string
    destaque?: boolean
}) {
    return (
        <div className="bg-card p-6">
            <span
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    destaque
                        ? "bg-brand-terracota/12 text-brand-terracota"
                        : "bg-muted text-muted-foreground"
                )}
            >
                <Icone className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <p className="mt-4 text-[clamp(1.6rem,2.4vw,2.2rem)] font-extrabold leading-none tracking-tight">
                {valor}
            </p>
            <p className="mt-2 text-sm leading-snug text-muted-foreground">{rotulo}</p>
        </div>
    )
}

/** Fecho: converte quem chegou pela ferramenta. */
function ConviteCreator() {
    return (
        <section className="border-t border-border">
            <div className="mx-auto w-full max-w-[1600px] px-6 py-14 lg:py-16">
                <div className="rounded-3xl border border-border bg-card p-8 lg:p-10">
                    <h2 className="max-w-lg text-[clamp(1.6rem,2.6vw,2.2rem)] font-extrabold leading-tight tracking-[-0.03em]">
                        É creator? Faça parte da PRETA.
                    </h2>
                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                        Cadastre-se gratuitamente, organize seus dados, crie seu Media Kit e apareça
                        para marcas que valorizam a sua história.
                    </p>
                    <Link
                        href="/creator/criar-conta"
                        className="group mt-7 inline-flex h-13 items-center gap-3 rounded-full bg-brand-terracota px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-coral"
                    >
                        Criar minha conta
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                </div>
            </div>
        </section>
    )
}
