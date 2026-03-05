import { NextResponse } from "next/server"

export type TikTokProfile = {
    username: string
    full_name: string
    follower_count: number
    following_count: number
    total_likes: number
    profile_pic_url: string
}

function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x([0-9a-fA-F]+);/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_: string, dec: string) => String.fromCharCode(parseInt(dec, 10)))
}

function extractMetaContent(html: string, property: string): string {
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

function parseCount(str: string): number {
    if (!str) return 0
    const cleaned = str.replace(/,/g, "").trim()
    // Handle suffixes like 160.3m, 2563.7m, 10.5k
    const m = cleaned.match(/^([\d.]+)\s*([KkMmBb])?$/)
    if (m) {
        const num = parseFloat(m[1])
        switch ((m[2] || "").toLowerCase()) {
            case "k": return Math.round(num * 1_000)
            case "m": return Math.round(num * 1_000_000)
            case "b": return Math.round(num * 1_000_000_000)
            default: return Math.round(num)
        }
    }
    return parseInt(cleaned, 10) || 0
}

async function fetchTikTokProfile(username: string): Promise<TikTokProfile> {
    const response = await fetch(`https://www.tiktok.com/@${username}`, {
        headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "identity",
        },
        next: { revalidate: 3600 },
    })

    if (!response.ok) {
        throw new Error("PROFILE_NOT_FOUND")
    }

    const html = await response.text()

    const ogTitle = extractMetaContent(html, "og:title")
    const ogDescription = extractMetaContent(html, "og:description")
    const ogImage = extractMetaContent(html, "og:image")

    if (!ogDescription) {
        throw new Error("PROFILE_NOT_FOUND")
    }

    // og:description format: "@username 160.3m Followers, 85 Following, 2563.7m Likes - Watch awesome short videos created by Full Name"
    let follower_count = 0
    let following_count = 0
    let total_likes = 0
    let full_name = ""

    const statsMatch = ogDescription.match(
        /@[\w.]+\s+([\d,.]+[KkMmBb]?)\s*Followers?,\s*([\d,.]+[KkMmBb]?)\s*Following,\s*([\d,.]+[KkMmBb]?)\s*Likes?\s*-\s*.*?(?:created by|criado por)\s+(.+)$/i
    )

    if (statsMatch) {
        follower_count = parseCount(statsMatch[1])
        following_count = parseCount(statsMatch[2])
        total_likes = parseCount(statsMatch[3])
        full_name = statsMatch[4].trim()
    } else {
        // Fallback: try to parse without the "created by" part
        const basicMatch = ogDescription.match(
            /@[\w.]+\s+([\d,.]+[KkMmBb]?)\s*Followers?,\s*([\d,.]+[KkMmBb]?)\s*Following,\s*([\d,.]+[KkMmBb]?)\s*Likes?/i
        )
        if (basicMatch) {
            follower_count = parseCount(basicMatch[1])
            following_count = parseCount(basicMatch[2])
            total_likes = parseCount(basicMatch[3])
        }
    }

    // og:title format: "Full Name on TikTok"
    if (!full_name && ogTitle) {
        const titleMatch = ogTitle.match(/^(.+?)\s+on TikTok$/i)
        if (titleMatch) full_name = titleMatch[1].trim()
    }

    return {
        username,
        full_name: full_name || username,
        follower_count,
        following_count,
        total_likes,
        profile_pic_url: ogImage || "",
    }
}

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

        const profile = await fetchTikTokProfile(cleanUsername)

        return NextResponse.json(profile)
    } catch (error) {
        console.error("TikTok Scraper Error:", error)

        const message = error instanceof Error ? error.message : ""

        if (message === "PROFILE_NOT_FOUND") {
            return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
        }

        return NextResponse.json({ error: "Erro ao buscar dados do TikTok" }, { status: 500 })
    }
}
