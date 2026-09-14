import type { MetadataRoute } from "next"
import { headers } from "next/headers"

import { SITE_URL } from "@/lib/constants/site"

/**
 * Dois robots, um arquivo — o mesmo app atende o site e o subdomínio do painel.
 *
 * No painel, NADA deve ser indexado: as telas exigem sessão, mas sem esta
 * distinção o /robots.txt de plataforma.somospreta.com diria "pode rastrear
 * tudo" e ofereceria as telas de login ao buscador.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
    const host = (await headers()).get("host")?.split(":")[0].toLowerCase() ?? ""

    if (host === "plataforma" || host.startsWith("plataforma.")) {
        return { rules: { userAgent: "*", disallow: "/" } }
    }

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            // A área do criador e o portal do cliente são acessados por link
            // direto; o /app/ cobre bookmarks antigos do painel, que agora
            // respondem com redirect para o subdomínio.
            disallow: ["/app/", "/creator/", "/client-portal/"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
