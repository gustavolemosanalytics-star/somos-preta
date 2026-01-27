import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { influencerSchema } from "@/lib/validations/influencer"
import { mockDb } from "@/lib/mock-db"

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session) {
            //   return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get("query")
        const state = searchParams.get("state")
        const niche = searchParams.get("niche")

        const where: any = {}

        if (query) {
            where.OR = [
                { name: { contains: query, mode: "insensitive" } },
            ]
        }

        if (state) {
            where.state = state
        }

        const influencers = await mockDb.influencer.findMany({
            where,
        })

        return NextResponse.json(influencers)
    } catch (error) {
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        // if (!session) {
        //   return new NextResponse("Unauthorized", { status: 401 })
        // }

        const body = await req.json()
        const { name, email, ...rest } = influencerSchema.parse(body)

        const influencer = await mockDb.influencer.create({
            data: {
                name,
                email,
                workspaceId: "mock-workspace-id",
                ...rest,
            },
        })

        return NextResponse.json(influencer)
    } catch (error) {
        console.error("Influencer Create Error:", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
