"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Info, Image as ImageIcon, BarChart, ListChecks, ArrowRight, ArrowLeft, Sparkles } from "lucide-react"

const tutorials = [
    {
        id: 1,
        title: "1. Sua Bio é seu Outdoor",
        description: "Sua apresentação deve ser curta, direta e regional. O que faz de você único no Norte/Nordeste?",
        tip: "Evite clichês. Diga qual problema você resolve para a marca.",
        Icon: Info,
    },
    {
        id: 2,
        title: "2. Suas Métricas Reais",
        description: "Marcas buscam engajamento, não apenas seguidores. Mostre seu alcance nos estados que você domina.",
        tip: "Use prints reais ou integre sua conta na nossa plataforma para dados automáticos.",
        Icon: BarChart,
    },
    {
        id: 3,
        title: "3. Melhores Cases",
        description: "Selecione seus 3 melhores trabalhos. Qual foi o resultado prático para o cliente?",
        tip: "Foque em conversão e depoimentos de marcas locais.",
        Icon: ListChecks,
    },
    {
        id: 4,
        title: "4. Fotos que Vendem",
        description: "Use imagens de alta qualidade que mostrem seu estilo de vida e conexão com a sua região.",
        tip: "Luz natural e cenários regionais trazem autenticidade.",
        Icon: ImageIcon,
    }
]

export default function MediaKitTutorialPage() {
    const [step, setStep] = useState(0)

    const next = () => setStep(s => Math.min(s + 1, tutorials.length))
    const prev = () => setStep(s => Math.max(s - 1, 0))

    const CurrentIcon = step < tutorials.length ? tutorials[step].Icon : null

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <Badge className="bg-accent/20 text-accent-foreground border-accent/30 backdrop-blur-sm">✨ TUTORIAL EXCLUSIVO</Badge>
                    <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        Construindo seu Mídia Kit Master
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Aprenda a criar um cartão de visitas digital que converte e mostre o valor real da sua influência regional.
                    </p>
                </div>

                <div className="relative">
                    <Progress value={(step / tutorials.length) * 100} className="h-2 bg-muted/30 rounded-full overflow-hidden" />
                </div>

                <AnimatePresence mode="wait">
                    {step < tutorials.length ? (
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="grid gap-8"
                        >
                            <Card className="p-6 md:p-12 overflow-hidden relative bg-gradient-to-br from-card to-card/80 backdrop-blur-xl border-white/10 shadow-2xl shadow-primary/5 rounded-3xl">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    {CurrentIcon && <CurrentIcon className="h-48 w-48 text-primary" />}
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

                                <CardHeader className="p-0 mb-8 relative z-10">
                                    <CardTitle className="text-3xl font-bold text-primary">{tutorials[step].title}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-8 relative z-10">
                                    <p className="text-2xl leading-relaxed text-foreground/90">{tutorials[step].description}</p>
                                    <div className="p-6 bg-gradient-to-r from-secondary/20 to-secondary/5 border-l-4 border-secondary rounded-2xl backdrop-blur-sm">
                                        <h4 className="font-bold flex items-center gap-2 mb-2 text-secondary">
                                            <Sparkles className="h-4 w-4" /> DICA DE OURO
                                        </h4>
                                        <p className="text-muted-foreground italic">{tutorials[step].tip}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-8"
                        >
                            <div className="h-40 w-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/20 shadow-2xl">
                                <CheckCircle2 className="h-24 w-24 text-primary" />
                            </div>
                            <h2 className="text-4xl font-bold">Pronto para a Ação!</h2>
                            <p className="text-lg text-muted-foreground">Agora que você sabe as regras do jogo, vamos criar seu kit na prática.</p>
                            <Button size="lg" className="h-16 px-12 text-xl font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all rounded-2xl shadow-xl shadow-primary/20">
                                Ir para o Gerador <ArrowRight className="ml-2" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex justify-between items-center pt-8">
                    <Button
                        variant="ghost"
                        onClick={prev}
                        disabled={step === 0}
                        className="rounded-xl"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> ANTERIOR
                    </Button>

                    {step < tutorials.length && (
                        <Button
                            onClick={next}
                            className="bg-gradient-to-r from-primary to-secondary px-8 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                        >
                            {step === tutorials.length - 1 ? "FINALIZAR" : "PRÓXIMO"} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
