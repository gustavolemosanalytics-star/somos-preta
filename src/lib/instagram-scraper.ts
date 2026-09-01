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
    is_business: boolean
    category: string
    avg_likes: number
    avg_comments: number
    engagement_rate: number
    recent_posts: RecentPost[]
}

export type RecentPost = {
    shortcode: string
    thumbnail_url: string
    likes: number
    comments: number
    caption: string
    timestamp: number
    is_video: boolean
    video_views: number
}

// Instagram's internal web API endpoint
const IG_API_URL = "https://www.instagram.com/api/v1/users/web_profile_info/"
const IG_APP_ID = "936619743392459"

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractPostData(edge: any): RecentPost {
    const node = edge.node
    const likes = node.edge_liked_by?.count
        ?? node.edge_media_preview_like?.count
        ?? 0
    const comments = node.edge_media_to_comment?.count
        ?? node.edge_media_preview_comment?.count
        ?? 0
    const captionEdges = node.edge_media_to_caption?.edges || []
    const caption = captionEdges[0]?.node?.text || ""

    return {
        shortcode: node.shortcode || "",
        thumbnail_url: node.thumbnail_src || node.display_url || "",
        likes,
        comments,
        caption: caption.slice(0, 200),
        timestamp: node.taken_at_timestamp || 0,
        is_video: node.is_video || false,
        video_views: node.video_view_count || 0,
    }
}

// === PRIMARY: Instagram web_profile_info API (rich data) ===
async function fetchViaAPI(username: string): Promise<InstagramProfile> {
    const response = await fetch(
        `${IG_API_URL}?username=${encodeURIComponent(username)}`,
        {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "X-IG-App-ID": IG_APP_ID,
                "Accept": "*/*",
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
                "Sec-Fetch-Site": "same-origin",
                "Sec-Fetch-Mode": "cors",
            },
            next: { revalidate: 3600 },
        }
    )

    if (!response.ok) {
        throw new Error(`API_STATUS_${response.status}`)
    }

    const json = await response.json()
    const user = json?.data?.user

    if (!user) {
        throw new Error("PROFILE_NOT_FOUND")
    }

    const follower_count = user.edge_followed_by?.count || 0
    const following_count = user.edge_follow?.count || 0
    const posts_count = user.edge_owner_to_timeline_media?.count || 0

    const postEdges = user.edge_owner_to_timeline_media?.edges || []
    const recent_posts: RecentPost[] = postEdges.map(extractPostData)

    let avg_likes = 0
    let avg_comments = 0
    let engagement_rate = 0

    if (recent_posts.length > 0) {
        const totalLikes = recent_posts.reduce((sum, p) => sum + p.likes, 0)
        const totalComments = recent_posts.reduce((sum, p) => sum + p.comments, 0)
        avg_likes = Math.round(totalLikes / recent_posts.length)
        avg_comments = Math.round(totalComments / recent_posts.length)

        if (follower_count > 0) {
            const avgInteractions = avg_likes + avg_comments
            engagement_rate = Math.round((avgInteractions / follower_count) * 10000) / 100
        }
    }

    return {
        username: user.username || username,
        full_name: user.full_name || "",
        biography: user.biography || "",
        follower_count,
        following_count,
        posts_count,
        profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url || "",
        is_verified: user.is_verified || false,
        is_private: user.is_private || false,
        is_business: user.is_business_account || user.is_professional_account || false,
        category: user.category_name || user.business_category_name || "",
        avg_likes,
        avg_comments,
        engagement_rate,
        recent_posts,
    }
}

// === FALLBACK: Scrape meta tags from profile page ===
function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&apos;/g, "'")
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
    const m = cleaned.match(/^([\d.]+)\s*([KkMmBb])?$/)
    if (m) {
        const num = parseFloat(m[1])
        switch ((m[2] || "").toUpperCase()) {
            case "K": return Math.round(num * 1_000)
            case "M": return Math.round(num * 1_000_000)
            case "B": return Math.round(num * 1_000_000_000)
            default: return Math.round(num)
        }
    }
    return parseInt(cleaned, 10) || 0
}

async function fetchViaMetaTags(username: string): Promise<InstagramProfile> {
    // Use Facebook's own link preview bot UA — Instagram (owned by Meta) won't block it
    const response = await fetch(`https://www.instagram.com/${username}/`, {
        headers: {
            "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "identity",
        },
        next: { revalidate: 3600 },
    })

    if (!response.ok) {
        throw new Error(`Instagram returned status ${response.status}`)
    }

    const html = await response.text()

    if (html.includes("loginForm") && !html.includes("og:image")) {
        throw new Error("LOGIN_WALL")
    }

    const ogTitle = extractMetaContent(html, "og:title")
    const ogDescription = extractMetaContent(html, "og:description")
    const ogImage = extractMetaContent(html, "og:image")

    if (!ogTitle && !ogDescription) {
        throw new Error("PROFILE_NOT_FOUND")
    }

    let full_name = ""
    const titleMatch = ogTitle.match(/^(.+?)\s*\(@/)
    if (titleMatch) full_name = titleMatch[1].trim()

    let follower_count = 0
    let following_count = 0
    let posts_count = 0

    if (ogDescription) {
        const decoded = ogDescription.replace(/&#x2014;/g, "—").replace(/&#064;/g, "@").replace(/&amp;/g, "&")

        const ptMatch = decoded.match(/^([\d,.]+[KkMmBb]?)\s*seguidores?,?\s*seguindo\s*([\d,.]+[KkMmBb]?),?\s*([\d,.]+[KkMmBb]?)\s*posts?/i)
        const engMatch = decoded.match(/^([\d,.]+[KkMmBb]?)\s*Followers?,?\s*([\d,.]+[KkMmBb]?)\s*Following,?\s*([\d,.]+[KkMmBb]?)\s*Posts?/i)

        const match = ptMatch || engMatch
        if (match) {
            follower_count = parseCount(match[1])
            following_count = parseCount(match[2])
            posts_count = parseCount(match[3])
        }
    }

    let biography = ""
    const metaDescription = extractMetaContent(html, "description")
    if (metaDescription) {
        // Try English format: 'on Instagram: "bio"'
        // Try Portuguese format: 'no Instagram: "bio"'
        const bioMatch = metaDescription.match(/(?:on|no) Instagram:\s*"([\s\S]+)"$/)
        if (bioMatch?.[1]) biography = bioMatch[1].trim()
    }

    const is_verified = html.includes('"is_verified":true') || html.includes("verified_badge")
    const is_private = html.includes('"is_private":true') || html.includes("This Account is Private") || html.includes("Esta conta é privada")

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
        is_business: false,
        category: "",
        avg_likes: 0,
        avg_comments: 0,
        engagement_rate: 0,
        recent_posts: [],
    }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Busca um perfil público do Instagram. Tenta a API rica primeiro (dados
 * completos, incl. posts recentes p/ engajamento); se estiver bloqueada pelo
 * Instagram (comum — rate limit agressivo), cai no fallback de meta tags da
 * própria página (mais confiável, mas sem posts/curtidas/comentários).
 */
export async function fetchInstagramProfile(username: string): Promise<InstagramProfile> {
    try {
        return await fetchViaAPI(username)
    } catch (apiError) {
        console.log("Instagram API failed, trying meta tags fallback:", apiError)
        return await fetchViaMetaTags(username)
    }
}
