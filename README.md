# App de Análise Capilar — MVP

Análise capilar por foto com IA (Claude), voltada ao mercado brasileiro, atendendo tanto quem cuida da qualidade do fio quanto quem acompanha densidade/queda no mesmo app.

Status atual: **Milestone 1 — Fundação** concluído. Ver [Roteiro](#roteiro-de-milestones) abaixo.

## Stack

- **Mobile**: Expo (React Native) + Expo Router + TypeScript — `apps/mobile`
- **Backend**: Node.js + TypeScript + Fastify — `apps/backend`
- **Banco**: PostgreSQL 16, rodando localmente via Docker Compose
- **ORM**: Drizzle
- **Tipos/schemas compartilhados**: `packages/shared` (Zod), importado tanto pelo backend quanto pelo app
- **IA**: Claude API (Anthropic) — chave e chamadas só existem no backend, nunca no app

## Pré-requisitos

- Node.js ≥ 20 (testado com v24)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando
- App **Expo Go** instalado no seu iPhone (App Store), na mesma rede Wi-Fi deste computador
- Uma conta na [Anthropic Console](https://console.anthropic.com) com billing ativo — **só é necessária a partir do Milestone 4** (integração de IA); os milestones 1–3 rodam sem ela

## Setup do zero

1. **Instale as dependências** (na raiz do repo — instala backend, app e o pacote compartilhado de uma vez, via npm workspaces):
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente** — copie os três arquivos de exemplo:
   ```bash
   cp .env.example .env
   cp apps/backend/.env.example apps/backend/.env
   cp apps/mobile/.env.example apps/mobile/.env
   ```
   Depois edite `apps/mobile/.env` e troque `EXPO_PUBLIC_API_URL` pelo IP local da sua máquina na rede Wi-Fi (não use `localhost` — o celular físico não consegue resolver isso). Para descobrir o IP:
   ```bash
   ipconfig getifaddr en0   # ou en1, dependendo da sua interface de rede
   ```

3. **Suba o Postgres local**:
   ```bash
   npm run db:up
   ```
   Isso inicia um container Postgres 16 na porta 5432, com os dados persistidos num volume Docker (sobrevive a restarts).

4. **Rode o backend**:
   ```bash
   npm run dev:backend
   ```
   Verifique em outro terminal:
   ```bash
   curl http://localhost:3000/health
   ```
   Deve retornar `{"status":"ok",...}`. Se retornar `503` com `"database unreachable"`, o Postgres ainda não subiu — espere alguns segundos após `npm run db:up` e tente de novo.

5. **Rode o app**:
   ```bash
   npm run dev:mobile
   ```
   Escaneie o QR code exibido no terminal com a câmera do iPhone (abre automaticamente no Expo Go). A tela inicial mostra o status da conexão app → backend → banco — deve aparecer "✓ Backend e banco de dados respondendo" com o JSON de resposta.

## Estrutura do repositório

```
apps/
  backend/     # API Fastify — rotas, banco (Drizzle), integração com a IA, storage de imagem
  mobile/      # App Expo — telas, câmera, estado (Zustand)
packages/
  shared/      # Schemas Zod e tipos TypeScript usados por backend e app
docker-compose.yml   # Postgres local
```

Dentro de `apps/backend/src`: `routes/` (endpoints), `db/` (schema Drizzle + migrations), `ai/` (cliente Claude, prompts versionados, schemas de validação da resposta), `storage/` (interface de storage de imagem + implementação local em disco), `catalog/` (interface de catálogo de produtos, mockada no MVP), `habits/` (interface de dados de hábito, entrada manual no MVP, pronta para wearables no futuro), `middleware/` (auth, rate limit, tratamento de erro).

## Variáveis de ambiente

Cada `.env.example` documenta o que cada variável faz. Resumo:

| Arquivo | Para que serve |
|---|---|
| `.env` (raiz) | Credenciais do Postgres, lidas pelo `docker-compose.yml` |
| `apps/backend/.env` | Connection string do banco, segredos de JWT e de assinatura de URL de storage, modelo e chave da Claude API, limite de rate limit |
| `apps/mobile/.env` | URL do backend que o app deve chamar (`EXPO_PUBLIC_API_URL`) |

Nenhum `.env` é versionado (estão no `.gitignore`); só os `.env.example`.

## Comandos úteis

```bash
npm run db:up          # sobe o Postgres local
npm run db:down        # derruba o Postgres local
npm run dev:backend    # backend em modo watch
npm run dev:mobile     # Expo dev server
npm run db:generate    # gera uma migration a partir de apps/backend/src/db/schema.ts
npm run db:migrate     # aplica as migrations pendentes no banco
```

## Roteiro de milestones

1. ✅ **Fundação** — monorepo, backend com health check (incluindo teste real de conectividade com o banco), app Expo mínimo rodando no iPhone via Expo Go, schema compartilhado provado de ponta a ponta.
2. **Auth + questionário** — cadastro, modo convidado, questionário completo persistido no banco.
3. **Captura de foto** — câmera guiada, validação local de qualidade, upload, storage seguro.
4. **Integração de IA** — endpoint de análise com Claude API, schema validado, retry, log de custo.
5. **Perfil + Score + Rotina** — telas de resultado, Índice Capilar, plano semanal.
6. **Scanner de produto** — leitura de rótulo/ingredientes, avaliação de compatibilidade.
7. **Progresso** — timeline, comparador de fotos, gráficos, lembretes.
8. **Conteúdo + paywall stub + polimento** — glossário, artigos, free/premium, acessibilidade.

## Decisões técnicas relevantes

- **Sem marca/SKU recomendado no MVP** — recomendações são por categoria e ingrediente-alvo (ex: "shampoo sem sulfato com coco-glucoside"), nunca produto nomeado. Catálogo real fica atrás de `ProductCatalogProvider`, mockado por enquanto.
- **Scanner de produto lê a foto da lista de ingredientes**, não código de barras — sem uma base de produtos pra resolver barcode→composição, leitura de barcode sozinha não gera avaliação nenhuma. A Claude API lê o texto da embalagem diretamente da imagem.
- **Índice Capilar** é a média dos 4 sub-scores retornados pela IA, calculada no backend (não pela IA) — determinístico e auditável.
- **Modo convidado** usa um ID anônimo de device (gerado no app, guardado em `expo-secure-store`) como identidade para rate limit e dono dos dados — sem conta, sem `user_id`.
