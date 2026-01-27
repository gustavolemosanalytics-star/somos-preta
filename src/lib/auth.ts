import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { z } from "zod"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // adapter: PrismaAdapter(prisma), // Disabled for Mock Mode
    session: { strategy: "jwt" },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    // MOCK AUTH: Always return a valid user for dev
                    return {
                        id: "mock-user-id",
                        name: "Usuário Mock",
                        email: parsedCredentials.data.email,
                        image: "",
                        workspaceId: "mock-workspace-id"
                    };
                }
                return null;
            },
        }),
    ],
})
