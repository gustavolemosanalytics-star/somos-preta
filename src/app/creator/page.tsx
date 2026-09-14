import { redirect } from "next/navigation"

import { getProfile } from "@/lib/supabase/auth"
import { PLATAFORMA_URL } from "@/lib/constants/site"

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
    // Absoluto: o painel vive noutro host, e um /dashboard relativo daqui
    // cairia no site institucional.
    if (profile.role !== "creator") redirect(`${PLATAFORMA_URL}/dashboard`)

    redirect(`/creator/${profile.id}`)
}
