import { NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-db"

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const existing = await mockDb.creator.findByInstagramId(body.instagramId)
        if (existing) {
            return NextResponse.json(existing)
        }

        const creator = await mockDb.creator.create({
            data: {
                name: body.name || "",
                email: body.email || "",
                facebookId: body.facebookId || "",
                instagramUsername: body.instagramUsername || "",
                instagramId: body.instagramId || "",
                instagramFollowers: body.instagramFollowers || 0,
                instagramProfilePic: body.instagramProfilePic || "",
                instagramBio: body.instagramBio || "",
                instagramMediaCount: body.instagramMediaCount || 0,
                accessToken: body.accessToken || "",
            },
        })

        return NextResponse.json(creator)
    } catch (error) {
        console.error("Creator Save Error:", error)
        return NextResponse.json(
            { error: "Erro ao salvar dados do creator" },
            { status: 500 }
        )
    }
}
