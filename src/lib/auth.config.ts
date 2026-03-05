import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    // Secret for NextAuth (required in production). using a fallback for demo purposes if env var is missing
    secret: process.env.AUTH_SECRET || "complex-secret-key-that-is-at-least-32-characters-long-for-demo",
    pages: {
        signIn: "/login",
    },
    callbacks: {
        // authorized callback removed to avoid conflict with middleware.ts
        async session({ session, token }) {
            if (token?.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token?.accessToken) {
                (session as any).accessToken = token.accessToken;
            }
            if (token?.provider) {
                (session as any).provider = token.provider;
            }
            return session;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.sub = user.id;
            }
            if (account) {
                token.accessToken = account.access_token;
                token.provider = account.provider;
            }
            return token;
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
