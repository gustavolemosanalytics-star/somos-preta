import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    // Secret for NextAuth (required in production). using a fallback for demo purposes if env var is missing
    secret: process.env.AUTH_SECRET || "complex-secret-key-that-is-at-least-32-characters-long-for-demo",
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/influencers') ||
                nextUrl.pathname.startsWith('/campaigns');

            const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isOnAuth) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
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
