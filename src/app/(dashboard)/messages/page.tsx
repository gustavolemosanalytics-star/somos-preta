"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { mockDb } from "@/lib/mock-db"
import {
    Search,
    Send,
    MoreVertical,
    Phone,
    Video,
    Info,
    MessageSquare,
    Mail,
    Plus,
    CheckCheck,
    Loader2
} from "lucide-react"

const contacts = [
    { id: 1, name: "Ana Silva", lastMessage: "Pode me enviar o contrato corrigido?", time: "10:30", unread: 2, status: "online", type: "whatsapp" },
    { id: 2, name: "João Victor", lastMessage: "O briefing está aprovado!", time: "Ontem", unread: 0, status: "offline", type: "email" },
    { id: 3, name: "Maria Costa", lastMessage: "Vou postar o reel amanhã às 18h.", time: "Ontem", unread: 0, status: "online", type: "whatsapp" },
    { id: 4, name: "Carlos Tech", lastMessage: "Obrigado pelo retorno.", time: "2 dias", unread: 0, status: "offline", type: "whatsapp" },
]

export default function MessagesPage() {
    const [selectedContact, setSelectedContact] = useState(contacts[0])

    // Fetch messages for the selected contact
    const { data: messages, isLoading } = useQuery({
        queryKey: ['messages', selectedContact.id],
        queryFn: () => mockDb.message.findMany({ where: { contactId: selectedContact.id } })
    })

    return (
        <div className="flex h-[calc(100vh-140px)] border rounded-xl overflow-hidden bg-background shadow-sm">
            {/* Sidebar */}
            <div className="w-[350px] border-r flex flex-col">
                <div className="p-4 border-b flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Comunicação</h2>
                        <Button size="icon" variant="ghost"><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar conversas..." className="pl-9 bg-muted/50" />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y">
                        {contacts.map((contact) => (
                            <div
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`p-4 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedContact.id === contact.id ? 'bg-muted' : ''}`}
                            >
                                <div className="relative">
                                    <Avatar>
                                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {contact.status === "online" && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold truncate">{contact.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{contact.time}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-muted-foreground truncate">{contact.lastMessage}</p>
                                        <div className="flex items-center gap-1">
                                            {contact.type === "whatsapp" ? <MessageSquare className="h-3 w-3 text-green-500" /> : <Mail className="h-3 w-3 text-blue-500" />}
                                            {contact.unread > 0 && (
                                                <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary">{contact.unread}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
                <div className="p-4 border-b bg-background flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-semibold leading-none mb-1">{selectedContact.name}</div>
                            <div className="text-[10px] text-muted-foreground">{selectedContact.status === "online" ? "Online agora" : "Visto por último hoje às 08:30"}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost"><Phone className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost"><Video className="h-4 w-4" /></Button>
                        <Separator orientation="vertical" className="h-8 mx-1" />
                        <Button size="icon" variant="ghost"><Info className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 p-6">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {messages?.map((m) => (
                                <div key={m.id} className={`flex flex-col gap-1 ${m.sender === "USER" ? "items-end" : "items-start"}`}>
                                    <div className={`${m.sender === "USER"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-white dark:bg-slate-900 border"
                                        } p-3 rounded-2xl ${m.sender === "USER" ? "rounded-tr-none" : "rounded-tl-none"} max-w-[70%] shadow-sm text-sm`}>
                                        {m.text}
                                    </div>
                                    <div className={`flex items-center gap-1 ${m.sender === "USER" ? "mr-1" : "ml-1"}`}>
                                        <span className="text-[10px] text-muted-foreground">{m.time}</span>
                                        {m.sender === "USER" && <CheckCheck className="h-3 w-3 text-blue-500" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 bg-background border-t">
                    <div className="flex gap-2">
                        <Input placeholder="Escreva sua mensagem..." className="flex-1 bg-muted/50 pr-12" />
                        <Button className="shrink-0"><Send className="h-4 w-4 mr-2" /> Enviar</Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Separator({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
    return <div className={`bg-border ${orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"} ${className}`} />
}
