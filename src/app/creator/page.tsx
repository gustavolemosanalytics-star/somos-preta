import { redirect } from "next/navigation"

import { getProfile } from "@/lib/supabase/auth"

/**
 * Porta de entrada da área do criador.
 *
 * A tela real vive em /creator/[id], mas nem sempre o id é conhecido na hora de
 * redirecionar — o retorno do OAuth e os links genéricos caem aqui, e daqui
 * seguem para a página do próprio usuário.
 *
 * Aqui NÃO se confere papel. Esta rota já mandou quem não era 'creator' para
 * plataforma.somospreta.com, e era isso que fazia o login parecer que ia entrar
 * na área do criador e terminar no painel da equipe. Nenhum caminho do site
 * leva ao outro host: quem entra por esta porta fica desta porta para dentro.
 */
export default async function CreatorEntradaPage() {
    const profile = await getProfile()

    if (!profile) redirect("/creator/login")

    redirect(`/creator/${profile.id}`)
}
