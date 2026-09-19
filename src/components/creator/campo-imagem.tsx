"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

/**
 * Campo de imagem com arrastar-e-soltar, clique e teclado.
 *
 * A validação de tipo mora aqui porque o `accept` do <input> é só o filtro
 * inicial do seletor de arquivos: quem troca para "Todos os arquivos", ou
 * arrasta de outra janela, passa qualquer coisa. O bucket é público — um SVG
 * com <script> servido do nosso domínio é XSS, por isso SVG fica de fora.
 */

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/avif"]
const TAMANHO_MAXIMO = 10 * 1024 * 1024

/**
 * Lado maior da imagem depois do corte.
 *
 * O bucket aceita 10MB e a vitrine servia o arquivo original: uma foto de
 * 4032px tirada no celular saía de lá inteira e voltava inteira para o celular
 * da marca, no 4G. 1600px cobre a capa em tela retina com folga e derruba essa
 * mesma foto para uns 250KB.
 */
const LADO_MAXIMO = 1600

/**
 * Encolhe no navegador antes de subir. Em qualquer falha devolve o arquivo
 * original: espremer a imagem é melhoria, não pode virar motivo de não
 * conseguir enviar a foto.
 */
async function encolher(arquivo: File): Promise<File> {
    // Abaixo de 400KB não compensa: o canvas re-encoda para JPEG e pode até
    // piorar um WebP ou AVIF que já veio bem comprimido.
    if (arquivo.size < 400 * 1024) return arquivo

    try {
        const bitmap = await createImageBitmap(arquivo)
        const maior = Math.max(bitmap.width, bitmap.height)
        if (maior <= LADO_MAXIMO) {
            bitmap.close()
            return arquivo
        }

        const escala = LADO_MAXIMO / maior
        const tela = document.createElement("canvas")
        tela.width = Math.round(bitmap.width * escala)
        tela.height = Math.round(bitmap.height * escala)

        const contexto = tela.getContext("2d")
        if (!contexto) {
            bitmap.close()
            return arquivo
        }
        contexto.drawImage(bitmap, 0, 0, tela.width, tela.height)
        bitmap.close()

        const blob = await new Promise<Blob | null>((resolve) =>
            tela.toBlob(resolve, "image/jpeg", 0.85),
        )
        if (!blob || blob.size >= arquivo.size) return arquivo

        const nome = arquivo.name.replace(/\.[^.]+$/, "") + ".jpg"
        return new File([blob], nome, { type: "image/jpeg" })
    } catch {
        return arquivo
    }
}

export type FormatoImagem = "capa" | "avatar" | "item"

export function CampoImagem({
    id,
    valor,
    formato,
    enviando = false,
    rotuloVazio,
    ajuda,
    onArquivo,
    onRemover,
    className,
}: {
    id: string
    valor?: string | null
    formato: FormatoImagem
    enviando?: boolean
    /** O convite que aparece quando ainda não há imagem. */
    rotuloVazio: string
    ajuda?: string
    onArquivo: (arquivo: File) => void
    /** Quando ausente, a imagem não pode ser removida — só trocada. */
    onRemover?: () => void
    className?: string
}) {
    const entradaRef = useRef<HTMLInputElement>(null)
    const [sobrevoando, setSobrevoando] = useState(false)

    // Sem isto o leitor de tela lia "Trocar arraste uma imagem ou clique para
    // escolher" — a frase do estado vazio emendada no verbo do estado cheio.
    const rotuloTrocar =
        formato === "avatar" ? "Trocar a foto de perfil"
            : formato === "capa" ? "Trocar a imagem de capa"
                : "Trocar a imagem do trabalho"

    async function validarEEnviar(arquivo: File | undefined) {
        if (!arquivo) return

        if (!TIPOS_ACEITOS.includes(arquivo.type)) {
            toast.error("Use uma imagem JPG, PNG, WebP ou AVIF")
            return
        }
        if (arquivo.size > TAMANHO_MAXIMO) {
            const mb = (arquivo.size / 1024 / 1024).toFixed(1)
            toast.error(`Essa imagem tem ${mb}MB — o limite é 10MB`)
            return
        }

        onArquivo(await encolher(arquivo))
    }

    function abrirSeletor() {
        if (!enviando) entradaRef.current?.click()
    }

    const proporcao =
        formato === "avatar" ? "aspect-square rounded-full" : formato === "capa" ? "h-36 rounded-2xl" : "aspect-video rounded-2xl"

    return (
        <div className={cn("space-y-2", className)}>
            <input
                ref={entradaRef}
                id={id}
                type="file"
                accept={TIPOS_ACEITOS.join(",")}
                // Fora da ordem de tabulação: o input é invisível, e deixá-lo
                // alcançável criava uma parada de foco que sumia da tela. Quem
                // abre o seletor é a área de soltar, logo abaixo.
                tabIndex={-1}
                className="sr-only"
                onChange={(e) => {
                    void validarEEnviar(e.target.files?.[0])
                    // Sem isto o mesmo arquivo não pode ser reescolhido depois
                    // de um erro: o input guarda o valor e o change não dispara.
                    e.target.value = ""
                }}
            />

            <div
                role="button"
                tabIndex={0}
                aria-label={valor ? rotuloTrocar : rotuloVazio}
                aria-busy={enviando}
                aria-describedby={ajuda ? `${id}-ajuda` : undefined}
                onClick={abrirSeletor}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        abrirSeletor()
                    }
                }}
                onDragOver={(e) => {
                    e.preventDefault()
                    setSobrevoando(true)
                }}
                onDragLeave={() => setSobrevoando(false)}
                onDrop={(e) => {
                    e.preventDefault()
                    setSobrevoando(false)
                    void validarEEnviar(e.dataTransfer.files?.[0])
                }}
                className={cn(
                    "group relative w-full overflow-hidden border-2 border-dashed border-border bg-muted/40 p-0",
                    "hover:border-brand-terracota hover:bg-accent",
                    // O anel do :focus-visible global fica; sem ele o foco de
                    // teclado ficava idêntico ao hover do mouse e não dava para
                    // saber onde se estava.
                    "focus-visible:border-brand-terracota focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    proporcao,
                    formato === "avatar" && "h-24 w-24 shrink-0",
                    sobrevoando && "border-brand-terracota bg-brand-terracota/8",
                    enviando && "pointer-events-none opacity-70",
                )}
            >
                {valor ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={valor} alt="" className="h-full w-full object-cover" />
                        {/* No toque não existe hover: a pista de que dá para
                            trocar a imagem ficava invisível no celular. Aqui ela
                            é um selo sempre visível, que no ponteiro vira a
                            cortina inteira ao passar o mouse. */}
                        <span
                            aria-hidden
                            className={cn(
                                "absolute inset-0 flex items-center justify-center gap-2 bg-brand-carvao/55 text-[13px] font-medium text-white opacity-0",
                                "transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100",
                            )}
                        >
                            <RefreshCw className="h-4 w-4" />
                            {formato !== "avatar" && "Trocar imagem"}
                        </span>
                        <span
                            aria-hidden
                            className={cn(
                                "absolute flex items-center gap-1.5 rounded-full bg-brand-carvao/70 text-white group-hover:opacity-0",
                                formato === "avatar"
                                    ? "bottom-1 right-1 h-7 w-7 justify-center"
                                    : "bottom-2 right-2 px-3 py-1.5 text-[12px] font-medium",
                            )}
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            {formato !== "avatar" && "Trocar"}
                        </span>
                    </>
                ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
                        <ImagePlus
                            className={cn("text-brand-terracota", formato === "avatar" ? "h-5 w-5" : "h-6 w-6")}
                            aria-hidden
                        />
                        {formato !== "avatar" && (
                            <span className="text-[13px] font-medium text-muted-foreground">{rotuloVazio}</span>
                        )}
                    </span>
                )}

                {enviando && (
                    <span className="absolute inset-0 flex items-center justify-center bg-background/70">
                        <Loader2 className="h-5 w-5 animate-spin text-brand-terracota" aria-hidden />
                        <span className="sr-only">Enviando imagem</span>
                    </span>
                )}
            </div>

            {(ajuda || (valor && onRemover)) && (
                <div className="flex items-start justify-between gap-3">
                    {ajuda && (
                        <p id={`${id}-ajuda`} className="text-xs leading-relaxed text-muted-foreground">
                            {ajuda}
                        </p>
                    )}
                    {valor && onRemover && (
                        <button
                            type="button"
                            onClick={onRemover}
                            className="shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remover
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
