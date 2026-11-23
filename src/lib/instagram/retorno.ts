/**
 * Peças do vaivém do login que a ida (/api/instagram/login) e a volta
 * (/api/instagram/callback) precisam concordar. Ficam fora das rotas porque o
 * Next só aceita os verbos HTTP como exportação de um route.ts.
 */

export const COOKIE_DO_LOGIN = "sp_ig_login"

/** "/creator/x/metricas" + "conectado" → "/creator/x/metricas?instagram=conectado" */
export function comRetorno(voltar: string, resultado: string) {
    const [caminho, consulta = ""] = voltar.split("?")
    const params = new URLSearchParams(consulta)
    params.set("instagram", resultado)
    return `${caminho}?${params.toString()}`
}
