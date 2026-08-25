import type { Influencer } from "@/lib/db/types"

export const ORDENACAO_OPCOES = [
    { value: "seguidores", label: "Seguidores" },
    { value: "engajamento", label: "Engajamento" },
    { value: "views", label: "Views médias" },
    { value: "crescimento", label: "Crescimento" },
    { value: "recente", label: "Mais recente" },
    { value: "nome", label: "Nome A–Z" },
] as const

export type OrdenacaoValor = (typeof ORDENACAO_OPCOES)[number]["value"]

export function ordenarInfluencers(lista: Influencer[], ordenacao: OrdenacaoValor) {
    const copia = [...lista]
    switch (ordenacao) {
        case "seguidores": return copia.sort((a, b) => b.followers - a.followers)
        case "engajamento": return copia.sort((a, b) => b.engagement - a.engagement)
        case "views": return copia.sort((a, b) => b.views_medias - a.views_medias)
        case "crescimento": return copia.sort((a, b) => b.growth_rate - a.growth_rate)
        case "recente": return copia.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        case "nome": return copia.sort((a, b) => a.nome.localeCompare(b.nome))
        default: return copia
    }
}
