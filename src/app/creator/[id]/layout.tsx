import { redirect } from "next/navigation"
import Link from "next/link"
import { getProfile } from "@/lib/supabase/auth"
import { LogoPreta } from "@/components/public/marca"
import { LogoutButton } from "../logout-button"

const STAFF_ROLES = ["admin", "gestor", "analista"]

export default async function CreatorLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const profile = await getProfile()

    if (!profile) redirect("/creator/login")

    if (profile.role !== "creator") {
        if (STAFF_ROLES.includes(profile.role)) redirect("/app/dashboard")
        redirect("/app/sem-acesso")
    }

    // O id vai na URL, então precisa ser conferido: sem isto qualquer criador
    // logado abriria /creator/<id-de-outro>. Quem erra o id é mandado para o seu.
    if (id !== profile.id) redirect(`/creator/${profile.id}`)

    return (
        <div className="min-h-screen bg-background text-foreground">
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href={`/creator/${profile.id}`} aria-label="Somos Preta — início" className="flex items-center gap-2.5">
                        <LogoPreta className="h-6 w-auto" />
                    </Link>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground hidden sm:inline">{profile.nome}</span>
                        <LogoutButton />
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-4 py-8">{children}</main>
        </div>
    )
}
