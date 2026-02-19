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
    audienceData?: {
        ageRanges: { range: string; percentage: number }[]
        genderSplit: { male: number; female: number; other: number }
        topCities: { city: string; percentage: number }[]
    }
    avgLikes?: number
    avgComments?: number
    avgShares?: number
    growthRate?: number
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
    instructor?: string
    description?: string
    price?: string
    enrolled?: number
}

export type Post = {
    id: number
    user: { name: string; handle: string; avatar: string }
    content: string
    likes: number
    comments: number
    shares?: number
    time: string
}

export type MidiaKitUser = {
    id: string
    name: string
    email: string
    instagram: string
    password: string
    createdAt: string
}

const globalForMock = global as unknown as {
    mockInfluencers: Influencer[],
    mockCampaigns: Campaign[],
    mockContracts: Contract[],
    mockMessages: Message[],
    mockCourses: Course[],
    mockPosts: Post[],
    mockMidiaKitUsers: MidiaKitUser[]
}

const INITIAL_INFLUENCERS: Influencer[] = [
    { id: "1", name: "Ana Silva", email: "ana@example.com", instagram: "@anasilva", username: "anasilva", followers: 12500, engagement: 4.5, status: "ACTIVE", state: "BA", city: "Salvador", niche: ["Moda", "Lifestyle"], bio: "Apaixonada por moda sustentável e lifestyle baiano. Criadora de conteúdo desde 2019.", cacheValue: "R$ 1.500", portfolio: [{ title: "Verão Coca-Cola", image: "", link: "#" }, { title: "Coleção Farm", image: "", link: "#" }], audienceData: { ageRanges: [{ range: "18-24", percentage: 35 }, { range: "25-34", percentage: 42 }, { range: "35-44", percentage: 15 }, { range: "45+", percentage: 8 }], genderSplit: { male: 22, female: 75, other: 3 }, topCities: [{ city: "Salvador", percentage: 38 }, { city: "São Paulo", percentage: 15 }, { city: "Recife", percentage: 12 }] }, avgLikes: 890, avgComments: 67, avgShares: 34, growthRate: 3.2 },
    { id: "2", name: "João Victor", email: "joao@example.com", instagram: "@joaov", username: "joaov", followers: 45000, engagement: 3.2, status: "NEGOTIATING", state: "PE", city: "Recife", niche: ["Tech", "Games"], bio: "Tech reviewer focado no público pernambucano. Reviews honestos de gadgets e games.", cacheValue: "R$ 4.500", audienceData: { ageRanges: [{ range: "13-17", percentage: 18 }, { range: "18-24", percentage: 45 }, { range: "25-34", percentage: 28 }, { range: "35+", percentage: 9 }], genderSplit: { male: 72, female: 25, other: 3 }, topCities: [{ city: "Recife", percentage: 32 }, { city: "São Paulo", percentage: 18 }, { city: "Fortaleza", percentage: 10 }] }, avgLikes: 2100, avgComments: 180, avgShares: 95, growthRate: 5.1 },
    { id: "3", name: "Maria Costa", email: "maria@example.com", instagram: "@mariac", username: "mariac", followers: 8200, engagement: 5.8, status: "ACTIVE", state: "CE", city: "Fortaleza", niche: ["Beleza"], bio: "Dicas de skincare para o clima do Ceará. Especialista em pele oleosa e proteção solar.", cacheValue: "R$ 800", audienceData: { ageRanges: [{ range: "18-24", percentage: 40 }, { range: "25-34", percentage: 38 }, { range: "35-44", percentage: 16 }, { range: "45+", percentage: 6 }], genderSplit: { male: 12, female: 85, other: 3 }, topCities: [{ city: "Fortaleza", percentage: 45 }, { city: "São Paulo", percentage: 12 }, { city: "Salvador", percentage: 8 }] }, avgLikes: 476, avgComments: 52, avgShares: 28, growthRate: 7.8 },
    { id: "4", name: "Rafael Duarte", email: "rafael@example.com", instagram: "@rafaduarte", username: "rafaduarte", followers: 28000, engagement: 4.1, status: "ACTIVE", state: "RN", city: "Natal", niche: ["Gastronomia", "Viagem"], bio: "Desbravando a culinária nordestina e os melhores destinos do RN.", cacheValue: "R$ 3.000", audienceData: { ageRanges: [{ range: "18-24", percentage: 20 }, { range: "25-34", percentage: 40 }, { range: "35-44", percentage: 28 }, { range: "45+", percentage: 12 }], genderSplit: { male: 45, female: 52, other: 3 }, topCities: [{ city: "Natal", percentage: 30 }, { city: "São Paulo", percentage: 20 }, { city: "Rio de Janeiro", percentage: 12 }] }, avgLikes: 1540, avgComments: 98, avgShares: 72, growthRate: 2.5 },
    { id: "5", name: "Beatriz Lopes", email: "bia@example.com", instagram: "@bialopes", username: "bialopes", followers: 15400, engagement: 6.2, status: "ACTIVE", state: "BA", city: "Trancoso", niche: ["Beleza", "Lifestyle"], bio: "Lifestyle tropical e beleza natural. Morando no paraíso de Trancoso.", cacheValue: "R$ 2.000", audienceData: { ageRanges: [{ range: "18-24", percentage: 30 }, { range: "25-34", percentage: 45 }, { range: "35-44", percentage: 18 }, { range: "45+", percentage: 7 }], genderSplit: { male: 18, female: 79, other: 3 }, topCities: [{ city: "Salvador", percentage: 25 }, { city: "São Paulo", percentage: 22 }, { city: "Porto Seguro", percentage: 15 }] }, avgLikes: 1250, avgComments: 89, avgShares: 45, growthRate: 4.6 },
    { id: "6", name: "Carlos Tech", email: "carlos@example.com", instagram: "@carlostech", username: "carlostech", followers: 32000, engagement: 2.9, status: "INACTIVE", state: "PB", city: "João Pessoa", niche: ["Tech"], bio: "Tecnologia acessível para todos. Dicas de produtividade e apps.", cacheValue: "R$ 3.200", audienceData: { ageRanges: [{ range: "18-24", percentage: 35 }, { range: "25-34", percentage: 40 }, { range: "35-44", percentage: 18 }, { range: "45+", percentage: 7 }], genderSplit: { male: 68, female: 29, other: 3 }, topCities: [{ city: "João Pessoa", percentage: 28 }, { city: "Recife", percentage: 18 }, { city: "São Paulo", percentage: 15 }] }, avgLikes: 1280, avgComments: 95, avgShares: 60, growthRate: -1.2 },
    { id: "7", name: "Juliana Mar", email: "ju@example.com", instagram: "@jumar", username: "jumar", followers: 95000, engagement: 3.5, status: "ACTIVE", state: "SE", city: "Aracaju", niche: ["Fitness", "Saúde"], bio: "Personal trainer e influenciadora fitness. Transformando vidas através do exercício.", cacheValue: "R$ 12.000", portfolio: [{ title: "Nike Training NE", image: "", link: "#" }, { title: "Growth Supplements", image: "", link: "#" }], audienceData: { ageRanges: [{ range: "18-24", percentage: 32 }, { range: "25-34", percentage: 40 }, { range: "35-44", percentage: 20 }, { range: "45+", percentage: 8 }], genderSplit: { male: 35, female: 62, other: 3 }, topCities: [{ city: "Aracaju", percentage: 20 }, { city: "São Paulo", percentage: 18 }, { city: "Salvador", percentage: 14 }] }, avgLikes: 5200, avgComments: 320, avgShares: 180, growthRate: 6.3 },
    { id: "8", name: "Pedro Alagoas", email: "pedro@example.com", instagram: "@pedro_al", username: "pedro_al", followers: 18000, engagement: 4.8, status: "NEGOTIATING", state: "AL", city: "Maceió", niche: ["Humor", "Entretenimento"], bio: "Humor nordestino na veia! Sketches e paródias do dia a dia alagoano.", cacheValue: "R$ 2.500", audienceData: { ageRanges: [{ range: "13-17", percentage: 22 }, { range: "18-24", percentage: 42 }, { range: "25-34", percentage: 25 }, { range: "35+", percentage: 11 }], genderSplit: { male: 55, female: 42, other: 3 }, topCities: [{ city: "Maceió", percentage: 35 }, { city: "Recife", percentage: 15 }, { city: "Salvador", percentage: 10 }] }, avgLikes: 1350, avgComments: 210, avgShares: 95, growthRate: 3.8 },
    { id: "9", name: "Luana Norte", email: "luana@example.com", instagram: "@luananorte", username: "luananorte", followers: 52000, engagement: 3.1, status: "ACTIVE", state: "AM", city: "Manaus", niche: ["Natureza", "Lifestyle"], bio: "Mostrando as belezas da Amazônia para o mundo. Sustentabilidade e vida na floresta.", cacheValue: "R$ 6.000", portfolio: [{ title: "Natura Amazônia", image: "", link: "#" }], audienceData: { ageRanges: [{ range: "18-24", percentage: 28 }, { range: "25-34", percentage: 38 }, { range: "35-44", percentage: 22 }, { range: "45+", percentage: 12 }], genderSplit: { male: 40, female: 57, other: 3 }, topCities: [{ city: "Manaus", percentage: 30 }, { city: "São Paulo", percentage: 20 }, { city: "Belém", percentage: 12 }] }, avgLikes: 2800, avgComments: 145, avgShares: 110, growthRate: 2.1 },
    { id: "10", name: "Guto Pará", email: "guto@example.com", instagram: "@gutopara", username: "gutopara", followers: 11000, engagement: 5.2, status: "ACTIVE", state: "PA", city: "Belém", niche: ["Culinária", "Cultura"], bio: "A riqueza culinária paraense em cada post. Tacacá, açaí e muito mais.", cacheValue: "R$ 1.200", audienceData: { ageRanges: [{ range: "18-24", percentage: 25 }, { range: "25-34", percentage: 40 }, { range: "35-44", percentage: 25 }, { range: "45+", percentage: 10 }], genderSplit: { male: 48, female: 49, other: 3 }, topCities: [{ city: "Belém", percentage: 42 }, { city: "Manaus", percentage: 12 }, { city: "São Paulo", percentage: 10 }] }, avgLikes: 720, avgComments: 85, avgShares: 40, growthRate: 4.2 },
    { id: "11", name: "Fernanda Teresina", email: "fepa@example.com", instagram: "@fepa_te", username: "fepa_te", followers: 22000, engagement: 4.0, status: "ACTIVE", state: "PI", city: "Teresina", niche: ["Moda"], bio: "Moda acessível e tendências para o Piauí. Estilo não precisa ser caro.", cacheValue: "R$ 2.200", audienceData: { ageRanges: [{ range: "18-24", percentage: 38 }, { range: "25-34", percentage: 40 }, { range: "35-44", percentage: 15 }, { range: "45+", percentage: 7 }], genderSplit: { male: 15, female: 82, other: 3 }, topCities: [{ city: "Teresina", percentage: 40 }, { city: "São Luís", percentage: 12 }, { city: "Fortaleza", percentage: 10 }] }, avgLikes: 1100, avgComments: 78, avgShares: 35, growthRate: 3.5 },
    { id: "12", name: "Marcos Maranhão", email: "marcos@example.com", instagram: "@marcos_slz", username: "marcos_slz", followers: 35000, engagement: 2.7, status: "BLOCKED", state: "MA", city: "São Luís", niche: ["Lifestyle"], bio: "Lifestyle e cultura maranhense.", cacheValue: "R$ 3.500", audienceData: { ageRanges: [{ range: "18-24", percentage: 30 }, { range: "25-34", percentage: 35 }, { range: "35-44", percentage: 22 }, { range: "45+", percentage: 13 }], genderSplit: { male: 50, female: 47, other: 3 }, topCities: [{ city: "São Luís", percentage: 38 }, { city: "Teresina", percentage: 12 }, { city: "Belém", percentage: 10 }] }, avgLikes: 1400, avgComments: 65, avgShares: 42, growthRate: -0.5 },
    { id: "13", name: "Camila Fortal", email: "camila@example.com", instagram: "@camilafortal", username: "camilafortal", followers: 67000, engagement: 4.3, status: "ACTIVE", state: "CE", city: "Fortaleza", niche: ["Moda", "Beleza"], bio: "Fashion blogger cearense. Do Beira Mar ao mundo, com estilo e autenticidade.", cacheValue: "R$ 8.000", portfolio: [{ title: "Riachuelo NE", image: "", link: "#" }, { title: "Avon Nordeste", image: "", link: "#" }], audienceData: { ageRanges: [{ range: "18-24", percentage: 33 }, { range: "25-34", percentage: 42 }, { range: "35-44", percentage: 18 }, { range: "45+", percentage: 7 }], genderSplit: { male: 15, female: 82, other: 3 }, topCities: [{ city: "Fortaleza", percentage: 35 }, { city: "São Paulo", percentage: 18 }, { city: "Recife", percentage: 10 }] }, avgLikes: 4200, avgComments: 280, avgShares: 150, growthRate: 5.8 },
    { id: "14", name: "Thiago Recife", email: "thiago@example.com", instagram: "@thiagorecife", username: "thiagorecife", followers: 41000, engagement: 3.8, status: "ACTIVE", state: "PE", city: "Recife", niche: ["Música", "Cultura"], bio: "DJ e produtor musical. Resgatando a cultura pernambucana através das batidas.", cacheValue: "R$ 5.000", audienceData: { ageRanges: [{ range: "18-24", percentage: 40 }, { range: "25-34", percentage: 35 }, { range: "35-44", percentage: 18 }, { range: "45+", percentage: 7 }], genderSplit: { male: 58, female: 39, other: 3 }, topCities: [{ city: "Recife", percentage: 30 }, { city: "São Paulo", percentage: 15 }, { city: "Olinda", percentage: 12 }] }, avgLikes: 2400, avgComments: 150, avgShares: 200, growthRate: 3.0 },
    { id: "15", name: "Isabela Santos", email: "isabela@example.com", instagram: "@isabelasantos", username: "isabelasantos", followers: 120000, engagement: 5.1, status: "ACTIVE", state: "BA", city: "Salvador", niche: ["Lifestyle", "Maternidade"], bio: "Mãe, creator e empreendedora. Compartilhando a maternidade real com muito amor.", cacheValue: "R$ 18.000", portfolio: [{ title: "Pampers Brasil", image: "", link: "#" }, { title: "Natura Mamãe", image: "", link: "#" }, { title: "Johnson's Baby", image: "", link: "#" }], audienceData: { ageRanges: [{ range: "18-24", percentage: 15 }, { range: "25-34", percentage: 48 }, { range: "35-44", percentage: 28 }, { range: "45+", percentage: 9 }], genderSplit: { male: 12, female: 85, other: 3 }, topCities: [{ city: "Salvador", percentage: 28 }, { city: "São Paulo", percentage: 20 }, { city: "Rio de Janeiro", percentage: 15 }] }, avgLikes: 8500, avgComments: 520, avgShares: 310, growthRate: 8.2 },
    { id: "16", name: "Lucas Manaus", email: "lucas@example.com", instagram: "@lucasmanaus", username: "lucasmanaus", followers: 29000, engagement: 4.6, status: "ACTIVE", state: "AM", city: "Manaus", niche: ["Aventura", "Viagem"], bio: "Aventureiro e guia turístico digital. Trilhas, rios e a selva amazônica.", cacheValue: "R$ 3.500", audienceData: { ageRanges: [{ range: "18-24", percentage: 30 }, { range: "25-34", percentage: 40 }, { range: "35-44", percentage: 20 }, { range: "45+", percentage: 10 }], genderSplit: { male: 60, female: 37, other: 3 }, topCities: [{ city: "Manaus", percentage: 32 }, { city: "São Paulo", percentage: 18 }, { city: "Belém", percentage: 10 }] }, avgLikes: 1800, avgComments: 120, avgShares: 95, growthRate: 4.8 },
    { id: "17", name: "Priscila Natal", email: "priscila@example.com", instagram: "@priscilanatal", username: "priscilanatal", followers: 19500, engagement: 5.5, status: "ACTIVE", state: "RN", city: "Natal", niche: ["Educação", "Carreira"], bio: "Mentora de carreira para creators. Ajudando influenciadores a se profissionalizarem.", cacheValue: "R$ 2.800", audienceData: { ageRanges: [{ range: "18-24", percentage: 28 }, { range: "25-34", percentage: 45 }, { range: "35-44", percentage: 20 }, { range: "45+", percentage: 7 }], genderSplit: { male: 30, female: 67, other: 3 }, topCities: [{ city: "Natal", percentage: 30 }, { city: "Recife", percentage: 15 }, { city: "João Pessoa", percentage: 12 }] }, avgLikes: 1400, avgComments: 190, avgShares: 85, growthRate: 6.1 },
    { id: "18", name: "Diego Maceió", email: "diego@example.com", instagram: "@diegomaceio", username: "diegomaceio", followers: 38000, engagement: 3.9, status: "ACTIVE", state: "AL", city: "Maceió", niche: ["Gastronomia", "Lifestyle"], bio: "Os melhores sabores de Alagoas. Reviews de restaurantes e receitas regionais.", cacheValue: "R$ 4.000", portfolio: [{ title: "iFood NE", image: "", link: "#" }], audienceData: { ageRanges: [{ range: "18-24", percentage: 22 }, { range: "25-34", percentage: 40 }, { range: "35-44", percentage: 26 }, { range: "45+", percentage: 12 }], genderSplit: { male: 45, female: 52, other: 3 }, topCities: [{ city: "Maceió", percentage: 35 }, { city: "Recife", percentage: 14 }, { city: "Salvador", percentage: 10 }] }, avgLikes: 2200, avgComments: 135, avgShares: 78, growthRate: 3.4 },
    { id: "19", name: "Amanda Belém", email: "amanda@example.com", instagram: "@amandabelem", username: "amandabelem", followers: 14000, engagement: 6.0, status: "ACTIVE", state: "PA", city: "Belém", niche: ["Arte", "Cultura"], bio: "Artista visual e cultural. Grafite, arte urbana e a cultura paraense.", cacheValue: "R$ 1.800", audienceData: { ageRanges: [{ range: "18-24", percentage: 35 }, { range: "25-34", percentage: 38 }, { range: "35-44", percentage: 18 }, { range: "45+", percentage: 9 }], genderSplit: { male: 42, female: 55, other: 3 }, topCities: [{ city: "Belém", percentage: 40 }, { city: "São Paulo", percentage: 15 }, { city: "Manaus", percentage: 10 }] }, avgLikes: 1050, avgComments: 95, avgShares: 60, growthRate: 5.5 },
    { id: "20", name: "Roberto Aracaju", email: "roberto@example.com", instagram: "@robertoaracaju", username: "robertoaracaju", followers: 26000, engagement: 4.2, status: "ACTIVE", state: "SE", city: "Aracaju", niche: ["Esporte", "Fitness"], bio: "Ex-atleta profissional. Motivação e treinos para todos os níveis.", cacheValue: "R$ 3.000", audienceData: { ageRanges: [{ range: "18-24", percentage: 30 }, { range: "25-34", percentage: 38 }, { range: "35-44", percentage: 22 }, { range: "45+", percentage: 10 }], genderSplit: { male: 65, female: 32, other: 3 }, topCities: [{ city: "Aracaju", percentage: 32 }, { city: "Salvador", percentage: 15 }, { city: "São Paulo", percentage: 12 }] }, avgLikes: 1600, avgComments: 110, avgShares: 65, growthRate: 2.8 },
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
    { id: 1, title: "Mídia Kit Irresistível", category: "Profissionalização", duration: "2h 30min", lessons: 12, progress: 100, rating: 4.9, image: "", instructor: "Priscila Natal", description: "Aprenda a criar um mídia kit profissional que vai destacar seu perfil para marcas e agências.", price: "R$ 97,00", enrolled: 1240 },
    { id: 2, title: "Negociação e Precificação", category: "Business", duration: "4h 15min", lessons: 8, progress: 45, rating: 5.0, image: "", instructor: "Isabela Santos", description: "Domine a arte de negociar com marcas e precificar seu trabalho de forma justa e lucrativa.", price: "R$ 147,00", enrolled: 890 },
    { id: 3, title: "Marketing de Influência NE", category: "Regional", duration: "6h 00min", lessons: 24, progress: 0, rating: 4.8, image: "", instructor: "Rafael Duarte", description: "Estratégias específicas para o mercado de influência do Norte e Nordeste brasileiro.", price: "R$ 197,00", enrolled: 650 },
    { id: 4, title: "Edição de Vídeo para Reels", category: "Criatividade", duration: "3h 45min", lessons: 15, progress: 10, rating: 4.7, image: "", instructor: "Thiago Recife", description: "Técnicas profissionais de edição para criar reels que viralizam e engajam.", price: "R$ 127,00", enrolled: 2100 },
    { id: 5, title: "Instagram Analytics na Prática", category: "Business", duration: "3h 00min", lessons: 10, progress: 0, rating: 4.9, image: "", instructor: "Camila Fortal", description: "Entenda suas métricas, identifique tendências e otimize sua estratégia de conteúdo.", price: "R$ 117,00", enrolled: 1580 },
    { id: 6, title: "Fotografia com Celular", category: "Criatividade", duration: "5h 20min", lessons: 18, progress: 0, rating: 4.6, image: "", instructor: "Amanda Belém", description: "Transforme seu celular em uma ferramenta profissional de fotografia para conteúdo.", price: "R$ 87,00", enrolled: 3200 },
    { id: 7, title: "Direito Digital para Creators", category: "Profissionalização", duration: "2h 00min", lessons: 8, progress: 0, rating: 4.8, image: "", instructor: "Priscila Natal", description: "Entenda seus direitos e obrigações como criador de conteúdo digital.", price: "R$ 67,00", enrolled: 720 },
    { id: 8, title: "Como Viralizar no TikTok", category: "Criatividade", duration: "4h 30min", lessons: 16, progress: 0, rating: 4.9, image: "", instructor: "Pedro Alagoas", description: "Estratégias e técnicas para criar conteúdo viral no TikTok, do roteiro à publicação.", price: "R$ 157,00", enrolled: 4500 },
]

const INITIAL_POSTS: Post[] = [
    { id: 1, user: { name: "Beatriz Lopes", handle: "@bialopes", avatar: "" }, content: "Alguém do Ceará com experiência em campanhas de skincare? Tenho uma marca interessada em fazer um collab focado em peles resistentes ao sol do NE! ☀️", likes: 24, comments: 12, shares: 5, time: "2h atrás" },
    { id: 2, user: { name: "Rafael Silva", handle: "@rafatech", avatar: "" }, content: "Acabei de fechar minha 10ª campanha através da Somos Preta! O curso de precificação me ajudou demais a valorizar meu trabalho. Valeu equipe! 🚀", likes: 156, comments: 8, shares: 32, time: "5h atrás" },
    { id: 3, user: { name: "Juliana Mar", handle: "@jumar", avatar: "" }, content: "Gente, alguém sabe como declarar recebimentos de permuta? 😅 #duvida #creators", likes: 42, comments: 20, shares: 8, time: "8h atrás" },
    { id: 4, user: { name: "Camila Fortal", handle: "@camilafortal", avatar: "" }, content: "Novo post no blog sobre como analisar suas métricas do Instagram! Link na bio. Spoiler: seguidores não são tudo 📊 #analytics #creators", likes: 89, comments: 15, shares: 22, time: "12h atrás" },
    { id: 5, user: { name: "Isabela Santos", handle: "@isabelasantos", avatar: "" }, content: "Maternidade e criação de conteúdo: consegui equilibrar os dois e meu engajamento nunca foi tão alto! Quem mais aqui é mãe e creator? 💜", likes: 234, comments: 45, shares: 18, time: "1d atrás" },
    { id: 6, user: { name: "Thiago Recife", handle: "@thiagorecife", avatar: "" }, content: "Workshop de edição de vídeo confirmado para sábado! Vagas limitadas. Vamos criar reels profissionais juntos 🎬 #workshop #reels", likes: 67, comments: 28, shares: 15, time: "1d atrás" },
    { id: 7, user: { name: "Diego Maceió", handle: "@diegomaceio", avatar: "" }, content: "Review do novo restaurante japonês em Maceió saindo amanhã! Vocês não estão preparados para esse omakase nordestino 🍣", likes: 112, comments: 33, shares: 10, time: "1d atrás" },
    { id: 8, user: { name: "Amanda Belém", handle: "@amandabelem", avatar: "" }, content: "Meu mural no Ver-o-Peso ficou pronto! Arte urbana contando a história do mercado mais famoso de Belém 🎨 Quem quiser ver, tá lá!", likes: 198, comments: 42, shares: 55, time: "2d atrás" },
    { id: 9, user: { name: "Lucas Manaus", handle: "@lucasmanaus", avatar: "" }, content: "Trilha incrível no Parque Nacional de Anavilhanas! 3 dias na floresta, sem sinal de celular. Conteúdo que valeu cada segundo offline 🌿", likes: 305, comments: 52, shares: 40, time: "2d atrás" },
    { id: 10, user: { name: "Priscila Natal", handle: "@priscilanatal", avatar: "" }, content: "Dica de ouro: seu mídia kit precisa ter no máximo 5 páginas. Marcas não têm tempo para ler 20 slides. Qualidade > quantidade! 📋 #dicadecreator", likes: 178, comments: 35, shares: 62, time: "3d atrás" },
    { id: 11, user: { name: "Ana Silva", handle: "@anasilva", avatar: "" }, content: "Salvador no verão é outro nível de conteúdo! Cada esquina é um cenário. Quem mais ama produzir conteúdo no verão baiano? 🌞", likes: 95, comments: 18, shares: 7, time: "3d atrás" },
    { id: 12, user: { name: "Roberto Aracaju", handle: "@robertoaracaju", avatar: "" }, content: "Desafio de 30 dias de treino em casa começou! Quem topa? Vou postar treino novo todo dia. Bora! 💪 #desafio30dias #fitness", likes: 145, comments: 68, shares: 25, time: "3d atrás" },
]

const INITIAL_MIDIA_KIT_USERS: MidiaKitUser[] = []

if (!globalForMock.mockInfluencers) globalForMock.mockInfluencers = [...INITIAL_INFLUENCERS]
if (!globalForMock.mockCampaigns) globalForMock.mockCampaigns = [...INITIAL_CAMPAIGNS]
if (!globalForMock.mockContracts) globalForMock.mockContracts = [...INITIAL_CONTRACTS]
if (!globalForMock.mockMessages) globalForMock.mockMessages = [...INITIAL_MESSAGES]
if (!globalForMock.mockCourses) globalForMock.mockCourses = [...INITIAL_COURSES]
if (!globalForMock.mockPosts) globalForMock.mockPosts = [...INITIAL_POSTS]
if (!globalForMock.mockMidiaKitUsers) globalForMock.mockMidiaKitUsers = [...INITIAL_MIDIA_KIT_USERS]

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
    },
    midiaKitUser: {
        create: async ({ data }: { data: Omit<MidiaKitUser, "id" | "createdAt"> }) => {
            const newUser: MidiaKitUser = { id: Math.random().toString(36).substring(7), createdAt: new Date().toISOString(), ...data }
            globalForMock.mockMidiaKitUsers.unshift(newUser)
            return newUser
        },
        findByEmail: async (email: string) => {
            await new Promise(r => setTimeout(r, 100))
            return globalForMock.mockMidiaKitUsers.find(u => u.email === email) || null
        },
    }
}
