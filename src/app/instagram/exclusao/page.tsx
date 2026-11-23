import type { Metadata } from "next"
import Link from "next/link"

/**
 * Endereço de acompanhamento que a Meta mostra a quem pediu a exclusão dos
 * dados (é a `url` devolvida por /api/instagram/exclusao-de-dados).
 *
 * A exclusão acontece na hora, dentro do próprio callback — não há fila. Por
 * isso a página só confirma, com o código que a pessoa recebeu da Meta.
 */

export const metadata: Metadata = {
    title: "Exclusão de dados do Instagram — Somos Preta",
    robots: { index: false, follow: false },
}

export default async function ExclusaoPage({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
    const { codigo } = await searchParams
    const codigoLimpo = (codigo ?? "").replace(/[^a-f0-9]/gi, "").slice(0, 32)

    return (
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-terracota-texto">Somos Preta</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Seus dados do Instagram foram apagados</h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                Removemos o acesso à sua conta, o histórico de métricas, os números exibidos no seu Mídia Kit e as imagens
                copiadas do seu perfil. Nada disso fica guardado com a gente.
            </p>
            {codigoLimpo && (
                <p className="mt-6 rounded-2xl bg-muted px-4 py-3 text-sm">
                    Código de confirmação: <strong className="font-mono">{codigoLimpo}</strong>
                </p>
            )}
            <p className="mt-6 text-sm text-muted-foreground">
                Dúvidas? Fale com a gente pelo{" "}
                <Link href="/" className="font-semibold text-foreground underline-offset-4 hover:underline">
                    site da Somos Preta
                </Link>
                .
            </p>
        </main>
    )
}
