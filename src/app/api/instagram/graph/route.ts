import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const FB_GRAPH_URL = "https://graph.facebook.com/v21.0"

export type InstagramGraphProfile = {
    id: string
    username: string
    name: string
    biography: string
    followers_count: number
    follows_count: number
    media_count: number
    profile_picture_url: string
}

export async function GET() {
    try {
        const session = await auth()
        const accessToken = (session as any)?.accessToken

        if (!accessToken) {
            return NextResponse.json(
                { error: "Token de acesso não encontrado. Faça login com Facebook primeiro." },
                { status: 401 }
            )
        }

        // Step 1: Get Facebook Pages the user manages
        const pagesRes = await fetch(
            `${FB_GRAPH_URL}/me/accounts?access_token=${accessToken}`
        )
        const pagesData = await pagesRes.json()

        if (pagesData.error) {
            return NextResponse.json(
                { error: pagesData.error.message || "Erro ao buscar páginas do Facebook" },
                { status: 400 }
            )
        }

        const pages = pagesData.data || []

        if (pages.length === 0) {
            return NextResponse.json(
                { error: "Nenhuma página do Facebook encontrada. Você precisa ter uma página conectada ao seu Instagram profissional." },
                { status: 404 }
            )
        }

        // Step 2: Find Instagram Business Account connected to any page
        let instagramAccount: InstagramGraphProfile | null = null

        for (const page of pages) {
            const igRes = await fetch(
                `${FB_GRAPH_URL}/${page.id}?fields=instagram_business_account&access_token=${page.access_token || accessToken}`
            )
            const igData = await igRes.json()

            if (igData.instagram_business_account?.id) {
                // Step 3: Fetch Instagram account details
                const igProfileRes = await fetch(
                    `${FB_GRAPH_URL}/${igData.instagram_business_account.id}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url&access_token=${page.access_token || accessToken}`
                )
                const igProfile = await igProfileRes.json()

                if (!igProfile.error) {
                    instagramAccount = igProfile
                    break
                }
            }
        }

        if (!instagramAccount) {
            return NextResponse.json(
                { error: "Nenhuma conta Instagram profissional encontrada conectada às suas páginas do Facebook." },
                { status: 404 }
            )
        }

        return NextResponse.json(instagramAccount)
    } catch (error) {
        console.error("Instagram Graph API Error:", error)
        return NextResponse.json(
            { error: "Erro interno ao buscar dados do Instagram" },
            { status: 500 }
        )
    }
}
