import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getProfile } from "@/lib/supabase/auth"
import { normalizarHandle, type RedeInfo } from "@/lib/constants/media-kit"
import type { MidiaKit } from "@/lib/db/types"
import { CascaDoCriador } from "@/components/creator/casca"

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

    // Não há conferência de papel aqui. Havia três linhas que mandavam quem não
    // fosse 'creator' para plataforma.somospreta.com — inclusive quem tem conta
    // de equipe e quis abrir o próprio Media Kit — e era o que fazia o login
    // piscar a área do criador antes de jogar o usuário no outro host.
    // A área é por usuário: o guard abaixo garante que ninguém abre a de outro,
    // e a RLS do banco decide o resto. Papel não muda nada aqui dentro.

    // O id vai na URL, então precisa ser conferido: sem isto qualquer criador
    // logado abriria /creator/<id-de-outro>. Quem erra o id é mandado para o seu.
    if (id !== profile.id) redirect(`/creator/${profile.id}`)

    // A barra lateral mostra o @ e a foto, que moram no kit e não no perfil.
    const supabase = await createClient()
    const { data: kit } = await supabase
        .from("somos_preta_midia_kits")
        .select("nome, avatar_url, redes")
        .eq("cadastrado_por", id)
        .maybeSingle<Pick<MidiaKit, "nome" | "avatar_url" | "redes">>()

    const redes = (kit?.redes ?? {}) as Record<string, RedeInfo>
    const arroba = normalizarHandle(redes.instagram?.handle ?? "") || null

    return (
        <CascaDoCriador
            itens={[
                { href: `/creator/${id}`, rotulo: "Meu perfil", sigla: "P" },
                { href: `/creator/${id}/midia-kit`, rotulo: "Meu Mídia Kit", sigla: "M" },
            ]}
            nome={kit?.nome || profile.nome || "Criador"}
            arroba={arroba}
            avatar={kit?.avatar_url ?? profile.avatar_url ?? null}
            papel="Creator"
        >
            {children}
        </CascaDoCriador>
    )
}
