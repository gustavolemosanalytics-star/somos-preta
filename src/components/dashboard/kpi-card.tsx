import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReactNode } from "react"

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
        <Card className="relative border border-border/60 shadow-sm bg-card group hover:shadow-md transition-shadow duration-300 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 relative z-10 p-4 sm:p-6">
                <CardTitle className="text-[10px] sm:text-xs font-semibold text-muted-foreground tracking-wider sm:tracking-widest uppercase line-clamp-1">{title}</CardTitle>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 ml-2">
                    {icon}
                </div>
            </CardHeader>
            <CardContent className="relative z-10 pt-0 sm:pt-2 p-4 sm:p-6 pt-0">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
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
