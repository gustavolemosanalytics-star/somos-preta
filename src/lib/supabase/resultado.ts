import { toast } from "sonner"

/**
 * Duas armadilhas do PostgREST que faziam as telas mentirem — e o antídoto.
 *
 * 1. UPDATE e DELETE barrados pela RLS NÃO devolvem erro: devolvem zero linhas.
 *    Sem conferir, a tela anuncia "salvo" para o que não gravou, e o registro
 *    reaparece intacto no próximo carregamento.
 *
 * 2. Erro de leitura desestruturado só por `data` e caído em `?? []` vira lista
 *    vazia. A tela então mostra "Nenhum contrato ainda" para quem na verdade
 *    perdeu a sessão — convidando a cadastrar de novo o que já existe.
 */

type Resposta<T> = { data: T | null; error: { message: string } | null }

/**
 * Confirma que a escrita alterou alguma linha de fato.
 *
 * A consulta PRECISA terminar em `.select(...)` — sem as linhas de volta não há
 * como distinguir "gravou" de "a RLS engoliu".
 *
 * Devolve true só quando gravou; no resto, já mostra o toast e devolve false.
 */
export async function confirmarEscrita(
    consulta: PromiseLike<Resposta<unknown[]>>,
    acao: string,
): Promise<boolean> {
    const { data, error } = await consulta

    if (error) {
        toast.error(`${acao}: ${error.message}`)
        return false
    }

    if (!data || data.length === 0) {
        toast.error(
            `${acao}. Você pode não ter permissão para isso, ou o registro já foi removido por outra pessoa.`
        )
        return false
    }

    return true
}

/**
 * Separa "não existe nada" de "não consegui ler".
 *
 * Devolve os dados quando a leitura deu certo e `null` quando falhou — nunca
 * uma lista vazia como consolo. Quem chama decide entre o estado vazio e o
 * aviso de falha, que são mensagens diferentes para o usuário.
 */
export function lidos<T>(resposta: Resposta<T[]>): T[] | null {
    if (resposta.error) return null
    return resposta.data ?? []
}

/** Mesma ideia para consulta de linha única (.single()/.maybeSingle()). */
export function lido<T>(resposta: Resposta<T>): { ok: true; valor: T | null } | { ok: false } {
    if (resposta.error) return { ok: false }
    return { ok: true, valor: resposta.data }
}
