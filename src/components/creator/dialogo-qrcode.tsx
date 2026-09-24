"use client"

import { useState } from "react"
import { Download, QrCode } from "lucide-react"

import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

/**
 * O QR Code do kit, para imprimir.
 *
 * A imagem vem da rota /api/kit/<slug>/qr, que devolve SVG. Gerar no navegador
 * traria a biblioteca de QR inteira para o pacote que toda criadora baixa, por
 * causa de um botão que a maioria vai clicar uma vez na vida.
 */
export function DialogoQrCode({ slug }: { slug: string }) {
    const [aberto, setAberto] = useState(false)
    const endereco = `/api/kit/${slug}/qr`

    return (
        <Dialog open={aberto} onOpenChange={setAberto}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                    <QrCode className="h-4 w-4" aria-hidden />
                    Gerar QR Code
                </button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>QR Code do seu Mídia Kit</DialogTitle>
                    <DialogDescription>
                        Quem apontar a câmera cai direto na sua página. Serve para crachá de evento, verso de
                        cartão ou slide de apresentação.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center rounded-2xl border border-border bg-white p-6">
                    {/* Vem de rota nossa, em SVG; next/image não otimiza SVG e
                        exigiria configuração de domínio à toa. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={endereco}
                        alt={`QR Code que leva ao Media Kit em somospreta.com/kit/${slug}`}
                        className="h-56 w-56"
                    />
                </div>

                <a
                    href={endereco}
                    download={`qrcode-${slug}.svg`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand-terracota text-sm font-bold text-white transition-colors hover:bg-brand-coral"
                >
                    <Download className="h-4 w-4" aria-hidden />
                    Baixar em SVG
                </a>

                <p className="text-center text-[13px] leading-relaxed text-muted-foreground">
                    O arquivo é vetorial: dá para ampliar do tamanho de um selo ao de um banner sem perder
                    nitidez.
                </p>
            </DialogContent>
        </Dialog>
    )
}
