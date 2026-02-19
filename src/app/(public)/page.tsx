"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ArrowRight, Search, Users2, GraduationCap, FileImage, Sparkles, Star, MapPin, TrendingUp, Shield } from "lucide-react"

const features = [
    {
        icon: Search,
        title: "Busca de Influencers",
        description: "Encontre os melhores criadores de conteúdo do Brasil. Pesquise por @, analise métricas reais e descubra talentos.",
        href: "/busca",
        color: "from-blue-500 to-cyan-500",
    },
    {
        icon: Users2,
        title: "Comunidade",
        description: "A rede social dos influencers. Conecte-se, compartilhe experiências e faça networking com outros creators.",
        href: "/comunidade",
        color: "from-purple-500 to-pink-500",
    },
    {
        icon: GraduationCap,
        title: "Cursos",
        description: "Capacite-se com cursos exclusivos para influenciadores digitais. Do básico ao avançado, tudo em um só lugar.",
        href: "/cursos",
        color: "from-amber-500 to-orange-500",
    },
    {
        icon: FileImage,
        title: "Mídia Kit",
        description: "Crie seu mídia kit profissional direto na plataforma. Intuitivo, moderno e pronto para impressionar marcas.",
        href: "/midia-kit",
        color: "from-emerald-500 to-teal-500",
    },
]

const stats = [
    { value: "500+", label: "Creators Ativos" },
    { value: "2M+", label: "Alcance Total" },
    { value: "150+", label: "Campanhas" },
    { value: "98%", label: "Satisfação" },
]

export default function HomePage() {
    return (
        <div className="flex flex-col overflow-hidden">
            {/* Floating Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-secondary/10 to-transparent rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl" />
            </div>

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
                                <Sparkles className="h-3 w-3 mr-2" /> Plataforma Completa para Influencers
                            </Badge>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight">
                                O futuro da{" "}
                                <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                                    influência digital
                                </span>{" "}
                                começa aqui.
                            </h1>
                            <p className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                                Busque influencers, conecte-se com a comunidade, aprenda com os melhores cursos e crie seu mídia kit profissional. Tudo em uma única plataforma.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
                        >
                            <Link href="/busca">
                                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-xl shadow-primary/20">
                                    <Search className="mr-2 h-5 w-5" />
                                    Buscar Influencers
                                </Button>
                            </Link>
                            <Link href="/midia-kit">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl border-2 border-primary/30 hover:bg-primary/5 transition-all">
                                    Criar Mídia Kit
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>

                <div className="absolute top-20 left-10 opacity-10"><Star className="h-32 w-32 text-accent" /></div>
                <div className="absolute bottom-20 right-10 opacity-10 rotate-12"><MapPin className="h-40 w-40 text-secondary" /></div>
            </section>

            {/* Stats Section */}
            <section className="py-16 relative z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8"
                    >
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                    {stat.value}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 relative z-10">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-5xl font-bold">
                            Tudo que você precisa,{" "}
                            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">em um só lugar</span>
                        </h2>
                        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                            Explore nossas ferramentas e encontre o que precisa para crescer como influenciador digital.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                            >
                                <Link href={feature.href} className="block group">
                                    <div className="relative p-8 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all h-full">
                                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                            <feature.icon className="h-7 w-7 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                                        <div className="mt-6 flex items-center text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                            Explorar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-24 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-primary to-primary/90" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground">
                                Sobre a Somos Preta
                            </h2>
                            <p className="mt-6 text-lg text-primary-foreground/80 leading-relaxed">
                                Somos a plataforma que conecta influenciadores digitais do Brasil inteiro com as ferramentas, conhecimento e comunidade que precisam para prosperar. Nossa missão é democratizar o acesso ao mercado de influência, valorizando talentos de todas as regiões.
                            </p>
                        </motion.div>

                        <div className="grid sm:grid-cols-3 gap-6 pt-8">
                            {[
                                { icon: TrendingUp, title: "Crescimento", desc: "Ferramentas para impulsionar sua carreira" },
                                { icon: Shield, title: "Confiança", desc: "Dados reais e transparência total" },
                                { icon: Users2, title: "Comunidade", desc: "Networking com creators de todo o Brasil" },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10"
                                >
                                    <item.icon className="h-8 w-8 text-accent mb-4" />
                                    <h3 className="font-bold text-primary-foreground mb-2">{item.title}</h3>
                                    <p className="text-sm text-primary-foreground/70">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative z-10">
                <div className="container mx-auto px-4 text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold">
                            Pronto para{" "}
                            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                                começar?
                            </span>
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                            Explore a plataforma agora mesmo. Busque influencers, participe da comunidade ou crie seu mídia kit.
                        </p>
                    </motion.div>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link href="/busca">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-2xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg">
                                Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
