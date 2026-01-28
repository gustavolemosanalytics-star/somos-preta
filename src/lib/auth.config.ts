import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    // Secret for NextAuth (required in production). using a fallback for demo purposes if env var is missing
    secret: process.env.AUTH_SECRET || "complex-secret-key-that-is-at-least-32-characters-long-for-demo",
    pages: {
        signIn: "/login",
    },
    callbacks: {
        // authorized callback removed to avoid conflict with middleware.ts
        async session({ session, user, token }) {
            if (token?.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.sub = user.id;
            }
            return token;
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig
