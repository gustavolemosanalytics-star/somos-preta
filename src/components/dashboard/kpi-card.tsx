import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface KPICardProps {
    title: string
    value: string | number
    description?: string
    icon: ReactNode
    trend?: "up" | "down" | "neutral"
}

export function KPICard({
    title,
    value,
    description,
    icon,
    trend = "neutral",
}: KPICardProps) {
    return (
        <Card className="relative overflow-hidden border-none shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-xl group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-2xl">
            {/* Animated Background Glow */}
            <div className={cn(
                "absolute -right-6 -top-6 h-32 w-32 rounded-full blur-3xl transition-all duration-500 group-hover:scale-150",
                trend === "up" ? "bg-gradient-to-br from-emerald-400/20 to-emerald-600/10" :
                    trend === "down" ? "bg-gradient-to-br from-rose-400/20 to-rose-600/10" :
                        "bg-gradient-to-br from-primary/20 to-secondary/10"
            )} />

            {/* Inner Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{title}</CardTitle>
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-2">
                <div className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {value}
                </div>
                {description && (
                    <p className="text-xs mt-2 text-muted-foreground/80 flex items-center gap-1">
                        {trend === "up" && <span className="text-emerald-500 font-bold text-sm">↑</span>}
                        {trend === "down" && <span className="text-rose-500 font-bold text-sm">↓</span>}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
