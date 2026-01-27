import { z } from "zod"

export const influencerSchema = z.object({
    name: z.string().min(2, {
        message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    email: z.string().email({
        message: "Email inválido.",
    }).optional().or(z.literal('')),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
    niche: z.array(z.string()),
    state: z.string().optional(),
    city: z.string().optional(),
    cacheValue: z.string().optional(),
})

export type InfluencerFormValues = z.infer<typeof influencerSchema>
