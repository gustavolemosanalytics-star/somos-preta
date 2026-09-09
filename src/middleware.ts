import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    // Arquivos estáticos de /public também passam pelo middleware e, por não
    // constarem em PUBLIC_PATHS, eram redirecionados para /app/login — o que
    // quebrava as imagens da landing para quem não estava logado. A extensão
    // no fim do matcher tira todo asset do caminho da autenticação.
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp4|webm|txt|xml|json|pdf)$).*)",
    ],
}
