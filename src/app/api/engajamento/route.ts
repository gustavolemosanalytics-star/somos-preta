import { NextResponse } from "next/server"
import { fetchInstagramProfile } from "@/lib/instagram-scraper"

/**
 * A única coisa que quem está de fora ouve quando a consulta falha por causa
 * NOSSA — saldo acabado, chave revogada, fonte fora do ar, coleta barrada.
 *
 * Antes cada uma dessas falhas se apresentava com nome e sobrenome na tela:
 * a falta de saldo virava "sem créditos na fonte de dados… avise a equipe da
 * Somos Preta", endereçada a quem passou ali por acaso e não tem como agir
 * sobre isso. Além de expor roupa suja, é um mapa da nossa infraestrutura
 * entregue a quem só queria uma taxa de engajamento.
 *
 * Sem prometer prazo, também: "em alguns minutos" é verdade quando a coleta
 * foi barrada e mentira quando a conta está sem saldo — e mandar o visitante
 * voltar em cinco minutos para falhar de novo é pior que não dizer nada.
 *
 * O diagnóstico não se perde, muda de lugar: vai inteiro para o log do
 * servidor, que é onde alguém consegue fazer algo a respeito. O status HTTP
 * continua distinguindo os casos (503 x 429) para quem lê máquina.
 */
const INDISPONIVEL = "A consulta de perfis está temporariamente indisponível. Tente de novo mais tarde."

type EngajamentoData = {
    username: string
    full_name: string
    profile_pic_url: string
    follower_count: number
    following_count: number
    posts_count: number
    is_private: boolean
    is_verified: boolean
    engagement_available: boolean
    avg_likes: number | null
    median_likes: number | null
    avg_comments: number | null
    median_comments: number | null
    engagement_rate: number | null
    /** Quantas publicações entraram no cálculo (não é o total do perfil). */
    analisados: number
    destaques: Destaque[]
    source: "hikerapi" | "scraper"
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function average(nums: number[]): number {
    return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length)
}

function median(nums: number[]): number {
    const sorted = [...nums].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0
        ? sorted[mid]
        : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

// Best-effort: busca posts recentes na HikerAPI para calcular engajamento.
// Se o endpoint/schema não bater, retorna null e o chamador segue sem posts.
/** Uma publicação recente, para a faixa de destaques. */
type Destaque = {
    id: string
    thumb: string | null
    likes: number
    comentarios: number
    link: string | null
}

async function fetchHikerMediaStats(userId: string, accessKey: string) {
    try {
        const res = await fetch(
            `https://api.hikerapi.com/v2/user/medias?user_id=${encodeURIComponent(userId)}&count=12`,
            { headers: { "x-access-key": accessKey }, cache: "no-store" }
        )
        const json: any = await res.json().catch(() => null)

        if (!res.ok || !json || json.state === false) return null

        const items: any[] = json.items ?? json.medias ?? (Array.isArray(json) ? json : [])
        const likes = items.map((it) => it?.like_count).filter((n): n is number => typeof n === "number")
        const comments = items.map((it) => it?.comment_count).filter((n): n is number => typeof n === "number")

        if (likes.length === 0) return null

        // A miniatura vem em formatos diferentes conforme o tipo de mídia;
        // sem ela o destaque ainda serve, só aparece sem imagem.
        const destaques: Destaque[] = items
            .filter((it) => typeof it?.like_count === "number")
            .slice(0, 6)
            .map((it, i) => ({
                id: String(it?.id ?? it?.pk ?? i),
                thumb:
                    it?.thumbnail_url ??
                    it?.image_versions2?.candidates?.[0]?.url ??
                    it?.display_uri ??
                    null,
                likes: it.like_count,
                comentarios: typeof it?.comment_count === "number" ? it.comment_count : 0,
                link: it?.code ? `https://www.instagram.com/p/${it.code}/` : null,
            }))

        return {
            avg_likes: average(likes),
            median_likes: median(likes),
            avg_comments: comments.length > 0 ? average(comments) : 0,
            median_comments: comments.length > 0 ? median(comments) : 0,
            analisados: likes.length,
            destaques,
        }
    } catch (err) {
        console.log("HikerAPI medias error:", err)
        return null
    }
}

/**
 * Por que a HikerAPI não respondeu.
 *
 * Existe porque "não achei" e "não consegui procurar" levavam à MESMA tela:
 * quando a conta fica sem crédito, o fallback bate num Instagram que exige
 * login, e o resultado saía como "Perfil não encontrado" para um perfil que
 * existe e tem milhões de seguidores. Erro de infraestrutura apresentado como
 * fato sobre o mundo é o pior tipo de mensagem.
 */
type FalhaHiker = "sem_credito" | "nao_encontrado" | "indisponivel"

type RespostaHiker =
    | { ok: true; dados: EngajamentoData }
    | { ok: false; motivo: FalhaHiker }

async function fetchViaHikerApi(username: string, accessKey: string): Promise<RespostaHiker> {
    let user: any

    try {
        const res = await fetch(
            `https://api.hikerapi.com/v2/user/by/username?username=${encodeURIComponent(username)}`,
            { headers: { "x-access-key": accessKey }, cache: "no-store" }
        )
        const json: any = await res.json().catch(() => null)

        if (!res.ok || !json || json.state === false) {
            console.warn("HikerAPI:", res.status, json?.exc_type ?? json?.error ?? "")
            // 402 é a conta sem saldo; 401/403, chave inválida ou revogada.
            // Nenhum dos três diz nada sobre o perfil procurado.
            if (res.status === 402) {
                console.error("HikerAPI sem saldo (402) — recarregar em hikerapi.com/billing")
                return { ok: false, motivo: "sem_credito" }
            }
            if (res.status === 404) return { ok: false, motivo: "nao_encontrado" }
            return { ok: false, motivo: "indisponivel" }
        }

        user = json.user ?? json
        if (!user || (user.pk == null && user.id == null && !user.username)) {
            return { ok: false, motivo: "nao_encontrado" }
        }
    } catch (err) {
        console.warn("HikerAPI indisponível:", err)
        return { ok: false, motivo: "indisponivel" }
    }

    const follower_count = user.follower_count ?? user.followers_count ?? 0
    const userId = user.pk ?? user.id

    const mediaStats = userId != null
        ? await fetchHikerMediaStats(String(userId), accessKey)
        : null

    let engagement_rate: number | null = null
    if (mediaStats && follower_count > 0) {
        engagement_rate = Math.round(((mediaStats.avg_likes + mediaStats.avg_comments) / follower_count) * 10000) / 100
    }

    return { ok: true, dados: {
        username: user.username || username,
        full_name: user.full_name || "",
        profile_pic_url: user.profile_pic_url || user.profile_pic_url_hd || "",
        follower_count,
        following_count: user.following_count ?? user.follows_count ?? 0,
        posts_count: user.media_count ?? user.posts_count ?? 0,
        is_private: user.is_private === true,
        is_verified: user.is_verified === true,
        engagement_available: mediaStats !== null,
        avg_likes: mediaStats?.avg_likes ?? null,
        median_likes: mediaStats?.median_likes ?? null,
        avg_comments: mediaStats?.avg_comments ?? null,
        median_comments: mediaStats?.median_comments ?? null,
        engagement_rate,
        analisados: mediaStats?.analisados ?? 0,
        destaques: mediaStats?.destaques ?? [],
        source: "hikerapi",
    } }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const raw = searchParams.get("username") ?? ""
    const username = raw.replace(/^@/, "").replace(/\s+/g, "").toLowerCase().trim()

    if (!username) {
        return NextResponse.json({ error: "Informe o @ do Instagram" }, { status: 400 })
    }

    const accessKey = process.env.HIKERAPI_ACCESS_KEY
    const hiker: RespostaHiker = accessKey
        ? await fetchViaHikerApi(username, accessKey)
        : { ok: false, motivo: "indisponivel" }

    let data: EngajamentoData | null = hiker.ok ? hiker.dados : null

    // A fonte principal disse, com autoridade, que o perfil não existe. Não
    // adianta insistir no scraper, que responde pior à mesma pergunta.
    if (!hiker.ok && hiker.motivo === "nao_encontrado") {
        return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    if (!data) {
        try {
            const profile = await fetchInstagramProfile(username)
            data = {
                username: profile.username || username,
                full_name: profile.full_name || "",
                profile_pic_url: profile.profile_pic_url || "",
                follower_count: profile.follower_count,
                following_count: profile.following_count,
                posts_count: profile.posts_count,
                is_private: profile.is_private,
                is_verified: profile.is_verified,
                engagement_available: false,
                avg_likes: null,
                median_likes: null,
                avg_comments: null,
                median_comments: null,
                engagement_rate: null,
                // O scraper não devolve as publicações, só o perfil.
                analisados: 0,
                destaques: [],
                source: "scraper",
            }
        } catch (error) {
            console.error("Engajamento scraper error:", error)
            const message = error instanceof Error ? error.message : ""

            // O scraper logado-fora não distingue "não existe" de "o Instagram
            // não me deixou ver". Se a fonte boa caiu por saldo ou por estar
            // fora do ar, o silêncio dele não vira veredito sobre o perfil.
            if (message === "PROFILE_NOT_FOUND") {
                // Saldo, chave ou fonte fora do ar: falhas nossas, todas com a
                // mesma consequência para quem está do outro lado — a consulta
                // não aconteceu. Sem accessKey nenhuma a fonte boa nem foi
                // tentada, então aí o silêncio do scraper vale como resposta.
                const aFonteBoaFalhou =
                    !hiker.ok &&
                    (hiker.motivo === "sem_credito" ||
                        (hiker.motivo === "indisponivel" && Boolean(accessKey)))

                if (aFonteBoaFalhou) {
                    return NextResponse.json({ error: INDISPONIVEL }, { status: 503 })
                }
                return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
            }
            // "O Instagram bloqueou a requisição" é a mesma indiscrição com
            // outra roupa: só faz sentido se existir uma coleta nossa batendo
            // lá, e ainda joga a culpa num terceiro. Para quem está do outro
            // lado o fato é um só — a consulta não saiu.
            if (message === "LOGIN_WALL") {
                return NextResponse.json({ error: INDISPONIVEL }, { status: 429 })
            }
            return NextResponse.json({ error: INDISPONIVEL }, { status: 500 })
        }
    }

    if (!data) {
        console.error("Engajamento: nenhuma fonte devolveu dados para", username)
        return NextResponse.json({ error: INDISPONIVEL }, { status: 500 })
    }

    if (data.is_private) {
        return NextResponse.json(
            { error: "Este perfil é privado — não é possível calcular métricas públicas." },
            { status: 422 }
        )
    }

    return NextResponse.json({ ...data, is_private: false })
}
