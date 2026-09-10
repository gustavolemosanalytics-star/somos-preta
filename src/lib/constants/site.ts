/**
 * Endereço público do site, usado por robots, sitemap e metadata de
 * compartilhamento. Pode ser sobrescrito por ambiente (preview, staging).
 */
export const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://www.somospreta.com"
