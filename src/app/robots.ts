import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/constants/site"

/**
 * O painel interno e a área do criador são acessados por link direto e não
 * devem aparecer em busca. As rotas já exigem sessão, mas sem isto as telas de
 * login seriam indexáveis.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/app/", "/creator/", "/client-portal/"],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
