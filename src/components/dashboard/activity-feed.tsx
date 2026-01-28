import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock } from "lucide-react"

export function ActivityFeed() {
    const activities = [
        {
            user: {
                name: "Ana Silva",
                avatar: "",
                initials: "AS",
            },
            action: "cadastrou um novo influenciador",
            target: "João Victor",
            time: "2 horas atrás",
        },
        {
            user: {
                name: "Carlos Santos",
                avatar: "",
                initials: "CS",
            },
            action: "criou a campanha",
            target: "Verão 2025 - Coca Cola",
            time: "4 horas atrás",
        },
        {
            user: {
                name: "Mariana Costa",
                avatar: "",
                initials: "MC",
            },
            action: "aprovou conteúdo de",
            target: "Luiza Mel",
            time: "Ontem às 14:30",
        },
        {
            user: {
                name: "Pedro Oliveira",
                avatar: "",
                initials: "PO",
            },
            action: "enviou contrato para",
            target: "Roberto Silva",
            time: "Ontem às 10:15",
        },
    ]

    return (
        <Card className="border-none shadow-xl sm:shadow-2xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-xl rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden h-full">
            <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent border-b border-border/50 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Atividade Recente
                    </CardTitle>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="space-y-3 sm:space-y-4">
                    {activities.map((activity, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-2 sm:p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                        >
                            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 ring-2 ring-background shadow-sm">
                                <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                                <AvatarFallback className="text-[10px] sm:text-xs font-bold bg-gradient-to-br from-primary/20 to-secondary/20 text-primary">
                                    {activity.user.initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                                <p className="text-xs sm:text-sm leading-snug">
                                    <span className="font-semibold text-foreground">{activity.user.name}</span>{" "}
                                    <span className="text-muted-foreground">
                                        {activity.action}
                                    </span>{" "}
                                    <span className="font-medium text-primary truncate">{activity.target}</span>
                                </p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground/70 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
