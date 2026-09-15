import { redirect } from "next/navigation"

import { Navbar } from "@/components/painel/navbar"
import { PainelBreadcrumb } from "@/components/dashboard/painel-breadcrumb"
import { getProfile } from "@/lib/supabase/auth"

const STAFF_ROLES = ["admin", "gestor", "analista"]

export default async function PainelLayout({
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
        <div className="flex min-h-svh flex-col">
            <Navbar user={navUser} />

            {/*
              `painel` liga o sistema de superfícies do globals.css: a atmosfera
              de fundo que o vidro refrata e o tratamento único de todo Card
              daqui para dentro.

              O max-w existe porque, sem a barra lateral, o conteúdo esticaria de
              ponta a ponta num monitor largo e a tabela viraria uma linha de
              horizonte — difícil de varrer com o olho.
            */}
            <main className="painel mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-4 sm:p-5 lg:p-6">
                <PainelBreadcrumb />
                {children}
            </main>
        </div>
    )
}
