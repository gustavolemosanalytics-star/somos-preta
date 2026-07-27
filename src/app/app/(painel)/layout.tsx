import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { getProfile } from "@/lib/supabase/auth"
import { slugify } from "@/lib/slug"

const STAFF_ROLES = ["admin", "gestor", "analista"]

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getProfile()

    // Sem perfil (não logado ou schema ainda não aplicado) -> login
    if (!profile) redirect("/app/login")

    // Creators não acessam o hub interno -> vão para a própria área
    if (!STAFF_ROLES.includes(profile.role)) redirect(`/criador/midia-kit/${slugify(profile.nome ?? "creator")}`)

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
                        <Breadcrumb className="hidden sm:flex">
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/app/dashboard">Dashboard</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="truncate max-w-[150px] sm:max-w-none">Overview</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <DashboardHeader />
                </header>
                <main className="flex flex-1 flex-col gap-4 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
