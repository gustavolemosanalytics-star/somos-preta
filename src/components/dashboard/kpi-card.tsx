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
        <Card className="relative overflow-hidden border-none shadow-lg sm:shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-xl group hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 sm:duration-500 rounded-xl sm:rounded-2xl active:scale-[0.98] sm:active:scale-100">
            {/* Animated Background Glow */}
            <div className={cn(
                "absolute -right-4 -top-4 sm:-right-6 sm:-top-6 h-24 w-24 sm:h-32 sm:w-32 rounded-full blur-2xl sm:blur-3xl transition-all duration-500 group-hover:scale-150",
                trend === "up" ? "bg-gradient-to-br from-emerald-400/20 to-emerald-600/10" :
                    trend === "down" ? "bg-gradient-to-br from-rose-400/20 to-rose-600/10" :
                        "bg-gradient-to-br from-primary/20 to-secondary/10"
            )} />

            {/* Inner Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 relative z-10 p-4 sm:p-6">
                <CardTitle className="text-[10px] sm:text-xs font-bold text-muted-foreground tracking-wider sm:tracking-widest uppercase line-clamp-1">{title}</CardTitle>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shrink-0 ml-2">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-0 sm:pt-2 p-4 sm:p-6 pt-0">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {value}
                </div>
                {description && (
                    <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 text-muted-foreground/80 flex items-center gap-1 line-clamp-1">
                        {trend === "up" && <span className="text-emerald-500 font-bold text-xs sm:text-sm">↑</span>}
                        {trend === "down" && <span className="text-rose-500 font-bold text-xs sm:text-sm">↓</span>}
                        <span className="truncate">{description}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
