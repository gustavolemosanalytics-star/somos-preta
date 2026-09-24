import { createClient } from "@/lib/supabase/client"

/**
 * Registro de eventos do Media Kit: visualização, clique no contato e download
 * do PDF.
 *
 * Duas regras que valem para os três:
 *
 * 1. FALHA EM SILÊNCIO. Métrica é assunto nosso, não da criadora nem da marca
 *    que abriu a página. Se o banco estiver fora do ar, ou a migration 0023
 *    ainda não tiver sido aplicada, a contagem se perde e a página segue
 *    funcionando — nunca o contrário.
 *
 * 2. PASSA PELO SLUG, não pelo id. Quem chama é a página pública, que só
 *    conhece o slug; e a função do banco resolve para um kit PUBLICADO, o que
 *    impede registrar evento em rascunho ou em kit que não existe.
 */

export type TipoDeEvento = "visualizacao" | "clique_contato" | "download_pdf"

export async function registrarEventoDoKit(slug: string, tipo: TipoDeEvento) {
    if (!slug) return
    try {
        const supabase = createClient()
        await supabase.rpc("somos_preta_registrar_evento_kit", { p_slug: slug, p_tipo: tipo })
    } catch {
        // de propósito: ver a regra 1 acima.
    }
}

/**
 * Marca que este evento já foi contado nesta aba.
 *
 * Sem isto, apertar F5 cinco vezes viraria cinco visualizações e o número que
 * a criadora usa para decidir o que postar seria o número de vezes que ela
 * mesma recarregou a própria página. O sessionStorage some quando a aba fecha,
 * que é a definição de "visita" que faz sentido aqui.
 */
export function primeiraVezNaSessao(chave: string): boolean {
    try {
        if (sessionStorage.getItem(chave)) return false
        sessionStorage.setItem(chave, "1")
        return true
    } catch {
        // Aba anônima com armazenamento bloqueado: conta como primeira vez. É
        // melhor contar demais aqui do que deixar de contar toda visita de quem
        // navega com o armazenamento fechado.
        return true
    }
}
