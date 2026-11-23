import Link from "next/link"
import {
    ArrowUpRight, BadgeCheck, Bookmark, Clock, Eye, Heart, Images, Link2, MessageCircle, Play, Radar, Send,
    Sparkles, TrendingDown, TrendingUp, UserMinus, UserPlus, Users,
} from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"
import type { MidiaKit } from "@/lib/db/types"
import { historicoDiario } from "@/lib/instagram/calculo"
import { lerConexao } from "@/lib/instagram/conexao"
import {
    duracao, lerMetricas, numeroCompacto, percentual,
    type Audiencia, type ColetaInstagram, type PostInstagram, type TipoPost,
} from "@/lib/instagram/tipos"
import { ConectarInstagram } from "@/components/creator/conectar-instagram"
import { BarraDeFormatos, CurvaDeAlcance, CurvaDeSeguidores, ROTULO_DO_FORMATO } from "@/components/public/kit/graficos"

/**
 * Métricas — o Instagram da criadora como ela vê no painel profissional do
 * app, e o histórico que a Somos Preta guarda a cada coleta.
 *
 * Tudo vem da conta que ELA conectou com login. O retrato atual mora em
 * `metricas_instagram` (o mesmo que a vitrine mostra); o histórico, em
 * somos_preta_instagram_coletas, que a RLS libera só para a dona do kit — e
 * que a equipe lê no painel interno. Os dois lados veem os mesmos números.
 */

const ICONE: Record<TipoPost, typeof Play> = { reel: Play, video: Play, carrossel: Images, foto: Heart }

function dataBR(iso: string, comHora = false) {
    return new Date(iso)
        .toLocaleString("pt-BR", {
            day: "2-digit",
            month: "short",
            ...(comHora ? { hour: "2-digit", minute: "2-digit" } : { year: "numeric" }),
            timeZone: "America/Sao_Paulo",
        })
        .replace(/\./g, "")
}

export default async function MetricasPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const [{ data: kit }, conexao] = await Promise.all([
        supabase.from("somos_preta_midia_kits").select("*").eq("cadastrado_por", id).maybeSingle<MidiaKit>(),
        lerConexao(id),
    ])

    const metricas = lerMetricas(kit?.metricas_instagram)
    const atual = conexao && metricas ? metricas : null

    let coletas: ColetaInstagram[] = []
    if (kit?.influencer_id && atual) {
        const { data } = await supabase
            .from("somos_preta_instagram_coletas")
            .select("*")
            .eq("influencer_id", kit.influencer_id)
            .eq("username", atual.username)
            .order("coletado_em", { ascending: false })
            .limit(120)
        coletas = (data ?? []) as ColetaInstagram[]
    }

    const historico = coletas.length ? historicoDiario(coletas, 90) : atual?.historico ?? []
    const posts: PostInstagram[] = (coletas[0]?.posts ?? atual?.destaques ?? []).slice(0, 24)
    const i30 = atual?.insights_30d ?? null

    return (
        <div className="space-y-6">
            {/* ---------- abertura ---------- */}
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-terracota-texto">Métricas</p>
                    <h1 className="mt-3 text-[clamp(2.1rem,4.4vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">
                        Seu Instagram em números
                    </h1>
                    <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
                        Direto da sua conta, atualizado todo dia e guardado no seu histórico. São estes os números que
                        aparecem no seu Mídia Kit.
                    </p>
                </div>
                {atual && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-status-sucesso/12 px-3 py-1.5 text-xs font-semibold text-status-sucesso">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                        Dados oficiais · {dataBR(atual.atualizado_em, true)}
                    </span>
                )}
            </header>

            {!atual ? (
                <ConectarInstagram conexao={conexao} metricas={metricas} variante="destaque" />
            ) : (
                <>
                    {/* ---------- seguidores + números de post ---------- */}
                    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                        <article className="relative isolate flex min-h-[20rem] flex-col overflow-hidden rounded-3xl bg-brand-carvao p-6 text-white sm:p-8">
                            <span aria-hidden className="pointer-events-none absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-brand-terracota/25 blur-3xl" />
                            <p className="flex items-center gap-2 text-sm text-white/65">
                                <Users className="h-4 w-4" aria-hidden /> Seguidores de @{atual.username}
                            </p>
                            <p className="mt-3 text-[clamp(3rem,7vw,5rem)] font-extrabold leading-none tracking-[-0.05em] tabular-nums">
                                {atual.seguidores.toLocaleString("pt-BR")}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {typeof atual.crescimento_30d === "number" ? (
                                    <span
                                        className={cn(
                                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                                            atual.crescimento_30d >= 0 ? "bg-status-sucesso/20 text-[#7EE2A8]" : "bg-status-erro/20 text-[#FF9C8A]",
                                        )}
                                    >
                                        {atual.crescimento_30d >= 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
                                        {atual.crescimento_30d >= 0 ? "+" : ""}
                                        {percentual(atual.crescimento_30d)} em 30 dias
                                    </span>
                                ) : null}
                                {i30?.novos_seguidores != null && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                                        <UserPlus className="h-3.5 w-3.5" aria-hidden /> {numeroCompacto(i30.novos_seguidores)} novos
                                    </span>
                                )}
                                {i30?.deixaram_de_seguir != null && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                                        <UserMinus className="h-3.5 w-3.5" aria-hidden /> {numeroCompacto(i30.deixaram_de_seguir)} saíram
                                    </span>
                                )}
                            </div>

                            {historico.length >= 2 ? (
                                <div className="mt-auto pt-8">
                                    <CurvaDeSeguidores pontos={historico} id="metricas-curva" cor="#E07A5F" className="h-36 w-full" />
                                    <div className="mt-2 flex justify-between text-[11px] text-white/45">
                                        <span>{dataBR(`${historico[0].data}T12:00:00-03:00`)}</span>
                                        <span>{dataBR(`${historico[historico.length - 1].data}T12:00:00-03:00`)}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="mt-auto pt-8 text-sm text-white/55">
                                    O gráfico de crescimento se desenha a partir da segunda coleta — a Somos Preta atualiza
                                    seus números uma vez por dia.
                                </p>
                            )}
                        </article>

                        <div className="grid grid-cols-2 gap-4">
                            <Numero icone={Sparkles} rotulo="Engajamento" valor={percentual(atual.taxa_engajamento, 2)} nota="por post, sobre seguidores" />
                            <Numero icone={Eye} rotulo="Alcance por post" valor={numeroCompacto(atual.media_alcance)} nota={atual.taxa_engajamento_alcance != null ? `${percentual(atual.taxa_engajamento_alcance)} de quem vê interage` : "média recente"} />
                            <Numero icone={Play} rotulo="Views nos Reels" valor={numeroCompacto(atual.media_visualizacoes)} nota="média por Reel" />
                            <Numero icone={Clock} rotulo="Tempo assistido" valor={duracao(atual.media_tempo_reels_s)} nota="média por Reel" />
                            <Numero icone={Bookmark} rotulo="Salvamentos" valor={numeroCompacto(atual.media_salvamentos)} nota="média por post" />
                            <Numero icone={Send} rotulo="Compartilhamentos" valor={numeroCompacto(atual.media_compartilhamentos)} nota="média por post" />
                        </div>
                    </section>

                    {/* ---------- últimos 30 dias ---------- */}
                    {i30 && (
                        <section className="rounded-3xl bg-white p-6 sm:p-7">
                            <h2 className="text-lg font-bold tracking-tight">Últimos 30 dias</h2>
                            <p className="mt-1 text-[13px] text-muted-foreground">O que sua conta inteira fez no período, segundo o Instagram.</p>
                            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                                <div>
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Radar className="h-4 w-4 text-brand-terracota-texto" aria-hidden /> Alcance
                                    </p>
                                    <p className="mt-1 text-4xl font-extrabold tracking-[-0.04em] tabular-nums">{numeroCompacto(i30.alcance)}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        contas diferentes
                                        {i30.alcance_nao_seguidores_pct != null && ` · ${percentual(i30.alcance_nao_seguidores_pct, 0)} ainda não te seguem`}
                                    </p>
                                    {atual.alcance_diario.length >= 2 && (
                                        <div className="mt-4 [--kit-acento:#E07A5F]">
                                            <CurvaDeAlcance pontos={atual.alcance_diario} className="h-24 w-full" />
                                        </div>
                                    )}
                                </div>
                                <dl className="grid grid-cols-2 gap-3 self-start">
                                    {[
                                        { rotulo: "Visualizações", valor: i30.visualizacoes, icone: Eye },
                                        { rotulo: "Contas engajadas", valor: i30.contas_engajadas, icone: Users },
                                        { rotulo: "Interações", valor: i30.interacoes, icone: Heart },
                                        { rotulo: "Cliques no link", valor: i30.cliques_links, icone: Link2 },
                                        { rotulo: "Comentários", valor: i30.comentarios, icone: MessageCircle },
                                        { rotulo: "Salvamentos", valor: i30.salvamentos, icone: Bookmark },
                                    ].map((m) => (
                                        <div key={m.rotulo} className="rounded-2xl bg-[#F7F0EC] px-4 py-3">
                                            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <m.icone className="h-3.5 w-3.5" aria-hidden /> {m.rotulo}
                                            </dt>
                                            <dd className="mt-1 text-xl font-extrabold tracking-tight tabular-nums">{numeroCompacto(m.valor)}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </section>
                    )}

                    {/* ---------- audiência ---------- */}
                    {(atual.audiencia || atual.audiencia_engajada) && (
                        <section className="grid gap-4 lg:grid-cols-2">
                            {atual.audiencia && <BlocoAudiencia titulo="Quem te segue" audiencia={atual.audiencia} />}
                            {atual.audiencia_engajada && <BlocoAudiencia titulo="Quem interagiu este mês" audiencia={atual.audiencia_engajada} />}
                        </section>
                    )}
                    {!atual.audiencia && (
                        <p className="rounded-3xl bg-white px-6 py-5 text-sm text-muted-foreground">
                            A distribuição da sua audiência (gênero, idade e cidades) aparece quando a conta passa de 100
                            seguidores — é a regra do Instagram.
                        </p>
                    )}

                    <div className="grid gap-4 lg:grid-cols-2">
                        {atual.formatos && (
                            <section className="rounded-3xl bg-white p-6 sm:p-7">
                                <h2 className="text-lg font-bold tracking-tight">O que você publica</h2>
                                <p className="mt-1 text-[13px] text-muted-foreground">Nas suas publicações mais recentes.</p>
                                <div className="mt-6">
                                    <BarraDeFormatos formatos={atual.formatos} />
                                </div>
                                {atual.stories.length > 0 && (
                                    <p className="mt-6 rounded-2xl bg-[#F7F0EC] px-4 py-3 text-sm">
                                        <strong className="font-bold">{atual.stories.length} stories no ar</strong> · alcance médio de{" "}
                                        {numeroCompacto(
                                            atual.stories.reduce((s, x) => s + (x.alcance ?? 0), 0) / Math.max(1, atual.stories.filter((x) => x.alcance != null).length),
                                        )}
                                    </p>
                                )}
                            </section>
                        )}
                        <ConectarInstagram conexao={conexao} metricas={metricas} />
                    </div>

                    {/* ---------- publicações ---------- */}
                    {posts.length > 0 && (
                        <section className="rounded-3xl bg-white p-6 sm:p-7">
                            <div className="flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold tracking-tight">Suas publicações</h2>
                                    <p className="mt-1 text-[13px] text-muted-foreground">
                                        As de melhor resultado aparecem em “Conteúdos em alta” no seu Mídia Kit.
                                    </p>
                                </div>
                                <Link href={`/creator/${id}/midia-kit/editar?etapa=tema`} className="text-sm font-semibold text-brand-terracota-texto hover:underline">
                                    Mostrar ou esconder no kit
                                </Link>
                            </div>
                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[720px] text-sm">
                                    <thead>
                                        <tr className="border-b border-brand-areia text-left text-xs text-muted-foreground">
                                            <th className="py-2.5 pr-4 font-medium">Publicação</th>
                                            <th className="py-2.5 pr-4 text-right font-medium">Alcance</th>
                                            <th className="py-2.5 pr-4 text-right font-medium">Views</th>
                                            <th className="py-2.5 pr-4 text-right font-medium">Curtidas</th>
                                            <th className="py-2.5 pr-4 text-right font-medium">Coment.</th>
                                            <th className="py-2.5 pr-4 text-right font-medium">Salvos</th>
                                            <th className="py-2.5 text-right font-medium">Compart.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {posts.map((p) => {
                                            const Icone = ICONE[p.tipo]
                                            return (
                                                <tr key={p.id} className="border-b border-brand-areia/60 last:border-0">
                                                    <td className="py-2.5 pr-4">
                                                        <a href={p.link ?? undefined} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:underline">
                                                            <span className="flex h-10 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-brand-areia text-muted-foreground">
                                                                {p.imagem ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img src={p.imagem} alt="" className="h-full w-full object-cover" />
                                                                ) : (
                                                                    <Icone className="h-3.5 w-3.5" aria-hidden />
                                                                )}
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="block text-xs font-semibold">{ROTULO_DO_FORMATO[p.tipo]}</span>
                                                                <span className="block text-xs text-muted-foreground">{p.data ? dataBR(p.data) : "—"}</span>
                                                            </span>
                                                        </a>
                                                    </td>
                                                    {[p.alcance, p.visualizacoes, p.curtidas, p.comentarios, p.salvamentos, p.compartilhamentos].map((v, i) => (
                                                        <td key={i} className={cn("py-2.5 text-right tabular-nums", i < 5 && "pr-4")}>{numeroCompacto(v)}</td>
                                                    ))}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* ---------- histórico ---------- */}
                    {coletas.length > 0 && (
                        <section className="rounded-3xl bg-white p-6 sm:p-7">
                            <h2 className="text-lg font-bold tracking-tight">Histórico de coletas</h2>
                            <p className="mt-1 text-[13px] text-muted-foreground">
                                Cada linha é uma leitura da sua conta, salva no seu perfil e visível para a equipe da Somos Preta.
                            </p>
                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[560px] text-sm">
                                    <thead>
                                        <tr className="border-b border-brand-areia text-left text-xs text-muted-foreground">
                                            <th className="py-2.5 pr-4 font-medium">Quando</th>
                                            <th className="py-2.5 pr-4 text-right font-medium">Seguidores</th>
                                            <th className="py-2.5 pr-4 text-right font-medium">Alcance 30d</th>
                                            <th className="py-2.5 pr-4 text-right font-medium">Engajamento</th>
                                            <th className="py-2.5 text-right font-medium">Views Reels</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coletas.slice(0, 15).map((c) => (
                                            <tr key={c.id} className="border-b border-brand-areia/60 last:border-0">
                                                <td className="py-2.5 pr-4">{dataBR(c.coletado_em, true)}</td>
                                                <td className="py-2.5 pr-4 text-right tabular-nums">{c.seguidores?.toLocaleString("pt-BR") ?? "—"}</td>
                                                <td className="py-2.5 pr-4 text-right tabular-nums">{numeroCompacto(c.alcance_30d === null ? null : Number(c.alcance_30d))}</td>
                                                <td className="py-2.5 pr-4 text-right tabular-nums">{percentual(c.taxa_engajamento === null ? null : Number(c.taxa_engajamento), 2)}</td>
                                                <td className="py-2.5 text-right tabular-nums">{numeroCompacto(c.media_visualizacoes === null ? null : Number(c.media_visualizacoes))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {kit?.publicado && kit.slug && (
                        <Link
                            href={`/kit/${kit.slug}#numeros`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-terracota-texto hover:underline"
                        >
                            Ver como estes números aparecem no seu Mídia Kit <ArrowUpRight className="h-4 w-4" aria-hidden />
                        </Link>
                    )}
                </>
            )}
        </div>
    )
}

function Numero({ icone: Icone, rotulo, valor, nota }: { icone: typeof Users; rotulo: string; valor: string; nota: string }) {
    return (
        <article className="flex flex-col rounded-3xl bg-white p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-terracota/12 text-brand-terracota-texto">
                <Icone className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-4 text-[13px] text-muted-foreground">{rotulo}</p>
            <p className="mt-1 text-[26px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">{valor}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">{nota}</p>
        </article>
    )
}

function BlocoAudiencia({ titulo, audiencia }: { titulo: string; audiencia: Audiencia }) {
    const topoIdade = Math.max(1, ...audiencia.idade.map((f) => f.pct))
    return (
        <article className="rounded-3xl bg-white p-6 sm:p-7">
            <h2 className="text-lg font-bold tracking-tight">{titulo}</h2>
            {audiencia.genero.length > 0 && (
                <div className="mt-5">
                    <div className="flex h-3 overflow-hidden rounded-full bg-brand-areia">
                        {audiencia.genero.map((f, i) => (
                            <span key={f.rotulo} style={{ width: `${f.pct}%` }} className={cn("h-full", ["bg-brand-terracota", "bg-brand-oliva", "bg-brand-bege"][i % 3])} />
                        ))}
                    </div>
                    <p className="mt-2 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                        {audiencia.genero.map((f) => (
                            <span key={f.rotulo}>
                                {f.rotulo} <strong className="text-foreground">{percentual(f.pct, 0)}</strong>
                            </span>
                        ))}
                    </p>
                </div>
            )}
            {audiencia.idade.length > 0 && (
                <div className="mt-6 flex h-28 items-end gap-1.5">
                    {audiencia.idade.map((f) => (
                        <div key={f.rotulo} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                            <span className="text-[10px] font-semibold tabular-nums">{Math.round(f.pct)}%</span>
                            <span className="w-full rounded-t-md bg-brand-terracota/70" style={{ height: `${Math.max(4, (f.pct / topoIdade) * 100)}%` }} />
                            <span className="text-[10px] text-muted-foreground">{f.rotulo}</span>
                        </div>
                    ))}
                </div>
            )}
            {audiencia.cidades.length > 0 && (
                <p className="mt-6 text-sm">
                    <span className="text-muted-foreground">Cidades: </span>
                    {audiencia.cidades.map((f) => `${f.rotulo} (${percentual(f.pct, 0)})`).join(" · ")}
                </p>
            )}
        </article>
    )
}
