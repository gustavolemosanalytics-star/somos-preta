import { Bricolage_Grotesque, Fraunces, Inter } from "next/font/google"

import type { ChaveFonte } from "@/lib/constants/media-kit"

/**
 * As três tipografias de título que a criadora pode escolher.
 *
 * Só os títulos e os números grandes mudam; o texto corrido segue em Inter,
 * que é o que garante leitura confortável em qualquer combinação. As duas
 * alternativas não são pré-carregadas: quem abre um kit "moderno" não deve
 * baixar a serifa de um kit "editorial".
 */

export const fonteModerna = Inter({
    subsets: ["latin"],
    variable: "--font-kit-moderna",
    display: "swap",
})

export const fonteEditorial = Fraunces({
    subsets: ["latin"],
    variable: "--font-kit-editorial",
    display: "swap",
    style: ["normal", "italic"],
    axes: ["SOFT", "opsz"],
    preload: false,
})

export const fonteExpressiva = Bricolage_Grotesque({
    subsets: ["latin"],
    variable: "--font-kit-expressiva",
    display: "swap",
    axes: ["wdth", "opsz"],
    preload: false,
})

export const VARIAVEIS_DE_FONTE = [fonteModerna.variable, fonteEditorial.variable, fonteExpressiva.variable].join(" ")

/** O que vai em `--kit-fonte-display`, mais o ajuste fino de peso e entrelinha de cada uma. */
export const FONTE_DISPLAY: Record<ChaveFonte, { familia: string; titulo: string }> = {
    moderna: { familia: "var(--font-kit-moderna)", titulo: "font-extrabold tracking-[-0.045em]" },
    editorial: { familia: "var(--font-kit-editorial)", titulo: "font-normal tracking-[-0.035em]" },
    expressiva: { familia: "var(--font-kit-expressiva)", titulo: "font-bold tracking-[-0.04em]" },
}
