import { redirect } from "next/navigation"

import { getProfile } from "@/lib/supabase/auth"

/**
 * Porta de entrada da área do criador.
 *
 * A tela real vive em /creator/[id], mas nem sempre o id é conhecido na hora de
 * redirecionar — o retorno do OAuth e os links genéricos caem aqui, e daqui
 * seguem para a página do próprio usuário.
 */
export default async function CreatorEntradaPage() {
    const profile = await getProfile()

    if (!profile) redirect("/creator/login")
    if (profile.role !== "creator") redirect("/app/dashboard")

    redirect(`/creator/${profile.id}`)
}
