"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
    Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import {
    AlertTriangle, BadgeCheck, Bookmark, Clapperboard, Database, ExternalLink, Eye, Heart, Images,
    Instagram, Loader2, MessageCircle, Play, RefreshCw, Send, Image as ImageIcon, UserRoundX,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import type { Influencer } from "@/lib/db/types"
import { crescimento, historicoDiario } from "@/lib/instagram/calculo"
import {
    MENSAGEM_DO_STATUS, duracao, lerMetricas, numeroCompacto, percentual,
    type Audiencia, type ColetaInstagram, type Formatos, type Insights30d, type MetricasInstagram,
    type PostInstagram, type StatusInstagram, type StoryInstagram, type TipoPost,
} from "@/lib/instagram/tipos"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Aba "Instagram" da ficha do criador.
 *
 * Tudo aqui vem da conta que a PRÓPRIA criadora conectou pela área dela (login
 * com Instagram/Meta). A equipe não busca mais ninguém pelo @: além de ser
 * contra as regras da Meta, só a conta conectada dá alcance, visualizações,
 * salvamentos e audiência — que é o que a marca quer ver.
 *
 * Duas fontes, mesma conta:
 *   - `metricas_instagram` do kit: o retrato mais recente, já calculado
 *     (insights de 30 dias, alcance diário, audiência, stories);
 *   - somos_preta_instagram_coletas: o histórico, uma linha por coleta — é de
 *     onde sai a curva de seguidores e a lista completa de publicações.
 * São as mesmas que a criadora vê na tela "Métricas" dela.
 */

type Leitura = "carregando" | "ok" | "sem_migration" | "erro"

const DIAS_DE_HISTORICO = 120

const ROTULO_DO_TIPO: Record<TipoPost, string> = {
    reel: "Reels",
    carrossel: "Carrossel",
    foto: "Foto",
    video: "Vídeo",
}

// Uma cor por formato, todas da identidade — o gráfico de formatos é o único
// lugar desta aba em que a cor carrega informação e não só destaque.
const COR_DO_TIPO: Record<TipoPost, string> = {
    reel: "var(--brand-terracota)",
    carrossel: "var(--brand-oliva)",
    foto: "var(--brand-bege)",
    video: "var(--brand-coral)",
}

const tooltipStyle = {
    borderRadius: "12px", border: "1px solid var(--border)",
    backgroundColor: "var(--popover)", fontSize: "12px", padding: "8px 12px",
}

/**
 * "A tabela não existe" e "não consegui ler" pedem ações diferentes: a
 * primeira é alguém aplicar a migration, a segunda é tentar de novo. O
 * PostgREST diz qual é qual pelo código.
 */
function faltaMigration(erro: { code?: string; message?: string } | null) {
    if (!erro) return false
    return erro.code === "42P01" || erro.code === "42703" || erro.code === "PGRST205" || /does not exist|schema cache/i.test(erro.message ?? "")
}

function numero(v: unknown): number | null {
    if (v === null || v === undefined || v === "") return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
}

/** O jsonb e o numeric chegam como vieram do banco; aqui viram tipo de verdade. */
function lerColeta(bruta: Record<string, unknown>): ColetaInstagram {
    return {
        id: String(bruta.id),
        influencer_id: String(bruta.influencer_id),
        kit_id: (bruta.kit_id as string | null) ?? null,
        username: String(bruta.username ?? ""),
        fonte: String(bruta.fonte ?? ""),
        seguidores: numero(bruta.seguidores),
        seguindo: numero(bruta.seguindo),
        publicacoes: numero(bruta.publicacoes),
        media_curtidas: numero(bruta.media_curtidas),
        media_comentarios: numero(bruta.media_comentarios),
        media_visualizacoes: numero(bruta.media_visualizacoes),
        taxa_engajamento: numero(bruta.taxa_engajamento),
        posts_por_semana: numero(bruta.posts_por_semana),
        publicacoes_analisadas: numero(bruta.publicacoes_analisadas) ?? 0,
        // Colunas da 0025: linhas antigas (ou banco sem a migration) vêm sem elas.
        alcance_30d: numero(bruta.alcance_30d),
        visualizacoes_30d: numero(bruta.visualizacoes_30d),
        contas_engajadas_30d: numero(bruta.contas_engajadas_30d),
        interacoes_30d: numero(bruta.interacoes_30d),
        formatos: (bruta.formatos as Formatos | null) ?? null,
        posts: Array.isArray(bruta.posts) ? (bruta.posts as PostInstagram[]) : null,
        insights: (bruta.insights as Insights30d | null) ?? null,
        audiencia: (bruta.audiencia as Audiencia | null) ?? null,
        stories: Array.isArray(bruta.stories) ? (bruta.stories as StoryInstagram[]) : null,
        coletado_em: String(bruta.coletado_em),
    }
}

/** Interações de um post: o total da Meta quando existe, senão a soma das partes. */
function interacoesDe(p: PostInstagram) {
    if (typeof p.interacoes === "number") return p.interacoes
    return (p.curtidas ?? 0) + (p.comentarios ?? 0) + (p.salvamentos ?? 0) + (p.compartilhamentos ?? 0)
}

function rotuloDoDia(dia: string) {
    const [, mes, d] = dia.split("-")
    return `${d}/${mes}`
}

/** Status da última tentativa, só quando há mensagem para ele. */
function mensagemDoStatus(status: string | null | undefined): string | null {
    if (!status || status === "ok") return null
    return MENSAGEM_DO_STATUS[status as Exclude<StatusInstagram, "ok">] ?? null
}

export function InstagramMetricas({
    influencer,
    onAtualizado,
}: {
    influencer: Influencer
    /** Recarrega a ficha (seguidores e engajamento do cabeçalho) sem desmontar as abas. */
    onAtualizado?: () => void | Promise<void>
}) {
    const [supabase] = useState(() => createClient())
    const [leitura, setLeitura] = useState<Leitura>("carregando")
    const [coletas, setColetas] = useState<ColetaInstagram[]>([])
    const [doKit, setDoKit] = useState<MetricasInstagram | null>(null)
    const [atualizando, setAtualizando] = useState(false)
    // Só sabemos que não há conexão depois de perguntar ao servidor: a tabela
    // de conexões não é legível pelo navegador (guarda o token da criadora).
    const [semConexao, setSemConexao] = useState(false)

    const carregar = useCallback(async () => {
        const desde = new Date(Date.now() - DIAS_DE_HISTORICO * 86_400_000).toISOString()
        const [respColetas, respKit] = await Promise.all([
            supabase
                .from("somos_preta_instagram_coletas")
                .select("*")
                .eq("influencer_id", influencer.id)
                .gte("coletado_em", desde)
                .order("coletado_em", { ascending: false })
                .limit(500),
            supabase
                .from("somos_preta_midia_kits")
                .select("metricas_instagram")
                .eq("influencer_id", influencer.id)
                .limit(1)
                .maybeSingle(),
        ])

        if (respColetas.error) {
            setLeitura(faltaMigration(respColetas.error) ? "sem_migration" : "erro")
            return
        }
        setColetas(((respColetas.data ?? []) as Record<string, unknown>[]).map(lerColeta))
        // O kit é o retrato mais rico (insights, audiência). Se a coluna ainda
        // não existir ou o criador não tiver kit, a aba segue com o histórico.
        setDoKit(respKit.error ? null : lerMetricas(respKit.data?.metricas_instagram))
        setLeitura("ok")
    }, [supabase, influencer.id])

    useEffect(() => {
        void carregar()
    }, [carregar])

    async function atualizar() {
        setAtualizando(true)
        try {
            const res = await fetch("/api/painel/instagram/sincronizar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ influencerId: influencer.id }),
            })
            const json = await res.json().catch(() => null)

            if (json?.status === "sem_conexao") {
                setSemConexao(true)
                toast.info("Este criador ainda não conectou o Instagram")
            } else if (!res.ok || !json?.ok) {
                toast.error(json?.mensagem || "Não consegui atualizar agora")
            } else {
                setSemConexao(false)
                toast.success(
                    json.doCache
                        ? "Os números já estavam em dia"
                        : `@${json.metricas?.username ?? ""} atualizado · ${numeroCompacto(json.metricas?.seguidores)} seguidores`,
                )
            }
        } catch {
            toast.error("Não consegui falar com o servidor")
        } finally {
            // Recarrega nos dois casos: até a falha muda alguma coisa (o
            // status da última tentativa que aparece no aviso).
            await Promise.all([carregar(), onAtualizado?.()])
            setAtualizando(false)
        }
    }

    const ultima = coletas[0] ?? null
    // Trocar de conta começa um histórico novo: a curva de outro perfil não é
    // crescimento deste, então os gráficos só usam a conta da última coleta.
    const daConta = useMemo(
        () => (ultima ? coletas.filter((c) => c.username === ultima.username) : []),
        [coletas, ultima],
    )
    const historico = useMemo(
        () => historicoDiario(daConta.map((c) => ({ coletado_em: c.coletado_em, seguidores: c.seguidores })), DIAS_DE_HISTORICO),
        [daConta],
    )

    // O kit só vale se for da mesma conta da última coleta (ou se não houver coleta).
    const kit = doKit && (!ultima || doKit.username === ultima.username) ? doKit : null

    const seguidores = kit?.seguidores ?? ultima?.seguidores ?? null
    const variacao = kit?.crescimento_30d ?? (seguidores ? crescimento(historico, seguidores) : null)
    const insights = kit?.insights_30d ?? ultima?.insights ?? null
    const audiencia = kit?.audiencia ?? ultima?.audiencia ?? null
    const audienciaEngajada = kit?.audiencia_engajada ?? null
    const stories = (kit?.stories?.length ? kit.stories : ultima?.stories) ?? []
    const formatos = kit?.formatos ?? ultima?.formatos ?? null

    const melhores = useMemo(() => {
        // A lista completa vem da coleta; a imagem copiada só existe nos
        // destaques do kit, então ela é emprestada de lá pelo id.
        const imagens = new Map((kit?.destaques ?? []).map((d) => [d.id, d.imagem]))
        const base = ultima?.posts?.length ? ultima.posts : (kit?.destaques ?? [])
        return [...base]
            .map((p) => ({ ...p, imagem: p.imagem ?? imagens.get(p.id) ?? null }))
            .sort((a, b) => interacoesDe(b) - interacoesDe(a))
            .slice(0, 8)
    }, [ultima, kit])

    const aviso = mensagemDoStatus(doKit?.status ?? influencer.instagram_status)
    const ultimaTentativa = doKit?.ultima_tentativa ?? influencer.instagram_sincronizado_em ?? null

    // ---------- estados de leitura ----------

    if (leitura === "carregando") {
        return (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando Instagram...
            </div>
        )
    }

    if (leitura === "sem_migration") {
        return (
            <Card className="mt-4">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <Database className="h-10 w-10 text-muted-foreground/50" />
                    <p className="font-medium">O histórico do Instagram ainda não existe neste banco.</p>
                    <p className="max-w-md text-sm text-muted-foreground">
                        Aplique as migrations <code className="text-xs">0024_instagram_meta_e_aparencia.sql</code> e{" "}
                        <code className="text-xs">0025_instagram_login_criadora.sql</code> no SQL Editor do Supabase e
                        recarregue esta página.
                    </p>
                </CardContent>
            </Card>
        )
    }

    if (leitura === "erro") {
        return (
            <Card className="mt-4">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                    <AlertTriangle className="h-10 w-10 text-status-erro/70" />
                    <p className="font-medium">Não consegui ler o histórico do Instagram.</p>
                    <Button variant="outline" className="rounded-xl" onClick={() => { setLeitura("carregando"); void carregar() }}>
                        Tentar de novo
                    </Button>
                </CardContent>
            </Card>
        )
    }

    const botaoAtualizar = (
        <Button type="button" onClick={() => void atualizar()} disabled={atualizando} className="rounded-xl">
            {atualizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar agora
        </Button>
    )

    // ---------- sem dados: a criadora não conectou ----------

    if (!ultima && !kit) {
        const desconectou = influencer.instagram_status === "desconectado"
        return (
            <div className="space-y-4 pt-4">
                {!desconectou && aviso && <Aviso texto={aviso} quando={ultimaTentativa} />}
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                        {desconectou ? (
                            <UserRoundX className="h-10 w-10 text-muted-foreground/50" />
                        ) : (
                            <Instagram className="h-10 w-10 text-muted-foreground/50" />
                        )}
                        <div className="max-w-lg space-y-2">
                            <p className="font-medium">
                                {desconectou
                                    ? "A criadora desconectou o Instagram."
                                    : semConexao
                                        ? "Este criador ainda não conectou o Instagram."
                                        : "Ainda não há dados do Instagram para este criador."}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {desconectou
                                    ? "Quando alguém desconecta, apagamos tudo o que veio da conta dela — é regra da Meta. Os números voltam se ela conectar de novo."
                                    : "Os números só chegam quando a própria criadora conecta a conta: na área dela, em Métricas → “Conectar com Instagram”. A equipe não busca perfis pelo @ — além de ser contra as regras da Meta, só a conta conectada traz alcance, visualizações e audiência."}
                            </p>
                        </div>
                        {!desconectou && (
                            <Button variant="outline" className="rounded-xl" onClick={() => void atualizar()} disabled={atualizando}>
                                {atualizando ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Verificar se já conectou
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ---------- com dados ----------

    const username = kit?.username ?? ultima?.username ?? ""
    const coletadoEm = new Date(kit?.atualizado_em ?? ultima?.coletado_em ?? Date.now())
    const daCriadora = (ultima?.fonte ?? kit?.fonte) === "instagram"
    const analisadas = kit?.publicacoes_analisadas ?? ultima?.publicacoes_analisadas ?? 0
    const alcanceDiario = kit?.alcance_diario ?? []
    const saldoSeguidores =
        insights && insights.novos_seguidores !== null && insights.deixaram_de_seguir !== null
            ? insights.novos_seguidores - insights.deixaram_de_seguir
            : null

    return (
        <div className="space-y-4 pt-4">
            {/* ---------- origem e atualização ---------- */}
            <Card>
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={`https://www.instagram.com/${username}/`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 font-semibold hover:underline"
                            >
                                <Instagram className="h-4 w-4" /> @{username}
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </a>
                            {daCriadora ? (
                                <Badge variant="secondary" className="bg-status-sucesso/12 text-status-sucesso">
                                    <BadgeCheck className="h-3 w-3" /> Conectado pela criadora
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">Coleta anterior ao login</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Atualizado {formatDistanceToNow(coletadoEm, { addSuffix: true, locale: ptBR })} ·{" "}
                            {format(coletadoEm, "dd/MM/yyyy 'às' HH:mm")} · {analisadas} publicações analisadas
                        </p>
                    </div>
                    {botaoAtualizar}
                </CardContent>
            </Card>

            {aviso && <Aviso texto={aviso} quando={ultimaTentativa} comDadosAntigos />}

            {/* ---------- médias por publicação ---------- */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Kpi rotulo="Seguidores" valor={numeroCompacto(seguidores)} />
                <Kpi rotulo="Engajamento (seguidores)" valor={percentual(kit?.taxa_engajamento ?? ultima?.taxa_engajamento, 2)} destaque />
                <Kpi
                    rotulo="Engajamento (alcance)"
                    valor={percentual(kit?.taxa_engajamento_alcance, 2)}
                    nota="interações ÷ quem viu"
                />
                <Kpi rotulo="Alcance médio por post" valor={numeroCompacto(kit?.media_alcance)} />
                <Kpi rotulo="Views médias (Reels)" valor={numeroCompacto(kit?.media_visualizacoes ?? ultima?.media_visualizacoes)} />
                <Kpi rotulo="Salvamentos por post" valor={numeroCompacto(kit?.media_salvamentos)} />
                <Kpi rotulo="Compartilhamentos por post" valor={numeroCompacto(kit?.media_compartilhamentos)} />
                <Kpi rotulo="Tempo médio (Reels)" valor={duracao(kit?.media_tempo_reels_s)} />
                <Kpi
                    rotulo="Posts por semana"
                    valor={(() => {
                        const v = kit?.posts_por_semana ?? ultima?.posts_por_semana
                        return v === null || v === undefined ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })
                    })()}
                />
                <Kpi
                    rotulo="Crescimento 30d"
                    valor={variacao === null ? "—" : `${variacao > 0 ? "+" : ""}${percentual(variacao)}`}
                    tom={variacao === null ? undefined : variacao >= 0 ? "bom" : "ruim"}
                    nota={variacao === null ? "Histórico curto" : undefined}
                />
            </div>

            {/* ---------- conta, últimos 30 dias ---------- */}
            <Card className="rounded-2xl">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base">Conta nos últimos 30 dias</CardTitle>
                    <CardDescription className="text-xs">Insights da conta, como a Meta mostra no painel profissional</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    {insights ? (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                            <Dado rotulo="Alcance" valor={numeroCompacto(insights.alcance)} />
                            <Dado rotulo="Visualizações" valor={numeroCompacto(insights.visualizacoes)} />
                            <Dado rotulo="Contas engajadas" valor={numeroCompacto(insights.contas_engajadas)} />
                            <Dado rotulo="Interações" valor={numeroCompacto(insights.interacoes)} />
                            <Dado rotulo="Cliques no link" valor={numeroCompacto(insights.cliques_links)} />
                            <Dado
                                rotulo="Seguidores ganhos / perdidos"
                                valor={`${numeroCompacto(insights.novos_seguidores)} / ${numeroCompacto(insights.deixaram_de_seguir)}`}
                                nota={saldoSeguidores === null ? undefined : `saldo ${saldoSeguidores >= 0 ? "+" : ""}${saldoSeguidores.toLocaleString("pt-BR")}`}
                            />
                            <Dado
                                rotulo="Alcance de não seguidores"
                                valor={percentual(insights.alcance_nao_seguidores_pct)}
                                nota="quanto chega em gente nova"
                            />
                            <Dado
                                rotulo="Salvamentos · compartilhamentos"
                                valor={`${numeroCompacto(insights.salvamentos)} · ${numeroCompacto(insights.compartilhamentos)}`}
                                nota={`${numeroCompacto(insights.curtidas)} curtidas · ${numeroCompacto(insights.comentarios)} comentários`}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Sem insights da conta nesta coleta. Eles chegam com a próxima atualização feita com a conta conectada.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ---------- gráficos ---------- */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card className="rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base">Seguidores</CardTitle>
                        <CardDescription className="text-xs">Uma coleta por dia, últimos {DIAS_DE_HISTORICO} dias</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[240px] p-2 pt-0 sm:p-4 sm:pt-0">
                        {historico.length < 2 ? (
                            <SemCurva texto="A curva aparece a partir do segundo dia de coleta." />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={historico} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={`ig-seg-${influencer.id}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="data" tickFormatter={rotuloDoDia} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={24} />
                                    <YAxis
                                        axisLine={false} tickLine={false} width={48}
                                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                                        tickFormatter={(v: number) => numeroCompacto(v)}
                                        domain={["dataMin", "dataMax"]}
                                    />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        labelFormatter={(v) => rotuloDoDia(String(v))}
                                        formatter={(v?: number) => [Number(v ?? 0).toLocaleString("pt-BR"), "Seguidores"]}
                                    />
                                    <Area type="monotone" dataKey="seguidores" stroke="var(--primary)" strokeWidth={2} fill={`url(#ig-seg-${influencer.id})`} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base">Alcance diário</CardTitle>
                        <CardDescription className="text-xs">Contas alcançadas por dia, últimos 30 dias</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[240px] p-2 pt-0 sm:p-4 sm:pt-0">
                        {alcanceDiario.length < 2 ? (
                            <SemCurva texto="O alcance diário chega com a coleta feita pela conta conectada." />
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={alcanceDiario} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                    <XAxis dataKey="data" tickFormatter={rotuloDoDia} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} minTickGap={24} />
                                    <YAxis axisLine={false} tickLine={false} width={44} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(v: number) => numeroCompacto(v)} />
                                    <Tooltip
                                        contentStyle={tooltipStyle}
                                        labelFormatter={(v) => rotuloDoDia(String(v))}
                                        formatter={(v?: number) => [Number(v ?? 0).toLocaleString("pt-BR"), "Alcance"]}
                                    />
                                    <Bar dataKey="alcance" fill="var(--brand-oliva)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ---------- audiência ---------- */}
            <Card className="rounded-2xl">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base">Audiência</CardTitle>
                    <CardDescription className="text-xs">
                        Quem segue a conta e quem interagiu com ela neste mês, segundo a Meta
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                    {audiencia || audienciaEngajada ? (
                        <Tabs defaultValue={audiencia ? "seguidores" : "engajada"}>
                            <TabsList>
                                <TabsTrigger value="seguidores" disabled={!audiencia}>Quem segue</TabsTrigger>
                                <TabsTrigger value="engajada" disabled={!audienciaEngajada}>Quem interagiu</TabsTrigger>
                            </TabsList>
                            {audiencia && <TabsContent value="seguidores"><PainelDeAudiencia audiencia={audiencia} /></TabsContent>}
                            {audienciaEngajada && <TabsContent value="engajada"><PainelDeAudiencia audiencia={audienciaEngajada} /></TabsContent>}
                        </Tabs>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Sem dados de audiência. A Meta só libera a demografia para contas com 100 ou mais seguidores (ou
                            100+ interações no período).
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ---------- formatos ---------- */}
            {formatos && (
                <Card className="rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base">Formatos</CardTitle>
                        <CardDescription className="text-xs">Como as publicações recentes se dividem</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0 sm:p-6 sm:pt-0">
                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
                            {(Object.keys(ROTULO_DO_TIPO) as TipoPost[])
                                .filter((t) => (formatos[t] ?? 0) > 0)
                                .map((t) => (
                                    <span
                                        key={t}
                                        className="h-full"
                                        style={{ width: `${formatos[t] ?? 0}%`, backgroundColor: COR_DO_TIPO[t] }}
                                        title={`${ROTULO_DO_TIPO[t]}: ${formatos[t] ?? 0}%`}
                                    />
                                ))}
                        </div>
                        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                            {(Object.keys(ROTULO_DO_TIPO) as TipoPost[]).map((t) => (
                                <li key={t} className="flex items-center gap-1.5">
                                    <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_DO_TIPO[t] }} />
                                    {ROTULO_DO_TIPO[t]}
                                    <span className="font-semibold tabular-nums">{formatos[t] ?? 0}%</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* ---------- melhores publicações ---------- */}
            {melhores.length > 0 && (
                <Card className="rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base">Melhores publicações</CardTitle>
                        <CardDescription className="text-xs">Por interações (curtidas, comentários, salvamentos e compartilhamentos)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                        <GradeDePublicacoes posts={melhores} />
                    </CardContent>
                </Card>
            )}

            {/* ---------- stories ---------- */}
            {stories.length > 0 && (
                <Card className="rounded-2xl">
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base">Stories no ar na última coleta</CardTitle>
                        <CardDescription className="text-xs">A Meta só entrega os stories das últimas 24 horas</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-4 pt-0 sm:p-6 sm:pt-0">
                        <table className="w-full min-w-[520px] text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs text-muted-foreground">
                                    <th className="py-2 pr-4 font-medium">Publicado</th>
                                    <th className="py-2 pr-4 text-right font-medium">Alcance</th>
                                    <th className="py-2 pr-4 text-right font-medium">Visualizações</th>
                                    <th className="py-2 pr-4 text-right font-medium">Respostas</th>
                                    <th className="py-2 pr-4 text-right font-medium">Compart.</th>
                                    <th className="py-2 text-right font-medium">Interações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stories.map((s) => (
                                    <tr key={s.id} className="border-b last:border-0">
                                        <td className="py-2 pr-4">{s.data ? format(new Date(s.data), "dd/MM HH:mm") : "—"}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{numeroCompacto(s.alcance)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{numeroCompacto(s.visualizacoes)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{numeroCompacto(s.respostas)}</td>
                                        <td className="py-2 pr-4 text-right tabular-nums">{numeroCompacto(s.compartilhamentos)}</td>
                                        <td className="py-2 text-right tabular-nums">{numeroCompacto(s.interacoes)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function Aviso({ texto, quando, comDadosAntigos }: { texto: string; quando: string | null; comDadosAntigos?: boolean }) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-status-atencao/30 bg-status-atencao/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-atencao" />
            <div className="space-y-0.5">
                <p className="font-medium">
                    A última tentativa de atualizar não deu certo
                    {quando ? ` (${formatDistanceToNow(new Date(quando), { addSuffix: true, locale: ptBR })})` : ""}.
                </p>
                <p className="text-muted-foreground">{texto}</p>
                {comDadosAntigos && (
                    <p className="text-xs text-muted-foreground">Os números abaixo são da última coleta que funcionou.</p>
                )}
            </div>
        </div>
    )
}

function Kpi({
    rotulo, valor, destaque, tom, nota,
}: {
    rotulo: string
    valor: string
    destaque?: boolean
    tom?: "bom" | "ruim"
    nota?: string
}) {
    return (
        <Card className="gap-0 rounded-2xl py-0">
            <CardContent className="p-4">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
                <p
                    className={cn(
                        "mt-1 text-xl font-bold tabular-nums",
                        destaque && "text-primary",
                        tom === "bom" && "text-status-sucesso",
                        tom === "ruim" && "text-status-erro",
                    )}
                >
                    {valor}
                </p>
                {nota && <p className="mt-0.5 text-[10px] text-muted-foreground">{nota}</p>}
            </CardContent>
        </Card>
    )
}

function Dado({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
    return (
        <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
            <p className="mt-1 text-lg font-bold tabular-nums">{valor}</p>
            {nota && <p className="text-[11px] text-muted-foreground">{nota}</p>}
        </div>
    )
}

function SemCurva({ texto }: { texto: string }) {
    return (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {texto}
        </div>
    )
}

/** Barras horizontais de uma distribuição (gênero, idade, cidades, países). */
function Distribuicao({ titulo, fatias }: { titulo: string; fatias: Audiencia["idade"] }) {
    if (fatias.length === 0) return null
    const maior = Math.max(...fatias.map((f) => f.pct))
    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</p>
            <ul className="space-y-1.5">
                {fatias.map((f) => (
                    <li key={f.rotulo} className="grid grid-cols-[minmax(0,7.5rem)_1fr_3rem] items-center gap-2 text-xs">
                        <span className="truncate">{f.rotulo}</span>
                        <span className="h-2 overflow-hidden rounded-full bg-muted">
                            <span className="block h-full rounded-full bg-primary" style={{ width: `${maior ? (f.pct / maior) * 100 : 0}%` }} />
                        </span>
                        <span className="text-right font-semibold tabular-nums">{percentual(f.pct)}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function PainelDeAudiencia({ audiencia }: { audiencia: Audiencia }) {
    return (
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <Distribuicao titulo="Gênero" fatias={audiencia.genero} />
            <Distribuicao titulo="Faixa etária" fatias={audiencia.idade} />
            <Distribuicao titulo="Principais cidades" fatias={audiencia.cidades} />
            <Distribuicao titulo="Países" fatias={audiencia.paises} />
        </div>
    )
}

const ICONE_DO_TIPO: Record<TipoPost, typeof Play> = {
    reel: Clapperboard,
    video: Play,
    carrossel: Images,
    foto: ImageIcon,
}

/**
 * Grade de publicações com os insights de cada uma. Exportada porque a aba
 * "Conteúdo" da ficha mostra a mesma coisa, só que sem o resto das métricas.
 */
export function GradeDePublicacoes({ posts }: { posts: PostInstagram[] }) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((p) => <Publicacao key={p.id} post={p} />)}
        </div>
    )
}

function Publicacao({ post }: { post: PostInstagram }) {
    const Icone = ICONE_DO_TIPO[post.tipo] ?? ImageIcon
    const conteudo = (
        <>
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                {post.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.imagem} alt={post.legenda ?? ""} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                        <Icone className="h-8 w-8" />
                    </div>
                )}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
                    <Icone className="h-3 w-3" /> {ROTULO_DO_TIPO[post.tipo]}
                </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {typeof post.alcance === "number" && (
                    <span className="inline-flex items-center gap-1" title="Alcance"><Eye className="h-3 w-3" /> {numeroCompacto(post.alcance)}</span>
                )}
                {typeof post.visualizacoes === "number" && (
                    <span className="inline-flex items-center gap-1" title="Visualizações"><Play className="h-3 w-3" /> {numeroCompacto(post.visualizacoes)}</span>
                )}
                <span className="inline-flex items-center gap-1" title="Curtidas"><Heart className="h-3 w-3" /> {numeroCompacto(post.curtidas)}</span>
                <span className="inline-flex items-center gap-1" title="Comentários"><MessageCircle className="h-3 w-3" /> {numeroCompacto(post.comentarios)}</span>
                {typeof post.salvamentos === "number" && (
                    <span className="inline-flex items-center gap-1" title="Salvamentos"><Bookmark className="h-3 w-3" /> {numeroCompacto(post.salvamentos)}</span>
                )}
                {typeof post.compartilhamentos === "number" && (
                    <span className="inline-flex items-center gap-1" title="Compartilhamentos"><Send className="h-3 w-3" /> {numeroCompacto(post.compartilhamentos)}</span>
                )}
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
                {post.data ? format(new Date(post.data), "dd/MM/yyyy") : ""}
                {typeof post.tempo_medio_s === "number" ? ` · ${duracao(post.tempo_medio_s)} assistidos em média` : ""}
            </p>
        </>
    )

    return post.link ? (
        <a href={post.link} target="_blank" rel="noopener noreferrer" className="group block">
            {conteudo}
        </a>
    ) : (
        <div className="group">{conteudo}</div>
    )
}
