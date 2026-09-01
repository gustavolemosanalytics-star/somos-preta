import { redirect } from "next/navigation"
import Link from "next/link"
import { getProfile } from "@/lib/supabase/auth"
import { LogoutButton } from "../logout-button"

const STAFF_ROLES = ["admin", "gestor", "analista"]

export default async function CriadorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getProfile()

    if (!profile) redirect("/criador/login")

    if (profile.role !== "creator") {
        if (STAFF_ROLES.includes(profile.role)) redirect("/app/dashboard")
        redirect("/app/sem-acesso")
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/criador" className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">S</span>
                        </div>
                        <span className="text-lg font-semibold tracking-tight">Somos Preta</span>
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
