"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BarChart3, CheckCircle2, Eye, EyeOff, Loader2, Megaphone, Newspaper } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { LogoSomosPreta } from "@/components/public/marca"

/**
 * Porta de entrada do criador: cadastro e login na mesma tela, alternados por
 * um botão no topo. A lógica de auth é a que já existia — signUp com role_hint
 * "creator" e signInWithPassword — só a apresentação mudou.
 */

type Modo = "cadastro" | "login"

const VANTAGENS = [
    {
        icon: Newspaper,
        titulo: "Monte seu Media Kit",
        descricao: "Mostre quem você é, seus projetos e o impacto do seu trabalho.",
        cor: "bg-brand-terracota/12 text-brand-terracota",
    },
    {
        icon: BarChart3,
        titulo: "Organize suas redes e portfólio",
        descricao: "Reúna seus conteúdos, conquistas e métricas em um só lugar.",
        cor: "bg-brand-oliva/12 text-brand-oliva",
    },
    {
        icon: Megaphone,
        titulo: "Compartilhe com marcas",
        descricao: "Conecte-se com marcas que valorizam a diversidade e a cultura brasileira.",
        cor: "bg-brand-coral/12 text-brand-coral",
    },
]

const EIXOS = ["Pessoas", "Território", "Cultura", "Autenticidade", "Movimento"]

const SENHA_MINIMA = 8

export default function CriadorCriarContaPage() {
    const router = useRouter()
    const [supabase] = useState(() => createClient())
    const [modo, setModo] = useState<Modo>("cadastro")
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState("")
    const [confirmar, setConfirmar] = useState(false)
    const [verSenha, setVerSenha] = useState(false)
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")

    const trocarModo = (novo: Modo) => {
        setModo(novo)
        setErro("")
        setSenha("")
    }

    const entrarComGoogle = async () => {
        setCarregando(true)
        setErro("")
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/criador` },
        })
        if (error) {
            // Acontece quando o provider Google ainda não foi habilitado no Supabase.
            setErro("Não foi possível continuar com o Google. Tente pelo e-mail.")
            setCarregando(false)
        }
    }

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault()
        setCarregando(true)
        setErro("")

        if (modo === "login") {
            const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
            if (error) {
                setErro(
                    error.message.includes("Invalid")
                        ? "E-mail ou senha inválidos."
                        : error.message.includes("confirm")
                          ? "Confirme seu e-mail antes de entrar."
                          : "Não foi possível entrar. Tente novamente."
                )
                setCarregando(false)
                return
            }
            router.push("/criador")
            router.refresh()
            return
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password: senha,
            options: { data: { nome, role_hint: "creator" } },
        })

        if (error) {
            setErro(
                error.message.includes("already")
                    ? "Este e-mail já está cadastrado. Tente entrar."
                    : "Não foi possível criar a conta. Tente novamente."
            )
            setCarregando(false)
            return
        }

        if (data.session) {
            router.push("/criador")
            router.refresh()
            return
        }

        setConfirmar(true)
        setCarregando(false)
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="border-b border-border">
                <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-6">
                    <Link href="/" aria-label="Somos Preta — início">
                        <LogoSomosPreta className="text-[1rem]" />
                    </Link>

                    <p className="text-sm text-muted-foreground">
                        {modo === "cadastro" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
                        <button
                            type="button"
                            onClick={() => trocarModo(modo === "cadastro" ? "login" : "cadastro")}
                            className="font-semibold text-brand-terracota underline-offset-4 hover:underline"
                        >
                            {modo === "cadastro" ? "Entrar" : "Criar conta"}
                        </button>
                    </p>
                </div>
            </header>

            <main className="flex-1">
                <div className="mx-auto grid max-w-[1500px] gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)] lg:gap-10 lg:py-12">
                    {/* ---------- discurso ---------- */}
                    <section className="relative grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-6">
                        <div className="relative z-10">
                        <p className="text-[11px] font-medium uppercase leading-[1.8] tracking-[0.22em] text-muted-foreground">
                            Do Norte e Nordeste
                            <br />
                            para todo o Brasil
                        </p>

                        <h1 className="mt-6 max-w-[9ch] text-[clamp(2.1rem,3vw,3.1rem)] font-extrabold leading-[1.04] tracking-[-0.032em]">
                            Mais conexões{" "}
                            <span className="text-brand-terracota">para o que você cria.</span>
                        </h1>

                        <p className="mt-5 max-w-[34ch] text-[15px] leading-relaxed text-muted-foreground">
                            O Somos Preta é o ponto de encontro entre criadores, marcas e
                            territórios que acreditam no poder da representatividade.
                        </p>

                        <p
                            aria-hidden
                            className="mt-8 max-w-[9ch] -rotate-3 font-manuscrita text-[clamp(1.4rem,1.9vw,2rem)] leading-[1.2] text-brand-carvao"
                        >
                            Criar também é construir futuro.
                            <span aria-hidden className="mt-2 block h-[2px] w-24 rounded-full bg-brand-coral" />
                        </p>

                        </div>

                        {/* retrato com a pincelada atrás */}
                        <div className="relative hidden aspect-[880/1000] lg:block">
                            {/* mancha de tinta atrás do retrato */}
                            <span
                                aria-hidden
                                className="absolute -left-[18%] -top-[6%] h-[70%] w-[62%] rounded-[46%_54%_38%_62%/40%_45%_55%_60%] bg-brand-bege/70"
                            />

                            <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] bg-muted">
                                <Image
                                    src="/media-kit/criadora-turbante.svg"
                                    alt="Criadora de conteúdo com turbante e brincos, olhando para o alto"
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 0px, 36vw"
                                    unoptimized
                                    className="object-cover"
                                />
                            </div>

                            <ul aria-hidden className="absolute -right-2 top-[6%] space-y-1.5">
                                {EIXOS.map((e) => (
                                    <li
                                        key={e}
                                        className="text-[10px] font-medium uppercase leading-none tracking-[0.2em] text-muted-foreground"
                                    >
                                        {e}
                                    </li>
                                ))}
                                <li aria-hidden className="!mt-3 h-[2px] w-8 rounded-full bg-brand-coral" />
                            </ul>
                        </div>
                    </section>

                    {/* ---------- formulário ---------- */}
                    <section className="lg:pt-2">
                        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
                            {confirmar ? (
                                <div className="space-y-4 py-6 text-center">
                                    <CheckCircle2 className="mx-auto h-12 w-12 text-brand-terracota" />
                                    <p className="text-lg font-bold">Confira seu e-mail</p>
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Enviamos um link de confirmação para{" "}
                                        <strong className="text-foreground">{email}</strong>. Confirme
                                        para acessar seu Media Kit.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setConfirmar(false)
                                            trocarModo("login")
                                        }}
                                        className="text-sm font-semibold text-brand-terracota underline-offset-4 hover:underline"
                                    >
                                        Voltar para o login
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-[clamp(1.6rem,2.2vw,2rem)] font-extrabold leading-tight tracking-[-0.025em]">
                                        {modo === "cadastro" ? "Crie seu Media Kit" : "Entrar na sua conta"}
                                    </h2>
                                    <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                                        {modo === "cadastro"
                                            ? "Cadastre-se para montar seu perfil profissional e fazer parte do Somos Preta."
                                            : "Acesse para editar e compartilhar o seu Media Kit."}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={entrarComGoogle}
                                        disabled={carregando}
                                        className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-60"
                                    >
                                        <LogoGoogle />
                                        Continuar com Google
                                    </button>

                                    <div className="my-6 flex items-center gap-4">
                                        <span aria-hidden className="h-px flex-1 bg-border" />
                                        <span className="text-xs text-muted-foreground">ou</span>
                                        <span aria-hidden className="h-px flex-1 bg-border" />
                                    </div>

                                    <form onSubmit={enviar} className="space-y-4">
                                        {modo === "cadastro" && (
                                            <Campo
                                                id="nome"
                                                rotulo="Nome completo"
                                                placeholder="Seu nome completo"
                                                value={nome}
                                                onChange={setNome}
                                                autoComplete="name"
                                            />
                                        )}

                                        <Campo
                                            id="email"
                                            rotulo="E-mail"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={setEmail}
                                            autoComplete="email"
                                        />

                                        <div className="space-y-2">
                                            <label htmlFor="senha" className="block text-sm font-medium">
                                                Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    id="senha"
                                                    type={verSenha ? "text" : "password"}
                                                    placeholder={
                                                        modo === "cadastro"
                                                            ? `Mínimo de ${SENHA_MINIMA} caracteres`
                                                            : "Sua senha"
                                                    }
                                                    value={senha}
                                                    onChange={(e) => setSenha(e.target.value)}
                                                    minLength={modo === "cadastro" ? SENHA_MINIMA : undefined}
                                                    autoComplete={
                                                        modo === "cadastro" ? "new-password" : "current-password"
                                                    }
                                                    required
                                                    className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-12 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-brand-terracota"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setVerSenha((v) => !v)}
                                                    aria-label={verSenha ? "Ocultar senha" : "Mostrar senha"}
                                                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
                                                >
                                                    {verSenha ? (
                                                        <EyeOff className="h-[18px] w-[18px]" />
                                                    ) : (
                                                        <Eye className="h-[18px] w-[18px]" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {erro && (
                                            <p
                                                role="alert"
                                                className="rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive"
                                            >
                                                {erro}
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={carregando}
                                            className="flex h-13 w-full items-center justify-center rounded-xl bg-brand-terracota py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-coral disabled:opacity-60"
                                        >
                                            {carregando ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : modo === "cadastro" ? (
                                                "Criar conta"
                                            ) : (
                                                "Entrar"
                                            )}
                                        </button>
                                    </form>

                                    {modo === "cadastro" ? (
                                        <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                                            Ao criar sua conta, você concorda com nossos{" "}
                                            <Link href="/termos" className="text-brand-terracota underline">
                                                Termos de Uso
                                            </Link>{" "}
                                            e{" "}
                                            <Link href="/privacidade" className="text-brand-terracota underline">
                                                Política de Privacidade
                                            </Link>
                                            .
                                        </p>
                                    ) : (
                                        <p className="mt-4 text-center text-xs text-muted-foreground">
                                            Esqueceu a senha?{" "}
                                            <Link
                                                href="/app/esqueci-senha"
                                                className="text-brand-terracota underline"
                                            >
                                                Recuperar acesso
                                            </Link>
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </section>
                </div>

                {/* ---------- o que você ganha ---------- */}
                <div className="mx-auto max-w-[1500px] px-6 pb-12">
                    <ul className="grid gap-8 sm:grid-cols-3">
                        {VANTAGENS.map((v) => (
                            <li key={v.titulo} className="flex gap-4">
                                <span
                                    className={cn(
                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                                        v.cor
                                    )}
                                >
                                    <v.icon className="h-5 w-5" aria-hidden />
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-bold leading-snug">{v.titulo}</span>
                                    <span className="mt-1.5 block text-[13px] leading-relaxed text-muted-foreground">
                                        {v.descricao}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </main>

            <footer className="border-t border-border">
                <div className="mx-auto flex max-w-[1500px] items-center gap-6 px-6 py-6">
                    <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Somos Preta
                    </span>
                    <span aria-hidden className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Ideias que movem pessoas.
                    </span>
                </div>
            </footer>
        </div>
    )
}

function Campo({
    id,
    rotulo,
    value,
    onChange,
    type = "text",
    placeholder,
    autoComplete,
}: {
    id: string
    rotulo: string
    value: string
    onChange: (v: string) => void
    type?: string
    placeholder?: string
    autoComplete?: string
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium">
                {rotulo}
            </label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
                required
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-brand-terracota"
            />
        </div>
    )
}

function LogoGoogle() {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden focusable="false">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
            />
        </svg>
    )
}
