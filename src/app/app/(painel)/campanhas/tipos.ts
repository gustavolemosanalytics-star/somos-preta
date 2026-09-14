import type { Campanha, CampanhaMetrica } from "@/lib/db/types"

export type ResponsavelResumo = {
    id: string
    nome: string | null
    email: string | null
    avatar_url: string | null
}

export type CampanhaDaLista = Campanha & {
    cliente: { id: string; nome: string; logo_url: string | null } | null
    dono: ResponsavelResumo | null
}

/** Métricas por campanha, indexadas para o card não varrer a lista toda. */
export type MapaMetricas = Map<string, CampanhaMetrica>

/**
 * Capa do card, com a cadeia de reserva.
 *
 * `capa_url` nasce nula em toda campanha existente e só ganha valor quando
 * alguém sobe um arquivo — sem a cadeia, a tela inteira abriria com buracos.
 */
export function capaDaCampanha(c: CampanhaDaLista) {
    return c.capa_url ?? c.cliente?.logo_url ?? null
}
