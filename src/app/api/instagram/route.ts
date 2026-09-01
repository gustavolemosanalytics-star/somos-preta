import { NextResponse } from "next/server"
import { fetchInstagramProfile } from "@/lib/instagram-scraper"
export type { InstagramProfile, RecentPost } from "@/lib/instagram-scraper"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const username = searchParams.get("username")

        if (!username) {
            return NextResponse.json({ error: "Username é obrigatório" }, { status: 400 })
        }

        const cleanUsername = username.replace(/^@/, "").trim().toLowerCase()

        if (!cleanUsername) {
            return NextResponse.json({ error: "Username inválido" }, { status: 400 })
        }

        const profile = await fetchInstagramProfile(cleanUsername)

        return NextResponse.json(profile)
    } catch (error) {
        console.error("Instagram Scraper Error:", error)

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
