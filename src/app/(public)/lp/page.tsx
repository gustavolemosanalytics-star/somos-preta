"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ArrowRight, Star, MapPin, Search, ShieldCheck, Zap, Sparkles } from "lucide-react"

export default function RegionalLP() {
    return (
        <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-hidden">
            {/* Floating Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-2xl border-b border-white/10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">Somos Preta</span>
                    <div className="flex gap-4">
                        <Link href="/login"><Button variant="ghost" className="rounded-xl">Entrar</Button></Link>
                        <Link href="/login">
                            <Button className="rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                                Faça Parte
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="flex-1 pt-16 relative z-10">
                {/* Hero Section */}
                <section className="relative py-24 lg:py-40 flex items-center justify-center">
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-4xl mx-auto text-center space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Badge className="bg-gradient-to-r from-secondary/20 to-accent/20 text-secondary border-secondary/30 backdrop-blur-sm mb-6 px-6 py-2">
                                    <Sparkles className="h-3 w-3 mr-2" /> O Poder do Norte & Nordeste
                                </Badge>
                                <h1 className="text-6xl md:text-8xl font-bold leading-tight tracking-tight">
                                    A plataforma de{" "}
                                    <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                                        Creators
                                    </span>{" "}
                                    do NE.
                                </h1>
                                <p className="mt-8 text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                                    A plataforma definitiva para profissionais que se destacam e marcas que buscam a verdadeira influência regional.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                            >
                                <Link href="/construcao_midia_kit">
                                    <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-2xl bg-gradient-to-r from-secondary to-secondary/80 hover:opacity-90 transition-all shadow-xl shadow-secondary/20">
                                        CRIAR MEU MÍDIA KIT
                                    </Button>
                                </Link>
                                <Link href="/creators">
                                    <Button size="lg" variant="outline" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 border-primary/30 hover:bg-primary/5 transition-all">
                                        CONTRATAR TALENTOS
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>

                    {/* Hero Decorative */}
                    <div className="absolute top-20 left-10 opacity-10"><Star className="h-32 w-32 text-accent" /></div>
                    <div className="absolute bottom-20 right-10 opacity-10 rotate-12"><MapPin className="h-40 w-40 text-secondary" /></div>
                </section>

                {/* Feature Grid */}
                <section className="py-24 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary/90" />
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { Icon: Zap, title: "Destaque Regional", desc: "Levamos perfis do Norte e Nordeste para o topo do mercado nacional com dados e estratégia." },
                                { Icon: Search, title: "Buscador Dinâmico", desc: "Métricas reais e rastreabilidade total. Encontre o criador perfeito para sua campanha em segundos." },
                                { Icon: ShieldCheck, title: "Gestão de Contratos", desc: "Segurança jurídica e transparência para agência e influenciador em todas as etapas." },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="space-y-4 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl hover:bg-white/10 transition-all group"
                                >
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <item.Icon className="h-7 w-7 text-accent" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-primary-foreground">{item.title}</h3>
                                    <p className="text-primary-foreground/70 leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-24">
                    <div className="container mx-auto px-4 text-center space-y-12">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                                Não sabe por onde começar?
                            </h2>
                            <p className="text-lg max-w-2xl mx-auto text-muted-foreground mt-6">
                                Preparamos um tutorial completo de como construir seu mídia kit e como se destacar na nossa vitrine regional.
                            </p>
                        </motion.div>
                        <Link href="/construcao_midia_kit">
                            <Button size="lg" variant="link" className="text-2xl font-bold text-primary flex items-center mx-auto group">
                                VER PASSO A PASSO <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="py-12 border-t border-border/50 bg-card/50 backdrop-blur-sm relative z-10">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
                    <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Somos Preta.</span>
                    <div className="flex gap-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        <Link href="#" className="hover:text-primary transition-colors">Instagram</Link>
                        <Link href="#" className="hover:text-primary transition-colors">LinkedIn</Link>
                        <Link href="#" className="hover:text-primary transition-colors">Contato</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
