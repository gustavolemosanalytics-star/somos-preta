"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { FileImage, CheckCircle2, Sparkles, ArrowRight, Star, Palette, BarChart3, Briefcase } from "lucide-react"
import { motion } from "framer-motion"

const benefits = [
    { icon: Palette, title: "Design Profissional", desc: "Templates modernos e personalizáveis que impressionam marcas e agências." },
    { icon: BarChart3, title: "Métricas Integradas", desc: "Insira suas métricas reais e deixe seu mídia kit sempre atualizado." },
    { icon: Briefcase, title: "Portfólio Completo", desc: "Mostre seus melhores trabalhos de forma organizada e visual." },
    { icon: Star, title: "Compartilhe com 1 Click", desc: "Gere um link exclusivo e compartilhe seu mídia kit com qualquer pessoa." },
]

const steps = [
    { step: "01", title: "Crie sua conta", desc: "Registre-se gratuitamente em menos de 1 minuto." },
    { step: "02", title: "Preencha seus dados", desc: "Adicione suas informações, redes sociais e métricas." },
    { step: "03", title: "Monte seu portfólio", desc: "Adicione seus melhores trabalhos e campanhas anteriores." },
    { step: "04", title: "Personalize o visual", desc: "Escolha cores e estilo que combinam com sua marca pessoal." },
    { step: "05", title: "Compartilhe", desc: "Envie para marcas e agências com um link exclusivo." },
]

export default function MidiaKitPage() {
    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Badge className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 mb-4 px-4 py-1.5">
                                <FileImage className="h-3 w-3 mr-2" /> Mídia Kit Builder
                            </Badge>
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
                                Crie seu{" "}
                                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                                    Mídia Kit
                                </span>{" "}
                                profissional
                            </h1>
                            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                                A ferramenta mais completa e intuitiva para criar seu mídia kit. Impressione marcas e agências com um material profissional e sempre atualizado.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link href="/midia-kit/registro">
                                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 shadow-xl shadow-emerald-500/20">
                                    Criar Minha Conta <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/login/midia-kit">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl border-2 border-emerald-500/30 hover:bg-emerald-500/5">
                                    Já tenho conta
                                </Button>
                            </Link>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Preview */}
            <section className="container mx-auto px-4 -mt-8 relative z-10 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <Card className="border-none bg-gradient-to-br from-card to-card/50 shadow-2xl overflow-hidden max-w-4xl mx-auto">
                        <CardContent className="p-0">
                            <div className="aspect-[16/9] bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-primary/10 flex items-center justify-center relative">
                                <div className="absolute inset-4 md:inset-8 border-2 border-dashed border-muted-foreground/20 rounded-2xl flex items-center justify-center">
                                    <div className="text-center space-y-4 p-4">
                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mx-auto flex items-center justify-center">
                                            <FileImage className="h-10 w-10 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Preview do seu Mídia Kit</p>
                                            <p className="text-sm text-muted-foreground">Crie sua conta para começar a construir</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </section>

            {/* Benefits */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                    Por que criar seu mídia kit{" "}
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">aqui?</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Card className="border-none bg-card/50 hover:shadow-lg transition-all h-full">
                                <CardContent className="p-6 space-y-4">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                                        <benefit.icon className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <h3 className="font-bold text-lg">{benefit.title}</h3>
                                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Steps */}
            <section className="py-16 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent" />
                <div className="container mx-auto px-4 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                        Como funciona
                    </h2>
                    <div className="max-w-3xl mx-auto space-y-6">
                        {steps.map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="flex gap-6 items-start"
                            >
                                <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                    {item.step}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-16">
                <div className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 p-8 md:p-12 text-center text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-6 max-w-xl mx-auto">
                        <Sparkles className="h-10 w-10 mx-auto" />
                        <h2 className="text-3xl md:text-4xl font-bold">Pronto para impressionar?</h2>
                        <p className="text-emerald-100">Crie seu mídia kit profissional agora. É grátis para começar.</p>
                        <Link href="/midia-kit/registro">
                            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold rounded-2xl">
                                Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <FileImage className="h-64 w-64" />
                    </div>
                </div>
            </section>
        </div>
    )
}
