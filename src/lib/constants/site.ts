/**
 * Endereço público do site, usado por robots, sitemap e metadata de
 * compartilhamento. Pode ser sobrescrito por ambiente (preview, staging).
 */
export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.somospreta.com"

/**
 * Endereço do painel interno, que vive em subdomínio próprio.
 *
 * Existe para os saltos entre as duas áreas: a área do criador e o callback do
 * OAuth rodam no domínio do site, e um href relativo para /dashboard ali cairia
 * no site, não no painel.
 */
export const PLATAFORMA_URL =
    process.env.NEXT_PUBLIC_PLATAFORMA_URL?.replace(/\/$/, "") ?? "https://plataforma.somospreta.com"
