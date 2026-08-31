"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, ChevronsUpDown, UserRound, X } from "lucide-react"

type InfluencerOpcao = { id: string; nome: string; avatar_url: string | null }

function InfluencerAvatar({ influencer, className }: { influencer?: Pick<InfluencerOpcao, "nome" | "avatar_url"> | null; className?: string }) {
    return (
        <Avatar className={className ?? "h-6 w-6"}>
            {influencer?.avatar_url && <AvatarImage src={influencer.avatar_url} alt={influencer.nome ?? ""} />}
            <AvatarFallback className="text-[10px]">
                {influencer?.nome ? influencer.nome.slice(0, 2).toUpperCase() : <UserRound className="h-3 w-3" />}
            </AvatarFallback>
        </Avatar>
    )
}

export function InfluencerPicker({ value, onChange, placeholder = "Selecionar criador", allowClear = true, disabled }: {
    value: string | null
    onChange: (id: string | null, nome: string | null) => void
    placeholder?: string
    allowClear?: boolean
    disabled?: boolean
}) {
    const [supabase] = useState(() => createClient())
    const [open, setOpen] = useState(false)
    const [busca, setBusca] = useState("")
    const [resultados, setResultados] = useState<InfluencerOpcao[]>([])
    const [loading, setLoading] = useState(false)
    const [selecionado, setSelecionado] = useState<InfluencerOpcao | null>(null)

    useEffect(() => {
        if (!value) { setSelecionado(null); return }
        if (selecionado?.id === value) return
        supabase.from("somos_preta_influencers").select("id, nome, avatar_url").eq("id", value).single()
            .then(({ data }) => setSelecionado((data as InfluencerOpcao) ?? null))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    useEffect(() => {
        if (!open) return
        setLoading(true)
        const timeout = setTimeout(async () => {
            let query = supabase.from("somos_preta_influencers").select("id, nome, avatar_url").order("nome").limit(30)
            if (busca.trim()) query = query.ilike("nome", `%${busca.trim()}%`)
            const { data } = await query
            setResultados((data as InfluencerOpcao[]) ?? [])
            setLoading(false)
        }, 300)
        return () => clearTimeout(timeout)
    }, [busca, open, supabase])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between font-normal"
                >
                    {selecionado ? (
                        <span className="flex items-center gap-2 truncate">
                            <InfluencerAvatar influencer={selecionado} /> {selecionado.nome}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Buscar criador..." value={busca} onValueChange={setBusca} />
                    <CommandList>
                        <CommandEmpty>{loading ? "Buscando..." : "Nenhum criador encontrado."}</CommandEmpty>
                        <CommandGroup>
                            {allowClear && value && (
                                <CommandItem onSelect={() => { onChange(null, null); setOpen(false) }} className="text-muted-foreground">
                                    <X className="h-4 w-4" /> Remover seleção
                                </CommandItem>
                            )}
                            {resultados.map((i) => (
                                <CommandItem
                                    key={i.id}
                                    value={i.id}
                                    onSelect={() => { onChange(i.id, i.nome); setSelecionado(i); setOpen(false) }}
                                >
                                    <InfluencerAvatar influencer={i} />
                                    <span className="flex-1 truncate">{i.nome}</span>
                                    {value === i.id && <Check className="h-4 w-4" />}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
