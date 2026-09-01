import { NextResponse } from "next/server"
import { fetchInstagramProfile } from "@/lib/instagram-scraper"

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

        return {
            avg_likes: average(likes),
            median_likes: median(likes),
            avg_comments: comments.length > 0 ? average(comments) : 0,
            median_comments: comments.length > 0 ? median(comments) : 0,
        }
    } catch (err) {
        console.log("HikerAPI medias error:", err)
        return null
    }
}

// Tenta buscar dados via HikerAPI. Retorna null se a fonte falhar por
// qualquer motivo (sem crédito, erro de rede, schema inesperado) — nesse
// caso o chamador cai para o scraper de fallback.
async function fetchViaHikerApi(username: string, accessKey: string): Promise<EngajamentoData | null> {
    let user: any

    try {
        const res = await fetch(
            `https://api.hikerapi.com/v2/user/by/username?username=${encodeURIComponent(username)}`,
            { headers: { "x-access-key": accessKey }, cache: "no-store" }
        )
        const json: any = await res.json().catch(() => null)

        if (!res.ok || !json || json.state === false) {
            console.log("HikerAPI user lookup failed:", res.status, json)
            return null
        }

        user = json.user ?? json
        if (!user || (user.pk == null && user.id == null && !user.username)) return null
    } catch (err) {
        console.log("HikerAPI user lookup error:", err)
        return null
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

    return {
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
        source: "hikerapi",
    }
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
    let data: EngajamentoData | null = accessKey ? await fetchViaHikerApi(username, accessKey) : null

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
                source: "scraper",
            }
        } catch (error) {
            console.error("Engajamento scraper error:", error)
            const message = error instanceof Error ? error.message : ""

            if (message === "PROFILE_NOT_FOUND") {
                return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
            }
            if (message === "LOGIN_WALL") {
                return NextResponse.json(
                    { error: "Instagram bloqueou a requisição. Tente novamente em alguns minutos." },
                    { status: 429 }
                )
            }
            return NextResponse.json({ error: "Erro ao buscar dados do Instagram" }, { status: 500 })
        }
    }

    if (data.is_private) {
        return NextResponse.json(
            { error: "Este perfil é privado — não é possível calcular métricas públicas." },
            { status: 422 }
        )
    }

    return NextResponse.json({ ...data, is_private: false })
}
