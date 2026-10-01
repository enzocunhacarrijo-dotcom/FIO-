# Plano de redesign — Fio

**O que vi no código:** só as cores e a fonte mudaram. Cards com borda 1px e sem sombra, títulos de seção em CAIXA ALTA 11px, botões retangulares (raio 16) e glifos de texto (`‹`, `✓`, `•`) no lugar de ícones. Os mesmos estilos `plainCard`, `sectionLabel`, `disclaimer`, `warnCard` e `alertCard` estão copiados em quase todas as telas. `themed-text.tsx` e `themed-view.tsx` são sobras do template inicial. Já instalados e utilizáveis: `react-native-reanimated` 4, `react-native-svg` e `expo-symbols`. Não estão instalados e precisam ser adicionados: `expo-haptics` e `expo-linear-gradient`.

## 1. Linguagem visual

- **Formas:** tudo bem arredondado, com cara de cápsula. Cards com raio 24, card principal com raio 32, botões e chips em formato pill (999), inputs com raio 18. Cards sem borda: a separação vem da superfície branca com sombra suave sobre o fundo papel. Borda só no estado de seleção (2px `primary`).
- **Fio como elemento gráfico:** criar um componente `<Strand>` (SVG) que reaproveita a curva em S do logo. Usos:
  - divisor de seção (curva com 2px de traço, ~48px);
  - "rabisco" atrás do título na welcome e no resultado (traço de 6px, `primaryTint`);
  - o arco do score (o fio desenhando o índice);
  - a linha do gráfico de evolução (curva suave, não `Polyline` reta);
  - progresso do questionário: o fio crescendo, com um ponto âmbar na ponta.
- **Âmbar com uma função só:** "brilho / conquista". Usado no ponto na ponta do fio, na sequência de dias, no destaque do score e no CTA premium. Nunca em fundos grandes.
- **Fundos:** `bg #F6F5F0` como base. O hero do resultado e da welcome usa um bloco `primary #0F6B62` com cantos inferiores de raio 40 (header que vira bloco de cor) e texto branco. Superfícies elevadas em `#FFFFFF`. Superfície rebaixada (trilhos e áreas vazias) em `#EEEDE6`.
- **Ícones:** `expo-symbols` (SF Symbols no iOS) com fallback em SVG próprio para Android/web. Traço de 2px com pontas arredondadas, tamanhos 20 e 24. Substituem `‹`, `✓` e `•`. Ícone sempre dentro de um círculo de 40px em `primaryTint` nos itens de lista.
- **Botões:** pill grandes. Primário com 56px de altura, fundo `primary`, sombra colorida e ícone opcional à direita (→). Secundário com fundo `primaryTint` e sem borda. Terciário/ghost só com texto `primaryStrong` sublinhado no press. Na welcome e no resultado, só um CTA primário por tela; as outras ações viram linhas de lista ("ações rápidas").
- **Tipografia:** os títulos ficam em ExtraBold com letter-spacing negativo. O CAIXA ALTA 11px dos títulos de seção vira título em frase normal, 18px Bold. CAIXA ALTA fica restrito a "eyebrows" de 12px.

## 2. Tokens novos (`src/theme/tokens.ts`)

```ts
colors += { surfaceSunken:'#EEEDE6', primaryDeep:'#083F39', onPrimaryMuted:'rgba(255,255,255,0.72)',
  accentGlow:'rgba(242,165,58,0.28)', overlay:'rgba(20,33,31,0.55)', success:'#2E8B57', successTint:'#DDF1E4' }
spacing  = { xxs:2, xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, huge:48 }  // gutter de tela = 20
radii    = { xs:8, sm:12, md:18, lg:24, xl:32, xxl:40, pill:999 }
type = {               // fontFamily / size / lineHeight / letterSpacing
  display:  { f:'800', s:40, lh:44, ls:-1.2 },
  h1:       { f:'800', s:30, lh:36, ls:-0.8 },
  h2:       { f:'700', s:22, lh:28, ls:-0.4 },
  h3:       { f:'700', s:18, lh:24, ls:-0.2 },
  bodyLg:   { f:'500', s:17, lh:26 },
  body:     { f:'400', s:15, lh:22 },
  bodySm:   { f:'400', s:13, lh:19 },
  label:    { f:'600', s:14, lh:18 },
  eyebrow:  { f:'700', s:12, lh:16, ls:1.2, upper:true },
  caption:  { f:'500', s:12, lh:16 },
  numeric:  { f:'800', s:64, lh:64, ls:-2, tabular:true },
}
shadows = {   // iOS shadow* + Android elevation; na web, boxShadow
  sm:  { color:'#14211F', opacity:0.06, radius:8,  y:2,  elevation:2 },
  md:  { color:'#14211F', opacity:0.08, radius:20, y:8,  elevation:6 },
  lg:  { color:'#14211F', opacity:0.12, radius:32, y:16, elevation:12 },
  primary: { color:'#0F6B62', opacity:0.30, radius:16, y:8, elevation:8 },
}
motion = {
  duration: { fast:120, base:220, slow:420, draw:900 },
  easing: { standard: Easing.bezier(0.2,0,0,1), emphasized: Easing.bezier(0.3,0,0,1.2) },
  spring: { press:{damping:18, stiffness:320}, pop:{damping:12, stiffness:220} },
  pressScale: 0.97,
}
```

Também: `src/theme/typography.ts` exporta um helper `text('h2')`, que devolve o estilo pronto.

## 3. Frentes de trabalho

**Contrato entre as frentes (definir antes, para A e B rodarem em paralelo):**

- `Text` com `variant: keyof type` e `tone: 'default'|'muted'|'faint'|'primary'|'onPrimary'|'danger'`
- `Card` com `variant: 'elevated'|'sunken'|'tint'|'warn'|'danger'` e `padding?`
- `SectionHeader` com `title`, `eyebrow?` e `action?`
- `Button`: os props atuais mais `variant: 'primary'|'secondary'|'ghost'`, `icon?`, `size: 'lg'|'md'`
- `ListRow` com `icon`, `title`, `subtitle?` e `onPress`
- `Disclaimer`
- `Strand`
- `Icon` com `name` e `size`

### A) Componentes base e tokens (`src/theme`, `src/components`)

| Arquivo | Mudança |
|---|---|
| `theme/tokens.ts` | Escalas acima; manter as chaves antigas por enquanto, como aliases, para não quebrar B. |
| `theme/typography.ts` (novo) | Escala `type` e helper `text()`. |
| `components/text.tsx` (novo) | `<Text variant tone>`. |
| `components/card.tsx` (novo) | Raio 24, padding 20, `shadows.sm`, sem borda. Variantes `tint` (`primaryTint`), `warn` (`accentTint` + ícone), `danger`. |
| `components/section-header.tsx` (novo) | h3 18/Bold com ação opcional à direita; `<Strand>` pequeno acima. |
| `components/list-row.tsx` (novo) | Altura 64, ícone num círculo de 40px em `primaryTint`, chevron à direita. |
| `components/icon.tsx` (novo) | `expo-symbols` com fallback SVG; set mínimo: chevron.left/right, check, camera, sparkle, drop, leaf, chart, flame, info, warning, user, lock, barcode. |
| `components/strand.tsx` (novo) | Curva do logo parametrizada (`width`, `stroke`, `color`, `animated` com o traço sendo desenhado em `draw`, 900ms). |
| `components/disclaimer.tsx` (novo) | Ícone de informação e caption em `textFaint`, centralizado. |
| `button.tsx` | Pill, 56px (lg) / 44px (md), label 16/600, ícone à direita, `shadows.primary` no primário; press com scale 0.97 em spring (Reanimated) e `Haptics.selectionAsync`; loading troca o label por 3 pontos pulsando. |
| `text-field.tsx` | Label em frase normal (14/600, sem CAIXA ALTA), input de 56px, raio 18, fundo `surfaceSunken`, sem borda. Foco: fundo `surface`, borda 2px `primary` e anel `primaryTint` de 4px. Props `error` e `hint`. |
| `choice-chips.tsx` | Pill de 40px; selecionado com fundo `primary`, texto branco e ✓ de 14px à esquerda; não selecionado com fundo `surface` e `shadows.sm`; spring "pop" ao selecionar. |
| `option-card.tsx` | Raio 20, sem borda, `shadows.sm`. Selecionado: borda 2px `primary` e fundo `primaryTint`. Radio/check de 24px com animação do ✓ desenhado; `icon?` à esquerda. |
| `checkbox.tsx` | Caixa de 24px com raio 8, `Icon check` animado e haptic. |
| `progress-bar.tsx` | Trilho de 8px em `surfaceSunken`, preenchimento `primary` com ponto âmbar de 10px na ponta (o "fio"); largura animada em `base`; label "3/8" no estilo eyebrow à direita. |
| `screen-header.tsx` | Voltar em círculo de 40px em `surface` com `shadows.sm` e `Icon chevron.left`; título h2 22/800 abaixo do botão (estilo large title); prop `eyebrow?` e variante `onPrimary` para heros coloridos. |
| `fiber-index.tsx` | Trocar as barras verticais por um anel SVG (raio 88, traço 14, pontas arredondadas, `primary` sobre trilho `surfaceSunken`) com o número `numeric` 64 no centro e um ponto âmbar na ponta do arco. Os 4 subíndices viram linhas horizontais (label + barra de 6px + valor). Animação: arco e número contando de 0 até o total em `draw`. |
| `attribute-card.tsx` | Usa `Card`: eyebrow no título, valor em h3, tags pill de 24px; confiança como 3 pontinhos (●●○) em vez de texto em tag. |
| `evolution-chart.tsx` | Caminho com curva cúbica suave, traço de 3px `primary`, área com gradiente `primaryTint` → transparente, pontos de 6px `surface` com borda `primary`, último ponto âmbar maior com o valor em tooltip; grid horizontal tracejado em 0/50/100. |
| `rotina-checklist.tsx` | Sequência num badge pill `accentTint` com `Icon flame` em âmbar; anel de progresso do dia (x/y); item concluído com o texto riscado e fade a 60%. |
| `help-note.tsx` | Trigger com `Icon info` e texto; a caixa abre com altura animada e fundo `primaryTint`, raio 16. |
| `capture-guide.tsx` | Contorno de 3px, tracejado animado (marching ants) até detectar o enquadramento; cantos em L nos 4 cantos; caption num pill escuro com blur (`overlay`). |
| `logo.tsx` | Adicionar a variante `mono` (traço branco, sem fundo) para usar sobre `primary`. |
| `themed-text.tsx`, `themed-view.tsx` | Apagar se o grep confirmar que nada os usa. |
| Deps | `npx expo install expo-haptics expo-linear-gradient`. |

### B) Telas (`src/app/**`)

Regras para todas as telas:
- gutter de 20;
- `gap` de 24 entre seções;
- trocar os `plainCard`/`sectionLabel`/`disclaimer` locais por `Card`, `SectionHeader` e `Disclaimer`;
- `ActivityIndicator` de tela cheia vira um skeleton (blocos `surfaceSunken` pulsando) ou o `Strand` animado;
- entrada das telas com fade + translateY de 8 (`FadeInDown.duration(220)`, com stagger de 40ms nos cards).

| Tela | Mudança |
|---|---|
| `_layout.tsx` | `animation: 'slide_from_right'`; `contentStyle` em `bg`. |
| `index.tsx` | Loader com o `LogoMark` e o `Strand` sendo desenhado, no lugar do spinner. |
| `welcome.tsx` | Hero em bloco `primary` ocupando ~55% da altura, cantos inferiores de raio 40, `Logo mono`, título display 40 branco e um `Strand` grande decorativo em `primaryStrong`. Embaixo, sobre o papel: consentimento num `Card sunken`, CTA primário "Criar conta", secundário "Já tenho conta" e ghost "Continuar sem conta". |
| `login.tsx`, `register.tsx` | `ScreenHeader` large title, novos `TextField`, CTA fixo no rodapé (sticky, acima do teclado). |
| `onboarding/questionario.tsx` | `ProgressBar` novo no topo, pergunta em h1 30/800, `OptionCard` com stagger, CTA fixo no rodapé; transição entre perguntas com slide horizontal e fade. |
| `captura/index.tsx` | Overlay de topo: pill escuro com "Foto 1 de 3" e instrução 15/500. Obturador de 76px com anel externo `accent` e scale ao pressionar, mais haptic `impactMedium`. Revisão: imagem com raio 32 e 2 botões lado a lado (secundário "Refazer" e primário "Usar foto"). |
| `analise/index.tsx` | Tela de "analisando" com o `Strand` desenhando em loop e mensagens rotativas em fade a cada 2,5s. |
| `analise/resultado.tsx` | Hero em bloco `primary` com o `FiberIndex` (anel) em branco/âmbar e o título "Seu perfil capilar". Na sequência: `observacoesAoUsuario` em bodyLg; "O que observamos" com `AttributeCard` em grid de 2 colunas (curvatura, densidade, porosidade) e cards de largura total para couro e integridade; prioridades como lista numerada com círculos `accentTint`; ingredientes como chips (bons em `primaryTint`, a evitar em `dangerTint`) que expandem o "por quê"; rotina; 3 botões trocados por `ListRow` (Progresso, Scanner, Conta); `Disclaimer`. `alertCard` e `warnCard` usam `Card` com variante `danger`/`warn`. |
| `scanner/index.tsx` | Guia em retângulo com raio 24 e cantos em L com marching ants; obturador igual ao da captura. |
| `scanner/resultado.tsx` | Veredito como selo grande (círculo de 72px com ícone e cor `success`, `accent` ou `danger`) e título h1; ingredientes em `ListRow` com ponto de cor. |
| `progresso/index.tsx` | `EvolutionChart` dentro de um `Card` com o delta em destaque ("+6 pts", `success`); timeline vertical com o fio ligando os itens (linha de 2px `primaryTint` e nó de 10px); hábitos com `ChoiceChips`. |
| `progresso/comparador.tsx` | Fotos lado a lado com raio 20, slider de "antes/depois" se for viável, deltas em chips coloridos. |
| `conta/index.tsx`, `privacidade/index.tsx` | Avatar em círculo `primaryTint` com a inicial; ações em grupos de `ListRow` dentro de um `Card`; "Excluir dados" em `ListRow` com tom `danger`. |
| `premium/index.tsx` | Hero `primaryDeep` com `Strand` âmbar, benefícios em `ListRow` com `Icon check` e CTA âmbar (fundo `accent`, texto `text`) — a única tela onde o âmbar é botão. |
| `aprender/index.tsx`, `glossario.tsx`, `artigo/[slug].tsx` | Cards de artigo com faixa de cor e ícone, título h3; artigo com corpo em bodyLg 17/26 e largura máxima de ~640 na web. |
| `dev-health.tsx` | Não mexer. |

## Riscos e trade-offs

- **Sombras:** `shadow*` não funciona no Android (só `elevation`) e na web precisa de `boxShadow`. Concentrar isso num helper `elevation(level)` dentro de `tokens.ts`.
- **Contraste:** o âmbar `#F2A53A` sobre branco não passa em contraste AA para texto. Usar só como preenchimento, ou como texto sobre `ink`; para texto âmbar, usar `accentStrong`.
- **Performance:** animações de SVG (anel e `Strand`) devem usar `useAnimatedProps` do Reanimated, não `setState`, para não travar em Android fraco.
- **Ordem de entrega:** B depende só do contrato de API acima. A deve entregar primeiro `text`, `card`, `button`, `icon` e `section-header`. Os tokens antigos ficam como aliases até B terminar; depois são removidos.
