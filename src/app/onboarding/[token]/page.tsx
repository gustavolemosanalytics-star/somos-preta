"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, User, Globe, Briefcase, FileText, Heart, Sparkles } from "lucide-react"
import { toast } from "sonner"

const steps = [
    { id: 1, title: "Dados Básicos", icon: User },
    { id: 2, title: "Redes Sociais", icon: Globe },
    { id: 3, title: "Profissional", icon: Briefcase },
    { id: 4, title: "Documentos", icon: FileText },
    { id: 5, title: "Preferências", icon: Heart },
]

const onboardingSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    instagram: z.string().min(1, "Instagram é obrigatório"),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    bio: z.string().min(10, "Bio muito curta"),
    niche: z.string().min(2, "Informe seu nicho"),
    cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
    preferences: z.string().optional(),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

export default function OnboardingPage({ params }: { params: { token: string } }) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isCompleted, setIsCompleted] = useState(false)

    const form = useForm<OnboardingValues>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            instagram: "",
            tiktok: "",
            youtube: "",
            bio: "",
            niche: "",
            cpfCnpj: "",
            preferences: "",
        },
    })

    const progress = (currentStep / steps.length) * 100

    async function onSubmit(data: OnboardingValues) {
        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1)
            return
        }

        try {
            const response = await fetch("/api/influencers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    status: "ACTIVE",
                    niche: [data.niche]
                }),
            })

            if (!response.ok) throw new Error()

            setIsCompleted(true)
            toast.success("Cadastro concluído com sucesso!")
        } catch (error) {
            toast.error("Erro ao salvar cadastro. Tente novamente.")
        }
    }

    if (isCompleted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl">Bem-vindo à Somos Preta!</CardTitle>
                        <CardDescription>
                            Seu perfil foi criado e está sendo verificado pela nossa equipe.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-700 dark:text-purple-300">
                            <Sparkles className="h-5 w-5" />
                            <span className="font-medium text-sm">Badge de "Perfil Verificado" desbloqueado</span>
                        </div>
                        <Button className="w-full" onClick={() => router.push("/login")}>
                            Ir para Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 dark:bg-slate-950">
            <div className="mx-auto max-w-2xl space-y-8">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Onboarding de Creator</h1>
                    <p className="text-muted-foreground">Complete seu perfil para ter acesso às melhores campanhas do Nordeste.</p>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm font-medium">
                        <span>Passo {currentStep} de {steps.length}</span>
                        <span>{Math.round(progress)}% Completo</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                <div className="flex justify-between">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={`flex flex-col items-center gap-2 transition-colors ${currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                                }`}
                        >
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${currentStep >= step.id ? "border-primary bg-primary/10" : "border-muted"
                                }`}>
                                <step.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] uppercase font-bold hidden sm:block tracking-wider">{step.title}</span>
                        </div>
                    ))}
                </div>

                <Card className="border-t-4 border-t-primary">
                    <CardHeader>
                        <CardTitle>{steps[currentStep - 1].title}</CardTitle>
                        <CardDescription>Insira suas informações para prosseguir.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {currentStep === 1 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome Completo</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Seu nome artístico ou real" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email Profissional</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="seu@email.com" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>WhatsApp</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="(00) 00000-0000" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <FormField
                                            control={form.control}
                                            name="instagram"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Instagram</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="@seu_perfil" {...field} />
                                                    </FormControl>
                                                    <FormDescription>Usaremos isto para carregar suas métricas automaticamente.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="tiktok"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>TikTok (Opcional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="@seu_tiktok" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <FormField
                                            control={form.control}
                                            name="niche"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nicho Principal</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: Moda, Beleza, Tech..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="bio"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Fale um pouco sobre você</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Sua bio profissional..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-8">
                                        <div className="border-2 border-dashed rounded-xl p-12 text-muted-foreground">
                                            Suba seu documento de identidade ou CNPJ
                                            <Button variant="outline" className="mt-4 block mx-auto" type="button">Selecionar Arquivo</Button>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="cpfCnpj"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Número do Documento (CPF/CNPJ)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="000.000.000-00" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}

                                {currentStep === 5 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <FormField
                                            control={form.control}
                                            name="preferences"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Preferências de Trabalho</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ex: Apenas marcas locais, aceito permuta, etc." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                                            <h4 className="font-medium text-sm mb-2">Próximos passos</h4>
                                            <ul className="text-xs space-y-2 text-muted-foreground">
                                                <li>• Seu perfil passará por análise de engajamento</li>
                                                <li>• Você receberá acesso ao seu Mídia Kit editável</li>
                                                <li>• Campanhas regionais serão sugeridas via WhatsApp</li>
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setCurrentStep(prev => prev - 1)}
                                        disabled={currentStep === 1}
                                    >
                                        Voltar
                                    </Button>
                                    <Button type="submit">
                                        {currentStep === steps.length ? "Finalizar Cadastro" : "Próximo Passo"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
