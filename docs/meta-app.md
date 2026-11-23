# App da Meta — Instagram conectado pela criadora

Este guia liga a plataforma à Meta para que **a própria criadora** conecte o Instagram dela com login. A partir daí, o Mídia Kit e o painel interno passam a mostrar os números oficiais da conta.

> **Não existe mais consulta por @.** Ler dados do perfil de terceiros sem autorização é contra as regras da Meta. Por isso, o verificador de engajamento do site, a busca por @ no painel e a conexão por @ foram removidos. Só o login dá acesso a alcance, visualizações e audiência.

> As telas do painel da Meta mudam de nome com frequência. Se um botão não estiver onde o guia diz, procure pelo nome da permissão ou do produto.

---

## Qual produto da Meta

**Instagram API with Unified Login.** Apps criados hoje **não podem** usar o "Instagram API with Instagram Login" antigo: a Meta só mantém os apps que já existiam. O fluxo novo:

1. A criadora clica em **Conectar com Instagram**, na área dela (Perfil, Métricas ou na etapa Redes do editor).
2. Ela vai para o diálogo de login da Meta (`facebook.com/dialog/oauth` com um `config_id`), entra com o Instagram ou o Facebook, escolhe a conta profissional e autoriza.
3. A Meta devolve um código para `/api/instagram/callback`, e o servidor troca esse código por um **token de usuário do sistema de integração**, que **não vence** por padrão.
4. O token é guardado **cifrado** (AES-256-GCM) na tabela `somos_preta_instagram_conexoes`, que não tem nenhuma política de leitura: só o servidor acessa.
5. A primeira coleta roda na hora. Depois disso, uma vez por dia (rotina) ou quando alguém aperta "Atualizar".

Todas as chamadas vão para `graph.facebook.com` com as permissões `instagram_basic` e `instagram_manage_insights`.

## O que é coletado

| Grupo | Dados |
|---|---|
| Perfil | seguidores, seguindo, nº de publicações, nome, bio, foto |
| Publicações (últimas 24) | curtidas, comentários, **alcance**, **visualizações**, **salvamentos**, **compartilhamentos**, interações e **tempo médio assistido** (Reels) |
| Conta, últimos 30 dias | alcance (total e por dia), visualizações, contas engajadas, interações, curtidas, comentários, compartilhamentos, salvamentos, respostas, **cliques no link**, **novos seguidores e quem deixou de seguir**, **% do alcance vindo de não seguidores** |
| Audiência | **gênero, faixa etária, cidades e países** de quem segue e de quem interagiu no mês (o Instagram só libera com 100+ seguidores) |
| Stories | os que estiverem no ar no momento da coleta: alcance, visualizações, respostas e compartilhamentos |

A partir disso, a plataforma calcula:

- engajamento sobre seguidores (a régua do mercado);
- engajamento sobre alcance;
- médias por post;
- frequência de publicação;
- mistura de formatos;
- crescimento em 30 dias.

O código está em `src/lib/instagram/graph.ts` e `calculo.ts`.

**Onde fica salvo:**

- `somos_preta_instagram_coletas`: o histórico, com uma linha por coleta (inclui insights, audiência, stories e todas as publicações);
- `somos_preta_midia_kits.metricas_instagram`: o retrato atual, que a vitrine desenha;
- `somos_preta_influencers`: seguidores, engajamento, médias, `views_medias` e `audience_data`, que a lista do painel interno mostra.

---

## Passo a passo

### 1. Pré-requisitos

- [ ] Existe um **portfólio empresarial** da Somos Preta em [business.facebook.com](https://business.facebook.com). O app precisa pertencer a um portfólio.
- [ ] A **verificação da empresa** está feita nesse portfólio. Ela é necessária para publicar o app e pedir acesso avançado.

### 2. Criar o app

1. Em [developers.facebook.com/apps](https://developers.facebook.com/apps), crie um app do tipo **Empresa / Business** ligado ao portfólio da Somos Preta.
2. Adicione o produto **Instagram** e siga a configuração do **Unified Login**.
3. Em **Configurações do app → Básico**, anote o **ID do app** e a **Chave secreta do app**.
4. Ative **"Exigir segredo do app"** (Require App Secret). O servidor já assina toda chamada com `appsecret_proof`.

### 3. Criar a configuração do login (`config_id`)

No produto de login do app (Facebook Login for Business → **Configurações**), crie uma configuração:

- **Tipo de token:** usuário do sistema (*System-user access token*).
- **Validade:** sem expiração. É o padrão; confira na prévia.
- **Ativos:** contas do Instagram.
- **Permissões:** `instagram_basic` e `instagram_manage_insights`.
  - A configuração padrão da Meta também inclui `instagram_manage_messages`. Se o painel deixar, **tire** essa permissão: o app não lê mensagens, e ela exigiria análise extra.

Anote o **ID da configuração**: é o `INSTAGRAM_LOGIN_CONFIG_ID`.

### 4. URLs para colar no painel da Meta

O cartão **Configurações → Integração Instagram**, no painel interno, mostra estas três URLs com botão de copiar:

| Onde no painel da Meta | URL |
|---|---|
| URIs de redirecionamento do OAuth válidos | `https://www.somospreta.com/api/instagram/callback` |
| URL de retorno de chamada para cancelar autorização (Deauthorize) | `https://www.somospreta.com/api/instagram/desautorizar` |
| URL de solicitação de exclusão de dados (Data deletion) | `https://www.somospreta.com/api/instagram/exclusao-de-dados` |

Para testar localmente, adicione também `http://localhost:3000/api/instagram/callback`.

### 5. Variáveis de ambiente

Coloque na Vercel (Project → Settings → Environment Variables) e no `.env.local`:

| Variável | Obrigatória | O que é |
|---|---|---|
| `META_APP_ID` | sim | ID do app (passo 2) |
| `META_APP_SECRET` | sim | chave secreta do app (passo 2) |
| `INSTAGRAM_LOGIN_CONFIG_ID` | sim | ID da configuração (passo 3) |
| `INSTAGRAM_TOKEN_SECRET` | sim | chave do cofre dos tokens. Texto aleatório longo (`openssl rand -hex 32`). **Se trocar, todas as criadoras precisam conectar de novo.** |
| `CRON_SECRET` | sim | protege a rotina diária (`openssl rand -hex 32`) |
| `INSTAGRAM_REDIRECT_URI` | não | força a URL de retorno. Sem ela, vale `<domínio>/api/instagram/callback` |
| `META_GRAPH_VERSION` | não | padrão `v27.0` |

Nenhuma delas pode ter o prefixo `NEXT_PUBLIC_`.

### 6. Banco

Aplique, **nesta ordem**, no SQL Editor do Supabase:

1. `supabase/migrations/0024_instagram_meta_e_aparencia.sql`: personalização do kit, histórico de coletas e a trava que impede a criadora de forjar métrica.
2. `supabase/migrations/0025_instagram_login_criadora.sql`: tabela de conexões (token cifrado) e as colunas novas do histórico.

### 7. Testar antes da Análise do App

Enquanto o app está em **modo de desenvolvimento**, só contas com função no app conseguem conectar:

1. Em **Funções do app → Testadores do Instagram**, convide a conta (até 50).
2. A pessoa aceita o convite no Instagram web (Configurações → Apps e sites).

Depois, com uma criadora de teste:

1. Na área do criador: **Métricas → Conectar com Instagram**.
2. Ao voltar, a tela mostra "Instagram conectado" e os números.
3. No painel interno, a ficha dessa criadora → aba **Instagram** → **Atualizar agora**.

**Confira na primeira conexão real.** Alguns pontos a documentação do Unified Login não deixa explícitos, e o código já tolera as duas variações em cada um:

- o formato da resposta da troca do código;
- se demografia e alcance diário vêm com esse tipo de token;
- se a Meta chama a URL de desautorização no Unified Login. Se não chamar, a próxima coleta recebe "token inválido", marca a conexão como revogada e a criadora vê o pedido de reconexão.

Erros aparecem nos logs da Vercel com o prefixo `[instagram]`.

### 8. Análise do App (para abrir a todas as criadoras)

Para quem não tem função no app conectar, é preciso:

- **Acesso avançado** em `instagram_basic` e `instagram_manage_insights`;
- e o app em **modo Live**.

A Meta pede:

- um vídeo da tela mostrando o fluxo inteiro: botão "Conectar com Instagram" → login → números na tela de Métricas e no Mídia Kit;
- pelo menos uma chamada de API bem-sucedida com cada permissão;
- a política de privacidade publicada.

---

## Rotina diária

O `vercel.json` agenda `GET /api/cron/instagram` todo dia às 09:00 UTC (06:00 em Brasília). Cada execução atualiza até 30 conexões ativas que estão há mais de 20 horas sem coleta, as mais antigas primeiro. A rotina:

- desenha o gráfico de crescimento;
- renova as capas dos posts em destaque;
- guarda os stories do dia.

Ela para sozinha se o problema for do app (limite da Meta, permissão, configuração). Token revogado de uma criadora não para a fila: só aquela conexão é marcada.

Para disparar à mão: **Configurações → Atualizar conectadas agora**.

## Desconectar e excluir dados

- **Pela criadora:** botão "Desconectar". Apaga o token, o histórico de coletas, o retrato do kit, as imagens copiadas e os números da ficha (quando vieram do Instagram).
- **Pela Meta:** quando a pessoa remove o app e pede exclusão, a Meta chama `/api/instagram/exclusao-de-dados`. A rotina confere a assinatura com o `META_APP_SECRET`, apaga tudo da mesma forma e responde com o código de confirmação. A página de acompanhamento é `/instagram/exclusao`.

## Se der erro

| Sintoma | Causa provável |
|---|---|
| Volta com "não encontramos uma conta profissional" | A conta é pessoal, ou a pessoa não marcou a conta do Instagram no diálogo |
| "O login demorou demais e expirou" | Mais de 15 minutos no diálogo, ou o login começou em outro navegador |
| "Reconecte seu Instagram" | O acesso foi removido em Integrações / Apps e sites, ou a conta mudou de portfólio |
| Erro #10 ou #200 (permissão) | Falta permissão na configuração, ou a conta não é testadora e o app ainda não tem acesso avançado |
| Erro #4, #17, #32 ou #613 | Limite de chamadas. Espere; a rotina já para sozinha |
| "aplique a migration" no painel | Falta a 0024 ou a 0025 (passo 6) |
