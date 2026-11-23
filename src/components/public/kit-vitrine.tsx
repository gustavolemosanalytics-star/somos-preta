import {
    ArrowDownRight, ArrowUpRight, AtSign, BadgeCheck, Bookmark, Check, Clock, Eye, Heart, Images, Instagram,
    MapPin, MessageCircle, Music2, Play, Radar, Send, Sparkles, Twitter, Users, Youtube,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
    lerAparencia, normalizarHandle, paletaDoTema,
    type Aparencia, type ChaveSecao,
} from "@/lib/constants/media-kit"
import {
    duracao, lerMetricas, numeroCompacto, percentual,
    type Audiencia, type Fatia, type MetricasInstagram, type PostInstagram, type TipoPost,
} from "@/lib/instagram/tipos"
import { BotaoWhatsapp, ContarVisualizacao } from "@/components/public/kit-metricas"
import { FONTE_DISPLAY, VARIAVEIS_DE_FONTE } from "@/components/public/kit/fontes"
import { Grafismo } from "@/components/public/kit/grafismo"
import {
    BarraDeFormatos, CurvaDeAlcance, CurvaDeSeguidores, MedidorCircular, ROTULO_DO_FORMATO, SeloGiratorio,
} from "@/components/public/kit/graficos"

/**
 * A vitrine do Media Kit — o desenho da página que a marca abre.
 *
 * Vive fora da rota porque tem TRÊS pontas: /kit/[slug] renderiza com o que
 * veio da view pública, /kit/[slug]/pdf imprime a mesma coisa, e o editor
 * renderiza com o estado local, ao vivo, para a criadora ver o resultado
 * enquanto escolhe cor, tipografia e grafismo.
 *
 * PERSONALIZAÇÃO
 * A paleta (coluna `tema`) vira variáveis CSS na raiz (--kit-fundo,
 * --kit-acento...), registradas no Tailwind como `kit-*`. Todo o desenho abaixo
 * fala só nessas variáveis; trocar de paleta não muda uma classe sequer.
 * Tipografia, grafismo, abertura e ordem das seções vêm de `aparencia`.
 *
 * A largura é medida por CONTAINER (`@container`, `@3xl:`, unidade `cqi`),
 * não por viewport: a prévia do editor ocupa uma coluna de 400px numa tela
 * larga e precisa mostrar o layout de celular, não o de desktop espremido.
 *
 * Componente de servidor de propósito (só os dois contadores são cliente): a
 * marca abre o link no celular e o que chega é HTML pronto, sem esperar
 * JavaScript para ver o primeiro número.
 */

export type RedeSocial = {
    handle?: string
    followers?: number | null
    engagement_rate?: number | null
    verificado?: boolean
}

export type ItemVitrine = {
    titulo?: string
    imagem?: string
    descricao?: string
    link?: string
}

export type PacoteVitrine = {
    nome?: string
    preco?: string | number
    descricao?: string
    itens?: string[]
}

/** O mínimo para desenhar. A view pública e o editor satisfazem os dois. */
export type DadosVitrine = {
    nome: string
    whatsapp?: string | null
    bio?: string | null
    avatar_url?: string | null
    cover_url?: string | null
    cidade?: string | null
    estado?: string | null
    nichos?: string[] | null
    tema?: string | null
    redes?: Record<string, RedeSocial | undefined> | null
    portfolio?: ItemVitrine[] | null
    pacotes?: PacoteVitrine[] | null
    aparencia?: Record<string, unknown> | Aparencia | null
    chamada?: string | null
    marcas?: string[] | null
    metricas_instagram?: Record<string, unknown> | MetricasInstagram | null
}

const REDES: Record<string, { label: string; icone: typeof Instagram; url: (h: string) => string }> = {
    instagram: { label: "Instagram", icone: Instagram, url: (h) => `https://instagram.com/${h}` },
    tiktok: { label: "TikTok", icone: Music2, url: (h) => `https://www.tiktok.com/@${h}` },
    youtube: { label: "YouTube", icone: Youtube, url: (h) => `https://www.youtube.com/@${h}` },
    twitter: { label: "X / Twitter", icone: Twitter, url: (h) => `https://x.com/${h}` },
}

const ICONE_DO_FORMATO: Record<TipoPost, typeof Play> = { reel: Play, video: Play, carrossel: Images, foto: Heart }

function dataCurta(iso: string | null | undefined) {
    if (!iso) return null
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }).replace(/\./g, "")
}

export function KitVitrine({
    kit,
    /**
     * "previa" desliga os links (ninguém quer sair do editor por engano),
     * tira o min-h-dvh e a barra fixa, porque ali a vitrine mora numa moldura.
     */
    modo = "publico",
    /**
     * O endereço do kit. Só vem preenchido na página pública de um kit de
     * verdade: é ele que liga a contagem de visualização e de clique.
     */
    slug,
    /** "abertura" desenha só o topo — é a miniatura dos modelos no editor. */
    parte = "tudo",
    className,
}: {
    kit: DadosVitrine
    modo?: "publico" | "previa"
    slug?: string
    parte?: "tudo" | "abertura"
    className?: string
}) {
    const previa = modo === "previa"
    const paleta = paletaDoTema(kit.tema)
    const aparencia = lerAparencia(kit.aparencia)
    const fonte = FONTE_DISPLAY[aparencia.fonte]

    // ---------- dados ----------
    const redes = Object.entries(kit.redes ?? {})
        .filter((e): e is [string, RedeSocial] => Boolean(e[1]?.handle))
        .map(([chave, r]) => ({ chave, ...r, handle: normalizarHandle(r.handle ?? "") }))
        .filter((r) => r.handle)

    // As métricas só valem para o @ que está no kit agora. Trocar de @ sem
    // conseguir atualizar não pode deixar os números da conta antiga no ar.
    const ig = (() => {
        const m = lerMetricas(kit.metricas_instagram)
        const handle = redes.find((r) => r.chave === "instagram")?.handle.toLowerCase()
        return m && handle && m.username === handle ? m : null
    })()

    // O Instagram verificado manda no número; as outras redes vêm do que a
    // criadora digitou.
    const seguidoresDe = (r: (typeof redes)[number]) =>
        r.chave === "instagram" && ig ? ig.seguidores : typeof r.followers === "number" ? r.followers : null
    const alcance = redes.reduce((soma, r) => soma + (seguidoresDe(r) ?? 0), 0)

    const portfolio = (Array.isArray(kit.portfolio) ? kit.portfolio : []).filter((i) => i?.titulo || i?.imagem)
    const pacotes = (Array.isArray(kit.pacotes) ? kit.pacotes : []).filter((p) => p?.nome)
    const marcas = (kit.marcas ?? []).map((m) => m.trim()).filter(Boolean)
    const destaques = (ig?.destaques ?? []).filter((p) => p.imagem || p.link)
    const whatsapp = kit.whatsapp ? kit.whatsapp.replace(/\D/g, "") : null
    const local = [kit.cidade, kit.estado].filter(Boolean).join(", ")
    const ano = new Date().getFullYear()

    const temConteudo: Record<ChaveSecao, boolean> = {
        numeros: redes.length > 0,
        audiencia: Boolean(ig?.audiencia),
        destaques: destaques.length >= 3,
        portfolio: portfolio.length > 0,
        marcas: marcas.length > 0,
        pacotes: pacotes.length > 0,
    }
    const secoes = aparencia.secoes.filter((s) => s.visivel && temConteudo[s.chave]).map((s) => s.chave)
    const numeroDa = (chave: ChaveSecao) => String(secoes.indexOf(chave) + 1).padStart(2, "0")

    const link = (href: string) => (previa ? { tabIndex: -1 } : { href, target: "_blank", rel: "noopener noreferrer" })

    const contexto: Contexto = { previa, fonteTitulo: fonte.titulo, link }

    const estilo = {
        "--kit-fundo": paleta.fundo,
        "--kit-superficie": paleta.superficie,
        "--kit-tinta": paleta.tinta,
        "--kit-suave": paleta.suave,
        "--kit-linha": paleta.linha,
        "--kit-acento": paleta.acento,
        "--kit-acento2": paleta.acento2,
        "--kit-leitura": paleta.leitura,
        "--kit-botao": paleta.botao,
        "--kit-sobre-botao": paleta.sobreBotao,
        "--kit-fonte-display": fonte.familia,
        colorScheme: paleta.escuro ? "dark" : "light",
    } as React.CSSProperties

    const botaoContato = (rotulo: string, classe: string) =>
        whatsapp ? (
            slug && !previa ? (
                <BotaoWhatsapp slug={slug} numero={whatsapp} className={classe}>
                    <MessageCircle className="h-4.5 w-4.5" aria-hidden /> {rotulo}
                </BotaoWhatsapp>
            ) : (
                <a {...link(`https://wa.me/${whatsapp}`)} className={classe}>
                    <MessageCircle className="h-4.5 w-4.5" aria-hidden /> {rotulo}
                </a>
            )
        ) : null

    return (
        <div
            style={estilo}
            className={cn(
                VARIAVEIS_DE_FONTE,
                "@container relative isolate overflow-x-clip bg-kit-fundo text-kit-tinta antialiased",
                !previa && "min-h-dvh",
                previa && "pointer-events-none select-none",
                className,
            )}
        >
            {/* ---------- barra fixa ---------- */}
            {!previa && parte === "tudo" && (
                <div className="sticky top-0 z-30 border-b border-kit-linha/70 bg-kit-fundo/75 backdrop-blur-xl print:hidden">
                    <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-5">
                        <span className="flex min-w-0 items-center gap-2.5">
                            {kit.avatar_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={kit.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                            )}
                            <span className="truncate text-sm font-semibold">{kit.nome}</span>
                            <span className="hidden text-xs uppercase tracking-[0.18em] text-kit-suave @md:inline">
                                · Media Kit {ano}
                            </span>
                        </span>
                        {whatsapp && (
                            <a
                                href="#contato"
                                className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-kit-botao px-4 text-[13px] font-semibold text-kit-sobre-botao transition-opacity hover:opacity-90"
                            >
                                Vamos conversar <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* ---------- abertura ---------- */}
            <Abertura
                kit={kit}
                aparencia={aparencia}
                ctx={contexto}
                redes={redes}
                seguidoresDe={seguidoresDe}
                ig={ig}
                local={local}
                ano={ano}
                botaoContato={botaoContato("Quero trabalhar com você", "inline-flex h-12 items-center gap-2 rounded-full bg-kit-botao px-6 text-sm font-semibold text-kit-sobre-botao shadow-[0_12px_30px_-12px_var(--kit-botao)] transition-transform hover:-translate-y-0.5")}
            />

            {parte === "tudo" && (
            <>
            {/* ---------- seções na ordem escolhida ---------- */}
            <div className="mx-auto w-full max-w-6xl space-y-20 px-5 pb-6 @3xl:space-y-28">
                {secoes.map((chave) => {
                    const numero = numeroDa(chave)
                    if (chave === "numeros") {
                        return <SecaoNumeros key={chave} numero={numero} ctx={contexto} ig={ig} redes={redes} seguidoresDe={seguidoresDe} alcance={alcance} />
                    }
                    if (chave === "audiencia" && ig?.audiencia) {
                        return <SecaoAudiencia key={chave} numero={numero} ctx={contexto} audiencia={ig.audiencia} naoSeguidoresPct={ig.insights_30d?.alcance_nao_seguidores_pct ?? null} />
                    }
                    if (chave === "destaques") {
                        return <SecaoDestaques key={chave} numero={numero} ctx={contexto} destaques={destaques} handle={ig?.username ?? ""} />
                    }
                    if (chave === "portfolio") return <SecaoPortfolio key={chave} numero={numero} ctx={contexto} itens={portfolio} />
                    if (chave === "marcas") return <SecaoMarcas key={chave} numero={numero} ctx={contexto} marcas={marcas} />
                    return <SecaoPacotes key={chave} numero={numero} ctx={contexto} pacotes={pacotes} />
                })}
            </div>

            {/* ---------- convite final ---------- */}
            <section id="contato" className="mx-auto w-full max-w-6xl px-5 pb-10 pt-16 @3xl:pt-24">
                <div className="relative isolate overflow-hidden rounded-[2rem] bg-kit-botao px-6 py-14 text-center text-kit-sobre-botao @3xl:rounded-[2.5rem] @3xl:px-12 @3xl:py-20">
                    <Grafismo tipo={aparencia.grafismo === "liso" ? "aneis" : aparencia.grafismo} intensidade="suave" />
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] opacity-80">
                        {whatsapp ? "Parcerias abertas" : "Contato"}
                    </p>
                    <h2 className={cn("font-kit mx-auto mt-4 max-w-3xl text-[clamp(2.2rem,8cqi,5rem)] leading-[0.95]", fonte.titulo)}>
                        Vamos criar algo juntos?
                    </h2>
                    <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed opacity-85">
                        {whatsapp
                            ? `Me chama para conversar sobre a sua marca — respondo pelo WhatsApp.`
                            : "Me encontre nas redes abaixo."}
                    </p>
                    {whatsapp && (
                        <div className="mt-8 flex justify-center">
                            {botaoContato(
                                "Falar no WhatsApp",
                                "inline-flex h-13 items-center gap-2 rounded-full bg-kit-sobre-botao px-8 text-[15px] font-semibold text-kit-botao transition-transform hover:-translate-y-0.5",
                            )}
                        </div>
                    )}
                    {redes.length > 0 && (
                        <ul className="mt-8 flex flex-wrap justify-center gap-2">
                            {redes.map((r) => {
                                const cfg = REDES[r.chave] ?? { label: r.chave, icone: AtSign, url: () => "#" }
                                const Icone = cfg.icone
                                return (
                                    <li key={r.chave}>
                                        <a
                                            {...link(cfg.url(r.handle))}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-current/25 px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-kit-sobre-botao/10"
                                        >
                                            <Icone className="h-3.5 w-3.5" aria-hidden /> @{r.handle}
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>

                <p className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-kit-suave">
                    <span>© {ano} {kit.nome}</span>
                    <span>
                        Media Kit feito com{" "}
                        <a {...link("https://somospreta.com")} className="font-semibold text-kit-tinta hover:underline">
                            Somos Preta
                        </a>
                    </span>
                </p>
            </section>

            </>
            )}

            {slug && !previa && <ContarVisualizacao slug={slug} />}
        </div>
    )
}

/* ============================================================================ */

type Contexto = {
    previa: boolean
    fonteTitulo: string
    link: (href: string) => Record<string, unknown>
}

type RedeNormalizada = RedeSocial & { chave: string; handle: string }

function Abertura({
    kit, aparencia, ctx, redes, seguidoresDe, ig, local, ano, botaoContato,
}: {
    kit: DadosVitrine
    aparencia: Aparencia
    ctx: Contexto
    redes: RedeNormalizada[]
    seguidoresDe: (r: RedeNormalizada) => number | null
    ig: MetricasInstagram | null
    local: string
    ano: number
    botaoContato: React.ReactNode
}) {
    const inicial = (kit.nome || "?").slice(0, 1).toUpperCase()
    const nome = kit.nome || "Seu nome aqui"

    const sobrancelha = (
        <p className="inline-flex items-center gap-2 rounded-full border border-kit-linha bg-kit-superficie/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-kit-suave backdrop-blur">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-kit-acento" />
            Media Kit {ano}
        </p>
    )

    const titulo = (centro = false) => (
        <h1
            className={cn(
                "font-kit mt-5 break-words text-[clamp(2.8rem,11cqi,7.5rem)] leading-[0.92]",
                ctx.fonteTitulo,
                centro && "mx-auto",
            )}
        >
            {nome}
        </h1>
    )

    const chamada = kit.chamada?.trim() ? (
        <p className="font-kit mt-5 max-w-xl text-[clamp(1.2rem,3.4cqi,1.75rem)] leading-snug text-kit-leitura">
            {kit.chamada}
        </p>
    ) : null

    const bio = kit.bio ? (
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed break-words text-kit-suave @3xl:text-base">{kit.bio}</p>
    ) : null

    const etiquetas = (centro = false) =>
        local || (kit.nichos ?? []).length > 0 ? (
            <div className={cn("mt-6 flex flex-wrap gap-2", centro && "justify-center")}>
                {local && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-kit-tinta px-3 py-1.5 text-[13px] font-medium text-kit-fundo">
                        <MapPin className="h-3.5 w-3.5" aria-hidden /> {local}
                    </span>
                )}
                {(kit.nichos ?? []).map((n) => (
                    <span key={n} className="rounded-full border border-kit-linha bg-kit-superficie/70 px-3 py-1.5 text-[13px] font-medium">
                        {n}
                    </span>
                ))}
            </div>
        ) : null

    const perfis = (centro = false) =>
        redes.length > 0 ? (
            <ul className={cn("mt-7 flex flex-wrap gap-2.5", centro && "justify-center")}>
                {redes.map((r) => {
                    const cfg = REDES[r.chave] ?? { label: r.chave, icone: AtSign, url: () => "#" }
                    const Icone = cfg.icone
                    const n = seguidoresDe(r)
                    return (
                        <li key={r.chave}>
                            <a
                                {...ctx.link(cfg.url(r.handle))}
                                className="group inline-flex items-center gap-2.5 rounded-2xl border border-kit-linha bg-kit-superficie px-3.5 py-2.5 transition-colors hover:border-kit-acento"
                            >
                                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-kit-acento/15 text-kit-leitura">
                                    <Icone className="h-4 w-4" aria-hidden />
                                </span>
                                <span className="text-left leading-tight">
                                    <span className="block text-[15px] font-bold tabular-nums">
                                        {n !== null ? numeroCompacto(n) : cfg.label}
                                    </span>
                                    <span className="block text-xs text-kit-suave">@{r.handle}</span>
                                </span>
                            </a>
                        </li>
                    )
                })}
            </ul>
        ) : null

    const acoes = (centro = false) => (
        <div className={cn("mt-8 flex flex-wrap items-center gap-3", centro && "justify-center")}>
            {botaoContato}
            {redes.length > 0 && (
                <a
                    href={ctx.previa ? undefined : "#numeros"}
                    tabIndex={ctx.previa ? -1 : undefined}
                    className="inline-flex h-12 items-center gap-2 rounded-full border border-kit-linha px-5 text-sm font-semibold transition-colors hover:border-kit-tinta"
                >
                    Ver meus números <ArrowDownRight className="h-4 w-4" aria-hidden />
                </a>
            )}
        </div>
    )

    const foto = (classe: string) =>
        kit.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={kit.avatar_url} alt={`Foto de ${nome}`} className={classe} />
        ) : (
            <span className={cn(classe, "flex items-center justify-center bg-kit-acento/20 font-kit text-[clamp(3rem,14cqi,8rem)] text-kit-leitura")}>
                {inicial}
            </span>
        )

    /* ---------- capa ---------- */
    if (aparencia.abertura === "capa") {
        return (
            <header className="relative">
                <div className="relative isolate h-[clamp(13rem,42cqi,28rem)] overflow-hidden bg-kit-acento/25">
                    {kit.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={kit.cover_url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
                    ) : (
                        <Grafismo tipo={aparencia.grafismo === "liso" ? "aurora" : aparencia.grafismo} />
                    )}
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-kit-fundo to-transparent" />
                </div>
                <div className="relative mx-auto max-w-6xl px-5 pb-16">
                    <div className="-mt-20 flex flex-wrap items-end gap-5 @3xl:-mt-24">
                        <span className="block h-32 w-32 overflow-hidden rounded-[2rem] border-4 border-kit-fundo bg-kit-superficie shadow-xl @3xl:h-40 @3xl:w-40">
                            {foto("h-full w-full object-cover")}
                        </span>
                        {sobrancelha}
                    </div>
                    <div className="@4xl:grid @4xl:grid-cols-[1.15fr_0.85fr] @4xl:gap-14">
                        <div>
                            {titulo()}
                            {chamada}
                            {acoes()}
                        </div>
                        <div className="@4xl:pt-8">
                            {bio}
                            {etiquetas()}
                            {perfis()}
                        </div>
                    </div>
                </div>
            </header>
        )
    }

    /* ---------- central ---------- */
    if (aparencia.abertura === "central") {
        return (
            <header className="relative isolate overflow-hidden px-5 pb-20 pt-14 text-center @3xl:pt-20">
                <Grafismo tipo={aparencia.grafismo} />
                <div className="mx-auto flex max-w-3xl flex-col items-center">
                    <span className="relative block h-36 w-36 @3xl:h-44 @3xl:w-44">
                        <span
                            aria-hidden
                            className="kit-anima-girar absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,var(--kit-acento),var(--kit-acento2),var(--kit-acento))]"
                        />
                        <span className="absolute inset-[5px] overflow-hidden rounded-full border-4 border-kit-fundo bg-kit-superficie">
                            {foto("h-full w-full object-cover")}
                        </span>
                    </span>
                    <div className="mt-8">{sobrancelha}</div>
                    {titulo(true)}
                    {chamada && <div className="flex justify-center text-center">{chamada}</div>}
                    {bio && <div className="flex justify-center">{bio}</div>}
                    {etiquetas(true)}
                    {perfis(true)}
                    {acoes(true)}
                </div>
            </header>
        )
    }

    /* ---------- retrato (padrão) ---------- */
    const engajamento = ig?.taxa_engajamento ?? null
    return (
        <header className="relative isolate overflow-hidden">
            <Grafismo tipo={aparencia.grafismo} />
            <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 @3xl:grid @3xl:grid-cols-[1.12fr_0.88fr] @3xl:items-center @3xl:gap-12 @3xl:pb-24 @3xl:pt-16">
                <div>
                    {sobrancelha}
                    {titulo()}
                    {chamada}
                    {bio}
                    {etiquetas()}
                    {perfis()}
                    {acoes()}
                </div>

                <div className="relative mx-auto mt-14 w-full max-w-[22rem] @3xl:mt-0 @3xl:max-w-[26rem]">
                    <span aria-hidden className="absolute -inset-3 -z-10 rotate-[-4deg] rounded-[2.5rem] bg-kit-acento/25" />
                    <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border border-kit-linha bg-kit-superficie shadow-[0_40px_80px_-40px_rgba(0,0,0,0.5)]">
                        {foto("h-full w-full object-cover")}
                    </div>

                    {ig && (
                        <div className="absolute -left-4 bottom-10 rounded-2xl border border-kit-linha bg-kit-superficie/85 px-4 py-3 shadow-xl backdrop-blur-md @3xl:-left-10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kit-suave">Seguidores</p>
                            <p className="font-kit text-2xl font-bold tabular-nums">{numeroCompacto(ig.seguidores)}</p>
                            {typeof ig.crescimento_30d === "number" && ig.crescimento_30d !== 0 && (
                                <p className="text-xs font-semibold text-kit-leitura">
                                    {ig.crescimento_30d > 0 ? "+" : ""}
                                    {percentual(ig.crescimento_30d)} em 30 dias
                                </p>
                            )}
                        </div>
                    )}
                    {engajamento !== null && (
                        <div className="absolute -right-3 top-8 flex items-center gap-2.5 rounded-2xl border border-kit-linha bg-kit-superficie/85 px-3.5 py-2.5 shadow-xl backdrop-blur-md @3xl:-right-8">
                            <MedidorCircular valor={engajamento} className="h-9 w-9" />
                            <span className="leading-tight">
                                <span className="block font-kit text-lg font-bold tabular-nums">{percentual(engajamento)}</span>
                                <span className="block text-[11px] text-kit-suave">engajamento</span>
                            </span>
                        </div>
                    )}
                    <SeloGiratorio
                        texto={` media kit • ${(kit.nome || "criadora").split(" ")[0]} • ${ano} •`}
                        className="absolute -bottom-8 -right-4 h-24 w-24 @3xl:h-28 @3xl:w-28"
                    />
                </div>
            </div>
        </header>
    )
}

function Titulo({ numero, rotulo, titulo, ctx, extra }: { numero: string; rotulo: string; titulo: string; ctx: Contexto; extra?: React.ReactNode }) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-kit-linha pb-5 @3xl:mb-10">
            <div>
                <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-kit-suave">
                    <span className="font-kit text-sm tabular-nums text-kit-leitura">{numero}</span>
                    <span aria-hidden className="h-px w-8 bg-kit-linha" />
                    {rotulo}
                </p>
                <h2 className={cn("font-kit mt-3 text-[clamp(2rem,6.5cqi,3.75rem)] leading-[0.95]", ctx.fonteTitulo)}>{titulo}</h2>
            </div>
            {extra}
        </div>
    )
}

function SecaoNumeros({
    numero, ctx, ig, redes, seguidoresDe, alcance,
}: {
    numero: string
    ctx: Contexto
    ig: MetricasInstagram | null
    redes: RedeNormalizada[]
    seguidoresDe: (r: RedeNormalizada) => number | null
    alcance: number
}) {
    const outras = redes.filter((r) => !(r.chave === "instagram" && ig))
    const selo = ig ? (
        <p className="inline-flex items-center gap-1.5 rounded-full border border-kit-linha bg-kit-superficie px-3 py-1.5 text-xs font-medium text-kit-suave">
            <BadgeCheck className="h-3.5 w-3.5 text-kit-leitura" aria-hidden />
            Dados oficiais do Instagram
            {dataCurta(ig.atualizado_em) && <> · {dataCurta(ig.atualizado_em)}</>}
        </p>
    ) : null

    // ---------- um grid só, sem buraco ----------
    // Cada cartão declara quantas colunas ocupa no grid de 4 (largo) e no de
    // 2 (médio). O último estica para fechar a linha: um buraco no fim do
    // grid é o tipo de detalhe que faz a página parecer inacabada.
    type Cartao = { chave: string; c4: number; c2: number; linhas4?: number; conteudo: React.ReactNode }
    const cartoes: Cartao[] = []

    const metricas: Cartao[] = []
    if (ig?.taxa_engajamento != null) {
        metricas.push({
            chave: "engajamento", c4: 1, c2: 1,
            conteudo: (
                <Metrica rotulo="Engajamento médio" ctx={ctx} valor={percentual(ig.taxa_engajamento)} nota="curtidas + comentários por seguidor, por post">
                    <MedidorCircular valor={ig.taxa_engajamento} className="absolute right-5 top-5 h-12 w-12" />
                </Metrica>
            ),
        })
    }
    if (ig?.media_visualizacoes != null) {
        metricas.push({
            chave: "views", c4: 1, c2: 1,
            conteudo: (
                <Metrica rotulo="Views médias nos Reels" ctx={ctx} valor={numeroCompacto(ig.media_visualizacoes)} nota="por Reel publicado">
                    <Eye className="absolute right-5 top-5 h-5 w-5 text-kit-leitura" aria-hidden />
                </Metrica>
            ),
        })
    }
    if (ig?.media_curtidas != null) {
        metricas.push({
            chave: "curtidas", c4: 1, c2: 1,
            conteudo: (
                <Metrica rotulo="Curtidas por post" ctx={ctx} valor={numeroCompacto(ig.media_curtidas)} nota={`${numeroCompacto(ig.media_comentarios)} comentários em média`}>
                    <Heart className="absolute right-5 top-5 h-5 w-5 text-kit-leitura" aria-hidden />
                </Metrica>
            ),
        })
    }
    const i30 = ig?.insights_30d
    if (i30?.alcance != null) {
        metricas.unshift({
            chave: "alcance", c4: 1, c2: 1,
            conteudo: (
                <Metrica
                    rotulo="Alcance em 30 dias"
                    ctx={ctx}
                    valor={numeroCompacto(i30.alcance)}
                    nota="contas diferentes que viram meu conteúdo"
                    rodape={ig && ig.alcance_diario.length >= 2 ? <CurvaDeAlcance pontos={ig.alcance_diario} id="kit-alcance" className="mt-4 h-10 w-full" /> : null}
                >
                    <Radar className="absolute right-5 top-5 h-5 w-5 text-kit-leitura" aria-hidden />
                </Metrica>
            ),
        })
    }
    if (i30?.contas_engajadas != null) {
        metricas.push({
            chave: "engajadas", c4: 1, c2: 1,
            conteudo: (
                <Metrica rotulo="Contas engajadas" ctx={ctx} valor={numeroCompacto(i30.contas_engajadas)} nota="interagiram nos últimos 30 dias">
                    <Users className="absolute right-5 top-5 h-5 w-5 text-kit-leitura" aria-hidden />
                </Metrica>
            ),
        })
    }
    if (ig?.media_alcance != null) {
        metricas.push({
            chave: "alcance-post", c4: 1, c2: 1,
            conteudo: (
                <Metrica
                    rotulo="Alcance por post"
                    ctx={ctx}
                    valor={numeroCompacto(ig.media_alcance)}
                    nota={ig.taxa_engajamento_alcance != null ? `${percentual(ig.taxa_engajamento_alcance)} de quem vê interage` : "média das últimas publicações"}
                >
                    <Eye className="absolute right-5 top-5 h-5 w-5 text-kit-leitura" aria-hidden />
                </Metrica>
            ),
        })
    }
    if (ig && (ig.media_salvamentos != null || ig.media_compartilhamentos != null)) {
        metricas.push({
            chave: "salvos", c4: 1, c2: 1,
            conteudo: (
                <Metrica
                    rotulo="Salvamentos por post"
                    ctx={ctx}
                    valor={numeroCompacto(ig.media_salvamentos)}
                    nota={`${numeroCompacto(ig.media_compartilhamentos)} compartilhamentos em média`}
                >
                    <Bookmark className="absolute right-5 top-5 h-5 w-5 text-kit-leitura" aria-hidden />
                </Metrica>
            ),
        })
    }
    if (ig?.media_tempo_reels_s != null) {
        metricas.push({
            chave: "tempo", c4: 1, c2: 1,
            conteudo: (
                <Metrica rotulo="Tempo assistido" ctx={ctx} valor={duracao(ig.media_tempo_reels_s)} nota="em média, por Reel">
                    <Clock className="absolute right-5 top-5 h-5 w-5 text-kit-leitura" aria-hidden />
                </Metrica>
            ),
        })
    }
    if (ig?.posts_por_semana != null) {
        metricas.push({
            chave: "ritmo", c4: 1, c2: 1,
            conteudo: (
                <Metrica rotulo="Ritmo" ctx={ctx} valor={ig.posts_por_semana.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} nota="publicações por semana">
                    <Sparkles className="absolute right-5 top-5 h-5 w-5 text-kit-leitura" aria-hidden />
                </Metrica>
            ),
        })
    }

    if (ig) {
        // Duas linhas de altura só quando há quatro métricas para ladear o
        // cartão; com menos, sobraria um vão embaixo delas.
        const alto = metricas.length >= 4
        cartoes.push({
            chave: "seguidores", c4: 2, c2: 2, linhas4: alto ? 2 : 1,
            conteudo: (
                <article className="relative isolate flex h-full min-h-[18rem] flex-col overflow-hidden rounded-[1.75rem] bg-kit-tinta p-6 text-kit-fundo @4xl:p-8">
                    <p className="flex items-center gap-2 text-sm font-medium opacity-75">
                        <Instagram className="h-4 w-4" aria-hidden /> @{ig.username}
                    </p>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Seguidores</p>
                    <p className={cn("font-kit mt-1 text-[clamp(3rem,13cqi,6.5rem)] leading-none tabular-nums", ctx.fonteTitulo)}>
                        {numeroCompacto(ig.seguidores)}
                    </p>
                    {typeof ig.crescimento_30d === "number" && (
                        <p className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-kit-acento px-3 py-1 text-xs font-bold text-kit-tinta">
                            {ig.crescimento_30d >= 0 ? "▲" : "▼"} {percentual(Math.abs(ig.crescimento_30d))} nos últimos 30 dias
                        </p>
                    )}
                    {ig.historico.length >= 2 ? (
                        <CurvaDeSeguidores
                            pontos={ig.historico}
                            id="kit-curva"
                            className={cn("-mx-6 -mb-6 mt-auto h-28 w-[calc(100%+3rem)] pt-6 @4xl:-mx-8 @4xl:-mb-8 @4xl:w-[calc(100%+4rem)]", alto && "@4xl:h-40")}
                        />
                    ) : (
                        <p className="mt-auto pt-6 text-sm opacity-60">{numeroCompacto(ig.publicacoes)} publicações no perfil</p>
                    )}
                </article>
            ),
        })
        cartoes.push(...metricas)
        if (ig.formatos) {
            cartoes.push({
                chave: "formatos", c4: 2, c2: 2,
                conteudo: (
                    <article className="h-full rounded-[1.75rem] border border-kit-linha bg-kit-superficie p-6">
                        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-kit-suave">O que eu publico</p>
                        <BarraDeFormatos formatos={ig.formatos} />
                    </article>
                ),
            })
        }
    }

    for (const r of outras) {
        const cfg = REDES[r.chave] ?? { label: r.chave, icone: AtSign, url: () => "#" }
        const Icone = cfg.icone
        const n = seguidoresDe(r)
        cartoes.push({
            chave: r.chave, c4: 1, c2: 1,
            conteudo: (
                <article className="h-full rounded-[1.75rem] border border-kit-linha bg-kit-superficie p-6">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                        <Icone className="h-4 w-4 text-kit-leitura" aria-hidden /> {cfg.label}
                    </p>
                    <p className="mt-1 truncate text-xs text-kit-suave">@{r.handle}</p>
                    <p className={cn("font-kit mt-4 text-[2.6rem] leading-none tabular-nums", ctx.fonteTitulo)}>
                        {n !== null ? numeroCompacto(n) : "—"}
                    </p>
                    <p className="mt-2 text-sm text-kit-suave">
                        {typeof r.engagement_rate === "number" ? `${percentual(r.engagement_rate)} de engajamento` : "seguidores"}
                    </p>
                </article>
            ),
        })
    }

    // Por último: se alguém precisa esticar para fechar a linha, que seja ele.
    if (redes.length > 1 && alcance > 0) {
        cartoes.push({
            chave: "alcance", c4: 1, c2: 1,
            conteudo: (
                <article className="flex h-full flex-col justify-between gap-x-8 gap-y-6 rounded-[1.75rem] bg-kit-acento/15 p-6 @2xl:flex-row @2xl:flex-wrap @2xl:items-end">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kit-suave">Alcance somado</p>
                    <p>
                        <span className={cn("font-kit block text-[2.6rem] leading-none tabular-nums", ctx.fonteTitulo)}>{numeroCompacto(alcance)}</span>
                        <span className="mt-2 block text-sm text-kit-suave">seguidores em {redes.length} redes</span>
                    </p>
                </article>
            ),
        })
    }

    if (cartoes.length > 0) {
        const ultimo = cartoes[cartoes.length - 1]
        const celulas4 = cartoes.reduce((s, c) => s + c.c4 * (c.linhas4 ?? 1), 0)
        const celulas2 = cartoes.reduce((s, c) => s + c.c2, 0)
        if (celulas4 % 4) ultimo.c4 = Math.min(4, ultimo.c4 + (4 - (celulas4 % 4)))
        if (celulas2 % 2) ultimo.c2 = 2
    }

    const COLUNAS_4: Record<number, string> = { 1: "@4xl:col-span-1", 2: "@4xl:col-span-2", 3: "@4xl:col-span-3", 4: "@4xl:col-span-4" }

    return (
        <section id="numeros" className="scroll-mt-20">
            <Titulo numero={numero} rotulo="Audiência" titulo="Números que contam" ctx={ctx} extra={selo} />

            <div className="grid gap-3 @2xl:grid-cols-2 @4xl:grid-cols-4 @4xl:gap-4">
                {cartoes.map((c) => (
                    <div
                        key={c.chave}
                        className={cn(c.c2 === 2 && "@2xl:col-span-2", COLUNAS_4[c.c4], c.linhas4 === 2 && "@4xl:row-span-2")}
                    >
                        {c.conteudo}
                    </div>
                ))}
            </div>
        </section>
    )
}

function Metrica({
    rotulo, valor, nota, ctx, children, rodape,
}: {
    rotulo: string
    valor: string
    nota: string
    ctx: Contexto
    /** O ícone do canto. */
    children?: React.ReactNode
    /** Um minigráfico embaixo do número. */
    rodape?: React.ReactNode
}) {
    return (
        <article className="relative h-full rounded-[1.75rem] border border-kit-linha bg-kit-superficie p-6">
            {children}
            <p className="max-w-[70%] text-xs font-semibold uppercase tracking-[0.2em] text-kit-suave">{rotulo}</p>
            <p className={cn("font-kit mt-6 text-[2.6rem] leading-none tabular-nums", ctx.fonteTitulo)}>{valor}</p>
            <p className="mt-2 text-sm text-kit-suave">{nota}</p>
            {rodape}
        </article>
    )
}

/**
 * Quem acompanha a criadora — a pergunta que a marca mais faz e que só o
 * login responde. Gênero em barra única, idade em colunas, cidades em ranking.
 */
function SecaoAudiencia({
    numero, ctx, audiencia, naoSeguidoresPct,
}: {
    numero: string
    ctx: Contexto
    audiencia: Audiencia
    naoSeguidoresPct: number | null
}) {
    const principal = audiencia.genero[0]
    const maiorIdade = audiencia.idade.reduce<Fatia | null>((m, f) => (!m || f.pct > m.pct ? f : m), null)
    const topoIdade = Math.max(1, ...audiencia.idade.map((f) => f.pct))
    const CORES = ["var(--kit-acento)", "var(--kit-acento2)", "var(--kit-suave)"]

    return (
        <section>
            <Titulo numero={numero} rotulo="Audiência" titulo="Quem me acompanha" ctx={ctx} />
            <div className="grid gap-3 @3xl:grid-cols-2 @4xl:gap-4">
                {audiencia.genero.length > 0 && principal && (
                    <article className="rounded-[1.75rem] border border-kit-linha bg-kit-superficie p-6 @3xl:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kit-suave">Gênero</p>
                        <p className={cn("font-kit mt-5 text-[clamp(2.8rem,9cqi,4.5rem)] leading-none tabular-nums", ctx.fonteTitulo)}>
                            {Math.round(principal.pct)}%
                        </p>
                        <p className="mt-2 text-sm text-kit-suave">da minha audiência são {principal.rotulo.toLowerCase()}</p>
                        <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-kit-linha">
                            {audiencia.genero.map((f, i) => (
                                <span key={f.rotulo} style={{ width: `${f.pct}%`, backgroundColor: CORES[i % CORES.length] }} className="h-full" />
                            ))}
                        </div>
                        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                            {audiencia.genero.map((f, i) => (
                                <li key={f.rotulo} className="flex items-center gap-2">
                                    <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CORES[i % CORES.length] }} />
                                    <span className="text-kit-suave">{f.rotulo}</span>
                                    <span className="font-semibold tabular-nums">{percentual(f.pct)}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                )}

                {audiencia.idade.length > 0 && (
                    <article className="rounded-[1.75rem] border border-kit-linha bg-kit-superficie p-6 @3xl:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kit-suave">Faixa etária</p>
                        {maiorIdade && (
                            <p className="mt-2 text-sm text-kit-suave">
                                A maior parte tem <strong className="font-semibold text-kit-tinta">{maiorIdade.rotulo} anos</strong>
                            </p>
                        )}
                        <div className="mt-6 flex h-40 items-end gap-2">
                            {audiencia.idade.map((f) => (
                                <div key={f.rotulo} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                                    <span className="text-[11px] font-semibold tabular-nums">{Math.round(f.pct)}%</span>
                                    <span
                                        className={cn("w-full rounded-t-lg", f === maiorIdade ? "bg-kit-acento" : "bg-kit-acento/30")}
                                        style={{ height: `${Math.max(4, (f.pct / topoIdade) * 100)}%` }}
                                    />
                                    <span className="text-[11px] text-kit-suave">{f.rotulo}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                )}

                {audiencia.cidades.length > 0 && (
                    <article className="rounded-[1.75rem] border border-kit-linha bg-kit-superficie p-6 @3xl:p-8">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kit-suave">Principais cidades</p>
                        <ol className="mt-5 space-y-3">
                            {audiencia.cidades.map((f, i) => (
                                <li key={f.rotulo}>
                                    <div className="flex items-baseline justify-between gap-3 text-sm">
                                        <span className="flex items-center gap-2 font-medium">
                                            <span className="font-kit w-5 text-kit-leitura tabular-nums">{i + 1}</span> {f.rotulo}
                                        </span>
                                        <span className="tabular-nums text-kit-suave">{percentual(f.pct)}</span>
                                    </div>
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-kit-linha">
                                        <span className="block h-full rounded-full bg-kit-acento" style={{ width: `${Math.min(100, (f.pct / audiencia.cidades[0].pct) * 100)}%` }} />
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </article>
                )}

                {(audiencia.paises.length > 0 || naoSeguidoresPct !== null) && (
                    <article className="flex flex-col gap-6 rounded-[1.75rem] bg-kit-acento/15 p-6 @3xl:p-8">
                        {naoSeguidoresPct !== null && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kit-suave">Fora da bolha</p>
                                <p className={cn("font-kit mt-4 text-[2.6rem] leading-none tabular-nums", ctx.fonteTitulo)}>{percentual(naoSeguidoresPct, 0)}</p>
                                <p className="mt-2 text-sm text-kit-suave">do meu alcance vem de quem ainda não me segue</p>
                            </div>
                        )}
                        {audiencia.paises.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-kit-suave">Países</p>
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {audiencia.paises.map((f) => (
                                        <li key={f.rotulo} className="rounded-full bg-kit-superficie px-3 py-1.5 text-[13px]">
                                            {f.rotulo} <strong className="ml-1 font-semibold tabular-nums">{percentual(f.pct, 0)}</strong>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </article>
                )}
            </div>
        </section>
    )
}

function SecaoDestaques({ numero, ctx, destaques, handle }: { numero: string; ctx: Contexto; destaques: PostInstagram[]; handle: string }) {
    return (
        <section>
            <Titulo
                numero={numero}
                rotulo="Instagram"
                titulo="Conteúdos em alta"
                ctx={ctx}
                extra={
                    handle ? (
                        <a {...ctx.link(`https://instagram.com/${handle}`)} className="inline-flex items-center gap-1 text-sm font-semibold text-kit-leitura hover:underline">
                            Ver perfil <ArrowUpRight className="h-4 w-4" aria-hidden />
                        </a>
                    ) : null
                }
            />
            <ul className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 @2xl:mx-0 @2xl:grid @2xl:grid-cols-3 @2xl:overflow-visible @2xl:px-0 @4xl:gap-4">
                {destaques.slice(0, 6).map((p) => {
                    const Icone = ICONE_DO_FORMATO[p.tipo]
                    return (
                        <li key={p.id} className="w-[70%] shrink-0 snap-start @md:w-[45%] @2xl:w-auto">
                            <a
                                {...(p.link ? ctx.link(p.link) : {})}
                                className="group relative block aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-kit-acento/20"
                            >
                                {p.imagem ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.imagem} alt={p.legenda ?? ""} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center">
                                        <Icone className="h-8 w-8 text-kit-leitura" aria-hidden />
                                    </span>
                                )}
                                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                                    <Icone className="h-3 w-3" aria-hidden /> {ROTULO_DO_FORMATO[p.tipo]}
                                </span>
                                <span className="absolute inset-x-0 bottom-0 flex flex-wrap gap-x-3 gap-y-1 bg-gradient-to-t from-black/75 to-transparent px-4 pb-4 pt-10 text-[13px] font-semibold text-white">
                                    {typeof p.alcance === "number" && (
                                        <span className="inline-flex items-center gap-1"><Radar className="h-3.5 w-3.5" aria-hidden /> {numeroCompacto(p.alcance)}</span>
                                    )}
                                    {typeof p.salvamentos === "number" && p.salvamentos > 0 && (
                                        <span className="inline-flex items-center gap-1"><Bookmark className="h-3.5 w-3.5" aria-hidden /> {numeroCompacto(p.salvamentos)}</span>
                                    )}
                                    {typeof p.compartilhamentos === "number" && p.compartilhamentos > 0 && (
                                        <span className="inline-flex items-center gap-1"><Send className="h-3.5 w-3.5" aria-hidden /> {numeroCompacto(p.compartilhamentos)}</span>
                                    )}
                                    {typeof p.visualizacoes === "number" && (
                                        <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden /> {numeroCompacto(p.visualizacoes)}</span>
                                    )}
                                    {typeof p.curtidas === "number" && (
                                        <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden /> {numeroCompacto(p.curtidas)}</span>
                                    )}
                                    {typeof p.comentarios === "number" && (
                                        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" aria-hidden /> {numeroCompacto(p.comentarios)}</span>
                                    )}
                                </span>
                            </a>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

function SecaoPortfolio({ numero, ctx, itens }: { numero: string; ctx: Contexto; itens: ItemVitrine[] }) {
    return (
        <section>
            <Titulo numero={numero} rotulo="Portfólio" titulo="Trabalhos selecionados" ctx={ctx} />
            <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
                {itens.map((item, i) => {
                    const grande = i === 0 && itens.length > 2
                    return (
                        <article
                            key={i}
                            className={cn(
                                "group flex flex-col overflow-hidden rounded-[1.75rem] border border-kit-linha bg-kit-superficie",
                                grande && "@4xl:col-span-2 @4xl:row-span-2",
                            )}
                        >
                            {item.imagem && (
                                <div className={cn("relative overflow-hidden bg-kit-acento/15", grande ? "aspect-[16/10] @4xl:aspect-auto @4xl:flex-1" : "aspect-[16/10]")}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.imagem}
                                        alt={item.titulo ?? ""}
                                        loading="lazy"
                                        decoding="async"
                                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                    />
                                    <span className="font-kit absolute left-4 top-4 rounded-full bg-kit-fundo/85 px-2.5 py-0.5 text-xs font-bold tabular-nums backdrop-blur">
                                        {String(i + 1).padStart(2, "0")}
                                    </span>
                                </div>
                            )}
                            <div className="p-5 @3xl:p-6">
                                {item.titulo && <h3 className={cn("font-kit text-xl leading-tight", ctx.fonteTitulo)}>{item.titulo}</h3>}
                                {item.descricao && <p className="mt-2 text-sm leading-relaxed text-kit-suave">{item.descricao}</p>}
                                {item.link && (
                                    <a {...ctx.link(item.link)} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-kit-leitura hover:underline">
                                        Ver trabalho <ArrowUpRight className="h-4 w-4" aria-hidden />
                                    </a>
                                )}
                            </div>
                        </article>
                    )
                })}
            </div>
        </section>
    )
}

function SecaoMarcas({ numero, ctx, marcas }: { numero: string; ctx: Contexto; marcas: string[] }) {
    // Repetida para o letreiro dar a volta sem emenda: o trilho anda 50% e
    // a segunda metade ocupa exatamente o lugar da primeira.
    const linha = (copia: boolean) => (
        <ul aria-hidden={copia || undefined} className="flex shrink-0 items-center gap-8 pr-8 @3xl:gap-12 @3xl:pr-12">
            {marcas.map((m, i) => (
                <li key={`${m}-${i}`} className="flex items-center gap-8 @3xl:gap-12">
                    <span
                        className={cn(
                            "font-kit whitespace-nowrap text-[clamp(2rem,8cqi,4.5rem)] leading-none",
                            ctx.fonteTitulo,
                            i % 2 === 1 && "text-transparent [-webkit-text-stroke:1.5px_var(--kit-tinta)]",
                        )}
                    >
                        {m}
                    </span>
                    <span aria-hidden className="text-2xl text-kit-acento">✦</span>
                </li>
            ))}
        </ul>
    )

    return (
        <section>
            <Titulo numero={numero} rotulo="Parcerias" titulo="Marcas que confiaram" ctx={ctx} />
            <div className="kit-mascara-x -mx-5 overflow-hidden py-2 print:mx-0">
                <div className={cn("flex w-max", !ctx.previa && "kit-anima-letreiro print:animate-none")}>
                    {linha(false)}
                    {!ctx.previa && <div className="print:hidden">{linha(true)}</div>}
                </div>
            </div>
            {/* Leitor de tela e impressão leem a lista uma vez, sem movimento. */}
            <p className="sr-only">Marcas: {marcas.join(", ")}.</p>
        </section>
    )
}

function SecaoPacotes({ numero, ctx, pacotes }: { numero: string; ctx: Contexto; pacotes: PacoteVitrine[] }) {
    return (
        <section>
            <Titulo numero={numero} rotulo="Formatos" titulo="Como trabalhamos" ctx={ctx} />
            <div className="grid gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
                {pacotes.map((p, i) => (
                    <article key={i} className="flex flex-col rounded-[1.75rem] border border-kit-linha bg-kit-superficie p-6 @3xl:p-7">
                        <div className="flex items-center justify-between gap-3">
                            <span className="font-kit text-sm font-bold tabular-nums text-kit-leitura">{String(i + 1).padStart(2, "0")}</span>
                            <span aria-hidden className="h-px flex-1 bg-kit-linha" />
                        </div>
                        {p.nome && <h3 className={cn("font-kit mt-5 text-2xl leading-tight", ctx.fonteTitulo)}>{p.nome}</h3>}
                        {p.preco !== undefined && p.preco !== "" && (
                            <p className={cn("font-kit mt-3 text-[2.2rem] leading-none text-kit-leitura", ctx.fonteTitulo)}>
                                {typeof p.preco === "number"
                                    ? p.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                    : p.preco}
                            </p>
                        )}
                        {p.descricao && <p className="mt-4 text-sm leading-relaxed text-kit-suave">{p.descricao}</p>}
                        {(p.itens ?? []).length > 0 && (
                            <ul className="mt-5 space-y-2.5 border-t border-kit-linha pt-5 text-sm">
                                {(p.itens ?? []).map((item, j) => (
                                    <li key={j} className="flex items-start gap-2.5">
                                        <span aria-hidden className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-kit-acento/20 text-kit-leitura">
                                            <Check className="h-3 w-3" strokeWidth={3} />
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                ))}
            </div>
        </section>
    )
}
