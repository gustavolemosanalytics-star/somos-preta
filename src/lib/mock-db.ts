// Core Mock Database Service for "Somos Preta"
// This file centralizes all demonstration data for the platform.

export type Influencer = {
    id: string
    name: string
    email: string
    instagram: string
    followers: number
    engagement: number
    status: "ACTIVE" | "INACTIVE" | "NEGOTIATING" | "BLOCKED"
    state: string
    city?: string
    niche: string[]
    bio?: string
    portfolio?: { title: string; image: string; link: string }[]
    username?: string
    cacheValue?: string
}

export type Campaign = {
    id: string
    name: string
    client: string
    status: "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "COMPLETED" | "CANCELLED"
    budget: string
    influencersCount: number
    startDate: string
    endDate: string
}

export type Contract = {
    id: string
    title: string
    influencer: string
    status: "PENDING" | "SIGNED" | "EXPIRED" | "CANCELLED"
    createdAt: string
    expiresAt: string
}

export type Message = {
    id: string
    contactId: number
    text: string
    sender: "USER" | "INFLUENCER"
    time: string
    read: boolean
}

export type Course = {
    id: number
    title: string
    category: string
    duration: string
    lessons: number
    progress: number
    rating: number
    image: string
}

export type Post = {
    id: number
    user: { name: string; handle: string; avatar: string }
    content: string
    likes: number
    comments: number
    time: string
}

const globalForMock = global as unknown as {
    mockInfluencers: Influencer[],
    mockCampaigns: Campaign[],
    mockContracts: Contract[],
    mockMessages: Message[],
    mockCourses: Course[],
    mockPosts: Post[]
}

const INITIAL_INFLUENCERS: Influencer[] = [
    { id: "1", name: "Ana Silva", email: "ana@example.com", instagram: "@anasilva", username: "anasilva", followers: 12500, engagement: 4.5, status: "ACTIVE", state: "BA", city: "Salvador", niche: ["Moda", "Lifestyle"], bio: "Apaixonada por moda sustentável e lifestyle baiano.", cacheValue: "R$ 1.500", portfolio: [{ title: "Verão Coca-Cola", image: "", link: "#" }] },
    { id: "2", name: "João Victor", email: "joao@example.com", instagram: "@joaov", username: "joaov", followers: 45000, engagement: 3.2, status: "NEGOTIATING", state: "PE", city: "Recife", niche: ["Tech", "Games"], bio: "Tech reviewer focado no público pernambucano." },
    { id: "3", name: "Maria Costa", email: "maria@example.com", instagram: "@mariac", username: "mariac", followers: 8200, engagement: 5.8, status: "ACTIVE", state: "CE", city: "Fortaleza", niche: ["Beleza"], bio: "Dicas de skincare para o clima do Ceará." },
    { id: "4", name: "Rafael Duarte", email: "rafael@example.com", instagram: "@rafaduarte", username: "rafaduarte", followers: 28000, engagement: 4.1, status: "ACTIVE", state: "RN", city: "Natal", niche: ["Gastronomia", "Viagem"] },
    { id: "5", name: "Beatriz Lopes", email: "bia@example.com", instagram: "@bialopes", username: "bialopes", followers: 15400, engagement: 6.2, status: "ACTIVE", state: "BA", city: "Trancoso", niche: ["Beleza", "Lifestyle"] },
    { id: "6", name: "Carlos Tech", email: "carlos@example.com", instagram: "@carlostech", username: "carlostech", followers: 32000, engagement: 2.9, status: "INACTIVE", state: "PB", city: "João Pessoa", niche: ["Tech"] },
    { id: "7", name: "Juliana Mar", email: "ju@example.com", instagram: "@jumar", username: "jumar", followers: 95000, engagement: 3.5, status: "ACTIVE", state: "SE", city: "Aracaju", niche: ["Fitness", "Saúde"] },
    { id: "8", name: "Pedro Alagoas", email: "pedro@example.com", instagram: "@pedro_al", username: "pedro_al", followers: 18000, engagement: 4.8, status: "NEGOTIATING", state: "AL", city: "Maceió", niche: ["Humor", "Entretenimento"] },
    { id: "9", name: "Luana Norte", email: "luana@example.com", instagram: "@luananorte", username: "luananorte", followers: 52000, engagement: 3.1, status: "ACTIVE", state: "AM", city: "Manaus", niche: ["Natureza", "Lifestyle"] },
    { id: "10", name: "Guto Pará", email: "guto@example.com", instagram: "@gutopara", username: "gutopara", followers: 11000, engagement: 5.2, status: "ACTIVE", state: "PA", city: "Belém", niche: ["Culinária", "Cultura"] },
    { id: "11", name: "Fernanda Teresina", email: "fepa@example.com", instagram: "@fepa_te", username: "fepa_te", followers: 22000, engagement: 4.0, status: "ACTIVE", state: "PI", city: "Teresina", niche: ["Moda"] },
    { id: "12", name: "Marcos Maranhão", email: "marcos@example.com", instagram: "@marcos_slz", username: "marcos_slz", followers: 35000, engagement: 2.7, status: "BLOCKED", state: "MA", city: "São Luís", niche: ["Lifestyle"] },
]

const INITIAL_CAMPAIGNS: Campaign[] = [
    { id: "1", name: "Lançamento Verão 2025", client: "Cervejaria Bahia", status: "ACTIVE", budget: "R$ 25.000,00", influencersCount: 12, startDate: "2024-12-01", endDate: "2025-02-28" },
    { id: "2", name: "Promoção Dia das Mães", client: "Shopping Recife", status: "DRAFT", budget: "R$ 15.000,00", influencersCount: 5, startDate: "2025-04-15", endDate: "2025-05-12" },
    { id: "3", name: "Black Friday Tech", client: "Hitech Store CE", status: "COMPLETED", budget: "R$ 50.000,00", influencersCount: 20, startDate: "2024-11-01", endDate: "2024-11-30" },
    { id: "4", name: "Carnaval da Gente", client: "Gov Bahia", status: "ACTIVE", budget: "R$ 120.000,00", influencersCount: 45, startDate: "2025-01-10", endDate: "2025-03-05" },
    { id: "5", name: "São João de Caruaru 2025", client: "Prefeitura Caruaru", status: "PENDING_APPROVAL", budget: "R$ 85.000,00", influencersCount: 30, startDate: "2025-06-01", endDate: "2025-06-30" },
]

const INITIAL_CONTRACTS: Contract[] = [
    { id: "1", title: "Campanha Verão - Exclusividade", influencer: "Ana Silva", status: "SIGNED", createdAt: "2024-11-20", expiresAt: "2025-02-28" },
    { id: "2", title: "Termo de Parceria - Beauty", influencer: "Maria Costa", status: "PENDING", createdAt: "2025-01-15", expiresAt: "2025-03-15" },
    { id: "3", title: "Contrato Anual Master", influencer: "João Victor", status: "EXPIRED", createdAt: "2024-01-01", expiresAt: "2024-12-31" },
    { id: "4", title: "Contrato Gov Bahia - Carnaval", influencer: "Rafael Duarte", status: "SIGNED", createdAt: "2025-01-05", expiresAt: "2025-03-10" },
]

const INITIAL_MESSAGES: Message[] = [
    { id: "1", contactId: 1, text: "Olá! Já recebeu os materiais que enviei por email?", sender: "INFLUENCER", time: "09:15", read: true },
    { id: "2", contactId: 1, text: "Ainda não, vou conferir aqui agora mesmo Ana.", sender: "USER", time: "09:20", read: true },
    { id: "3", contactId: 1, text: "Pode me enviar o contrato corrigido?", sender: "INFLUENCER", time: "10:30", read: true },
    { id: "4", contactId: 3, text: "Vou postar o reel amanhã às 18h.", sender: "INFLUENCER", time: "11:50", read: true },
    { id: "5", contactId: 3, text: "Perfeito, Maria! Fico no aguardo.", sender: "USER", time: "12:00", read: true },
]

const INITIAL_COURSES: Course[] = [
    { id: 1, title: "Mídia Kit Irresistível", category: "Profissionalização", duration: "2h 30min", lessons: 12, progress: 100, rating: 4.9, image: "" },
    { id: 2, title: "Negociação e Precificação", category: "Business", duration: "4h 15min", lessons: 8, progress: 45, rating: 5.0, image: "" },
    { id: 3, title: "Marketing de Influência NE", category: "Regional", duration: "6h 00min", lessons: 24, progress: 0, rating: 4.8, image: "" },
    { id: 4, title: "Edição de Vídeo para Reels", category: "Criatividade", duration: "3h 45min", lessons: 15, progress: 10, rating: 4.7, image: "" },
]

const INITIAL_POSTS: Post[] = [
    { id: 1, user: { name: "Beatriz Lopes", handle: "@bialopes", avatar: "" }, content: "Alguém do Ceará com experiência em campanhas de skincare? Tenho uma marca interessada em fazer um collab focado em peles resistentes ao sol do NE! ☀️", likes: 24, comments: 12, time: "2h atrás" },
    { id: 2, user: { name: "Rafael Silva", handle: "@rafatech", avatar: "" }, content: "Acabei de fechar minha 10ª campanha através da Somos Preta! O curso de precificação me ajudou demais a valorizar meu trabalho. Valeu equipe! 🚀", likes: 156, comments: 8, time: "5h atrás" },
    { id: 3, user: { name: "Juliana Mar", handle: "@jumar", avatar: "" }, content: "Gente, alguém sabe como declarar recebimentos de permuta? 😅 #duvida #creators", likes: 42, comments: 20, time: "8h atrás" },
]

if (!globalForMock.mockInfluencers) globalForMock.mockInfluencers = [...INITIAL_INFLUENCERS]
if (!globalForMock.mockCampaigns) globalForMock.mockCampaigns = [...INITIAL_CAMPAIGNS]
if (!globalForMock.mockContracts) globalForMock.mockContracts = [...INITIAL_CONTRACTS]
if (!globalForMock.mockMessages) globalForMock.mockMessages = [...INITIAL_MESSAGES]
if (!globalForMock.mockCourses) globalForMock.mockCourses = [...INITIAL_COURSES]
if (!globalForMock.mockPosts) globalForMock.mockPosts = [...INITIAL_POSTS]

export const mockDb = {
    influencer: {
        findMany: async ({ where }: any = {}) => {
            let results = [...globalForMock.mockInfluencers]
            if (where?.OR) {
                const query = where.OR[0].name?.contains?.toLowerCase()
                results = results.filter(i => i.name.toLowerCase().includes(query) || i.instagram.toLowerCase().includes(query))
            }
            if (where?.state) results = results.filter(i => i.state === where.state)
            await new Promise(r => setTimeout(r, 200))
            return results
        },
        findUnique: async ({ where }: any) => {
            await new Promise(r => setTimeout(r, 100))
            if (where.username) return globalForMock.mockInfluencers.find(i => i.username === where.username)
            if (where.id) return globalForMock.mockInfluencers.find(i => i.id === where.id)
            return null
        },
        create: async ({ data }: any) => {
            const newItem = { id: Math.random().toString(36).substring(7), status: "ACTIVE" as const, followers: 0, engagement: 0, username: data.instagram.replace('@', '').toLowerCase(), ...data }
            globalForMock.mockInfluencers.unshift(newItem)
            return newItem
        },
        count: async () => globalForMock.mockInfluencers.length,
    },
    campaign: {
        findMany: async () => {
            await new Promise(r => setTimeout(r, 100))
            return globalForMock.mockCampaigns
        },
        count: async ({ where }: any = {}) => {
            if (where?.status === "ACTIVE") return globalForMock.mockCampaigns.filter(c => c.status === "ACTIVE").length
            return globalForMock.mockCampaigns.length
        }
    },
    contract: {
        findMany: async () => globalForMock.mockContracts,
        count: async () => globalForMock.mockContracts.length,
    },
    message: {
        findMany: async ({ where }: any = {}) => {
            if (where?.contactId) return globalForMock.mockMessages.filter(m => m.contactId === where.contactId)
            return globalForMock.mockMessages
        }
    },
    course: {
        findMany: async () => globalForMock.mockCourses,
    },
    post: {
        findMany: async () => globalForMock.mockPosts,
    }
}
