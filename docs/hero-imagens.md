# Imagens da landing — Somos Preta

Guia de assets de foto da landing page: as 4 fotos da colagem da hero e os 4 painéis da
segunda dobra ("Quem somos"). Contém os prompts prontos para ferramentas de geração de
imagem (Midjourney, Adobe Firefly, DALL-E, Ideogram) e as alternativas de banco de imagem,
caso o time prefira licenciar.

## Como usar

1. Gere ou licencie cada uma das 8 fotos seguindo as seções "Hero" e "Quem somos (2ª dobra)".
2. Exporte em **WebP** (preferido) ou **JPG de alta qualidade** (qualidade 82-88).
   Largura útil: 1600px para os retratos, 2000px para as paisagens. Não exporte PNG.
3. Salve na pasta do slot — `public/hero/` para a hero, `public/quem-somos/` para a segunda
   dobra — usando o **nome exato do slot**, substituindo o placeholder `.svg`.
   Exemplo: o placeholder `public/hero/criadora-principal.svg` vira `public/hero/criadora-principal.jpg`.
4. Troque a extensão no array de slots do componente correspondente: `SLOTS` em
   `src/components/public/hero.tsx` e `PAINEIS` em `src/components/public/quem-somos.tsx`
   (`.svg` → `.jpg` ou `.webp`). O nome do arquivo continua o mesmo; só a extensão muda.
5. Confira o peso final antes de commitar.

**Fundo da página:** hero e segunda dobra são montadas sobre o off-white `#FAF7F2`. Avalie
cada foto sobre esse fundo — não sobre branco puro nem sobre o cinza do editor de imagem. É
nele que a borda da foto vai encostar, e é ele que denuncia foto escura demais.

**Peso alvo:** menos de 250KB por foto; a foto herói (`criadora-principal`) pode ir até 400KB.
Se passar disso, reduza a qualidade do JPG antes de reduzir a resolução — o recorte da colagem
esconde parte da imagem e perdoa compressão, mas não perdoa foto pequena esticada.

## Direção de arte comum

Tudo que as 8 fotos precisam ter em comum para a landing ler como uma série só, e não como
oito imagens avulsas coladas lado a lado:

- **Luz dourada de fim de tarde (golden hour).** Sombra quente, luz lateral ou contraluz suave.
  Nada de flash duro, nada de luz de estúdio branca, nada de meio-dia estourado.
- **Exposição clara e arejada, com as altas luzes preservadas.** Contraste médio, nunca dramático:
  as sombras abrem, o preto não fecha. Nada de imagem densa, pesada ou "moody" — a página vive
  sobre o off-white `#FAF7F2` e uma foto escura vira mancha no meio da página clara.
- **Fundo naturalmente luminoso**: céu aberto, parede caiada, areia, duna, água clara refletindo
  o sol. É o oposto da orientação antiga de escurecer as bordas: aqui a foto precisa se dissolver
  no claro, não no escuro. Nada de vinheta marcada.
- **Paleta terracota `#E07A5F`, coral `#F26D4F`, areia `#E8DDD1` e verde oliva `#2F4F3E`** nos
  elementos da cena — roupa, terra, parede, vegetação, madeira. Segue valendo: nada de azul
  saturado, verde neon ou qualquer cor fria dominante.
- **Fotografia documental real, não publicidade genérica.** Pessoas negras brasileiras do Norte
  e Nordeste, expressão natural e digna, gesto de quem estava ali antes da câmera chegar.
  Nunca sorriso corporativo, nunca pose de banco de imagem, nunca braços cruzados olhando pro nada.
- **Grão sutil de filme** e **profundidade de campo rasa** nos retratos (fundo desfocado,
  rosto nítido). Nas paisagens, profundidade ampla.

## Paleta da marca

Referência de cor para quem for gerar, tratar ou licenciar as fotos.

| Nome | Hex | Uso |
| --- | --- | --- |
| Off-white | `#FAF7F2` | fundo principal do site — é sobre ele que a colagem assenta |
| Areia Clara | `#E8DDD1` | superfícies e bordas suaves |
| Bege | `#D4C4B6` | superfícies mais marcadas |
| Terracota Suave | `#E07A5F` | botão primário |
| Verde Oliva | `#2F4F3E` | cor secundária |
| Carvão | `#1F1F1F` | texto |
| Coral | `#F26D4F` | acento, traços, estado ativo |
| Branco | `#FFFFFF` | cards |

Tagline: "Ideias que movem pessoas."

## Hero

Quatro fotos, na ordem do array `SLOTS` de `src/components/public/hero.tsx`. Os recortes de
papel rasgado cortam de 2% a 6% de cada borda: deixe respiro em volta do rosto e não encoste
elemento importante na margem.

### 1. criador-chapeu

- **Arquivo**: `public/hero/criador-chapeu.jpg`
- **Proporção**: 3:4 retrato — `--ar 3:4`
- **Papel na colagem**: retrato lateral, coluna da esquerda, levemente inclinado. Contrapeso
  masculino à foto herói. Comunica criador de conteúdo real, não modelo — alguém no meio do
  próprio dia.

**Prompt (EN)**

> Documentary portrait of an adult Black Brazilian man wearing a woven straw hat with a
> slightly frayed brim, white linen shirt, smiling openly and unposed, warm side light from the
> low late-afternoon sun spilling under the hat brim onto his face, blurred sunlit whitewashed
> wall and palm fronds behind him in bright open air, shallow depth of field, airy high-key
> exposure with preserved highlights and open shadows, medium contrast, terracotta, sand and
> warm beige palette, subtle 35mm film grain, natural skin texture, no retouching, no studio
> lighting, no vignette, editorial photojournalism --ar 3:4 --style raw --v 7

**Prompt (PT)**

> Retrato documental de um homem negro brasileiro adulto de chapéu de palha trançada com a aba
> levemente desfiada, camisa branca de linho, sorrindo aberto e sem pose, luz lateral quente do
> sol baixo do fim de tarde entrando por baixo da aba e iluminando o rosto, parede caiada
> iluminada e folhas de palmeira desfocadas ao fundo, ao ar livre e com muita luz, profundidade
> de campo rasa, exposição clara e arejada com altas luzes preservadas e sombras abertas,
> contraste médio, paleta terracota, areia e bege quente, grão sutil de filme 35mm, textura de
> pele natural sem retoque, sem luz de estúdio, sem vinheta, fotojornalismo editorial.

**Busca em banco de imagens**

- `black man straw hat smiling golden hour portrait bright background`
- `brazilian man straw hat linen shirt sunset whitewashed wall`
- `afro brazilian creator straw hat portrait warm backlight documentary airy`

---

### 2. criadora-principal

- **Arquivo**: `public/hero/criadora-principal.jpg`
- **Proporção**: 3:4 retrato — `--ar 3:4`
- **Papel na colagem**: **a foto herói.** Bloco maior, no centro, primeiro ponto de leitura da
  página, ao lado do título. Carrega sozinha a promessa da marca: criadora negra do
  Norte/Nordeste, presença, confiança, autoria. Se só uma foto for feita com orçamento e
  cuidado, é esta.

**Prompt (EN)**

> Close editorial portrait of a young Black Brazilian woman with box braids, large gold
> fan-shaped statement earrings, wearing a terracotta top, skin luminous under warm golden hour
> light, confident self-possessed gaze directed slightly above the camera, chin lifted, soft
> warm rim light along her cheek and braids, softly blurred bright background of sand-toned wall
> and open sky, very shallow depth of field, airy high-key exposure with preserved highlights
> and open shadows, medium contrast, natural skin texture and visible pores, subtle film grain,
> terracotta, coral and sand palette, documentary fashion photography, no studio flash, no heavy
> retouching, no vignette --ar 3:4 --style raw --v 7

**Prompt (PT)**

> Retrato editorial aproximado de uma jovem mulher negra brasileira com tranças box braids,
> brincos grandes dourados em forma de leque, blusa terracota, pele iluminada pela luz dourada
> do fim de tarde, olhar confiante e seguro dirigido levemente acima da câmera, queixo erguido,
> luz quente de contorno na bochecha e nas tranças, fundo claro suavemente desfocado de parede
> cor de areia e céu aberto, profundidade de campo muito rasa, exposição clara e arejada com
> altas luzes preservadas e sombras abertas, contraste médio, textura de pele natural com poros
> visíveis, grão sutil de filme, paleta terracota, coral e areia, fotografia de moda documental,
> sem flash de estúdio, sem retoque pesado, sem vinheta.

**Busca em banco de imagens**

- `black woman box braids gold fan earrings golden hour portrait`
- `afro brazilian woman confident portrait light background warm sun`
- `young black woman braids terracotta editorial portrait bright airy`

---

### 3. criadora-cacheada

- **Arquivo**: `public/hero/criadora-cacheada.jpg`
- **Proporção**: 6:7 retrato curto — `--ar 6:7`
- **Papel na colagem**: bloco quase quadrado, à direita e mais abaixo, quebra o ritmo dos dois
  retratos verticais. Traz olhar direto e cidade — centro histórico nordestino — para a série
  não virar só natureza e pose de perfil.

**Prompt (EN)**

> Documentary portrait of a Black Brazilian woman with voluminous natural curly hair catching
> the late afternoon sun, looking straight into the camera with a warm open expression, blurred
> sunlit pale ochre and whitewashed facades of a northeastern Brazilian historic town square
> behind her, bright warm light on pale cobblestones, shallow depth of field, golden hour side
> light, airy high-key exposure with preserved highlights and open soft shadows, medium
> contrast, terracotta, ochre and sand palette, subtle film grain, natural skin texture, unposed
> street photography feel, no vignette --ar 6:7 --style raw --v 7

**Prompt (PT)**

> Retrato documental de uma mulher negra brasileira de cabelo cacheado volumoso e natural
> pegando o sol do fim da tarde, olhando direto para a câmera com expressão aberta e acolhedora,
> fachadas caiadas e em ocre claro de praça de centro histórico do Nordeste desfocadas e
> iluminadas ao fundo, luz quente e clara sobre o calçamento de pedra, profundidade de campo
> rasa, luz lateral dourada, exposição clara e arejada com altas luzes preservadas e sombras
> suaves e abertas, contraste médio, paleta terracota, ocre e areia, grão sutil de filme,
> textura de pele natural, estética de fotografia de rua sem pose, sem vinheta.

**Busca em banco de imagens**

- `black woman curly hair looking at camera historic town brazil bright`
- `brazilian woman natural curls historic square golden hour airy light`
- `afro brazilian woman portrait ochre facade bokeh warm light`

---

### 4. paisagem-litoral

- **Arquivo**: `public/hero/paisagem-litoral.jpg`
- **Proporção**: 10:7 landscape — `--ar 10:7`
- **Papel na colagem**: faixa horizontal na base, entre os retratos. Estabelece território —
  litoral nordestino, falésia, mar — sem pessoa nenhuma. É o que diz "essa agência é de lá"
  antes de qualquer texto, e amarra a paleta terracota/coral da cena com o `#F26D4F` da marca.

**Prompt (EN)**

> Documentary landscape photograph of northeastern Brazilian coastal cliffs at late golden hour,
> layered terracotta and ochre sandstone cliffs dropping to a wide bright beach, calm turquoise-
> to-pale-green sea with gentle foam lines catching low warm sunlight, damp sand mirroring the
> luminous sky, sparse dry coastal vegetation on the cliff top, wide open bright sky in a soft
> sand to coral gradient with thin high clouds, warm haze on the horizon, deep focus, no people,
> no buildings, terracotta, coral, sand and olive green palette, airy high-key exposure with
> preserved highlights and open shadows, medium contrast, subtle film grain, no vignette, shot on
> 35mm film, Kodak Portra tones, photojournalistic realism, no text, no logos
> --ar 10:7 --style raw --v 7

**Prompt (PT)**

> Fotografia documental de paisagem das falésias do litoral nordestino brasileiro no fim da
> tarde, camadas de arenito em terracota e ocre descendo para uma praia larga e clara, mar calmo
> em verde-água claro com linhas suaves de espuma recebendo a luz quente do sol baixo, areia
> úmida espelhando o céu luminoso, vegetação costeira seca e esparsa no alto da falésia, céu
> aberto e claro em degradê suave de areia a coral com nuvens altas finas, névoa quente no
> horizonte, foco profundo, sem pessoas, sem construções, paleta terracota, coral, areia e verde
> oliva, exposição clara e arejada com altas luzes preservadas e sombras abertas, contraste
> médio, grão sutil de filme, sem vinheta, estética de filme 35mm, realismo fotojornalístico,
> sem texto, sem logotipos.

**Busca em banco de imagens**

- `northeast brazil coastal cliffs golden hour bright sky no people`
- `falesias praia nordeste brasil sunset red sandstone sea`
- `pipa canoa quebrada cliffs beach warm light wide landscape airy`

## Quem somos (2ª dobra)

Quatro painéis em accordion, na ordem do array `PAINEIS` de
`src/components/public/quem-somos.tsx`. Todos em **retrato 3:4**. A pasta de destino é
`public/quem-somos/`.

**Direção específica desta fileira:** os quatro painéis aparecem lado a lado, na mesma altura,
e um deles cresce quando recebe o cursor ou o foco. Por isso precisam ter **enquadramento e
distância focal parecidos** — mesma altura de linha do horizonte, mesma escala de assunto no
quadro, mesma sensação de lente (algo entre 50mm e 85mm nos retratos) — para a fileira ler como
uma série fotografada no mesmo dia, e não como quatro imagens de origens diferentes. Cada painel
também é cortado em cantos arredondados e sofre um leve giro: mantenha assunto e horizonte longe
das bordas.

### 1. talento

- **Arquivo**: `public/quem-somos/talento.jpg`
- **Proporção**: 3:4 retrato — `--ar 3:4`
- **Papel na fileira**: abre a série com pessoa. É o painel de "Talento": criador de conteúdo
  real, sorriso genuíno, ao ar livre.

**Prompt (EN)**

> Documentary portrait of an adult Black Brazilian man with long natural dreadlocks, wearing a
> white linen shirt, smiling genuinely outdoors, warm side light from the low late-afternoon sun
> rimming his face and locs, blurred sunlit whitewashed wall and palm fronds behind him in
> bright open air, waist-up framing on a short telephoto lens, shallow depth of field, airy
> high-key exposure with preserved highlights and open shadows, medium contrast, terracotta,
> sand and warm beige palette, subtle 35mm film grain, natural skin texture, no retouching, no
> studio lighting, no vignette, editorial photojournalism --ar 3:4 --style raw --v 7

**Prompt (PT)**

> Retrato documental de um homem negro brasileiro adulto com dreadlocks longos naturais, camisa
> branca de linho, sorrindo de forma genuína ao ar livre, luz lateral quente do sol baixo do fim
> de tarde contornando o rosto e os dreads, parede caiada iluminada e folhas de palmeira
> desfocadas ao fundo, ao ar livre e com muita luz, enquadramento da cintura para cima com lente
> teleobjetiva curta, profundidade de campo rasa, exposição clara e arejada com altas luzes
> preservadas e sombras abertas, contraste médio, paleta terracota, areia e bege quente, grão
> sutil de filme 35mm, textura de pele natural sem retoque, sem luz de estúdio, sem vinheta,
> fotojornalismo editorial.

**Busca em banco de imagens**

- `black man dreadlocks smiling golden hour portrait bright background vertical`
- `brazilian man locs laughing outdoors whitewashed wall warm light`
- `afro brazilian creator portrait locs documentary airy high key`

---

### 2. territorio

- **Arquivo**: `public/quem-somos/territorio.jpg`
- **Proporção**: 3:4 retrato — `--ar 3:4`
- **Papel na fileira**: o único painel sem pessoa. Ancora o discurso no lugar: patrimônio à
  beira-mar, pedra antiga e água clara. Como está em retrato, componha na vertical — muralha
  em primeiro plano, mar e céu subindo no quadro.

**Prompt (EN)**

> Documentary photograph of a historic colonial seaside fort on the northeastern Brazilian
> coast at late golden hour, weathered pale stone ramparts in the foreground warmed by low
> sunlight, calm pale green sea and bright open horizon beyond the wall, vertical composition
> with the rampart low and the luminous sky filling the upper frame, thin high clouds, sparse
> dry coastal grass, deep focus, no people, terracotta, sand and olive green palette, airy
> high-key exposure with preserved highlights and open shadows, medium contrast, subtle film
> grain, no vignette, large format documentary architecture photography, no text, no logos
> --ar 3:4 --style raw --v 7

**Prompt (PT)**

> Fotografia documental de um forte colonial histórico à beira-mar no litoral nordestino
> brasileiro no fim da tarde, muralhas de pedra clara desgastada em primeiro plano aquecidas
> pelo sol baixo, mar calmo em verde claro e horizonte aberto e luminoso além do muro,
> composição vertical com a muralha embaixo e o céu luminoso ocupando a parte de cima do quadro,
> nuvens altas finas, capim costeiro seco e esparso, foco profundo, sem pessoas, paleta
> terracota, areia e verde oliva, exposição clara e arejada com altas luzes preservadas e
> sombras abertas, contraste médio, grão sutil de filme, sem vinheta, fotografia documental de
> arquitetura em grande formato, sem texto, sem logotipos.

**Busca em banco de imagens**

- `historic seaside fort northeast brazil golden hour vertical`
- `forte colonial beira mar nordeste brasil luz dourada`
- `fortaleza dos reis magos colonial fort sea bright sky documentary`

---

### 3. cultura

- **Arquivo**: `public/quem-somos/cultura.jpg`
- **Proporção**: 3:4 retrato — `--ar 3:4`
- **Papel na fileira**: o painel de alegria. Riso espontâneo no meio do movimento — é o que
  impede a fileira de virar quatro retratos sérios em fila.

**Prompt (EN)**

> Documentary portrait of a Black Brazilian woman laughing genuinely, voluminous natural curly
> hair catching the late afternoon sun, candid mid-laugh expression with eyes crinkled, blurred
> sunlit pale ochre and whitewashed facades of a northeastern Brazilian historic town square
> behind her, bright warm light on pale cobblestones, waist-up framing on a short telephoto
> lens, shallow depth of field, golden hour side light, airy high-key exposure with preserved
> highlights and open soft shadows, medium contrast, terracotta, ochre and sand palette, subtle
> film grain, natural skin texture, unposed street photography feel, no vignette
> --ar 3:4 --style raw --v 7

**Prompt (PT)**

> Retrato documental de uma mulher negra brasileira rindo de forma genuína, cabelo cacheado
> volumoso e natural pegando o sol do fim da tarde, expressão espontânea no meio do riso com os
> olhos apertados, fachadas caiadas e em ocre claro de praça de centro histórico do Nordeste
> desfocadas e iluminadas ao fundo, luz quente e clara sobre o calçamento de pedra,
> enquadramento da cintura para cima com lente teleobjetiva curta, profundidade de campo rasa,
> luz lateral dourada, exposição clara e arejada com altas luzes preservadas e sombras suaves e
> abertas, contraste médio, paleta terracota, ocre e areia, grão sutil de filme, textura de pele
> natural, estética de fotografia de rua sem pose, sem vinheta.

**Busca em banco de imagens**

- `black woman laughing curly hair historic town brazil bright vertical`
- `brazilian woman smiling historic square golden hour airy light`
- `afro brazilian woman laughing natural curls warm sun candid`

---

### 4. oportunidades

- **Arquivo**: `public/quem-somos/oportunidades.jpg`
- **Proporção**: 3:4 retrato — `--ar 3:4`
- **Papel na fileira**: fecha a série levando a pessoa para fora da cidade — criador de chapéu
  numa paisagem de campo, horizonte aberto atrás. Pessoa e território no mesmo quadro, que é
  exatamente o argumento de "Oportunidades".

**Prompt (EN)**

> Documentary portrait of an adult Black Brazilian man wearing a woven straw hat, simple
> earth-toned shirt, standing in an open rural landscape at late golden hour, calm confident
> half-smile, warm low sunlight across dry olive-green scrub and pale sandy soil behind him,
> distant open horizon and luminous sand-to-coral sky in the upper frame, waist-up framing on a
> short telephoto lens, shallow depth of field with the field softly blurred, airy high-key
> exposure with preserved highlights and open shadows, medium contrast, terracotta, coral, sand
> and olive green palette, subtle 35mm film grain, natural skin texture, no retouching, no
> studio lighting, no vignette, editorial photojournalism --ar 3:4 --style raw --v 7

**Prompt (PT)**

> Retrato documental de um homem negro brasileiro adulto de chapéu de palha trançada, camisa
> simples em tom de terra, de pé numa paisagem rural aberta no fim da tarde, meio sorriso calmo
> e confiante, luz baixa e quente atravessando a vegetação seca em verde oliva e o solo arenoso
> claro atrás dele, horizonte aberto ao longe e céu luminoso em degradê de areia a coral na
> parte de cima do quadro, enquadramento da cintura para cima com lente teleobjetiva curta,
> profundidade de campo rasa com o campo suavemente desfocado, exposição clara e arejada com
> altas luzes preservadas e sombras abertas, contraste médio, paleta terracota, coral, areia e
> verde oliva, grão sutil de filme 35mm, textura de pele natural sem retoque, sem luz de
> estúdio, sem vinheta, fotojornalismo editorial.

**Busca em banco de imagens**

- `black man straw hat rural landscape golden hour portrait vertical`
- `brazilian farmer straw hat field sunset warm light documentary`
- `afro brazilian man hat countryside open horizon airy high key`

## Nota sobre pessoas geradas por IA

Seis das oito fotos são de pessoas. Numa página que fala de representatividade e de criadores
reais do Norte e Nordeste, usar rostos gerados por IA é uma escolha editorial com risco de
mensagem: se alguém identificar, a contradição vale mais que a foto. A recomendação prática é
usar **fotos reais de criadores da própria base**, com autorização de uso de imagem assinada
(vale crédito no rodapé e vira conteúdo), ou **banco de imagem licenciado com pessoas reais**.
Deixe a geração por IA para as duas imagens sem pessoa — `paisagem-litoral` e `territorio` —
onde o risco é zero. Se a IA for usada em retrato por falta de prazo, trate como placeholder
com data de troca marcada, não como arte final.

## Checklist de substituição

Hero — extensão trocada no array `SLOTS` de `src/components/public/hero.tsx`:

- [ ] `public/hero/criador-chapeu` — gerado/licenciado, exportado, extensão trocada no `hero.tsx`
- [ ] `public/hero/criadora-principal` — foto herói, menos de 400KB, extensão trocada no `hero.tsx`
- [ ] `public/hero/criadora-cacheada` — gerado/licenciado, exportado, extensão trocada no `hero.tsx`
- [ ] `public/hero/paisagem-litoral` — gerado/licenciado, exportado, extensão trocada no `hero.tsx`

Quem somos — extensão trocada no array `PAINEIS` de `src/components/public/quem-somos.tsx`:

- [ ] `public/quem-somos/talento` — gerado/licenciado, exportado, extensão trocada no `quem-somos.tsx`
- [ ] `public/quem-somos/territorio` — gerado/licenciado, exportado, extensão trocada no `quem-somos.tsx`
- [ ] `public/quem-somos/cultura` — gerado/licenciado, exportado, extensão trocada no `quem-somos.tsx`
- [ ] `public/quem-somos/oportunidades` — gerado/licenciado, exportado, extensão trocada no `quem-somos.tsx`
