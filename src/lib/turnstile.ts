"use server"

/**
 * Verificação do desafio Turnstile, do lado do servidor.
 *
 * O widget no navegador sozinho não protege nada: ele só produz um token, e
 * quem não tem navegador simplesmente não o usa. A proteção acontece aqui, onde
 * o token é trocado com a Cloudflare pelo veredito — e o segredo nunca sai do
 * servidor.
 *
 * Sem TURNSTILE_SECRET_KEY configurada, a verificação PASSA em vez de barrar.
 * É uma escolha deliberada: uma variável esquecida num deploy trancaria a
 * equipe inteira para fora do painel, o que é pior do que ficar um período sem
 * o desafio. O aviso no log é o que denuncia a configuração faltando.
 */

const ENDERECO = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export async function verificarTurnstile(token: string | null): Promise<boolean> {
    const segredo = process.env.TURNSTILE_SECRET_KEY

    if (!segredo) {
        console.warn("[turnstile] TURNSTILE_SECRET_KEY ausente — desafio não verificado")
        return true
    }

    if (!token) return false

    try {
        const corpo = new URLSearchParams({ secret: segredo, response: token })
        const r = await fetch(ENDERECO, { method: "POST", body: corpo })
        const dados = (await r.json()) as { success?: boolean }
        return dados.success === true
    } catch {
        // Cloudflare fora do ar não pode virar porta trancada para quem já tem
        // senha válida: o login segue, e o incidente fica no log.
        console.warn("[turnstile] falha ao contatar a Cloudflare — desafio ignorado")
        return true
    }
}
