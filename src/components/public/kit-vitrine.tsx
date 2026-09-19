import { AtSign, ExternalLink, Instagram, MapPin, MessageCircle, Music2, Twitter, Youtube } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

/**
 * A vitrine do Media Kit — o desenho da página que a marca abre.
 *
 * Vive fora da rota porque tem DUAS pontas: /kit/[slug] renderiza com o que
 * veio da view pública, e o editor renderiza com o estado local, ao vivo, para
 * a criadora ver o resultado enquanto digita. Enquanto o desenho morava dentro
 * da página, a única forma de ver o próprio kit era publicá-lo de verdade —
 * expor ao mundo um rascunho para descobrir se estava bom.
 *
 * A largura é medida por CONTAINER, não por viewport (`@container` + `@xl:`).
 * Sem isso a prévia, que ocupa uma coluna estreita dentro de uma tela larga,
 * herdaria o layout de desktop espremido em 380px e mentiria sobre o resultado.
 */

export type RedeSocial = {
    handle?: string
    followers?: number | null
    engagement_rate?: number | null
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
}

const redeConfig: Record<string, { label: string; icone: typeof Instagram }> = {
    instagram: { label: "Instagram", icone: Instagram },
    tiktok: { label: "TikTok", icone: Music2 },
    youtube: { label: "YouTube", icone: Youtube },
    twitter: { label: "Twitter", icone: Twitter },
}

/**
 * Duas cores por tema, e a diferença importa.
 *
 * `icone` pinta ícone, marcador e ornamento — lugares onde a cor da marca pode
 * ser ela mesma. `leitura` pinta texto que alguém precisa ler: o terracota
 * #E07A5F dá 2,76:1 sobre o off-white e o coral #F26D4F, 2,78:1, quando a WCAG
 * AA pede 4,5:1. Num media kit aberto no celular, no sol, isso é a diferença
 * entre ler o preço do pacote e desistir.
 *
 * `teal` é chave de kits antigos e era pintada com `text-accent` — #F1EAE1,
 * superfície de hover: título quase branco sobre off-white. Aqui ela cai no
 * coral, que é cor de marca de verdade e enxerga.
 */
const acentos: Record<string, { icone: string; leitura: string; fundo: string }> = {
    terracota: { icone: "text-brand-terracota", leitura: "text-brand-terracota-texto", fundo: "bg-brand-terracota" },
    oliva: { icone: "text-brand-oliva", leitura: "text-brand-oliva", fundo: "bg-brand-oliva" },
    coral: { icone: "text-brand-coral", leitura: "text-brand-terracota-texto", fundo: "bg-brand-coral" },
    teal: { icone: "text-brand-coral", leitura: "text-brand-terracota-texto", fundo: "bg-brand-coral" },
}

function formatarNumero(valor: number) {
    if (valor >= 1_000_000) return `${(valor / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    if (valor >= 1_000) return `${(valor / 1_000).toFixed(1).replace(/\.0$/, "")}K`
    return `${valor}`
}

export function KitVitrine({
    kit,
    /**
     * "previa" desliga os links (ninguém quer sair do editor por engano) e
     * tira o min-h-dvh, porque ali a vitrine mora dentro de uma moldura.
     */
    modo = "publico",
    className,
}: {
    kit: DadosVitrine
    modo?: "publico" | "previa"
    className?: string
}) {
    const previa = modo === "previa"
    const acento = acentos[kit.tema ?? "terracota"] ?? acentos.terracota
    const redes = kit.redes ?? {}
    const redeEntries = Object.entries(redes).filter(
        (entrada): entrada is [string, RedeSocial] => Boolean(entrada[1]?.handle),
    )
    const portfolio = (Array.isArray(kit.portfolio) ? kit.portfolio : []).filter((i) => i?.titulo || i?.imagem)
    const pacotes = (Array.isArray(kit.pacotes) ? kit.pacotes : []).filter((p) => p?.nome)
    const whatsappLimpo = kit.whatsapp ? kit.whatsapp.replace(/\D/g, "") : null
    const localizacao = [kit.cidade, kit.estado].filter(Boolean).join(" — ")

    return (
        <div
            className={cn(
                "@container bg-background text-foreground",
                // 100vh no celular inclui a barra do navegador que some ao rolar,
                // criando uma rolagem vertical fantasma; dvh acompanha a tela real.
                !previa && "min-h-dvh",
                previa && "pointer-events-none select-none",
                className,
            )}
        >
            {/* ---------- capa e rosto ---------- */}
            <div className="relative h-32 bg-muted @xl:h-48 @3xl:h-64">
                {kit.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={kit.cover_url} alt="" className="h-full w-full object-cover" />
                )}
            </div>

            <div className="mx-auto w-full max-w-3xl px-4 @xl:px-6">
                <Avatar className="-mt-11 h-22 w-22 border-4 border-background @xl:-mt-14 @xl:h-28 @xl:w-28 @3xl:-mt-16 @3xl:h-32 @3xl:w-32">
                    <AvatarImage src={kit.avatar_url ?? undefined} alt={kit.nome} />
                    <AvatarFallback className="bg-muted text-2xl font-semibold @3xl:text-3xl">
                        {(kit.nome || "?").slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="mt-5 space-y-4">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight @3xl:text-3xl">
                            {kit.nome || "Seu nome aqui"}
                        </h1>
                        {localizacao && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <MapPin className={cn("h-4 w-4", acento.icone)} aria-hidden /> {localizacao}
                            </p>
                        )}
                    </div>

                    {kit.bio && <p className="max-w-2xl leading-relaxed break-words text-muted-foreground">{kit.bio}</p>}

                    {(kit.nichos ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {(kit.nichos ?? []).map((nicho) => (
                                <Badge key={nicho} variant="outline" className="max-w-full whitespace-normal text-[13px]">
                                    {nicho}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* ---------- redes ---------- */}
                {redeEntries.length > 0 && (
                    <div className="mt-10 grid grid-cols-2 gap-4 @xl:grid-cols-3">
                        {redeEntries.map(([chave, rede]) => {
                            const config = redeConfig[chave] ?? { label: chave, icone: AtSign }
                            const Icone = config.icone
                            return (
                                <Card key={chave} className="rounded-2xl">
                                    <CardContent className="px-5">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Icone className={cn("h-4 w-4", acento.icone)} aria-hidden />
                                            <span className="text-sm font-medium">{config.label}</span>
                                        </div>
                                        {rede.handle && (
                                            <p className="truncate text-sm text-muted-foreground">
                                                @{rede.handle.replace(/^@/, "")}
                                            </p>
                                        )}
                                        {typeof rede.followers === "number" && (
                                            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                                                {formatarNumero(rede.followers)}
                                            </p>
                                        )}
                                        {typeof rede.engagement_rate === "number" && (
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {rede.engagement_rate.toFixed(1)}% de engajamento
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                )}

                {/* ---------- portfólio ---------- */}
                {portfolio.length > 0 && (
                    <div className="mt-14">
                        <h2 className={cn("mb-5 text-xl font-semibold tracking-tight", acento.leitura)}>Portfólio</h2>
                        <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2 @3xl:grid-cols-3">
                            {portfolio.map((item, i) => (
                                <Card key={i} className="gap-0 overflow-hidden rounded-2xl py-0">
                                    {item.imagem && (
                                        <div className="aspect-video bg-muted">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={item.imagem}
                                                alt={item.titulo ?? ""}
                                                // O portfólio fica abaixo da
                                                // dobra: sem lazy, um kit com
                                                // seis trabalhos puxava tudo
                                                // antes da primeira rolagem.
                                                loading="lazy"
                                                decoding="async"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <CardContent className="p-4">
                                        {item.titulo && <h3 className="font-medium">{item.titulo}</h3>}
                                        {item.descricao && (
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                {item.descricao}
                                            </p>
                                        )}
                                        {item.link && (
                                            <a
                                                href={previa ? undefined : item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                tabIndex={previa ? -1 : undefined}
                                                className={cn(
                                                    "mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline",
                                                    acento.leitura,
                                                )}
                                            >
                                                Ver mais <ExternalLink className="h-3 w-3" aria-hidden />
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* ---------- pacotes ---------- */}
                {pacotes.length > 0 && (
                    <div className="mt-14">
                        <h2 className={cn("mb-5 text-xl font-semibold tracking-tight", acento.leitura)}>Pacotes</h2>
                        <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @5xl:grid-cols-3">
                            {pacotes.map((pacote, i) => (
                                <Card key={i} className="rounded-2xl">
                                    <CardContent className="flex flex-col gap-3 px-5 wrap-anywhere">
                                        {pacote.nome && <h3 className="font-semibold">{pacote.nome}</h3>}
                                        {pacote.preco !== undefined && pacote.preco !== "" && (
                                            <p className={cn("text-2xl font-semibold tracking-tight", acento.leitura)}>
                                                {typeof pacote.preco === "number"
                                                    ? pacote.preco.toLocaleString("pt-BR", {
                                                          style: "currency",
                                                          currency: "BRL",
                                                      })
                                                    : pacote.preco}
                                            </p>
                                        )}
                                        {pacote.descricao && (
                                            <p className="text-sm text-muted-foreground">{pacote.descricao}</p>
                                        )}
                                        {(pacote.itens ?? []).length > 0 && (
                                            <ul className="mt-1 space-y-1.5 text-sm text-muted-foreground">
                                                {(pacote.itens ?? []).map((item, j) => (
                                                    <li key={j} className="flex items-start gap-2">
                                                        <span
                                                            aria-hidden
                                                            className={cn(
                                                                "mt-1.5 h-1 w-1 shrink-0 rounded-full",
                                                                acento.fundo,
                                                            )}
                                                        />
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* ---------- contato ---------- */}
                {whatsappLimpo && (
                    <div className="mt-16 mb-20 text-center">
                        <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
                            <a
                                href={previa ? undefined : `https://wa.me/${whatsappLimpo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                tabIndex={previa ? -1 : undefined}
                            >
                                <MessageCircle className="h-5 w-5" aria-hidden /> Falar no WhatsApp
                            </a>
                        </Button>
                    </div>
                )}

                {!whatsappLimpo && <div className="h-16" />}
            </div>
        </div>
    )
}
