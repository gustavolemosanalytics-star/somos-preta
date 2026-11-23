"use client"

import { Check, Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"
import {
    ABERTURAS, FONTES, GRAFISMOS, MODELOS, PALETAS, SECOES, aplicarModelo, modeloAtual, paletaDoTema,
    type Aparencia, type ChaveAbertura, type ChaveFonte, type ChaveGrafismo, type Paleta,
} from "@/lib/constants/media-kit"
import { KitVitrine, type DadosVitrine } from "@/components/public/kit-vitrine"
import { Switch } from "@/components/ui/switch"
import { ListaOrdenavel } from "@/components/creator/lista-ordenavel"
import { FONTE_DISPLAY, VARIAVEIS_DE_FONTE } from "@/components/public/kit/fontes"
import { Grafismo } from "@/components/public/kit/grafismo"

/**
 * Etapa "Visual" do editor — onde o kit vira a cara da criadora.
 *
 * Cada escolha tem uma miniatura feita com as MESMAS peças da vitrine (a
 * paleta, a tipografia e o grafismo de verdade), e a prévia ao lado muda na
 * hora. Escolher "Aurora" lendo a palavra "Aurora" é adivinhar; vendo, não.
 *
 * Tudo salva no clique, como o resto do editor. Não há "aplicar".
 */

/** As variáveis da paleta, para as miniaturas falarem a mesma língua da vitrine. */
function variaveis(p: Paleta) {
    return {
        "--kit-fundo": p.fundo,
        "--kit-superficie": p.superficie,
        "--kit-tinta": p.tinta,
        "--kit-suave": p.suave,
        "--kit-linha": p.linha,
        "--kit-acento": p.acento,
        "--kit-acento2": p.acento2,
        "--kit-leitura": p.leitura,
        "--kit-botao": p.botao,
        "--kit-sobre-botao": p.sobreBotao,
    } as React.CSSProperties
}

/**
 * Grupo de cartões que se comporta como rádio: Tab entra uma vez, setas
 * trocam. Sem o onKeyDown, quem navega por teclado fica preso no cartão em
 * foco e não consegue mudar a escolha.
 */
function GrupoDeOpcoes<T extends string>({
    rotulo,
    opcoes,
    valor,
    onEscolher,
    colunas,
    children,
}: {
    rotulo: string
    opcoes: readonly { valor: T; label: string }[]
    valor: T
    onEscolher: (v: T) => void
    colunas: string
    children: (opcao: T, escolhido: boolean) => React.ReactNode
}) {
    return (
        <div role="radiogroup" aria-label={rotulo} className={cn("grid gap-3", colunas)}>
            {opcoes.map((opcao, indice) => {
                const escolhido = valor === opcao.valor
                return (
                    <button
                        key={opcao.valor}
                        type="button"
                        role="radio"
                        aria-checked={escolhido}
                        aria-label={opcao.label}
                        tabIndex={escolhido ? 0 : -1}
                        onClick={() => onEscolher(opcao.valor)}
                        onKeyDown={(e) => {
                            const passo =
                                e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
                                    : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1
                                        : 0
                            if (!passo) return
                            e.preventDefault()
                            const i = (indice + passo + opcoes.length) % opcoes.length
                            onEscolher(opcoes[i].valor)
                            e.currentTarget.parentElement
                                ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
                                [i]?.focus()
                        }}
                        className={cn(
                            "!min-h-0 relative flex flex-col items-stretch overflow-hidden rounded-2xl border bg-card p-0 text-left transition-colors",
                            escolhido ? "border-brand-terracota" : "border-border hover:border-brand-terracota/50",
                        )}
                    >
                        {children(opcao.valor, escolhido)}
                        {escolhido && (
                            <>
                                <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-brand-terracota" />
                                <span aria-hidden className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-terracota text-white shadow">
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                </span>
                            </>
                        )}
                    </button>
                )
            })}
        </div>
    )
}

function Bloco({ titulo, ajuda, children }: { titulo: string; ajuda: string; children: React.ReactNode }) {
    return (
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <h3 className="text-[15px] font-bold tracking-tight">{titulo}</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{ajuda}</p>
            <div className="mt-5">{children}</div>
        </section>
    )
}

export function EtapaVisual({
    tema,
    aparencia,
    onTema,
    onAparencia,
    onModelo,
    dados,
    nome,
    avatar,
}: {
    tema: string
    aparencia: Aparencia
    onTema: (valor: string) => void
    onAparencia: (nova: Aparencia) => void
    /** Troca paleta e aparência de uma vez (um salvamento só). */
    onModelo: (tema: string, aparencia: Aparencia) => void
    /** O conteúdo da criadora, para as miniaturas dos modelos serem o kit DELA. */
    dados: DadosVitrine
    nome: string
    avatar: string | null
}) {
    const atual = modeloAtual(tema, aparencia)
    const paleta = paletaDoTema(tema)
    const primeiroNome = (nome || "Seu nome").split(" ")[0]
    const mudar = <K extends keyof Aparencia>(chave: K, valor: Aparencia[K]) => onAparencia({ ...aparencia, [chave]: valor })

    const itensDeSecao = aparencia.secoes.map((s) => ({ id: s.chave, ...s }))

    return (
        <div className={cn("space-y-4", VARIAVEIS_DE_FONTE)}>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
                Seu kit, sua cara. Comece escolhendo um modelo e, se quiser, ajuste peça por peça logo abaixo. Tudo
                muda a página na hora.
            </p>

            {/* ---------- modelos ---------- */}
            <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[15px] font-bold tracking-tight">Modelos</h3>
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            atual ? "bg-brand-terracota/12 text-brand-terracota-texto" : "bg-muted text-muted-foreground",
                        )}
                    >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        {atual ? `Usando: ${atual.label}` : "Personalizado"}
                    </span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    Cada modelo já vem com cor, letra, grafismo e ordem das seções combinados. As miniaturas usam o seu
                    nome e a sua foto.
                </p>

                {/* Rolagem lateral com encaixe: nove modelos lado a lado no
                    celular viram uma esteira, não uma coluna de dois metros. */}
                <div
                    role="radiogroup"
                    aria-label="Modelo do Mídia Kit"
                    className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:-mx-6 sm:px-6"
                >
                    {MODELOS.map((m, indice) => {
                        const escolhido = atual?.valor === m.valor
                        const aplicado = aplicarModelo(m, aparencia)
                        return (
                            // div, e não button: a miniatura é a vitrine de verdade, com
                            // links e títulos, e nada disso pode morar dentro de um
                            // <button>. O papel de rádio e o teclado vêm declarados.
                            <div
                                key={m.valor}
                                role="radio"
                                aria-checked={escolhido}
                                aria-label={`Modelo ${m.label}: ${m.descricao}`}
                                tabIndex={escolhido || (!atual && indice === 0) ? 0 : -1}
                                onClick={() => onModelo(aplicado.tema, aplicado.aparencia)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault()
                                        onModelo(aplicado.tema, aplicado.aparencia)
                                        return
                                    }
                                    const passo = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
                                    if (!passo) return
                                    e.preventDefault()
                                    const i = (indice + passo + MODELOS.length) % MODELOS.length
                                    const alvo = aplicarModelo(MODELOS[i], aparencia)
                                    onModelo(alvo.tema, alvo.aparencia)
                                    e.currentTarget.parentElement
                                        ?.querySelectorAll<HTMLElement>('[role="radio"]')
                                        [i]?.focus()
                                }}
                                className={cn(
                                    "relative flex w-[264px] shrink-0 cursor-pointer snap-start flex-col overflow-hidden rounded-2xl border bg-card text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-terracota/50",
                                    escolhido ? "border-brand-terracota" : "border-border hover:border-brand-terracota/50",
                                )}
                            >
                                {/* O topo do kit em 1056px, reduzido a um quarto. A
                                    largura fixa faz o layout de computador aparecer
                                    na miniatura, que é o que a marca vê primeiro. */}
                                <div aria-hidden inert className="kit-miniatura relative h-[176px] w-full overflow-hidden">
                                    <div className="pointer-events-none absolute left-0 top-0 w-[1056px] origin-top-left scale-[0.25]">
                                        <KitVitrine
                                            kit={{ ...dados, tema: aplicado.tema, aparencia: aplicado.aparencia }}
                                            modo="previa"
                                            parte="abertura"
                                        />
                                    </div>
                                </div>
                                <span className="flex items-center justify-between gap-2 border-t border-border px-3.5 py-2.5">
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-semibold">{m.label}</span>
                                        <span className="block truncate text-[11px] text-muted-foreground">{m.descricao}</span>
                                    </span>
                                </span>
                                {escolhido && (
                                    <>
                                        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-brand-terracota" />
                                        <span aria-hidden className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-terracota text-white shadow">
                                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                        </span>
                                    </>
                                )}
                            </div>
                        )
                    })}
                </div>
            </section>

            <p className="px-1 pt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Ajuste fino</p>

            {/* ---------- paleta ---------- */}
            <Bloco titulo="Paleta" ajuda="Todas foram testadas para o texto ficar legível no celular, até as escuras.">
                <GrupoDeOpcoes
                    rotulo="Paleta de cores"
                    opcoes={PALETAS}
                    valor={paleta.valor}
                    onEscolher={onTema}
                    colunas="grid-cols-2 sm:grid-cols-3"
                >
                    {(valor) => {
                        const p = PALETAS.find((x) => x.valor === valor) as Paleta
                        return (
                            <>
                                <span aria-hidden style={variaveis(p)} className="relative isolate block h-20 overflow-hidden bg-kit-fundo">
                                    <span className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-kit-acento/70 blur-xl" />
                                    <span className="absolute -bottom-10 left-4 h-20 w-20 rounded-full bg-kit-acento2/60 blur-xl" />
                                    <span className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                        <span className="h-4 w-4 rounded-full border border-black/10 bg-kit-tinta" />
                                        <span className="h-4 w-4 rounded-full border border-black/10 bg-kit-acento" />
                                        <span className="h-4 w-4 rounded-full border border-black/10 bg-kit-acento2" />
                                    </span>
                                    <span className="absolute bottom-2.5 right-3 rounded-full bg-kit-botao px-2 py-0.5 text-[10px] font-bold text-kit-sobre-botao">
                                        Aa
                                    </span>
                                </span>
                                <span className="flex items-center justify-between gap-2 px-3.5 py-2.5">
                                    <span className="text-[13px] font-semibold">{p.label}</span>
                                    <span className="truncate text-[11px] text-muted-foreground">{p.escuro ? "Escuro" : p.descricao}</span>
                                </span>
                            </>
                        )
                    }}
                </GrupoDeOpcoes>
            </Bloco>

            {/* ---------- tipografia ---------- */}
            <Bloco titulo="Tipografia" ajuda="A letra do seu nome, dos títulos e dos números grandes. O texto corrido continua fácil de ler.">
                <GrupoDeOpcoes
                    rotulo="Tipografia"
                    opcoes={FONTES}
                    valor={aparencia.fonte}
                    onEscolher={(v: ChaveFonte) => mudar("fonte", v)}
                    colunas="grid-cols-1 sm:grid-cols-3"
                >
                    {(valor) => {
                        const f = FONTES.find((x) => x.valor === valor)!
                        return (
                            <>
                                <span
                                    aria-hidden
                                    style={{ fontFamily: FONTE_DISPLAY[valor].familia }}
                                    className={cn("block truncate px-4 pb-1 pt-5 text-[2.1rem] leading-none", FONTE_DISPLAY[valor].titulo)}
                                >
                                    {primeiroNome}
                                </span>
                                <span className="flex items-center justify-between gap-2 px-4 pb-3 pt-2">
                                    <span className="text-[13px] font-semibold">{f.label}</span>
                                    <span className="text-[11px] text-muted-foreground">{f.descricao}</span>
                                </span>
                            </>
                        )
                    }}
                </GrupoDeOpcoes>
            </Bloco>

            {/* ---------- abertura ---------- */}
            <Bloco titulo="Abertura" ajuda="Como a página começa — é o que a marca vê antes de rolar.">
                <GrupoDeOpcoes
                    rotulo="Abertura da página"
                    opcoes={ABERTURAS}
                    valor={aparencia.abertura}
                    onEscolher={(v: ChaveAbertura) => mudar("abertura", v)}
                    colunas="grid-cols-1 sm:grid-cols-3"
                >
                    {(valor) => {
                        const a = ABERTURAS.find((x) => x.valor === valor)!
                        return (
                            <>
                                <span aria-hidden style={variaveis(paleta)} className="block h-24 bg-kit-fundo p-3">
                                    <MiniaturaAbertura tipo={valor} avatar={avatar} />
                                </span>
                                <span className="block px-3.5 py-2.5">
                                    <span className="block text-[13px] font-semibold">{a.label}</span>
                                    <span className="block text-[11px] text-muted-foreground">{a.descricao}</span>
                                </span>
                            </>
                        )
                    }}
                </GrupoDeOpcoes>
            </Bloco>

            {/* ---------- grafismo ---------- */}
            <Bloco titulo="Grafismo" ajuda="O elemento gráfico do fundo do topo e do convite final. Muda de cor junto com a paleta.">
                <GrupoDeOpcoes
                    rotulo="Grafismo"
                    opcoes={GRAFISMOS}
                    valor={aparencia.grafismo}
                    onEscolher={(v: ChaveGrafismo) => mudar("grafismo", v)}
                    colunas="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                >
                    {(valor) => {
                        const g = GRAFISMOS.find((x) => x.valor === valor)!
                        return (
                            <>
                                <span aria-hidden style={variaveis(paleta)} className="relative isolate block h-20 overflow-hidden bg-kit-fundo">
                                    <Grafismo tipo={valor} />
                                </span>
                                <span className="block px-3 py-2.5">
                                    <span className="block text-[13px] font-semibold">{g.label}</span>
                                    <span className="block truncate text-[11px] text-muted-foreground">{g.descricao}</span>
                                </span>
                            </>
                        )
                    }}
                </GrupoDeOpcoes>
            </Bloco>

            {/* ---------- seções ---------- */}
            <Bloco
                titulo="Seções e ordem"
                ajuda="Arraste para mudar a ordem e desligue o que não quiser mostrar. Seção sem conteúdo não aparece de qualquer jeito."
            >
                <ListaOrdenavel
                    itens={itensDeSecao}
                    rotulo="seção"
                    className="space-y-2"
                    onReordenar={(novos) => mudar("secoes", novos.map(({ chave, visivel }) => ({ chave, visivel })))}
                >
                    {(item, indice, alca) => {
                        const info = SECOES.find((s) => s.valor === item.chave)!
                        const id = `secao-${item.chave}`
                        return (
                            <div className={cn("flex items-center gap-2 rounded-2xl border border-border bg-background px-2 py-2 pr-4", !item.visivel && "opacity-60")}>
                                {alca}
                                <span className="w-6 text-center text-xs font-bold tabular-nums text-muted-foreground">{String(indice + 1).padStart(2, "0")}</span>
                                <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                                    <span className="block text-sm font-semibold">{info.label}</span>
                                    <span className="block truncate text-xs text-muted-foreground">{info.descricao}</span>
                                </label>
                                <Switch
                                    id={id}
                                    checked={item.visivel}
                                    onCheckedChange={(visivel) =>
                                        mudar(
                                            "secoes",
                                            aparencia.secoes.map((s) => (s.chave === item.chave ? { ...s, visivel } : s)),
                                        )
                                    }
                                    aria-label={`Mostrar ${info.label}`}
                                />
                            </div>
                        )
                    }}
                </ListaOrdenavel>
            </Bloco>
        </div>
    )
}

/** Esqueleto de cada abertura, em traço simples, com as cores da paleta atual. */
function MiniaturaAbertura({ tipo, avatar }: { tipo: ChaveAbertura; avatar: string | null }) {
    const foto = (classe: string) =>
        avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className={cn("object-cover", classe)} />
        ) : (
            <span className={cn("block bg-kit-acento/50", classe)} />
        )
    const linhas = (centro = false) => (
        <span className={cn("flex flex-col gap-1", centro && "items-center")}>
            <span className="block h-2.5 w-16 rounded-full bg-kit-tinta" />
            <span className="block h-1.5 w-12 rounded-full bg-kit-leitura" />
            <span className="block h-1 w-14 rounded-full bg-kit-linha" />
        </span>
    )

    if (tipo === "capa") {
        return (
            <span className="flex h-full flex-col overflow-hidden rounded-lg border border-kit-linha">
                <span className="block h-7 bg-kit-acento/60" />
                <span className="flex items-start gap-2 px-2">
                    {foto("-mt-3 h-8 w-8 rounded-lg border-2 border-kit-fundo")}
                    <span className="pt-1">{linhas()}</span>
                </span>
            </span>
        )
    }
    if (tipo === "central") {
        return (
            <span className="flex h-full flex-col items-center justify-center gap-1.5 rounded-lg border border-kit-linha">
                <span className="rounded-full bg-[conic-gradient(var(--kit-acento),var(--kit-acento2),var(--kit-acento))] p-[2px]">
                    {foto("block h-8 w-8 rounded-full border-2 border-kit-fundo")}
                </span>
                {linhas(true)}
            </span>
        )
    }
    return (
        <span className="flex h-full items-center justify-between gap-2 rounded-lg border border-kit-linha px-2.5">
            {linhas()}
            {foto("h-14 w-11 rounded-md")}
        </span>
    )
}
