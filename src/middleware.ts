import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth

    // Public paths that don't require auth
    const isPublicPath = nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname === "/lp" ||
        nextUrl.pathname.startsWith("/kit/") ||
        nextUrl.pathname === "/construcao_midia_kit" ||
        nextUrl.pathname.startsWith("/busca") ||
        nextUrl.pathname.startsWith("/comunidade") ||
        nextUrl.pathname.startsWith("/cursos") ||
        nextUrl.pathname.startsWith("/midia-kit") ||
        nextUrl.pathname.startsWith("/cadastro") ||
        nextUrl.pathname.startsWith("/client-portal") ||
        nextUrl.pathname.startsWith("/api/auth")

    // Redirect logged-in users away from main login page to dashboard
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
