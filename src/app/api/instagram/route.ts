import { NextResponse } from "next/server"

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = "instagram-statistics-api.p.rapidapi.com"

export type InstagramProfile = {
    username: string
    full_name: string
    biography: string
    follower_count: number
    profile_pic_url: string
    is_verified: boolean
    is_private: boolean
    avg_engagement_rate: number
    avg_interactions: number
    tags: string[]
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const username = searchParams.get("username")

        if (!username) {
            return NextResponse.json(
                { error: "Username é obrigatório" },
                { status: 400 }
            )
        }

        if (!RAPIDAPI_KEY) {
            return NextResponse.json(
                { error: "RAPIDAPI_KEY não configurada" },
                { status: 500 }
            )
        }

        // Clean the username (remove @ if present)
        const cleanUsername = username.replace(/^@/, "").trim()

        if (!cleanUsername) {
            return NextResponse.json(
                { error: "Username inválido" },
                { status: 400 }
            )
        }

        const igUrl = `https://www.instagram.com/${encodeURIComponent(cleanUsername)}/`

        const response = await fetch(
            `https://${RAPIDAPI_HOST}/community?url=${encodeURIComponent(igUrl)}`,
            {
                method: "GET",
                headers: {
                    "x-rapidapi-key": RAPIDAPI_KEY,
                    "x-rapidapi-host": RAPIDAPI_HOST,
                },
                next: { revalidate: 3600 }, // Cache for 1 hour
            }
        )

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { error: "Perfil não encontrado" },
                    { status: 404 }
                )
            }
            return NextResponse.json(
                { error: "Erro ao buscar perfil do Instagram" },
                { status: response.status }
            )
        }

        const json = await response.json()
        const data = json.data

        if (!data || json.meta?.code !== 200) {
            return NextResponse.json(
                { error: "Perfil não encontrado" },
                { status: 404 }
            )
        }

        // Map tags to readable labels (filter out internal tags)
        const readableTags = (data.tags || [])
            .filter((t: string) => !t.startsWith("gender-") && !t.startsWith("age-") && t !== "influencer" && t !== "celebrity" && t !== "confirmed")
            .map((t: string) => t.replace(/-/g, " ").replace(/and/g, "&").replace(/\b\w/g, (c: string) => c.toUpperCase()))
            .slice(0, 5)

        const profile: InstagramProfile = {
            username: data.screenName || cleanUsername,
            full_name: data.name || "",
            biography: data.description || "",
            follower_count: data.usersCount || 0,
            profile_pic_url: data.image || "",
            is_verified: data.verified || false,
            is_private: data.isClosed || false,
            avg_engagement_rate: data.avgER ? Math.round(data.avgER * 10000) / 100 : 0, // Convert to percentage
            avg_interactions: data.avgInteractions || 0,
            tags: readableTags,
        }

        return NextResponse.json(profile)
    } catch (error) {
        console.error("Instagram API Error:", error)
        return NextResponse.json(
            { error: "Erro interno ao buscar dados do Instagram" },
            { status: 500 }
        )
    }
}
