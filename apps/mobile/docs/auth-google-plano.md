# Plano — Criar conta + Login com Google

Decisões: **D1=A** (OAuth mediado pelo backend, funciona no Expo Go) · **D2=B** (Apple fica para fase 2) · **D3=A** (convidado é convertido, mantém dados).

## 0. Dependências e env
- Backend: `npm i google-auth-library -w @hair-analysis/backend`.
- `apps/backend/src/config/env.ts`: adicionar `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_BASE_URL` (`z.string().url()`), todos `.optional()`.
  Ausentes → rotas Google respondem **503** `{error:"google_unavailable", message:"Login com Google indisponível no momento."}`.
- Documentar as 3 vars em `apps/backend/.env.example`. Callback = `${PUBLIC_BASE_URL}/api/auth/google/callback` (precisa ser HTTPS: Railway ou túnel).
- Mobile: nada novo (`expo-web-browser` e `expo-linking` já instalados; scheme `fio` já no app.json).

## 1. Schema + migration 0007 (`apps/backend/src/db/schema.ts`)
Sem tabela de identidades por ora (um provedor só; entra junto com Apple).

**`users`**
- Nova coluna: `googleSub: text("google_sub").unique()`.
- Trocar o check `registered_has_credentials` por:
  `kind <> 'registered' OR (email IS NOT NULL AND (password_hash IS NOT NULL OR google_sub IS NOT NULL))`.

**Nova tabela `oauth_login_codes`** (`oauthLoginCodes`)
| coluna | tipo |
|---|---|
| id | uuid pk defaultRandom |
| user_id | uuid notNull, fk users.id onDelete cascade |
| code_hash | text notNull unique (sha256 hex) |
| expires_at | timestamptz notNull |
| used_at | timestamptz null |
| created_at | timestamptz notNull defaultNow |
Índice em `user_id`.

Rodar `npm run db:generate -w @hair-analysis/backend`; **conferir no SQL** o `DROP CONSTRAINT registered_has_credentials` + `ADD CONSTRAINT` novo. Testar migração em banco com dados.

## 2. Shared (`packages/shared/src/auth.ts`)
```ts
// currentUserSchema: novo campo
providers: z.array(z.enum(["password", "google"])).default([]),

export const googleStartRequestSchema = z.object({
  redirectUri: z.string().regex(/^(fio|exp|exps):\/\//),
  lgpdConsent: lgpdConsentField,
});
export const googleStartResponseSchema = z.object({ authUrl: z.string().url() });
export const googleExchangeRequestSchema = z.object({ code: z.string().length(64) });
export const upgradeGuestRequestSchema = registerRequestSchema; // {email, password, lgpdConsent}
```
Backend `toCurrentUser`: `providers` = `["password"]` se `passwordHash`, + `"google"` se `googleSub`.

## 3. Endpoints (`apps/backend/src/routes/auth.ts`)
Erros sempre no formato `{error, message}`.

### `POST /api/auth/google/start` — Bearer **opcional**
- Body: `{ redirectUri, lgpdConsent: true }` → **200** `{ authUrl }`.
- Bearer: `try { await request.jwtVerify() }` (não usar `requireAuth`). Se `kind === "guest"` → `g = user.sub`, senão `g = null`.
- `nonce = randomBytes(16).toString("hex")`.
- `state = app.jwt.sign({ r: redirectUri, g, n: nonce }, { expiresIn: "10m" })`.
- `authUrl = https://accounts.google.com/o/oauth2/v2/auth?client_id=…&redirect_uri=<callback>&response_type=code&scope=openid%20email%20profile&state=…&nonce=…&prompt=select_account`.
- Erros: 400 `invalid_request` (redirect fora da allowlist / sem LGPD) · 503 `google_unavailable`.

### `GET /api/auth/google/callback?code&state` (ou `?error=…&state`)
1. Verifica `state` (JWT). Inválido/expirado → **400 HTML simples** "Link expirado. Volte ao app e tente de novo." (sem `r` confiável não há para onde redirecionar).
2. `error` presente (ex.: `access_denied`) → 302 `${r}?error=cancelled`.
3. `OAuth2Client.getToken(code)` → `verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`; checar `payload.nonce === n`. Falha → 302 `${r}?error=google_failed`.
4. `payload.email_verified !== true` → 302 `${r}?error=email_unverified`.
5. Upsert (transação), `email = payload.email.toLowerCase()`, `sub = payload.sub`:
   - a) existe user com `google_sub = sub` → usa.
   - b) senão existe user com `email` → `set googleSub = sub` (vínculo automático; seguro pois email_verified) → usa.
   - c) senão, `g` aponta para user `kind=guest` → **converte** (seção 5) com `googleSub`.
   - d) senão → `insert { kind:"registered", email, googleSub: sub, lgpdConsentAt: now }`.
   - Em a/b com `g` presente: entra na conta existente; convidado fica intocado (sem merge).
6. Code de uso único (seção 4) → 302 `${r}?code=<code>`.

### `POST /api/auth/google/exchange`
- Body: `{ code }` → **200** `AuthResponse` (mesmo shape do login).
- Consumo atômico:
  `UPDATE oauth_login_codes SET used_at = now() WHERE code_hash = $sha256 AND used_at IS NULL AND expires_at > now() RETURNING user_id` → `issueAuthResponse(user)`.
- Erros: 400 `invalid_request` · 401 `invalid_code` "Não foi possível concluir o login. Tente de novo."

### `POST /api/me/upgrade` — `requireAuth`
- Body: `{ email, password, lgpdConsent: true }` → **200** `AuthResponse` (tokens novos, pois o `kind` no JWT muda).
- Erros: 400 `invalid_request` (mesma msg do register) · 409 `already_registered` "Você já tem uma conta." (user não é guest) · 409 `email_in_use` "Já existe uma conta com esse e-mail."
- Normaliza e-mail com `toLowerCase()`; hash com `hashPassword`.

### Ajuste em `POST /api/auth/login`
- User existe com `!passwordHash && googleSub` → **401** `{error:"use_google", message:"Esta conta usa o Google. Toque em Continuar com Google."}`.

## 4. Code de uso único + deep link
- Code: `randomBytes(32).toString("hex")` (64 chars). Guardar só `sha256(code)`. **TTL 60 s, uso único.**
- `redirectUri` gerado no app: `Linking.createURL('auth/google')`
  - build própria: `fio://auth/google`
  - Expo Go: `exp://<ip>:8081/--/auth/google`
- Allowlist no backend: regex `^(fio|exp|exps):\/\/` (evita open redirect).
- Retornos possíveis: `?code=<64 hex>` ou `?error=cancelled|google_failed|email_unverified`.
- Fallback mobile: criar `apps/mobile/src/app/auth/google.tsx` que só retorna `<Redirect href="/" />` (Android pode abrir o link fora da auth session).
- O JWT nunca trafega na URL — só o code.

## 5. Conversão de convidado (helper único, usado por Google e `/api/me/upgrade`)
```ts
convertGuest(userId, { email, passwordHash?, googleSub? }) // em transação
```
- `UPDATE users SET kind='registered', email, password_hash|google_sub, device_id = NULL, updated_at = now() WHERE id = $id AND kind = 'guest'`.
- `device_id = NULL` é **obrigatório**: senão `/api/auth/guest` neste aparelho logaria na conta registrada sem credencial.
- Revogar refresh tokens antigos: `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $id AND revoked_at IS NULL`.
- Emitir novo `AuthResponse`. Fotos/análises/questionário/hábitos permanecem no mesmo `user_id`.

## 6. Interface mobile
### `apps/mobile/src/api/auth.ts`
```ts
googleStart(redirectUri: string, accessToken?: string): Promise<{ authUrl: string }>
  // POST /api/auth/google/start, body { redirectUri, lgpdConsent: true }
googleExchange(code: string): Promise<AuthResponse>
  // POST /api/auth/google/exchange
upgradeGuest(accessToken: string, email: string, password: string): Promise<AuthResponse>
  // POST /api/me/upgrade, body { email, password, lgpdConsent: true }
```
Validar respostas com os schemas do shared (`authResponseSchema.parse`, etc.), como as funções atuais.

### `apps/mobile/src/store/auth.ts`
```ts
loginWithGoogle: () => Promise<'ok' | 'cancelled' | 'error'>
```
1. `set({ busy: true, error: null })`.
2. `redirectUri = Linking.createURL('auth/google')`.
3. `{ authUrl } = await googleStart(redirectUri, user?.kind === 'guest' ? accessToken : undefined)`.
4. `res = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri)`.
   - `res.type !== 'success'` → `busy:false`, retorna `'cancelled'` (**sem** `error`).
5. `{ queryParams } = Linking.parse(res.url)`:
   - `error` → mensagem mapeada, retorna `'error'` (`cancelled` → retorna `'cancelled'` sem mensagem).
   - `code` → `googleExchange(code)` → `persistAuth` → `set({ user, accessToken, refreshToken, busy:false })` → `'ok'`.
6. `catch` → `ApiError.message` ou "Não foi possível entrar com o Google." → `'error'`.

`registerAccount(email, password)`: se `user?.kind === 'guest' && accessToken` → `upgradeGuest`; senão `register` (atual). Mesmo retorno boolean.

Mapa de mensagens:
| código | mensagem |
|---|---|
| cancelled | (nenhuma) |
| google_failed | Não foi possível entrar com o Google. |
| email_unverified | Seu e-mail Google não está verificado. |
| google_unavailable / use_google / invalid_code | usar `message` do backend |

Contrato p/ Prisma: `loginWithGoogle()`, `busy`, `error`, `clearError()`, `user.kind`, `user.providers`. Em `'ok'` a tela faz `router.replace('/')`.

## 7. TTLs
- `state`: 10 min · login code: 60 s, uso único · access 15 min / refresh 30 dias (inalterados).

## 8. Testes (vitest, backend)
- Upsert a/b/c/d; convidado + conta Google já existente (entra na existente, convidado intocado).
- `exchange`: code reusado, expirado, inexistente → 401.
- `start`: redirect fora da allowlist / sem LGPD → 400; sem env → 503.
- `upgrade`: email em uso, já registrado, caso feliz (mesmo id, dados preservados, `device_id` null, refresh antigos revogados).
- Login senha em conta só-Google → `use_google`.
- Migração aplicada sobre banco com dados existentes.

## Pré-requisitos do usuário
- Google Cloud: tela de consentimento OAuth + usuário de teste; credencial **Aplicativo da Web** → Client ID/Secret no `.env` do backend/Railway.
- `PUBLIC_BASE_URL` HTTPS e URI de redirecionamento `https://<host>/api/auth/google/callback` cadastrada no Console.
