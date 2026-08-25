"use client"

import { useState } from "react"
import { useProfiles } from "@/hooks/use-profiles"
import type { Profile } from "@/lib/db/types"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, ChevronsUpDown, UserRound, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function UserAvatar({ profile, className }: {
    profile?: Pick<Profile, "nome" | "avatar_url"> | null
    className?: string
}) {
    return (
        <Avatar className={cn("h-6 w-6", className)}>
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.nome ?? ""} />}
            <AvatarFallback className="text-[10px]">
                {profile?.nome ? profile.nome.slice(0, 2).toUpperCase() : <UserRound className="h-3 w-3" />}
            </AvatarFallback>
        </Avatar>
    )
}

export function UserPicker({ value, onChange, placeholder = "Selecionar pessoa", allowClear = true, disabled }: {
    value: string | null
    onChange: (id: string | null) => void
    placeholder?: string
    allowClear?: boolean
    disabled?: boolean
}) {
    const { profiles, loading } = useProfiles()
    const [open, setOpen] = useState(false)
    const selected = profiles.find((p) => p.id === value) ?? null

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
                    {selected ? (
                        <span className="flex items-center gap-2 truncate">
                            <UserAvatar profile={selected} /> {selected.nome ?? selected.email}
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{loading ? "Carregando..." : placeholder}</span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar pessoa..." />
                    <CommandList>
                        <CommandEmpty>Ninguém encontrado.</CommandEmpty>
                        <CommandGroup>
                            {allowClear && value && (
                                <CommandItem onSelect={() => { onChange(null); setOpen(false) }} className="text-muted-foreground">
                                    <X className="h-4 w-4" /> Remover seleção
                                </CommandItem>
                            )}
                            {profiles.map((p) => (
                                <CommandItem
                                    key={p.id}
                                    value={`${p.nome ?? ""} ${p.email ?? ""}`}
                                    onSelect={() => { onChange(p.id); setOpen(false) }}
                                >
                                    <UserAvatar profile={p} />
                                    <span className="flex-1 truncate">{p.nome ?? p.email}</span>
                                    {value === p.id && <Check className="h-4 w-4" />}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function UserMultiPicker({ values, onChange, placeholder = "Adicionar pessoas" }: {
    values: string[]
    onChange: (ids: string[]) => void
    placeholder?: string
}) {
    const { profiles, loading } = useProfiles()
    const [open, setOpen] = useState(false)
    const selected = profiles.filter((p) => values.includes(p.id))

    function toggle(id: string) {
        onChange(values.includes(id) ? values.filter((v) => v !== id) : [...values, id])
    }

    return (
        <div className="space-y-2">
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selected.map((p) => (
                        <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 pl-1 pr-1.5 py-0.5 text-xs">
                            <UserAvatar profile={p} className="h-4 w-4" />
                            {p.nome ?? p.email}
                            <button type="button" onClick={() => toggle(p.id)} className="text-muted-foreground hover:text-foreground" aria-label={`Remover ${p.nome ?? p.email}`}>
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="font-normal">
                        {loading ? "Carregando..." : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Buscar pessoa..." />
                        <CommandList>
                            <CommandEmpty>Ninguém encontrado.</CommandEmpty>
                            <CommandGroup>
                                {profiles.map((p) => (
                                    <CommandItem
                                        key={p.id}
                                        value={`${p.nome ?? ""} ${p.email ?? ""}`}
                                        onSelect={() => toggle(p.id)}
                                    >
                                        <UserAvatar profile={p} />
                                        <span className="flex-1 truncate">{p.nome ?? p.email}</span>
                                        {values.includes(p.id) && <Check className="h-4 w-4" />}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
