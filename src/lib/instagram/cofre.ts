import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

/**
 * Cofre do token do Instagram — só servidor.
 *
 * O token da criadora dá acesso de leitura a toda a conta dela (insights,
 * audiência, publicações). Ele fica no banco CIFRADO (AES-256-GCM), de modo
 * que um vazamento da tabela, um backup esquecido ou um SELECT de alguém com
 * acesso ao painel do Supabase não entrega a conta de ninguém.
 *
 * A chave vem de INSTAGRAM_TOKEN_SECRET. Trocar esse segredo invalida todos
 * os tokens guardados — as criadoras precisariam conectar de novo.
 */

const VERSAO = "v1"

function chave(): Buffer {
    const segredo = process.env.INSTAGRAM_TOKEN_SECRET
    if (!segredo || segredo.length < 16) {
        throw new Error("INSTAGRAM_TOKEN_SECRET ausente ou curto demais (mínimo 16 caracteres)")
    }
    return createHash("sha256").update(segredo).digest()
}

export function cofreConfigurado(): boolean {
    const segredo = process.env.INSTAGRAM_TOKEN_SECRET
    return Boolean(segredo && segredo.length >= 16)
}

export function cifrar(texto: string): string {
    const iv = randomBytes(12)
    const cifra = createCipheriv("aes-256-gcm", chave(), iv)
    const corpo = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()])
    const etiqueta = cifra.getAuthTag()
    return [VERSAO, iv.toString("base64url"), etiqueta.toString("base64url"), corpo.toString("base64url")].join(".")
}

export function decifrar(guardado: string): string {
    const [versao, iv, etiqueta, corpo] = guardado.split(".")
    if (versao !== VERSAO || !iv || !etiqueta || !corpo) throw new Error("Token guardado em formato desconhecido")
    const decifra = createDecipheriv("aes-256-gcm", chave(), Buffer.from(iv, "base64url"))
    decifra.setAuthTag(Buffer.from(etiqueta, "base64url"))
    return Buffer.concat([decifra.update(Buffer.from(corpo, "base64url")), decifra.final()]).toString("utf8")
}
