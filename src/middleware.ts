import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    // Public paths that don't require auth
    const isPublicPath = nextUrl.pathname === "/login" ||
        nextUrl.pathname === "/lp" ||
        nextUrl.pathname.startsWith("/kit/") ||
        nextUrl.pathname === "/construcao_midia_kit" ||
        nextUrl.pathname.startsWith("/api/auth")

    // Redirect root to dashboard (if logged in) or login (if not)
    if (nextUrl.pathname === "/") {
        if (isLoggedIn) {
            return Response.redirect(new URL("/dashboard", nextUrl))
        }
        return Response.redirect(new URL("/login", nextUrl))
    }

    // Redirect logged-in users away from login page
    if (isLoggedIn && nextUrl.pathname === "/login") {
        return Response.redirect(new URL("/dashboard", nextUrl))
    }

    // Protect all other paths
    if (!isLoggedIn && !isPublicPath) {
        return Response.redirect(new URL("/login", nextUrl))
    }

    return
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
