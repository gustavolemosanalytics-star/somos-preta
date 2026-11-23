import { createHmac, timingSafeEqual } from "node:crypto"

import { cofreConfigurado } from "./cofre"
import type {
    Audiencia, Fatia, Insights30d, PontoAlcance, PostInstagram, StatusInstagram, StoryInstagram, TipoPost,
} from "./tipos"

/**
 * Cliente da Graph API para contas conectadas pela própria criadora — só servidor.
 *
 * FLUXO: Instagram API with Unified Login. Apps criados hoje não podem mais
 * usar o "Instagram Login" antigo (a Meta só mantém os que já existiam); o
 * caminho para app novo é o diálogo de login da Meta com uma CONFIGURAÇÃO
 * (config_id) que define as permissões. A criadora entra com Instagram ou
 * Facebook, escolhe a conta profissional e autoriza; nós recebemos um token
 * de "usuário do sistema de integração" que, por padrão, não vence.
 *
 * Tudo que é lido aqui é da conta de quem autorizou — nada de consultar o @
 * de terceiros.
 *
 * VARIÁVEIS (ver docs/meta-app.md)
 *   META_APP_ID, META_APP_SECRET     do app da Meta
 *   INSTAGRAM_LOGIN_CONFIG_ID        a configuração do Login (permissões)
 *   INSTAGRAM_TOKEN_SECRET           chave do cofre dos tokens (lib/instagram/cofre.ts)
 *   INSTAGRAM_REDIRECT_URI           opcional; padrão <origem>/api/instagram/callback
 *   META_GRAPH_VERSION               opcional; padrão v27.0
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const VERSAO_GRAPH = process.env.META_GRAPH_VERSION || "v27.0"
const GRAPH = `https://graph.facebook.com/${VERSAO_GRAPH}`

export function loginConfigurado(): boolean {
    return Boolean(
        process.env.META_APP_ID &&
            process.env.META_APP_SECRET &&
            process.env.INSTAGRAM_LOGIN_CONFIG_ID &&
            cofreConfigurado(),
    )
}

export function urlDeRedirecionamento(origem: string): string {
    return process.env.INSTAGRAM_REDIRECT_URI || `${origem}/api/instagram/callback`
}

/** O endereço do diálogo de login da Meta. `prompt=login` oferece Instagram e Facebook. */
export function urlDeLogin({ state, redirectUri }: { state: string; redirectUri: string }): string {
    const url = new URL(`https://www.facebook.com/${VERSAO_GRAPH}/dialog/oauth`)
    url.searchParams.set("client_id", process.env.META_APP_ID as string)
    url.searchParams.set("config_id", process.env.INSTAGRAM_LOGIN_CONFIG_ID as string)
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("state", state)
    url.searchParams.set("prompt", "login")
    return url.toString()
}

// ---------------------------------------------------------------------------
// chamada base
// ---------------------------------------------------------------------------

export type ErroGraph = { message?: string; type?: string; code?: number; error_subcode?: number; fbtrace_id?: string }

export class FalhaDeToken extends Error {}

function prova(token: string): string {
    return createHmac("sha256", process.env.META_APP_SECRET as string).update(token).digest("hex")
}

async function chamar(caminho: string, parametros: Record<string, string>, token: string) {
    const url = new URL(`${GRAPH}/${caminho}`)
    for (const [k, v] of Object.entries(parametros)) url.searchParams.set(k, v)
    // appsecret_proof prova que a chamada vem do nosso servidor: com a opção
    // "exigir segredo do app" ligada no painel da Meta, um token vazado não
    // serve para nada fora daqui.
    url.searchParams.set("appsecret_proof", prova(token))

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
    })
    const json: any = await res.json().catch(() => null)
    const erro: ErroGraph | null = json?.error ?? null
    if (erro && ehErroDeToken(erro)) throw new FalhaDeToken(erro.message ?? "token inválido")
    return { json, erro }
}

function ehErroDeToken(erro: ErroGraph) {
    // 190: token inválido/revogado/expirado; 102: sessão. É o sinal de que a
    // criadora tirou o app em Integrações ou trocou a conta de portfólio.
    return erro.code === 190 || erro.code === 102
}

export function classificarErro(erro: ErroGraph): Exclude<StatusInstagram, "ok"> {
    const code = erro.code ?? 0
    if (ehErroDeToken(erro)) return "token"
    if ([4, 17, 32, 613, 80002].includes(code) || /rate limit|too many|limit reached/i.test(erro.message ?? "")) return "limite"
    if (code === 10 || (code >= 200 && code < 300)) return "permissao"
    return "indisponivel"
}

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

export async function trocarCodigo(code: string, redirectUri: string) {
    const url = new URL(`${GRAPH}/oauth/access_token`)
    url.searchParams.set("client_id", process.env.META_APP_ID as string)
    url.searchParams.set("client_secret", process.env.META_APP_SECRET as string)
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("code", code)
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(15_000) })
    const json: any = await res.json().catch(() => null)
    // A Meta não documenta o formato para o token de integração; aceita o
    // plano ({access_token}) e o embrulhado ({data:[{access_token}]}).
    const corpo = Array.isArray(json?.data) ? json.data[0] : json
    if (!corpo?.access_token) {
        console.error("[instagram] troca de código falhou:", json?.error ?? json)
        return null
    }
    const expiraEm = typeof corpo.expires_in === "number" && corpo.expires_in > 0
        ? new Date(Date.now() + corpo.expires_in * 1000).toISOString()
        : null
    return { token: String(corpo.access_token), expiraEm }
}

/** Quem logou e quais contas do Instagram autorizou. */
export async function contasDoLogin(token: string) {
    const [eu, contas] = await Promise.all([
        chamar("me", { fields: "id,client_business_id" }, token),
        chamar("me/assigned_instagram_accounts", { fields: "id,username" }, token),
    ])
    const lista = (Array.isArray(contas.json?.data) ? contas.json.data : []) as { id: string; username?: string }[]
    return {
        metaUserId: eu.json?.id ? String(eu.json.id) : null,
        clientBusinessId: eu.json?.client_business_id ? String(eu.json.client_business_id) : null,
        contas: lista.map((c) => ({ id: String(c.id), username: c.username ? String(c.username).toLowerCase() : null })),
        erro: contas.erro,
    }
}

// ---------------------------------------------------------------------------
// coleta
// ---------------------------------------------------------------------------

export type PostColetado = PostInstagram & { imagem_origem: string | null }

export type ContaColetada = {
    username: string
    ig_user_id: string
    nome: string | null
    biografia: string | null
    foto_origem: string | null
    seguidores: number
    seguindo: number | null
    publicacoes: number | null
    posts: PostColetado[]
    insights: Insights30d | null
    alcance_diario: PontoAlcance[]
    audiencia: Audiencia | null
    audiencia_engajada: Audiencia | null
    stories: StoryInstagram[]
}

export type ResultadoColeta =
    | { ok: true; conta: ContaColetada }
    | { ok: false; status: Exclude<StatusInstagram, "ok">; detalhe?: string }

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)

/** Do mais completo ao mínimo: a Meta recusa a chamada inteira por um campo não aceito. */
const CAMPOS_PERFIL = [
    "id,username,name,biography,website,profile_picture_url,followers_count,follows_count,media_count",
    "id,username,profile_picture_url,followers_count,follows_count,media_count",
    "id,username,followers_count,media_count",
]
const CAMPOS_MIDIA = [
    "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
    "id,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
]

async function primeiraQueResponde(caminho: string, conjuntos: string[], extra: Record<string, string>, token: string) {
    let ultimoErro: ErroGraph | null = null
    for (const fields of conjuntos) {
        const r = await chamar(caminho, { ...extra, fields }, token)
        if (!r.erro) return { json: r.json, erro: null }
        ultimoErro = r.erro
        if (r.erro.code !== 100) break // só "campo inválido" justifica tentar um conjunto menor
    }
    return { json: null, erro: ultimoErro }
}

function tipoDaMidia(m: any): TipoPost {
    if (m?.media_product_type === "REELS") return "reel"
    if (m?.media_type === "VIDEO") return m?.media_product_type ? "video" : "reel"
    if (m?.media_type === "CAROUSEL_ALBUM") return "carrossel"
    return "foto"
}

/** Lê { data: [{ name, values: [{ value }] }] } de /insights de mídia. */
function valoresDeInsight(json: any): Record<string, number> {
    const saida: Record<string, number> = {}
    for (const item of Array.isArray(json?.data) ? json.data : []) {
        const v = item?.values?.[0]?.value ?? item?.total_value?.value
        if (typeof v === "number") saida[item.name] = v
    }
    return saida
}

/**
 * Insights de uma publicação, tolerante: post antigo (de antes de a conta
 * virar profissional), story com menos de 5 visualizações e métrica que não
 * vale para aquele formato voltam erro — e nada disso pode derrubar a coleta.
 */
async function insightsDaMidia(id: string, metricas: string[], token: string): Promise<Record<string, number>> {
    for (const conjunto of metricas) {
        const r = await chamar(`${id}/insights`, { metric: conjunto }, token)
        if (!r.erro) return valoresDeInsight(r.json)
    }
    return {}
}

const INSIGHTS_REELS = [
    "reach,views,likes,comments,saved,shares,total_interactions,ig_reels_avg_watch_time",
    "reach,views,saved,shares,total_interactions",
    "reach",
]
const INSIGHTS_FEED = ["reach,views,likes,comments,saved,shares,total_interactions", "reach,saved,shares,total_interactions", "reach"]
const INSIGHTS_STORY = ["reach,views,replies,shares,total_interactions", "reach,replies", "reach"]

async function emLotes<T, R>(itens: T[], tamanho: number, fn: (item: T) => Promise<R>): Promise<R[]> {
    const saida: R[] = []
    for (let i = 0; i < itens.length; i += tamanho) {
        saida.push(...(await Promise.all(itens.slice(i, i + tamanho).map(fn))))
    }
    return saida
}

/** Totais da conta em 30 dias. Uma chamada; se a Meta recusar alguma métrica, uma por uma. */
async function insightsDaConta(igId: string, token: string): Promise<{ insights: Insights30d | null; alcanceDiario: PontoAlcance[] }> {
    const until = Math.floor(Date.now() / 1000)
    // A janela máxima é de 30 dias; uma hora de folga evita a recusa por
    // arredondamento do lado de lá.
    const since = until - 30 * 86_400 + 3_600
    const base = { period: "day", metric_type: "total_value", since: String(since), until: String(until) }

    const METRICAS = [
        "reach", "views", "accounts_engaged", "total_interactions", "likes", "comments",
        "shares", "saves", "replies", "profile_links_taps",
    ]

    const totais: Record<string, number> = {}
    const lerTotais = (json: any) => {
        for (const item of Array.isArray(json?.data) ? json.data : []) {
            const v = item?.total_value?.value
            if (typeof v === "number") totais[item.name] = v
        }
    }

    const tudo = await chamar(`${igId}/insights`, { ...base, metric: METRICAS.join(",") }, token)
    if (!tudo.erro) lerTotais(tudo.json)
    else {
        for (const m of METRICAS) {
            const r = await chamar(`${igId}/insights`, { ...base, metric: m }, token)
            if (!r.erro) lerTotais(r.json)
        }
    }

    // Quebras por tipo de seguidor: novos x saídas, e alcance vindo de fora.
    const porTipo = async (metric: string) => {
        const r = await chamar(`${igId}/insights`, { ...base, metric, breakdown: "follow_type" }, token)
        const resultados: any[] = r.json?.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? []
        const mapa: Record<string, number> = {}
        for (const x of resultados) if (typeof x?.value === "number") mapa[String(x.dimension_values?.[0])] = x.value
        return mapa
    }
    const [seguir, alcancePorTipo, serie] = await Promise.all([
        porTipo("follows_and_unfollows"),
        porTipo("reach"),
        chamar(`${igId}/insights`, { metric: "reach", period: "day", metric_type: "time_series", since: String(since), until: String(until) }, token),
    ])

    const alcanceDiario: PontoAlcance[] = (serie.json?.data?.[0]?.values ?? [])
        .filter((v: any) => typeof v?.value === "number" && typeof v?.end_time === "string")
        .map((v: any) => ({ data: String(v.end_time).slice(0, 10), alcance: v.value }))

    const seguidoresAlcancados = alcancePorTipo.FOLLOWER ?? null
    const naoSeguidores = alcancePorTipo.NON_FOLLOWER ?? null
    const alcance_nao_seguidores_pct =
        seguidoresAlcancados !== null && naoSeguidores !== null && seguidoresAlcancados + naoSeguidores > 0
            ? Math.round((naoSeguidores / (seguidoresAlcancados + naoSeguidores)) * 1000) / 10
            : null

    const insights: Insights30d = {
        alcance: totais.reach ?? null,
        visualizacoes: totais.views ?? null,
        contas_engajadas: totais.accounts_engaged ?? null,
        interacoes: totais.total_interactions ?? null,
        curtidas: totais.likes ?? null,
        comentarios: totais.comments ?? null,
        compartilhamentos: totais.shares ?? null,
        salvamentos: totais.saves ?? null,
        respostas: totais.replies ?? null,
        cliques_links: totais.profile_links_taps ?? null,
        novos_seguidores: seguir.FOLLOWER ?? null,
        deixaram_de_seguir: seguir.NON_FOLLOWER ?? null,
        alcance_nao_seguidores_pct,
    }
    const algum = Object.values(insights).some((v) => v !== null)
    return { insights: algum ? insights : null, alcanceDiario }
}

const NOME_DO_GENERO: Record<string, string> = { F: "Mulheres", M: "Homens", U: "Não informado" }
const paises = (() => {
    try {
        return new Intl.DisplayNames(["pt-BR"], { type: "region" })
    } catch {
        return null
    }
})()

function fatias(resultados: any[], rotular: (v: string) => string, limite?: number): Fatia[] {
    const brutos = resultados
        .map((r) => ({ chave: String(r?.dimension_values?.[0] ?? ""), valor: num(r?.value) ?? 0 }))
        .filter((r) => r.chave && r.valor > 0)
    const total = brutos.reduce((s, r) => s + r.valor, 0)
    if (!total) return []
    const lista = brutos.map((r) => ({ rotulo: rotular(r.chave), pct: Math.round((r.valor / total) * 1000) / 10 }))
    return limite ? lista.sort((a, b) => b.pct - a.pct).slice(0, limite) : lista
}

/**
 * Demografia (quem segue, ou quem interagiu). Só existe para conta com 100+
 * seguidores (ou 100+ interações no período) — abaixo disso a Meta não
 * devolve nada, e a vitrine simplesmente não mostra a seção.
 */
async function demografia(igId: string, metrica: "follower_demographics" | "engaged_audience_demographics", token: string): Promise<Audiencia | null> {
    const porQuebra = async (breakdown: string) => {
        const base = { metric: metrica, period: "lifetime", metric_type: "total_value", breakdown }
        let r = await chamar(`${igId}/insights`, { ...base, timeframe: "this_month" }, token)
        if (r.erro) r = await chamar(`${igId}/insights`, base, token)
        return (r.json?.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? []) as any[]
    }
    const [idade, genero, cidades, paisesBrutos] = await Promise.all([
        porQuebra("age"),
        porQuebra("gender"),
        porQuebra("city"),
        porQuebra("country"),
    ])
    const audiencia: Audiencia = {
        idade: fatias(idade, (v) => v).sort((a, b) => parseInt(a.rotulo) - parseInt(b.rotulo)),
        genero: fatias(genero, (v) => NOME_DO_GENERO[v] ?? v).sort((a, b) => b.pct - a.pct),
        // "São Paulo, São Paulo (state)" → "São Paulo"
        cidades: fatias(cidades, (v) => v.split(",")[0].trim(), 6),
        paises: fatias(paisesBrutos, (v) => paises?.of(v) ?? v, 5),
    }
    const vazio = !audiencia.idade.length && !audiencia.genero.length && !audiencia.cidades.length && !audiencia.paises.length
    return vazio ? null : audiencia
}

async function storiesAtivos(igId: string, token: string): Promise<StoryInstagram[]> {
    const r = await chamar(`${igId}/stories`, { fields: "id,timestamp" }, token)
    const lista: any[] = Array.isArray(r.json?.data) ? r.json.data : []
    return emLotes(lista.slice(0, 20), 5, async (s) => {
        const v = await insightsDaMidia(String(s.id), INSIGHTS_STORY, token)
        return {
            id: String(s.id),
            data: typeof s.timestamp === "string" ? new Date(s.timestamp).toISOString() : null,
            alcance: v.reach ?? null,
            visualizacoes: v.views ?? null,
            respostas: v.replies ?? null,
            compartilhamentos: v.shares ?? null,
            interacoes: v.total_interactions ?? null,
        }
    })
}

/**
 * Tudo da conta conectada. Perfil e lista de publicações são obrigatórios
 * (sem eles não há o que mostrar); insights, demografia e stories são melhor
 * esforço. Token inválido em QUALQUER chamada interrompe com status "token".
 */
export async function coletarConta(igId: string, token: string): Promise<ResultadoColeta> {
    if (!loginConfigurado()) return { ok: false, status: "nao_configurado" }

    try {
        const perfil = await primeiraQueResponde(igId, CAMPOS_PERFIL, {}, token)
        if (perfil.erro || !perfil.json) {
            const erro = perfil.erro ?? {}
            console.warn(`[instagram] perfil ${igId}: ${erro.code}/${erro.error_subcode ?? "-"} ${erro.message}`)
            return { ok: false, status: classificarErro(erro), detalhe: erro.message }
        }
        const p = perfil.json

        const midias = await primeiraQueResponde(`${igId}/media`, CAMPOS_MIDIA, { limit: "24" }, token)
        const lista: any[] = Array.isArray(midias.json?.data) ? midias.json.data : []

        const posts: PostColetado[] = await emLotes(lista, 5, async (m) => {
            const tipo = tipoDaMidia(m)
            const v = await insightsDaMidia(String(m.id), tipo === "reel" || tipo === "video" ? INSIGHTS_REELS : INSIGHTS_FEED, token)
            return {
                id: String(m.id),
                tipo,
                link: m?.permalink ?? null,
                imagem: null,
                // Em vídeo, media_url é o .mp4: a imagem é a thumbnail_url.
                imagem_origem: tipo === "reel" || tipo === "video" ? (m?.thumbnail_url ?? null) : (m?.media_url ?? null),
                curtidas: v.likes ?? num(m?.like_count),
                comentarios: v.comments ?? num(m?.comments_count),
                visualizacoes: v.views ?? null,
                alcance: v.reach ?? null,
                salvamentos: v.saved ?? null,
                compartilhamentos: v.shares ?? null,
                interacoes: v.total_interactions ?? null,
                // A Meta manda o tempo médio dos Reels em milissegundos.
                tempo_medio_s: typeof v.ig_reels_avg_watch_time === "number" ? Math.round(v.ig_reels_avg_watch_time / 100) / 10 : null,
                data: typeof m?.timestamp === "string" ? new Date(m.timestamp).toISOString() : null,
                legenda: typeof m?.caption === "string" ? m.caption.slice(0, 220) : null,
            }
        })

        const [conta, audiencia, audiencia_engajada, stories] = await Promise.all([
            insightsDaConta(igId, token),
            demografia(igId, "follower_demographics", token),
            demografia(igId, "engaged_audience_demographics", token),
            storiesAtivos(igId, token),
        ])

        return {
            ok: true,
            conta: {
                username: String(p.username ?? "").toLowerCase(),
                ig_user_id: String(p.id ?? igId),
                nome: p.name ?? null,
                biografia: p.biography ?? null,
                foto_origem: p.profile_picture_url ?? null,
                seguidores: num(p.followers_count) ?? 0,
                seguindo: num(p.follows_count),
                publicacoes: num(p.media_count),
                posts,
                insights: conta.insights,
                alcance_diario: conta.alcanceDiario,
                audiencia,
                audiencia_engajada,
                stories,
            },
        }
    } catch (erro) {
        if (erro instanceof FalhaDeToken) return { ok: false, status: "token", detalhe: erro.message }
        console.error("[instagram] coleta não respondeu:", erro)
        return { ok: false, status: "indisponivel" }
    }
}

/** Para o cartão de Configurações: o app existe e o segredo confere? */
export async function verificarApp() {
    const estado = {
        configurado: loginConfigurado(),
        versao: VERSAO_GRAPH,
        faltando: [
            !process.env.META_APP_ID && "META_APP_ID",
            !process.env.META_APP_SECRET && "META_APP_SECRET",
            !process.env.INSTAGRAM_LOGIN_CONFIG_ID && "INSTAGRAM_LOGIN_CONFIG_ID",
            !cofreConfigurado() && "INSTAGRAM_TOKEN_SECRET",
        ].filter(Boolean) as string[],
        app: null as { id: string; nome: string | null } | null,
        erro: null as string | null,
    }
    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) return estado
    try {
        const url = new URL(`${GRAPH}/${process.env.META_APP_ID}`)
        url.searchParams.set("fields", "id,name")
        url.searchParams.set("access_token", `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`)
        const json: any = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) }).then((r) => r.json())
        if (json?.error) estado.erro = json.error.message ?? "A Meta recusou o ID/segredo do app"
        else estado.app = { id: String(json.id), nome: json.name ?? null }
    } catch {
        estado.erro = "A Meta não respondeu"
    }
    return estado
}

/**
 * Valida o `signed_request` dos callbacks da Meta (exclusão de dados e
 * desautorização): `assinatura.payload` em base64url, HMAC-SHA256 do payload
 * com o segredo do app.
 */
export function lerSignedRequest(signed: string): { user_id?: string; [k: string]: unknown } | null {
    const [assinatura, payload] = (signed ?? "").split(".", 2)
    if (!assinatura || !payload || !process.env.META_APP_SECRET) return null
    const esperada = createHmac("sha256", process.env.META_APP_SECRET).update(payload).digest()
    const recebida = Buffer.from(assinatura.replace(/=+$/, ""), "base64url")
    if (recebida.length !== esperada.length || !timingSafeEqual(recebida, esperada)) return null
    try {
        const dados = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
        return dados?.algorithm && String(dados.algorithm).toUpperCase() !== "HMAC-SHA256" ? null : dados
    } catch {
        return null
    }
}
