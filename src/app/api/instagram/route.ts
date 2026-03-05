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

async function fetchInstagramProfile(username: string): Promise<InstagramProfile> {
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
        if (response.status === 404) {
            throw new Error("PROFILE_NOT_FOUND")
        }
        throw new Error(`Instagram returned status ${response.status}`)
    }

    const json = await response.json()
    const user = json?.data?.user

    if (!user) {
        throw new Error("PROFILE_NOT_FOUND")
    }

    const follower_count = user.edge_followed_by?.count || 0
    const following_count = user.edge_follow?.count || 0
    const posts_count = user.edge_owner_to_timeline_media?.count || 0

    // Extract recent posts with engagement data
    const postEdges = user.edge_owner_to_timeline_media?.edges || []
    const recent_posts: RecentPost[] = postEdges.map(extractPostData)

    // Calculate engagement metrics from recent posts
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

/* eslint-enable @typescript-eslint/no-explicit-any */

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

        const cleanUsername = username.replace(/^@/, "").trim().toLowerCase()

        if (!cleanUsername) {
            return NextResponse.json(
                { error: "Username inválido" },
                { status: 400 }
            )
        }

        const profile = await fetchInstagramProfile(cleanUsername)

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

        return NextResponse.json(
            { error: "Erro ao buscar dados do Instagram" },
            { status: 500 }
        )
    }
}
