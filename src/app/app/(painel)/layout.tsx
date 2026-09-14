import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { PainelBreadcrumb } from "@/components/dashboard/painel-breadcrumb"
import { getProfile } from "@/lib/supabase/auth"

const STAFF_ROLES = ["admin", "gestor", "analista"]

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getProfile()

    // Sem perfil (não logado ou schema ainda não aplicado) -> login
    if (!profile) redirect("/login")

    // Sem papel de equipe -> sem acesso ao sistema interno (aguarda liberação de um admin)
    if (!STAFF_ROLES.includes(profile.role)) redirect("/sem-acesso")

    const navUser = {
        name: profile.nome ?? "Usuário",
        email: profile.email ?? "",
        avatar: profile.avatar_url ?? "",
        role: profile.role,
    }

    return (
        <SidebarProvider>
            <AppSidebar user={navUser} />
            <SidebarInset>
                <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-2 transition-all ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/80 backdrop-blur-md px-3 sm:px-4">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <SidebarTrigger className="-ml-1 shrink-0" />
                        <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
                        <PainelBreadcrumb />
                    </div>
                    <DashboardHeader />
                </header>
                {/*
                  `painel` liga o sistema de superfícies do globals.css: a
                  atmosfera de fundo que o vidro refrata e o tratamento único de
                  todo Card daqui para dentro.
                */}
                <main className="painel flex flex-1 flex-col gap-5 overflow-x-hidden p-4 sm:p-5 lg:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
