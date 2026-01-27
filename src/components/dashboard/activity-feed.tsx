import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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
        <div className="space-y-8">
            {activities.map((activity, index) => (
                <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                        <AvatarFallback>{activity.user.initials}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {activity.user.name}{" "}
                            <span className="text-muted-foreground font-normal">
                                {activity.action}
                            </span>{" "}
                            {activity.target}
                        </p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
