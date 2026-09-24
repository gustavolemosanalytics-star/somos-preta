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

    // Os destinos levam o prefixo /app, que é onde as rotas realmente moram.
    //
    // Sem ele, quem chegasse a uma tela do painel pelo domínio do site caía num
    // 404: `/sem-acesso` não existe em somospreta.com — a rota é
    // `/app/sem-acesso`. E era justamente o caminho de quem tem conta de
    // criador e acaba num endereço do painel: em vez do aviso "sem acesso",
    // página não encontrada.
    //
    // No subdomínio do painel o prefixo não atrapalha: o middleware tira o
    // /app de qualquer endereço que chegue com ele.
    if (!profile) redirect("/app/login")

    // Sem papel de equipe -> sem acesso ao sistema interno (aguarda liberação de um admin)
    if (!STAFF_ROLES.includes(profile.role)) redirect("/app/sem-acesso")

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
