"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"
import { toast } from "sonner"

export default function MediaKitEditorPage() {
    // Mock initial data - in real app would fetch from API
    const [bio, setBio] = useState("")
    const [colors, setColors] = useState({ primary: "#000000", secondary: "#ffffff" })

    const handleSave = () => {
        toast.success("Mídia Kit atualizado com sucesso!")
        // Here we would sync with mock-db via API
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Editor de Mídia Kit</h2>
                    <p className="text-muted-foreground">
                        Personalize a aparência e conteúdo do seu cartão de visitas digital.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => window.open('/kit/anasilva', '_blank')}>
                        Ver Público
                    </Button>
                    <Button onClick={handleSave}>
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Editor Panel */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Informações Básicas</h3>
                        <Separator />
                        <div className="grid gap-2">
                            <Label>Biografia</Label>
                            <Textarea
                                placeholder="Conte um pouco sobre você..."
                                className="min-h-[100px]"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Esta bio aparecerá no topo do seu media kit.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 space-y-4">
                        <h3 className="text-lg font-semibold">Portfólio</h3>
                        <Separator />
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground mb-4">Adicione seus melhores trabalhos</p>
                            <Button variant="outline">Adicionar Case</Button>
                        </div>
                    </div>
                </div>

                {/* Preview Panel  */}
                <div className="hidden lg:block">
                    <div className="sticky top-6 rounded-xl border bg-slate-50 dark:bg-slate-900 shadow-sm p-4 overflow-hidden h-[800px] flex flex-col">
                        <div className="text-center mb-2 text-sm text-muted-foreground font-medium uppercase tracking-wide">Preview Mobile</div>
                        <div className="border-[8px] border-slate-800 rounded-[2rem] overflow-hidden flex-1 bg-white relative mx-auto w-[375px] shadow-2xl">
                            {/* Emulator Content */}
                            <iframe
                                src="/kit/anasilva"
                                className="w-full h-full bg-white"
                                title="Preview"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
