"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight, IdCard, Users, Megaphone, MapPin } from "lucide-react"

const Hero3D = dynamic(() => import("@/components/hero-3d"), { ssr: false })

const pilares = [
    {
        icon: Users,
        title: "Gestão de creators",
        description: "Uma base viva de criadores do Norte e Nordeste, com métricas reais e relacionamento próximo.",
    },
    {
        icon: Megaphone,
        title: "Campanhas ponta a ponta",
        description: "Do briefing à entrega: clientes, campanhas e tarefas organizados num só fluxo.",
    },
    {
        icon: IdCard,
        title: "Mídia kits profissionais",
        description: "O creator monta o próprio mídia kit e recebe uma página pronta para fechar contrato.",
    },
]

const numeros = [
    { value: "11", label: "estados do N/NE" },
    { value: "100%", label: "foco regional" },
    { value: "1", label: "plataforma" },
]

const fade = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
}

export default function HomePage() {
    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="relative">
                <div className="container mx-auto px-4 pt-16 pb-20 lg:pt-24 lg:pb-28">
                    <div className="grid lg:grid-cols-2 gap-10 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            className="space-y-7"
                        >
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <MapPin className="h-4 w-4 text-primary" /> Norte &amp; Nordeste
                            </span>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.02] tracking-tight text-balance">
                                Agência <span className="text-primary">Somos Preta</span>
                            </h1>
                            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                                Uma plataforma que reúne gestão de influenciadores, campanhas e mídia kits — feita para valorizar o talento regional.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Link href="/midia-kit">
                                    <Button size="lg" className="h-12 px-7 rounded-full text-base font-medium w-full sm:w-auto">
                                        Criar meu mídia kit <ArrowRight className="ml-1.5 h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button size="lg" variant="outline" className="h-12 px-7 rounded-full text-base font-medium w-full sm:w-auto border-border">
                                        Entrar no hub
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>

                        <div className="relative h-[320px] sm:h-[420px] lg:h-[520px]">
                            <div className="absolute inset-0">
                                <Hero3D />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pilares */}
            <section className="border-t border-border/60">
                <div className="container mx-auto px-4 py-20 lg:py-28">
                    <motion.div {...fade} className="max-w-xl mb-14">
                        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                            Tudo o que a operação precisa, num lugar só.
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-px bg-border/60 rounded-3xl overflow-hidden border border-border/60">
                        {pilares.map((p, i) => (
                            <motion.div
                                key={p.title}
                                {...fade}
                                transition={{ ...fade.transition, delay: i * 0.08 }}
                                className="bg-background p-8 lg:p-10 group hover:bg-muted/30 transition-colors"
                            >
                                <div className="h-11 w-11 rounded-xl border border-border flex items-center justify-center mb-6 group-hover:border-primary/40 group-hover:text-primary transition-colors">
                                    <p.icon className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                                <p className="text-muted-foreground leading-relaxed text-[15px]">{p.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Números */}
            <section className="border-t border-border/60">
                <div className="container mx-auto px-4 py-16">
                    <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                        {numeros.map((n, i) => (
                            <motion.div key={n.label} {...fade} transition={{ ...fade.transition, delay: i * 0.08 }} className="text-center">
                                <p className="text-4xl md:text-5xl font-semibold tracking-tight">{n.value}</p>
                                <p className="text-sm text-muted-foreground mt-2">{n.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-border/60">
                <div className="container mx-auto px-4 py-24 lg:py-32">
                    <motion.div {...fade} className="max-w-2xl mx-auto text-center space-y-7">
                        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-balance">
                            Pronto para mostrar seu trabalho?
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Monte seu mídia kit em minutos e receba uma página profissional para compartilhar com as marcas.
                        </p>
                        <div>
                            <Link href="/midia-kit">
                                <Button size="lg" className="h-12 px-8 rounded-full text-base font-medium">
                                    Começar agora <ArrowRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    )
}
