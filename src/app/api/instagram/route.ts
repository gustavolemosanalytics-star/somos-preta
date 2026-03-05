import { NextResponse } from "next/server"

export type InstagramProfile = {
    username: string
    full_name: string
    biography: string
    follower_count: number
    following_count: number
    posts_count: number
    profile_pic_url: string
    is_verified: boolean
    is_private: boolean
}

function parseCount(str: string): number {
    if (!str) return 0
    // Remove commas and dots used as thousand separators
    const cleaned = str.replace(/,/g, "").trim()

    // Handle K/M/B suffixes
    const multiplierMatch = cleaned.match(/^([\d.]+)\s*([KkMmBb])?$/)
    if (multiplierMatch) {
        const num = parseFloat(multiplierMatch[1])
        const suffix = (multiplierMatch[2] || "").toUpperCase()
        switch (suffix) {
            case "K": return Math.round(num * 1_000)
            case "M": return Math.round(num * 1_000_000)
            case "B": return Math.round(num * 1_000_000_000)
            default: return Math.round(num)
        }
    }
    return parseInt(cleaned, 10) || 0
}

function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
}

function extractMetaContent(html: string, property: string): string {
    // Build patterns for both attribute orders and both property/name
    const patterns = [
        `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
        `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
        `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
        `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`,
    ]

    for (const pattern of patterns) {
        const match = html.match(new RegExp(pattern, "i"))
        if (match) return decodeHtmlEntities(match[1])
    }

    return ""
}

async function scrapeInstagramProfile(username: string): Promise<InstagramProfile> {
    const url = `https://www.instagram.com/${username}/`

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "identity",
            "Cache-Control": "no-cache",
        },
        next: { revalidate: 3600 },
    })

    if (!response.ok) {
        throw new Error(`Instagram returned status ${response.status}`)
    }

    const html = await response.text()

    // Check if we got a login wall instead of the profile
    if (html.includes("loginForm") && !html.includes("og:image")) {
        throw new Error("LOGIN_WALL")
    }

    // Extract Open Graph meta tags
    const ogTitle = extractMetaContent(html, "og:title")
    const ogDescription = extractMetaContent(html, "og:description")
    const ogImage = extractMetaContent(html, "og:image")

    if (!ogTitle && !ogDescription) {
        throw new Error("PROFILE_NOT_FOUND")
    }

    // Parse title: "Name (@username) • Instagram photos and videos"
    let full_name = ""
    const titleMatch = ogTitle.match(/^(.+?)\s*\(@/)
    if (titleMatch) {
        full_name = titleMatch[1].trim()
    }

    // Parse description: "X Followers, Y Following, Z Posts - Bio text"
    // or Portuguese: "X seguidores, Y seguindo, Z publicações - Bio"
    let follower_count = 0
    let following_count = 0
    let posts_count = 0
    let biography = ""

    if (ogDescription) {
        // Decode HTML entities first for parsing
        const decoded = ogDescription
            .replace(/&#x2014;/g, "—")
            .replace(/&#064;/g, "@")
            .replace(/&amp;/g, "&")

        // Portuguese format: "205 seguidores, seguindo 353, 29 posts — Veja..."
        // Also: "672M seguidores, seguindo 644, 4,018 posts — Veja..."
        const ptMatch = decoded.match(
            /^([\d,.]+[KkMmBb]?)\s*seguidores?,?\s*seguindo\s*([\d,.]+[KkMmBb]?),?\s*([\d,.]+[KkMmBb]?)\s*posts?/i
        )
        // English format: "1,234 Followers, 567 Following, 89 Posts - Bio here"
        const engMatch = decoded.match(
            /^([\d,.]+[KkMmBb]?)\s*Followers?,?\s*([\d,.]+[KkMmBb]?)\s*Following,?\s*([\d,.]+[KkMmBb]?)\s*Posts?/i
        )

        if (ptMatch) {
            follower_count = parseCount(ptMatch[1])
            following_count = parseCount(ptMatch[2])
            posts_count = parseCount(ptMatch[3])
        } else if (engMatch) {
            follower_count = parseCount(engMatch[1])
            following_count = parseCount(engMatch[2])
            posts_count = parseCount(engMatch[3])
        }

    }

    // Extract bio from the name="description" meta tag
    // Format: '55M seguidores, 783 seguindo, 3,172 posts — Name (@user) no Instagram: "bio here"'
    const metaDescription = extractMetaContent(html, "description")
    if (metaDescription) {
        // Bio is after 'no Instagram: "' and before the closing '"'
        const bioMatch = metaDescription.match(/no Instagram:\s*"([\s\S]+)"$/)
        if (bioMatch && bioMatch[1]) {
            biography = bioMatch[1].trim()
        }
    }

    // Check for verified badge - look in the page for verification indicators
    const is_verified = html.includes('"is_verified":true') ||
        html.includes("verified_badge") ||
        html.includes("corgi-verified")

    // Check for private account
    const is_private = html.includes('"is_private":true') ||
        html.includes("This Account is Private") ||
        html.includes("Esta conta é privada")

    return {
        username,
        full_name: full_name || username,
        biography,
        follower_count,
        following_count,
        posts_count,
        profile_pic_url: ogImage || "",
        is_verified,
        is_private,
    }
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

        // Clean the username (remove @ if present)
        const cleanUsername = username.replace(/^@/, "").trim().toLowerCase()

        if (!cleanUsername || cleanUsername.length < 1) {
            return NextResponse.json(
                { error: "Username inválido" },
                { status: 400 }
            )
        }

        const profile = await scrapeInstagramProfile(cleanUsername)

        return NextResponse.json(profile)
    } catch (error) {
        console.error("Instagram Scraper Error:", error)

        const message = error instanceof Error ? error.message : ""

        if (message === "PROFILE_NOT_FOUND") {
            return NextResponse.json(
                { error: "Perfil não encontrado" },
                { status: 404 }
            )
        }

        if (message === "LOGIN_WALL") {
            return NextResponse.json(
                { error: "Instagram bloqueou a requisição. Tente novamente em alguns minutos." },
                { status: 429 }
            )
        }

        return NextResponse.json(
            { error: "Erro ao buscar dados do Instagram" },
            { status: 500 }
        )
    }
}
