"use client"

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
    ArrowLeft, ArrowRight, BadgeCheck, Check, Copy, ExternalLink, Eye, Loader2,
    PartyPopper, Plus, RefreshCw, Rocket, Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase/client"
import { confirmarEscrita } from "@/lib/supabase/resultado"
import { slugify } from "@/lib/slug"
import { cn } from "@/lib/utils"
import type { MidiaKit } from "@/lib/db/types"
import { UFS } from "@/lib/constants/uf"
import {
    ESSENCIAIS, ETAPAS, RECOMENDADOS, REDES_CONFIG, TEMAS,
    formatarWhatsapp, normalizarHandle, normalizarLink, percentualPronto,
    whatsappParaBanco, whatsappValido,
    type ChaveEtapa, type Pacote, type PortfolioItem, type RedeInfo,
} from "@/lib/constants/media-kit"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownSelect } from "@/components/ui/dropdown-select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ErroDeCarregamento } from "@/components/painel/erro-de-carregamento"
import { KitVitrine } from "@/components/public/kit-vitrine"
import { CampoImagem } from "@/components/creator/campo-imagem"
import { EntradaNichos } from "@/components/creator/entrada-nichos"
import { ListaOrdenavel } from "@/components/creator/lista-ordenavel"
import { TrilhaEtapas } from "@/components/creator/trilha-etapas"
import { IndicadorSalvamento, type EstadoSalvamento } from "@/components/creator/indicador-salvamento"

/**
 * Editor do Media Kit.
 *
 * Sete etapas em vez das seis abas antigas — entrou "Contato", que resolve o
 * buraco mais grave da tela anterior: a página pública monta seu único botão de
 * contratação a partir de `kit.whatsapp`, e o editor não tinha campo nenhum
 * para essa coluna. Todo kit publicado nascia sem forma de resposta.
 *
 * Três regras que estruturam o arquivo inteiro:
 *
 * 1. NADA de recarregar o kit do servidor depois de salvar. A versão anterior
 *    fazia UPDATE + SELECT e reescrevia TODOS os campos do formulário; como o
 *    salvamento é no blur, o campo que acabara de receber o foco era apagado no
 *    meio da digitação. É o que transformava "Salvador" em "dor".
 *
 * 2. Toda escrita passa por uma FILA. `redes`, `portfolio` e `pacotes` são
 *    jsonb reconstruídos por inteiro a cada patch: dois salvamentos em paralelo
 *    partiam da mesma base velha e o segundo apagava o primeiro.
 *
 * 3. Toda escrita termina em `.select()` e passa por `confirmarEscrita`. No
 *    PostgREST, UPDATE barrado pela RLS não devolve erro — devolve zero linhas.
 *    Sem conferir, a tela diz "salvo" para o que não gravou.
 */

const EXTENSAO_POR_TIPO: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
}

const MAX_BIO = 280

const entrada = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
}

function novoId() {
    return crypto.randomUUID()
}

/** Itens salvos antes desta versão não têm id; sem um, a lista não reordena. */
function comIds<T extends { id?: string }>(lista: unknown): (T & { id: string })[] {
    if (!Array.isArray(lista)) return []
    return lista.map((item) => ({ ...(item as T), id: (item as T).id || novoId() }))
}

/** O caminho dentro do bucket, extraído da URL pública que guardamos na coluna. */
function caminhoDoBucket(url: string): string | null {
    const marca = "/object/public/midia-kit/"
    const corte = url.indexOf(marca)
    if (corte < 0) return null
    return decodeURIComponent(url.slice(corte + marca.length))
}

export default function MediaKitPage() {
    return (
        <Suspense fallback={<EsqueletoDoEditor />}>
            <Editor />
        </Suspense>
    )
}

function Editor() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [supabase] = useState(() => createClient())
    const movimentoReduzido = useReducedMotion()

    const [userId, setUserId] = useState<string | null>(null)
    const [kit, setKit] = useState<MidiaKit | null>(null)
    const kitRef = useRef<MidiaKit | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [falhouAoCarregar, setFalhouAoCarregar] = useState(false)

    const [salvamento, setSalvamento] = useState<EstadoSalvamento>("ocioso")
    // Todas as escritas que falharam, não só a última: com a rede oscilando dá
    // para perder a bio e a cidade em sequência, e "Tentar de novo" precisa
    // recuperar as duas — senão a tela anuncia "Tudo salvo" com a bio perdida.
    const pendentesRef = useRef<(() => Promise<boolean>)[]>([])

    // Campos do formulário. Ficam fora de `kit` de propósito: é o estado local
    // que alimenta a prévia ao vivo, sem nenhuma ida ao servidor.
    const [nome, setNome] = useState("")
    const [bio, setBio] = useState("")
    const [cidade, setCidade] = useState("")
    const [estado, setEstado] = useState("")
    const [whatsapp, setWhatsapp] = useState("")
    const [nichos, setNichos] = useState<string[]>([])
    const [handles, setHandles] = useState<Record<string, string>>({})
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([])
    // Espelho do portfólio. O upload é assíncrono: sem ele, o patch montado
    // depois do await carrega a lista de antes do envio e apaga o que foi
    // digitado, adicionado ou reordenado enquanto a imagem subia.
    const portfolioRef = useRef<PortfolioItem[]>([])
    const [pacotes, setPacotes] = useState<Pacote[]>([])
    const [slug, setSlug] = useState("")

    const [enviando, setEnviando] = useState<string | null>(null)
    const [buscandoRede, setBuscandoRede] = useState<string | null>(null)
    const [confirmandoPublicacao, setConfirmandoPublicacao] = useState(false)
    const [aRemover, setARemover] = useState<{ tipo: "portfolio" | "pacote"; id: string; nome: string } | null>(null)
    const [acabouDePublicar, setAcabouDePublicar] = useState(false)
    const tituloDaEtapaRef = useRef<HTMLHeadingElement>(null)

    const etapaDaUrl = searchParams.get("etapa") as ChaveEtapa | null
    const etapa: ChaveEtapa = ETAPAS.some((e) => e.chave === etapaDaUrl) ? (etapaDaUrl as ChaveEtapa) : "identidade"

    const irPara = useCallback(
        (chave: ChaveEtapa) => {
            // A etapa vive na URL para o voltar do navegador e o F5 não jogarem
            // a criadora de volta para a etapa 1 no meio do preenchimento.
            router.replace(`?etapa=${chave}`, { scroll: false })
        },
        [router],
    )

    // ---------- carregamento ----------

    const carregarRef = useRef(false)

    const carregar = useCallback(async () => {
        setCarregando(true)
        setFalhouAoCarregar(false)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setFalhouAoCarregar(true)
                return
            }
            setUserId(user.id)

            const encontrado = await garantirKit(user.id)
            if (!encontrado) {
                setFalhouAoCarregar(true)
                return
            }

            aplicarKit(encontrado)
        } catch {
            setFalhouAoCarregar(true)
        } finally {
            setCarregando(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase])

    useEffect(() => {
        // O guard existe por causa do StrictMode, que monta o componente duas
        // vezes em desenvolvimento e fazia o kit ser criado em duplicata.
        if (carregarRef.current) return
        carregarRef.current = true
        carregar()
    }, [carregar])

    /**
     * Procura o kit do criador e só cria quando não existe.
     *
     * O upsert NÃO pode rodar em toda montagem da tela. Ele vira
     * `insert ... on conflict do nothing`, e no Postgres o gatilho BEFORE
     * INSERT dispara ANTES de o conflito ser resolvido: a linha do kit é
     * descartada, mas o efeito colateral do gatilho fica. Como a linha
     * proposta não leva influencer_id, ele cadastrava um criador NOVO em
     * somos_preta_influencers a cada F5 — o banco tinha 12 criadores com
     * fonte 'app' para 2 media kits, 11 deles sem username.
     *
     * Ler antes de escrever não traz de volta a duplicata que a migration
     * 0015 resolveu: a constraint unique em cadastrado_por continua de pé, e
     * o upsert com ignoreDuplicates segue sendo o caminho de criação.
     */
    async function garantirKit(uid: string): Promise<MidiaKit | null> {
        const existente = await buscarKit(uid)
        if (existente.falhou) return null
        if (existente.kit) return existente.kit

        const { data: perfil } = await supabase
            .from("somos_preta_profiles")
            .select("nome")
            .eq("id", uid)
            .single()

        const nomeBase = perfil?.nome || "Criador"
        const slugBase = slugify(nomeBase)

        // O retry cobre colisão de slug entre criadores homônimos; a colisão
        // em cadastrado_por já é absorvida pelo ignoreDuplicates.
        for (let tentativa = 1; tentativa <= 20; tentativa++) {
            const candidato = tentativa === 1 ? slugBase : `${slugBase}-${tentativa}`
            const { error } = await supabase
                .from("somos_preta_midia_kits")
                .upsert(
                    { cadastrado_por: uid, nome: nomeBase, slug: candidato, publicado: false, tema: "terracota" },
                    { onConflict: "cadastrado_por", ignoreDuplicates: true },
                )

            if (!error) break
            if (error.code !== "23505") return null
        }

        const criado = await buscarKit(uid)
        return criado.kit
    }

    async function buscarKit(uid: string): Promise<{ kit: MidiaKit | null; falhou: boolean }> {
        const { data, error } = await supabase
            .from("somos_preta_midia_kits")
            .select("*")
            .eq("cadastrado_por", uid)
            .limit(1)
            .maybeSingle()

        // Distingue "não existe" de "não consegui ler": tratar falha de leitura
        // como ausência faria a tela tentar criar um kit que já existe.
        return { kit: (data as MidiaKit | null) ?? null, falhou: Boolean(error) }
    }

    /** Só na carga inicial. Depois disso o servidor nunca mais reescreve o form. */
    function aplicarKit(k: MidiaKit) {
        kitRef.current = k
        setKit(k)
        setNome(k.nome ?? "")
        setBio(k.bio ?? "")
        setCidade(k.cidade ?? "")
        setSlug(k.slug ?? "")
        setWhatsapp(formatarWhatsapp(k.whatsapp))
        setNichos(k.nichos ?? [])
        definirPortfolio(comIds<PortfolioItem>(k.portfolio))
        setPacotes(comIds<Pacote>(k.pacotes))

        // O campo de estado era texto livre e há kits salvos com "Bahia"; o
        // resto do produto guarda a sigla. Converte na entrada para o seletor
        // não abrir vazio em cima de um dado que existe.
        const salvo = (k.estado ?? "").trim()
        const porNome = UFS.find((uf) => uf.nome.localeCompare(salvo, "pt-BR", { sensitivity: "base" }) === 0)
        const sigla = porNome ? porNome.sigla : salvo.toUpperCase()
        setEstado(sigla)

        // Converter só na tela deixaria a prévia mostrando "BA" e a página no
        // ar mostrando "Bahia" até a criadora tocar no campo — que ela não tem
        // motivo nenhum para tocar. A conversão é gravada na carga.
        if (sigla && sigla !== salvo) {
            void supabase
                .from("somos_preta_midia_kits")
                .update({ estado: sigla })
                .eq("id", k.id)
                .select()
                .maybeSingle()
                .then(({ data }) => {
                    if (!data) return
                    const atualizado = { ...k, estado: sigla } as MidiaKit
                    kitRef.current = atualizado
                    setKit(atualizado)
                })
        }

        const redes = (k.redes ?? {}) as Record<string, RedeInfo>
        setHandles(Object.fromEntries(REDES_CONFIG.map((r) => [r.chave, redes[r.chave]?.handle ?? ""])))
    }

    // ---------- escrita ----------

    const filaRef = useRef<Promise<unknown>>(Promise.resolve())

    /**
     * Enfileira o patch. Cada função só é executada quando a anterior terminou,
     * então ela lê `kitRef.current` já com o resultado da escrita de antes —
     * que é o que impede um @ de apagar o outro.
     */
    function enfileirar(tarefa: () => Promise<boolean>): Promise<boolean> {
        const proxima = filaRef.current.then(tarefa, tarefa)
        filaRef.current = proxima.catch(() => false)
        return proxima
    }

    async function gravar(patch: Partial<MidiaKit>): Promise<boolean> {
        const alvo = kitRef.current
        if (!alvo) return false

        setSalvamento("salvando")

        const ok = await confirmarEscrita(
            supabase.from("somos_preta_midia_kits").update(patch).eq("id", alvo.id).select(),
            "Não consegui salvar",
        )

        if (!ok) {
            setSalvamento("erro")
            return false
        }

        const atualizado = { ...alvo, ...patch } as MidiaKit
        kitRef.current = atualizado
        setKit(atualizado)
        setSalvamento("salvo")
        return true
    }

    /**
     * Envolve a tarefa para ela se registrar quando falha e se desregistrar
     * quando passa — é isso que faz "Tentar de novo" recuperar tudo e que
     * impede o indicador de dizer "Tudo salvo" com uma escrita ainda perdida.
     */
    function executar(tarefa: () => Promise<boolean>) {
        const envolvida: () => Promise<boolean> = async () => {
            const ok = await tarefa()
            if (!ok) {
                if (!pendentesRef.current.includes(envolvida)) pendentesRef.current.push(envolvida)
            } else {
                pendentesRef.current = pendentesRef.current.filter((t) => t !== envolvida)
                if (pendentesRef.current.length > 0) setSalvamento("erro")
            }
            return ok
        }
        return enfileirar(envolvida)
    }

    function salvar(patch: Partial<MidiaKit>) {
        return executar(() => gravar(patch))
    }

    /** Para patches que precisam ler o estado mais recente na hora de montar. */
    function salvarDerivado(montar: () => Partial<MidiaKit> | null) {
        return executar(async () => {
            const patch = montar()
            if (!patch) return true
            return gravar(patch)
        })
    }

    function tentarDeNovo() {
        const pendentes = [...pendentesRef.current]
        pendentesRef.current = []
        for (const tarefa of pendentes) enfileirar(tarefa)
    }

    // Quem troca de etapa pelo botão "Continuar" perde o foco: o botão é
    // desmontado junto com a seção e o foco volta para o <body>, fazendo o
    // próximo Tab recomeçar do topo da página. O título da etapa nova recebe o
    // foco no lugar — que é também o que o leitor de tela precisa ouvir.
    const primeiroRenderRef = useRef(true)
    useEffect(() => {
        if (primeiroRenderRef.current) {
            primeiroRenderRef.current = false
            return
        }
        const t = setTimeout(() => tituloDaEtapaRef.current?.focus(), 320)
        return () => clearTimeout(t)
    }, [etapa])

    // O "Tudo salvo" some sozinho: recibo que fica para sempre na tela vira
    // ruído, e a criadora passa a não enxergar mais.
    useEffect(() => {
        if (salvamento !== "salvo") return
        const t = setTimeout(() => setSalvamento("ocioso"), 2400)
        return () => clearTimeout(t)
    }, [salvamento])

    // ---------- campos ----------

    function salvarNome() {
        const limpo = nome.trim()
        if (!kitRef.current) return
        if (!limpo) {
            // Sem isto o input fica visualmente vazio enquanto o banco mantém o
            // nome antigo: a criadora acredita na tela e o nome "volta sozinho"
            // no próximo carregamento.
            setNome(kitRef.current.nome ?? "")
            toast.error("O nome não pode ficar vazio — é ele que a marca vê primeiro")
            return
        }
        if (limpo === kitRef.current.nome) return
        salvar({ nome: limpo })
    }

    function salvarSimples(campo: "bio" | "cidade" | "estado", valor: string) {
        const limpo = valor.trim()
        if (!kitRef.current) return
        if (limpo === (kitRef.current[campo] ?? "")) return
        salvar({ [campo]: limpo || null } as Partial<MidiaKit>)
    }

    function salvarWhatsapp() {
        const paraBanco = whatsappParaBanco(whatsapp)
        if (!kitRef.current) return
        if (whatsapp.trim() && !whatsappValido(whatsapp)) {
            toast.error("Confira o número: faltam dígitos para ser um telefone brasileiro")
            return
        }
        if (paraBanco === (kitRef.current.whatsapp ?? null)) return
        salvar({ whatsapp: paraBanco })
    }

    function salvarNichos(novos: string[]) {
        setNichos(novos)
        salvar({ nichos: novos })
    }

    function salvarHandle(chave: string) {
        const limpo = normalizarHandle(handles[chave] ?? "")
        setHandles((prev) => ({ ...prev, [chave]: limpo }))

        salvarDerivado(() => {
            const atuais = (kitRef.current?.redes ?? {}) as Record<string, RedeInfo>
            if ((atuais[chave]?.handle ?? "") === limpo) return null

            // Esvaziar o @ mantém a chave com o handle em branco em vez de
            // apagar a rede: seguidores e engajamento digitados à mão sobrevivem
            // a uma correção do usuário. A vitrine já ignora rede sem handle.
            const proximas = { ...atuais, [chave]: { ...atuais[chave], handle: limpo } }

            return { redes: proximas }
        })
    }

    function salvarMetrica(chave: string, campo: "followers" | "engagement_rate", valor: string) {
        const numero = valor.trim() === "" ? null : Number(valor.replace(",", "."))
        if (numero !== null && (Number.isNaN(numero) || numero < 0)) return

        salvarDerivado(() => {
            const atuais = (kitRef.current?.redes ?? {}) as Record<string, RedeInfo>
            const atual = atuais[chave]
            if (!atual?.handle) return null
            if ((atual[campo] ?? null) === numero) return null
            return { redes: { ...atuais, [chave]: { ...atual, [campo]: numero, verificado: false } } }
        })
    }

    async function buscarDados(chave: string) {
        const usuario = normalizarHandle(handles[chave] ?? "")
        if (!usuario) {
            toast.error("Escreva seu @ antes de buscar")
            return
        }

        setBuscandoRede(chave)
        try {
            const res = await fetch(`/api/engajamento?username=${encodeURIComponent(usuario)}`)
            const dados = await res.json()
            if (!res.ok) {
                toast.error(dados?.error || "Não consegui buscar seus números agora")
                return
            }

            await salvarDerivado(() => {
                const atuais = (kitRef.current?.redes ?? {}) as Record<string, RedeInfo>
                return {
                    redes: {
                        ...atuais,
                        [chave]: {
                            handle: usuario,
                            followers: dados.follower_count ?? null,
                            engagement_rate: dados.engagement_rate ?? null,
                            verificado: true,
                        },
                    },
                }
            })

            const seguidores = typeof dados.follower_count === "number"
                ? dados.follower_count.toLocaleString("pt-BR")
                : "?"
            toast.success(`${seguidores} seguidores encontrados`)
        } catch {
            toast.error("Não consegui buscar seus números agora")
        } finally {
            setBuscandoRede(null)
        }
    }

    // ---------- imagens ----------

    async function apagarDoBucket(url: string | null | undefined) {
        if (!url) return
        const caminho = caminhoDoBucket(url)
        // Melhor esforço: falhar em limpar o arquivo antigo não pode impedir a
        // criadora de trocar a foto.
        if (caminho) await supabase.storage.from("midia-kit").remove([caminho])
    }

    async function enviarImagem(arquivo: File, destino: "avatar" | "cover" | "portfolio", idDoItem?: string) {
        if (!userId || !kitRef.current) return

        const marca = destino === "portfolio" ? `portfolio-${idDoItem}` : destino
        setEnviando(marca)

        // O nome original do arquivo não entra no caminho: a API do storage
        // recusa acento e cedilha, e o getPublicUrl só aplica encodeURI — uma
        // foto chamada "perfil #1.jpg" viraria URL truncada no #.
        const extensao = EXTENSAO_POR_TIPO[arquivo.type] ?? "jpg"
        const caminho = `${userId}/${destino}-${novoId()}.${extensao}`

        const { error } = await supabase.storage
            .from("midia-kit")
            .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false })

        if (error) {
            toast.error("Não consegui enviar a imagem. Tente de novo.")
            setEnviando(null)
            return
        }

        const { data } = supabase.storage.from("midia-kit").getPublicUrl(caminho)

        if (destino === "portfolio" && idDoItem) {
            let aindaExiste = false
            let anteriorDoItem: string | undefined

            // O patch é montado só quando a tarefa chega na frente da fila, a
            // partir do espelho — e não do array capturado antes do upload.
            const ok = await salvarDerivado(() => {
                const alvo = portfolioRef.current.find((p) => p.id === idDoItem)
                aindaExiste = Boolean(alvo)
                if (!alvo) return null
                anteriorDoItem = alvo.imagem
                const novos = portfolioRef.current.map((p) =>
                    p.id === idDoItem ? { ...p, imagem: data.publicUrl } : p,
                )
                definirPortfolio(novos)
                return { portfolio: novos }
            })

            setEnviando(null)

            // O trabalho pode ter sido removido durante o envio: aí a imagem
            // não é apontada por ninguém e não tem por que ficar no bucket.
            if (!ok || !aindaExiste) {
                await supabase.storage.from("midia-kit").remove([caminho])
                return
            }
            await apagarDoBucket(anteriorDoItem)
            return
        }

        const anterior = destino === "avatar" ? kitRef.current.avatar_url : kitRef.current.cover_url
        const ok = await salvar(destino === "avatar" ? { avatar_url: data.publicUrl } : { cover_url: data.publicUrl })
        setEnviando(null)

        if (!ok) {
            // Sem isto o arquivo fica no bucket público para sempre, pago e
            // acessível, apontado por nada.
            await supabase.storage.from("midia-kit").remove([caminho])
            return
        }

        await apagarDoBucket(anterior)
        toast.success(destino === "avatar" ? "Foto de perfil atualizada" : "Capa atualizada")
    }

    async function removerImagemDoTrabalho(item: PortfolioItem) {
        const anterior = item.imagem
        const novos = portfolioRef.current.map((p) => (p.id === item.id ? { ...p, imagem: "" } : p))
        definirPortfolio(novos)
        const ok = await salvar({ portfolio: novos })
        if (ok) await apagarDoBucket(anterior)
    }

    async function removerImagem(destino: "avatar" | "cover") {
        const anterior = destino === "avatar" ? kitRef.current?.avatar_url : kitRef.current?.cover_url
        const ok = await salvar(destino === "avatar" ? { avatar_url: null } : { cover_url: null })
        if (ok) await apagarDoBucket(anterior)
    }

    // ---------- portfólio e pacotes ----------

    function adicionarTrabalho() {
        const novo: PortfolioItem = { id: novoId(), titulo: "", imagem: "", descricao: "", link: "" }
        const novos = [...portfolioRef.current, novo]
        definirPortfolio(novos)
        salvar({ portfolio: novos })
    }

    /** Único caminho para mexer no portfólio: mantém estado e espelho juntos. */
    function definirPortfolio(novos: PortfolioItem[]) {
        portfolioRef.current = novos
        setPortfolio(novos)
    }

    function mudarTrabalho(id: string, campo: keyof PortfolioItem, valor: string) {
        definirPortfolio(portfolioRef.current.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)))
    }

    function salvarTrabalhos(lista?: PortfolioItem[]) {
        const alvo = lista ?? portfolioRef.current
        if (lista) definirPortfolio(lista)
        salvar({ portfolio: alvo })
    }

    function adicionarPacote() {
        const novo: Pacote = { id: novoId(), nome: "", preco: "", descricao: "", itens: [] }
        const novos = [...pacotes, novo]
        setPacotes(novos)
        salvar({ pacotes: novos })
    }

    function mudarPacote(id: string, campo: keyof Pacote, valor: string | string[]) {
        setPacotes((prev) => prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p)))
    }

    function salvarPacotes(lista?: Pacote[]) {
        const alvo = lista ?? pacotes
        if (lista) setPacotes(lista)
        salvar({ pacotes: alvo })
    }

    async function confirmarRemocao() {
        if (!aRemover) return
        const { tipo, id } = aRemover
        setARemover(null)

        if (tipo === "portfolio") {
            const removido = portfolioRef.current.find((p) => p.id === id)
            const novos = portfolioRef.current.filter((p) => p.id !== id)
            definirPortfolio(novos)
            const ok = await salvar({ portfolio: novos })
            if (ok && removido?.imagem) await apagarDoBucket(removido.imagem)
        } else {
            const novos = pacotes.filter((p) => p.id !== id)
            setPacotes(novos)
            await salvar({ pacotes: novos })
        }
    }

    // ---------- publicação ----------

    const dadosPrevia = useMemo(() => {
        const metricas = (kit?.redes ?? {}) as Record<string, RedeInfo>
        const redes: Record<string, RedeInfo> = {}
        for (const rede of REDES_CONFIG) {
            const handle = handles[rede.chave]
            if (handle) redes[rede.chave] = { ...metricas[rede.chave], handle }
        }

        return {
            publicado: kit?.publicado ?? false,
            nome,
            bio,
            cidade,
            estado,
            nichos,
            whatsapp: whatsappParaBanco(whatsapp),
            avatar_url: kit?.avatar_url ?? null,
            cover_url: kit?.cover_url ?? null,
            tema: kit?.tema ?? "terracota",
            redes,
            portfolio,
            pacotes,
        }
    }, [nome, bio, cidade, estado, nichos, whatsapp, handles, portfolio, pacotes, kit])

    const prontas = useMemo(
        () =>
            Object.fromEntries(ETAPAS.map((e) => [e.chave, e.pronta(dadosPrevia)])) as Record<ChaveEtapa, boolean>,
        [dadosPrevia],
    )

    const percentual = percentualPronto(dadosPrevia)
    const faltamEssenciais = ESSENCIAIS.filter((item) => !item.ok(dadosPrevia))

    /**
     * O endereço é único no banco inteiro, mas a RLS só deixa o criador
     * enxergar a PRÓPRIA linha: consultar antes nunca encontraria o slug de
     * outra pessoa. Quem de fato avisa é a constraint, com o código 23505 —
     * por isso esta escrita não passa por `confirmarEscrita`, que traduziria
     * a violação para a mensagem crua do Postgres na cara da criadora.
     */
    async function salvarSlug() {
        const desejado = slugify(slug)
        setSlug(desejado)

        const alvo = kitRef.current
        if (!alvo || desejado === alvo.slug) return

        setSalvamento("salvando")
        const { data, error } = await supabase
            .from("somos_preta_midia_kits")
            .update({ slug: desejado })
            .eq("id", alvo.id)
            .select()
            .maybeSingle()

        if (error?.code === "23505") {
            toast.error("Esse endereço já está em uso — tente outro")
            setSlug(alvo.slug)
            setSalvamento("ocioso")
            return
        }

        if (error || !data) {
            toast.error("Não consegui salvar o endereço")
            setSlug(alvo.slug)
            setSalvamento("erro")
            return
        }

        const atualizado = { ...alvo, slug: desejado } as MidiaKit
        kitRef.current = atualizado
        setKit(atualizado)
        setSalvamento("salvo")
    }

    async function publicar() {
        setConfirmandoPublicacao(false)
        const ok = await salvar({ publicado: true })
        if (ok) setAcabouDePublicar(true)
    }

    async function despublicar() {
        const ok = await salvar({ publicado: false })
        if (ok) {
            setAcabouDePublicar(false)
            toast.success("Media Kit despublicado — o link parou de funcionar")
        }
    }

    async function copiarLink() {
        if (!kit) return
        const url = `${window.location.origin}/kit/${kit.slug}`
        try {
            await navigator.clipboard.writeText(url)
            toast.success("Link copiado")
        } catch {
            // A Promise do clipboard rejeita em contexto não-seguro e quando a
            // permissão é negada; anunciar sucesso ali é mentir.
            toast.error("Não consegui copiar — selecione o link e copie na mão")
        }
    }

    // ---------- render ----------

    if (carregando) return <EsqueletoDoEditor />

    if (falhouAoCarregar || !kit) {
        return (
            <div className="mx-auto w-full max-w-[1100px]">
                <ErroDeCarregamento
                    recurso="seu Media Kit"
                    onTentarDeNovo={() => {
                        carregarRef.current = false
                        carregar()
                    }}
                />
                <p className="mt-4 text-center text-sm">
                    <Link href="/creator" className="text-brand-terracota hover:underline">
                        Voltar ao painel
                    </Link>
                </p>
            </div>
        )
    }

    const indiceAtual = ETAPAS.findIndex((e) => e.chave === etapa)
    const anterior = ETAPAS[indiceAtual - 1]
    const proxima = ETAPAS[indiceAtual + 1]
    const etapaAtual = ETAPAS[indiceAtual]

    const previa = <KitVitrine kit={dadosPrevia} modo="previa" />

    return (
        <div className="mx-auto w-full max-w-[1460px]">
            {/* ---------- abertura ---------- */}
            <header className="relative">
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Editor do Media Kit
                </p>

                <h1 className="mt-4 max-w-2xl text-[clamp(1.9rem,3.2vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
                    Seu Media Kit,
                    <br />
                    <span className="text-brand-terracota">em sete passos.</span>
                </h1>

                <p
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-0 hidden max-w-[10ch] -rotate-3 font-manuscrita text-[clamp(1.2rem,1.6vw,1.7rem)] leading-[1.2] text-brand-coral lg:block"
                >
                    Seu trabalho merece ser visto.
                    <span aria-hidden className="mt-2 block h-[2px] w-16 rounded-full bg-brand-coral" />
                </p>
            </header>

            {/* ---------- progresso ---------- */}
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-[200px] flex-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold tracking-[-0.03em] tabular-nums">{percentual}%</span>
                        <span className="text-sm text-muted-foreground">do seu kit está pronto</span>
                    </div>
                    <Progress value={percentual} className="mt-2 h-1.5 max-w-md" />
                </div>

                <div className="flex items-center gap-3">
                    <IndicadorSalvamento estado={salvamento} onTentarDeNovo={tentarDeNovo} />

                    {/* Em telas estreitas a prévia não cabe ao lado; vira gaveta. */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="h-11 rounded-full xl:hidden">
                                <Eye className="h-4 w-4" aria-hidden /> Ver prévia
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-md">
                            <SheetHeader className="border-b border-border">
                                <SheetTitle>Como a marca vai ver</SheetTitle>
                            </SheetHeader>
                            {previa}
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            <TrilhaEtapas atual={etapa} prontas={prontas} onIr={irPara} className="mt-6" />

            {/* ---------- corpo ---------- */}
            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_400px]">
                <div>
                    <AnimatePresence mode="wait">
                        <motion.section
                            key={etapa}
                            {...(movimentoReduzido ? {} : entrada)}
                            aria-labelledby="titulo-da-etapa"
                        >
                            <header className="mb-6">
                                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                    Etapa {etapaAtual.numero}
                                </p>
                                <span aria-hidden className="mt-3 block h-[2px] w-12 rounded-full bg-brand-coral" />
                                <h2
                                    id="titulo-da-etapa"
                                    ref={tituloDaEtapaRef}
                                    tabIndex={-1}
                                    className="mt-4 text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold leading-[1.1] tracking-[-0.03em] outline-none"
                                >
                                    {etapaAtual.chamada}
                                </h2>
                            </header>

                            {etapa === "identidade" && (
                                <EtapaIdentidade
                                    kit={kit}
                                    nome={nome}
                                    setNome={setNome}
                                    salvarNome={salvarNome}
                                    bio={bio}
                                    setBio={setBio}
                                    salvarBio={() => salvarSimples("bio", bio)}
                                    cidade={cidade}
                                    setCidade={setCidade}
                                    salvarCidade={() => salvarSimples("cidade", cidade)}
                                    estado={estado}
                                    setEstado={(v) => {
                                        setEstado(v)
                                        salvar({ estado: v || null })
                                    }}
                                    nichos={nichos}
                                    salvarNichos={salvarNichos}
                                    enviando={enviando}
                                    onEnviarAvatar={(a) => enviarImagem(a, "avatar")}
                                    onEnviarCapa={(a) => enviarImagem(a, "cover")}
                                    onRemoverAvatar={() => removerImagem("avatar")}
                                    onRemoverCapa={() => removerImagem("cover")}
                                />
                            )}

                            {etapa === "contato" && (
                                <EtapaContato
                                    whatsapp={whatsapp}
                                    setWhatsapp={setWhatsapp}
                                    salvarWhatsapp={salvarWhatsapp}
                                />
                            )}

                            {etapa === "redes" && (
                                <EtapaRedes
                                    kit={kit}
                                    handles={handles}
                                    setHandles={setHandles}
                                    salvarHandle={salvarHandle}
                                    salvarMetrica={salvarMetrica}
                                    buscarDados={buscarDados}
                                    buscandoRede={buscandoRede}
                                />
                            )}

                            {etapa === "portfolio" && (
                                <EtapaPortfolio
                                    portfolio={portfolio}
                                    enviando={enviando}
                                    onAdicionar={adicionarTrabalho}
                                    onMudar={mudarTrabalho}
                                    onSalvar={salvarTrabalhos}
                                    onEnviarImagem={(arquivo, id) => enviarImagem(arquivo, "portfolio", id)}
                                    onRemoverImagem={removerImagemDoTrabalho}
                                    onRemover={(item) =>
                                        setARemover({ tipo: "portfolio", id: item.id, nome: item.titulo || "este trabalho" })
                                    }
                                />
                            )}

                            {etapa === "pacotes" && (
                                <EtapaPacotes
                                    pacotes={pacotes}
                                    onAdicionar={adicionarPacote}
                                    onMudar={mudarPacote}
                                    onSalvar={salvarPacotes}
                                    onRemover={(item) =>
                                        setARemover({ tipo: "pacote", id: item.id, nome: item.nome || "este pacote" })
                                    }
                                />
                            )}

                            {etapa === "tema" && (
                                <EtapaTema
                                    tema={kit.tema ?? "terracota"}
                                    onEscolher={(valor) => salvar({ tema: valor })}
                                    nome={nome}
                                    avatar={kit.avatar_url}
                                />
                            )}

                            {etapa === "publicar" && (
                                <EtapaPublicar
                                    kit={kit}
                                    dados={dadosPrevia}
                                    slug={slug}
                                    setSlug={setSlug}
                                    salvarSlug={salvarSlug}
                                    percentual={percentual}
                                    faltamEssenciais={faltamEssenciais}
                                    acabouDePublicar={acabouDePublicar}
                                    onIr={irPara}
                                    onPublicar={() => setConfirmandoPublicacao(true)}
                                    onDespublicar={despublicar}
                                    onCopiar={copiarLink}
                                />
                            )}

                            {/* ---------- navegação entre etapas ---------- */}
                            <nav className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
                                {anterior ? (
                                    <Button
                                        variant="outline"
                                        className="h-11 rounded-full"
                                        onClick={() => irPara(anterior.chave)}
                                    >
                                        <ArrowLeft className="h-4 w-4" aria-hidden /> {anterior.titulo}
                                    </Button>
                                ) : (
                                    <span />
                                )}

                                {proxima && (
                                    <button
                                        type="button"
                                        onClick={() => irPara(proxima.chave)}
                                        className="group inline-flex h-11 items-center gap-2.5 rounded-full bg-brand-terracota px-6 text-sm font-semibold text-white hover:bg-brand-coral"
                                    >
                                        Continuar para {proxima.titulo}
                                        <ArrowRight
                                            className="h-4 w-4 transition-transform group-hover:translate-x-1"
                                            aria-hidden
                                        />
                                    </button>
                                )}
                            </nav>
                        </motion.section>
                    </AnimatePresence>
                </div>

                {/* ---------- prévia ao vivo ---------- */}
                <aside className="hidden xl:block">
                    <div className="sticky top-24">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                                Como a marca vai ver
                            </p>
                            {kit.publicado && (
                                <Link
                                    href={`/kit/${kit.slug}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-terracota hover:underline"
                                >
                                    Abrir <ExternalLink className="h-3 w-3" aria-hidden />
                                </Link>
                            )}
                        </div>
                        <div className="max-h-[calc(100vh-11rem)] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-background shadow-[0_24px_60px_-40px_rgba(31,31,31,0.45)]">
                            {previa}
                        </div>
                    </div>
                </aside>
            </div>

            <AlertDialog open={confirmandoPublicacao} onOpenChange={setConfirmandoPublicacao}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Publicar seu Media Kit?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ele fica visível para qualquer pessoa com o link{" "}
                            <strong className="text-foreground">/kit/{kit.slug}</strong>. Você pode despublicar
                            quando quiser.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={publicar}>Publicar agora</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={Boolean(aRemover)} onOpenChange={(aberto) => !aberto && setARemover(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover &quot;{aRemover?.nome}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmarRemocao}>Remover</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

/* ============================ etapas ============================ */

function Cartao({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("rounded-3xl border border-border bg-card p-6 sm:p-7", className)}>{children}</div>
    )
}

function Ajuda({ id, children }: { id: string; children: React.ReactNode }) {
    return (
        <p id={id} className="text-[13px] leading-relaxed text-muted-foreground">
            {children}
        </p>
    )
}

function EtapaIdentidade({
    kit, nome, setNome, salvarNome, bio, setBio, salvarBio, cidade, setCidade, salvarCidade,
    estado, setEstado, nichos, salvarNichos, enviando, onEnviarAvatar, onEnviarCapa,
    onRemoverAvatar, onRemoverCapa,
}: {
    kit: MidiaKit
    nome: string
    setNome: (v: string) => void
    salvarNome: () => void
    bio: string
    setBio: (v: string) => void
    salvarBio: () => void
    cidade: string
    setCidade: (v: string) => void
    salvarCidade: () => void
    estado: string
    setEstado: (v: string) => void
    nichos: string[]
    salvarNichos: (v: string[]) => void
    enviando: string | null
    onEnviarAvatar: (a: File) => void
    onEnviarCapa: (a: File) => void
    onRemoverAvatar: () => void
    onRemoverCapa: () => void
}) {
    const restante = MAX_BIO - bio.length

    return (
        <Cartao className="space-y-7">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
                É por aqui que a marca começa a te conhecer. Dá para voltar e ajustar sempre.
            </p>

            <div className="space-y-3">
                <Label htmlFor="mk-capa">Imagem de capa</Label>
                <CampoImagem
                    id="mk-capa"
                    formato="capa"
                    valor={kit.cover_url}
                    enviando={enviando === "cover"}
                    rotuloVazio="Arraste uma imagem ou clique para escolher"
                    ajuda="Uma paisagem larga, tipo 1200×400. É a faixa do topo da sua página."
                    onArquivo={onEnviarCapa}
                    onRemover={kit.cover_url ? onRemoverCapa : undefined}
                />
            </div>

            <div className="space-y-3">
                <Label htmlFor="mk-avatar">Foto de perfil</Label>
                <CampoImagem
                    id="mk-avatar"
                    formato="avatar"
                    valor={kit.avatar_url}
                    enviando={enviando === "avatar"}
                    rotuloVazio="Enviar foto de perfil"
                    ajuda="Quadrada, com seu rosto bem visível. É a imagem que aparece ao lado do seu nome — e a primeira coisa que a marca olha."
                    onArquivo={onEnviarAvatar}
                    onRemover={kit.avatar_url ? onRemoverAvatar : undefined}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="mk-nome">
                    Nome <span className="text-brand-coral" aria-hidden>*</span>
                    <span className="sr-only">(obrigatório)</span>
                </Label>
                <Input
                    id="mk-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    onBlur={salvarNome}
                    aria-describedby="mk-nome-ajuda"
                    aria-invalid={!nome.trim()}
                    className="h-11 rounded-xl"
                />
                <Ajuda id="mk-nome-ajuda">Como você quer ser chamada nas conversas com marcas.</Ajuda>
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                    <Label htmlFor="mk-bio">Sua bio</Label>
                    <span
                        className={cn(
                            "text-xs tabular-nums",
                            restante < 0 ? "font-medium text-status-erro" : "text-muted-foreground",
                        )}
                    >
                        {bio.length}/{MAX_BIO}
                    </span>
                </div>
                <Textarea
                    id="mk-bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    onBlur={salvarBio}
                    aria-describedby="mk-bio-ajuda"
                    placeholder="Crio sobre beleza para mulheres pretas de 25 a 40 anos, em Salvador. Faço review honesto e tutorial de cabelo cacheado."
                    className="rounded-xl"
                />
                <Ajuda id="mk-bio-ajuda">
                    Três linhas bastam: quem você é, para quem você fala e o que você entrega.
                </Ajuda>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="mk-cidade">Cidade</Label>
                    <Input
                        id="mk-cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        onBlur={salvarCidade}
                        placeholder="Salvador"
                        className="h-11 rounded-xl"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mk-estado">Estado</Label>
                    <DropdownSelect
                        id="mk-estado"
                        aria-label="Estado"
                        value={estado}
                        onValueChange={setEstado}
                        placeholder="Escolha o estado"
                        options={UFS.map((uf) => ({ value: uf.sigla, label: `${uf.nome} (${uf.sigla})` }))}
                        className="!h-11 rounded-xl"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="mk-nichos">Seus nichos</Label>
                <EntradaNichos id="mk-nichos" nichos={nichos} onMudar={salvarNichos} />
                <Ajuda id="mk-nichos-ajuda">
                    É por eles que a marca te encontra quando procura alguém do seu assunto.
                </Ajuda>
            </div>
        </Cartao>
    )
}

function EtapaContato({
    whatsapp,
    setWhatsapp,
    salvarWhatsapp,
}: {
    whatsapp: string
    setWhatsapp: (v: string) => void
    salvarWhatsapp: () => void
}) {
    // As regras de prefers-reduced-motion do globals.css só alcançam CSS; o
    // framer-motion precisa ser avisado na mão.
    const movimentoReduzido = useReducedMotion()
    const valido = whatsappValido(whatsapp)
    const digitos = whatsapp.replace(/\D/g, "")

    return (
        <Cartao className="space-y-6">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
                Seu Media Kit inteiro serve para chegar nesta linha. Sem ela, quem gostou do seu trabalho não
                tem como te responder.
            </p>

            <div className="space-y-2 rounded-2xl border border-brand-terracota/30 bg-brand-terracota/[0.04] p-5">
                <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="mk-whatsapp">
                        WhatsApp <span className="text-brand-coral" aria-hidden>*</span>
                        <span className="sr-only">(obrigatório)</span>
                    </Label>
                    <span className="rounded-full bg-brand-terracota/12 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground">
                        aparece na sua página
                    </span>
                </div>

                <Input
                    id="mk-whatsapp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatarWhatsapp(e.target.value))}
                    onBlur={salvarWhatsapp}
                    aria-describedby="mk-whatsapp-ajuda"
                    aria-invalid={Boolean(digitos) && !valido}
                    placeholder="(71) 98888-7777"
                    className="h-12 max-w-xs rounded-xl bg-card text-base"
                />

                <Ajuda id="mk-whatsapp-ajuda">
                    Com DDD. É o número do botão &quot;Falar no WhatsApp&quot; da sua página.
                </Ajuda>

                <AnimatePresence>
                    {valido && (
                        <motion.p
                            initial={{ opacity: 0, y: movimentoReduzido ? 0 : 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: movimentoReduzido ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="flex items-center gap-1.5 pt-1 text-xs font-medium text-status-sucesso"
                        >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                            A marca vai cair em wa.me/{whatsappParaBanco(whatsapp)}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </Cartao>
    )
}

function EtapaRedes({
    kit, handles, setHandles, salvarHandle, salvarMetrica, buscarDados, buscandoRede,
}: {
    kit: MidiaKit
    handles: Record<string, string>
    setHandles: React.Dispatch<React.SetStateAction<Record<string, string>>>
    salvarHandle: (chave: string) => void
    salvarMetrica: (chave: string, campo: "followers" | "engagement_rate", valor: string) => void
    buscarDados: (chave: string) => void
    buscandoRede: string | null
}) {
    const metricas = (kit.redes ?? {}) as Record<string, RedeInfo>

    return (
        <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
                Não precisa ser milhão — precisa ser verdade. A marca confere depois.
            </p>

            {REDES_CONFIG.map((rede) => {
                const Icone = rede.icone
                const info = metricas[rede.chave]
                const temHandle = Boolean(handles[rede.chave])

                return (
                    <Cartao key={rede.chave} className="space-y-4 p-5 sm:p-5">
                        <div className="flex items-center gap-3">
                            <span
                                aria-hidden
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-terracota/12 text-brand-terracota"
                            >
                                <Icone className="h-4.5 w-4.5" />
                            </span>
                            <span className="text-[15px] font-semibold">{rede.label}</span>

                            {info?.verificado && typeof info.followers === "number" && (
                                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-status-sucesso/12 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-status-sucesso">
                                    <BadgeCheck className="h-3 w-3" aria-hidden /> Verificado
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-end gap-3">
                            <div className="min-w-[200px] flex-1 space-y-2">
                                <Label htmlFor={`mk-rede-${rede.chave}`}>Seu @ no {rede.label}</Label>
                                <div className="relative">
                                    {/* O @ é moldura, não conteúdo: quem cola "@fulano" via
                                        "@@fulano" quando o arroba é texto digitável. */}
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        @
                                    </span>
                                    <Input
                                        id={`mk-rede-${rede.chave}`}
                                        value={handles[rede.chave] ?? ""}
                                        onChange={(e) =>
                                            setHandles((prev) => ({ ...prev, [rede.chave]: e.target.value }))
                                        }
                                        onBlur={() => salvarHandle(rede.chave)}
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck={false}
                                        aria-describedby={`mk-rede-${rede.chave}-ajuda`}
                                        placeholder="seuusuario"
                                        className="h-11 rounded-xl pl-9"
                                    />
                                </div>
                            </div>

                            {rede.buscavel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={buscandoRede === rede.chave || !temHandle}
                                    onClick={() => buscarDados(rede.chave)}
                                    className="h-11 shrink-0 rounded-full"
                                >
                                    {buscandoRede === rede.chave ? (
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" aria-hidden />
                                    )}
                                    Buscar meus números
                                </Button>
                            )}
                        </div>

                        <Ajuda id={`mk-rede-${rede.chave}-ajuda`}>{rede.dica}</Ajuda>

                        {temHandle && (
                            <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor={`mk-seg-${rede.chave}`}>Seguidores</Label>
                                    <Input
                                        id={`mk-seg-${rede.chave}`}
                                        // A key remonta o campo quando o número muda por fora
                                        // (o botão "Buscar meus números"). Sem ela o input não
                                        // controlado seguia mostrando o valor digitado antes, e
                                        // o próximo blur regravava o velho por cima do buscado.
                                        key={`seg-${info?.followers ?? "vazio"}`}
                                        type="number"
                                        min={0}
                                        inputMode="numeric"
                                        defaultValue={info?.followers ?? ""}
                                        onBlur={(e) => salvarMetrica(rede.chave, "followers", e.target.value)}
                                        placeholder="12000"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`mk-eng-${rede.chave}`}>Engajamento (%)</Label>
                                    <Input
                                        id={`mk-eng-${rede.chave}`}
                                        key={`eng-${info?.engagement_rate ?? "vazio"}`}
                                        type="number"
                                        min={0}
                                        step="0.1"
                                        inputMode="decimal"
                                        defaultValue={info?.engagement_rate ?? ""}
                                        onBlur={(e) => salvarMetrica(rede.chave, "engagement_rate", e.target.value)}
                                        placeholder="4.2"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                        )}
                    </Cartao>
                )
            })}
        </div>
    )
}

function Vazio({
    titulo,
    texto,
    rotuloBotao,
    onAcao,
}: {
    titulo: string
    texto: string
    rotuloBotao: string
    onAcao: () => void
}) {
    return (
        <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-terracota/12 text-brand-terracota">
                <Plus className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-5 text-xl font-bold tracking-tight">{titulo}</h3>
            <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">{texto}</p>
            <button
                type="button"
                onClick={onAcao}
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-brand-terracota px-7 text-sm font-semibold text-white hover:bg-brand-coral"
            >
                <Plus className="h-4 w-4" aria-hidden /> {rotuloBotao}
            </button>
        </div>
    )
}

function EtapaPortfolio({
    portfolio, enviando, onAdicionar, onMudar, onSalvar, onEnviarImagem, onRemoverImagem, onRemover,
}: {
    portfolio: PortfolioItem[]
    enviando: string | null
    onAdicionar: () => void
    onMudar: (id: string, campo: keyof PortfolioItem, valor: string) => void
    onSalvar: (lista?: PortfolioItem[]) => void
    onEnviarImagem: (arquivo: File, id: string) => void
    onRemoverImagem: (item: PortfolioItem) => void
    onRemover: (item: PortfolioItem) => void
}) {
    if (portfolio.length === 0) {
        return (
            <Vazio
                titulo="Mostre o que você já fez"
                texto="Uma campanha, um vídeo que foi bem, um trabalho de que você se orgulha. Dois ou três já resolvem — não precisa ser com marca grande."
                rotuloBotao="Adicionar primeiro trabalho"
                onAcao={onAdicionar}
            />
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
                Arraste para mudar a ordem: o primeiro da fila é o que a marca vê primeiro.
            </p>

            <ListaOrdenavel itens={portfolio} onReordenar={(novos) => onSalvar(novos)} rotulo="trabalho">
                {(item, indice, alca) => (
                    <Cartao className="p-5 sm:p-5">
                        <div className="flex items-start gap-3">
                            {alca}
                            <div className="min-w-0 flex-1 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                        Trabalho {indice + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onRemover(item)}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        aria-label={`Remover ${item.titulo || "trabalho"}`}
                                        title="Remover trabalho"
                                        className="shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden />
                                    </button>
                                </div>

                                <CampoImagem
                                    id={`mk-pf-img-${item.id}`}
                                    formato="item"
                                    valor={item.imagem}
                                    enviando={enviando === `portfolio-${item.id}`}
                                    rotuloVazio="Arraste a imagem do trabalho ou clique para escolher"
                                    onArquivo={(arquivo) => onEnviarImagem(arquivo, item.id)}
                                    onRemover={item.imagem ? () => onRemoverImagem(item) : undefined}
                                />

                                <div className="space-y-2">
                                    <Label htmlFor={`mk-pf-titulo-${item.id}`}>Título do trabalho</Label>
                                    <Input
                                        id={`mk-pf-titulo-${item.id}`}
                                        value={item.titulo}
                                        onChange={(e) => onMudar(item.id, "titulo", e.target.value)}
                                        onBlur={() => onSalvar()}
                                        placeholder="Campanha de verão — Natura"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`mk-pf-desc-${item.id}`}>O que você fez</Label>
                                    <Textarea
                                        id={`mk-pf-desc-${item.id}`}
                                        rows={2}
                                        value={item.descricao}
                                        onChange={(e) => onMudar(item.id, "descricao", e.target.value)}
                                        onBlur={() => onSalvar()}
                                        placeholder="3 Reels e 1 carrossel, com 180 mil visualizações."
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`mk-pf-link-${item.id}`}>Link (opcional)</Label>
                                    <Input
                                        id={`mk-pf-link-${item.id}`}
                                        type="url"
                                        inputMode="url"
                                        value={item.link}
                                        onChange={(e) => onMudar(item.id, "link", e.target.value)}
                                        onBlur={(e) => {
                                            // Quem digita "instagram.com/p/xyz" grava um valor sem
                                            // esquema; no href isso vira caminho relativo e o
                                            // "Ver mais" da vitrine leva para o nosso próprio site.
                                            const normalizado = normalizarLink(e.target.value)
                                            onMudar(item.id, "link", normalizado)
                                            onSalvar(
                                                portfolio.map((p) =>
                                                    p.id === item.id ? { ...p, link: normalizado } : p,
                                                ),
                                            )
                                        }}
                                        placeholder="instagram.com/p/…"
                                        className="h-11 rounded-xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </Cartao>
                )}
            </ListaOrdenavel>

            <button
                type="button"
                onClick={onAdicionar}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm font-semibold hover:border-brand-terracota hover:bg-accent"
            >
                <Plus className="h-4 w-4" aria-hidden /> Adicionar outro trabalho
            </button>
        </div>
    )
}

function EtapaPacotes({
    pacotes, onAdicionar, onMudar, onSalvar, onRemover,
}: {
    pacotes: Pacote[]
    onAdicionar: () => void
    onMudar: (id: string, campo: keyof Pacote, valor: string | string[]) => void
    onSalvar: (lista?: Pacote[]) => void
    onRemover: (item: Pacote) => void
}) {
    if (pacotes.length === 0) {
        return (
            <Vazio
                titulo="Diga o que você entrega"
                texto="Um Reels, um combo de stories, uma diária de gravação. Dizer o preço economiza três mensagens de ida e volta — e se preferir, escreva 'sob consulta'."
                rotuloBotao="Criar meu primeiro pacote"
                onAcao={onAdicionar}
            />
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
                Coloque o que você mais vende em primeiro — é a ordem que a marca vê.
            </p>

            <ListaOrdenavel itens={pacotes} onReordenar={(novos) => onSalvar(novos)} rotulo="pacote">
                {(item, indice, alca) => (
                    <Cartao className="p-5 sm:p-5">
                        <div className="flex items-start gap-3">
                            {alca}
                            <div className="min-w-0 flex-1 space-y-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                        Pacote {indice + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onRemover(item)}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        aria-label={`Remover ${item.nome || "pacote"}`}
                                        title="Remover pacote"
                                        className="shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" aria-hidden />
                                    </button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor={`mk-pc-nome-${item.id}`}>Nome do pacote</Label>
                                        <Input
                                            id={`mk-pc-nome-${item.id}`}
                                            value={item.nome}
                                            onChange={(e) => onMudar(item.id, "nome", e.target.value)}
                                            onBlur={() => onSalvar()}
                                            placeholder="Combo Reels + Stories"
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`mk-pc-preco-${item.id}`}>Preço</Label>
                                        <Input
                                            id={`mk-pc-preco-${item.id}`}
                                            value={item.preco}
                                            onChange={(e) => onMudar(item.id, "preco", e.target.value)}
                                            onBlur={() => onSalvar()}
                                            placeholder="R$ 1.200 ou sob consulta"
                                            className="h-11 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`mk-pc-desc-${item.id}`}>Descrição</Label>
                                    <Textarea
                                        id={`mk-pc-desc-${item.id}`}
                                        rows={2}
                                        value={item.descricao}
                                        onChange={(e) => onMudar(item.id, "descricao", e.target.value)}
                                        onBlur={() => onSalvar()}
                                        placeholder="Para marcas que querem alcance rápido em lançamento."
                                        className="rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`mk-pc-itens-${item.id}`}>O que está incluso</Label>
                                    <Textarea
                                        id={`mk-pc-itens-${item.id}`}
                                        rows={3}
                                        value={item.itens.join("\n")}
                                        onChange={(e) => onMudar(item.id, "itens", e.target.value.split("\n"))}
                                        onBlur={() => {
                                            const limpos = item.itens.map((i) => i.trim()).filter(Boolean)
                                            onSalvar(
                                                pacotes.map((p) => (p.id === item.id ? { ...p, itens: limpos } : p)),
                                            )
                                        }}
                                        aria-describedby={`mk-pc-itens-${item.id}-ajuda`}
                                        placeholder={"1 Reels no feed\n3 Stories com link\n1 rodada de ajuste"}
                                        className="rounded-xl"
                                    />
                                    <Ajuda id={`mk-pc-itens-${item.id}-ajuda`}>Um item por linha.</Ajuda>
                                </div>
                            </div>
                        </div>
                    </Cartao>
                )}
            </ListaOrdenavel>

            <button
                type="button"
                onClick={onAdicionar}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm font-semibold hover:border-brand-terracota hover:bg-accent"
            >
                <Plus className="h-4 w-4" aria-hidden /> Adicionar outro pacote
            </button>
        </div>
    )
}

function EtapaTema({
    tema,
    onEscolher,
    nome,
    avatar,
}: {
    tema: string
    onEscolher: (valor: string) => void
    nome: string
    avatar: string | null
}) {
    return (
        <Cartao className="space-y-5">
            <p className="text-[15px] leading-relaxed text-muted-foreground">
                A cor manda nos títulos, nos ícones das redes e no preço dos pacotes. Dá para trocar quando
                quiser.
            </p>

            {/* Num radiogroup o Tab entra uma vez só e as SETAS trocam a opção
                (roving tabindex). Sem o onKeyDown, quem navega por teclado
                fica preso no cartão em foco e não consegue mudar de cor. */}
            <div role="radiogroup" aria-label="Cor do seu Media Kit" className="grid gap-4 sm:grid-cols-3">
                {TEMAS.map((opcao, indice) => {
                    const escolhido = tema === opcao.valor || (tema === "teal" && opcao.valor === "coral")
                    return (
                        <button
                            key={opcao.valor}
                            type="button"
                            role="radio"
                            aria-checked={escolhido}
                            tabIndex={escolhido ? 0 : -1}
                            onKeyDown={(e) => {
                                const passo =
                                    e.key === "ArrowRight" || e.key === "ArrowDown" ? 1
                                        : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1
                                            : 0
                                if (!passo) return
                                e.preventDefault()
                                const proximo = TEMAS[(indice + passo + TEMAS.length) % TEMAS.length]
                                onEscolher(proximo.valor)
                                const grupo = e.currentTarget.parentElement
                                const alvo = grupo?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[
                                    (indice + passo + TEMAS.length) % TEMAS.length
                                ]
                                alvo?.focus()
                            }}
                            onClick={() => onEscolher(opcao.valor)}
                            className={cn(
                                "!min-h-0 relative flex flex-col items-stretch gap-0 overflow-hidden rounded-2xl border bg-card p-0 text-left",
                                escolhido ? "border-brand-terracota" : "border-border hover:border-brand-terracota/50",
                            )}
                        >
                            {/* Miniatura real do topo do kit — escolher cor sem ver
                                cor era o que tornava esta etapa a mais pobre da tela. */}
                            <span aria-hidden className="block h-10 w-full" style={{ backgroundColor: opcao.amostra }} />
                            <span aria-hidden className="flex items-center gap-2 px-4 pb-1 pt-0">
                                <span className="-mt-4 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-card bg-muted text-[11px] font-bold text-muted-foreground">
                                    {avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        (nome || "?").slice(0, 2).toUpperCase()
                                    )}
                                </span>
                            </span>
                            <span className="flex flex-col gap-1 px-4 pb-4">
                                <span
                                    className="text-sm font-semibold tracking-tight"
                                    style={{ color: opcao.amostra }}
                                >
                                    Pacotes
                                </span>
                                <span className="text-[11px] text-muted-foreground">R$ 1.200</span>
                            </span>

                            <span className="flex items-center justify-between border-t border-border px-4 py-3">
                                <span className="text-[13px] font-semibold">{opcao.label}</span>
                                <span className="text-[11px] text-muted-foreground">{opcao.descricao}</span>
                            </span>

                            {escolhido && (
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-brand-terracota"
                                />
                            )}
                            {escolhido && (
                                <span
                                    aria-hidden
                                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-terracota text-white"
                                >
                                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </Cartao>
    )
}

function EtapaPublicar({
    kit, dados, slug, setSlug, salvarSlug, percentual, faltamEssenciais, acabouDePublicar,
    onIr, onPublicar, onDespublicar, onCopiar,
}: {
    kit: MidiaKit
    dados: Parameters<(typeof ESSENCIAIS)[number]["ok"]>[0]
    slug: string
    setSlug: (v: string) => void
    salvarSlug: () => void
    percentual: number
    faltamEssenciais: typeof ESSENCIAIS
    acabouDePublicar: boolean
    onIr: (chave: ChaveEtapa) => void
    onPublicar: () => void
    onDespublicar: () => void
    onCopiar: () => void
}) {
    const movimentoReduzido = useReducedMotion()

    if (acabouDePublicar && kit.publicado) {
        return (
            <motion.div
                initial={{ opacity: 0, y: movimentoReduzido ? 0 : 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: movimentoReduzido ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
                <Cartao className="space-y-5 text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-terracota/12 text-brand-terracota">
                        <PartyPopper className="h-6 w-6" aria-hidden />
                    </span>
                    <div>
                        <h3 className="text-2xl font-extrabold tracking-[-0.03em]">Seu Media Kit está no ar.</h3>
                        <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                            Manda esse link para as marcas com quem você quer trabalhar.
                        </p>
                    </div>
                    <LinkPublico slug={kit.slug} onCopiar={onCopiar} />
                </Cartao>
            </motion.div>
        )
    }

    return (
        <div className="space-y-5">
            <Cartao className="space-y-5">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Como está seu kit
                    </p>
                    <p className="mt-2 text-[32px] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
                        {percentual}%
                    </p>
                    <Progress value={percentual} className="mt-3 h-1.5" />
                </div>

                <ListaDeProntidao titulo="Precisa ter" itens={ESSENCIAIS} dados={dados} onIr={onIr} />
                <ListaDeProntidao titulo="Deixa melhor" itens={RECOMENDADOS} dados={dados} onIr={onIr} />
            </Cartao>

            <Cartao className="space-y-3">
                <Label htmlFor="mk-slug">Endereço da sua página</Label>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">somospreta.com/kit/</span>
                    <Input
                        id="mk-slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        onBlur={salvarSlug}
                        aria-describedby="mk-slug-ajuda"
                        autoCapitalize="none"
                        spellCheck={false}
                        className="h-11 w-56 rounded-xl"
                    />
                </div>
                <Ajuda id="mk-slug-ajuda">
                    Só letras, números e hífen. Se você já mandou o link antigo para alguém, trocar aqui faz o
                    antigo parar de funcionar.
                </Ajuda>
            </Cartao>

            <Cartao className="space-y-4">
                {kit.publicado ? (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-status-sucesso/12 px-3 py-1 text-[11px] font-medium text-status-sucesso">
                                <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> Publicado
                            </span>
                        </div>
                        <LinkPublico slug={kit.slug} onCopiar={onCopiar} />
                        <button
                            type="button"
                            onClick={onDespublicar}
                            className="text-sm font-medium text-muted-foreground underline underline-offset-4 hover:text-destructive"
                        >
                            Despublicar meu Media Kit
                        </button>
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-status-neutro/12 px-3 py-1 text-[11px] font-medium text-status-neutro">
                                Rascunho
                            </span>
                        </div>

                        <button
                            type="button"
                            disabled={faltamEssenciais.length > 0}
                            onClick={onPublicar}
                            className="inline-flex h-13 items-center gap-3 rounded-full bg-brand-terracota px-7 text-base font-semibold text-white hover:bg-brand-coral disabled:pointer-events-none disabled:opacity-50"
                        >
                            <Rocket className="h-4 w-4" aria-hidden /> Publicar meu Media Kit
                        </button>

                        {faltamEssenciais.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Falta {faltamEssenciais.length === 1 ? "um item" : `${faltamEssenciais.length} itens`} da
                                lista &quot;Precisa ter&quot; — sem eles a página não funciona para quem receber o
                                link.
                            </p>
                        )}
                    </>
                )}
            </Cartao>
        </div>
    )
}

function LinkPublico({ slug, onCopiar }: { slug: string; onCopiar: () => void }) {
    return (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3">
            {/* break-all em vez de truncate: o slug é o que a criadora vai conferir
                antes de mandar para a marca, e cortado em 89px ele não serve. */}
            <code className="w-full min-w-0 break-all text-sm sm:w-auto sm:flex-1 sm:truncate">somospreta.com/kit/{slug}</code>
            <Button variant="outline" onClick={onCopiar} className="h-10 rounded-full">
                <Copy className="h-4 w-4" aria-hidden /> Copiar
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-full">
                <Link href={`/kit/${slug}`} target="_blank">
                    <ExternalLink className="h-4 w-4" aria-hidden /> Abrir
                </Link>
            </Button>
        </div>
    )
}

function ListaDeProntidao({
    titulo,
    itens,
    dados,
    onIr,
}: {
    titulo: string
    itens: typeof ESSENCIAIS
    dados: Parameters<(typeof ESSENCIAIS)[number]["ok"]>[0]
    onIr: (chave: ChaveEtapa) => void
}) {
    return (
        <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {titulo}
            </p>
            <ul className="space-y-1">
                {itens.map((item) => {
                    const ok = item.ok(dados)
                    return (
                        <li key={item.rotulo}>
                            <button
                                type="button"
                                onClick={() => onIr(item.etapa)}
                                className="flex w-full items-center gap-3 rounded-xl px-3 text-left hover:bg-accent"
                            >
                                <span
                                    aria-hidden
                                    className={cn(
                                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                                        ok
                                            ? "bg-status-sucesso/12 text-status-sucesso"
                                            : "border border-dashed border-border text-muted-foreground",
                                    )}
                                >
                                    {ok && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                </span>
                                <span className={cn("flex-1 text-sm", ok ? "text-foreground" : "text-muted-foreground")}>
                                    {item.rotulo}
                                </span>
                                <span className="sr-only">{ok ? "pronto" : "pendente — ir para a etapa"}</span>
                                {!ok && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}

function EsqueletoDoEditor() {
    return (
        <div className="mx-auto w-full max-w-[1460px]">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-5 h-12 w-80" />
            <Skeleton className="mt-8 h-2 w-full max-w-md" />
            <div className="mt-6 flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-40 shrink-0 rounded-full" />
                ))}
            </div>
            <Skeleton className="mt-8 h-[460px] w-full rounded-3xl" />
        </div>
    )
}
