// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth"

declare module "next-auth" {
    interface User {
        workspaceId?: string
    }
    interface Session {
        user: User & {
            workspaceId?: string
        }
        accessToken?: string
        provider?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string
        provider?: string
    }
}
