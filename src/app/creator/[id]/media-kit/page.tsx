import { redirect } from "next/navigation"

/**
 * Endereço antigo do editor, mantido só para não quebrar link já enviado.
 *
 * O editor passou a viver debaixo do Mídia Kit (./midia-kit/editar), porque
 * agora existe uma tela de painel do kit antes dele. Quem guardou o endereço
 * velho cai no painel, que é de onde se chega ao editor em um clique.
 */
export default async function EditorAntigoDoMediaKit({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    redirect(`/creator/${id}/midia-kit`)
}
