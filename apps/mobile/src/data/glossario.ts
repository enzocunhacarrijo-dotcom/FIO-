export type TermoGlossario = {
  slug: string;
  termo: string;
  definicao: string;
};

export const GLOSSARIO: TermoGlossario[] = [
  {
    slug: 'porosidade',
    termo: 'Porosidade',
    definicao:
      'Quão facilmente a cutícula do fio deixa água e produtos entrarem e saírem. Fios de porosidade alta absorvem rápido mas também perdem umidade rápido; fios de porosidade baixa resistem à entrada de produto e pedem calor leve para abrir a cutícula.',
  },
  {
    slug: 'hidratacao',
    termo: 'Hidratação',
    definicao:
      'Reposição de água no fio, geralmente com ativos como glicerina e aloe vera. É a etapa que devolve maciez e elasticidade — fios ressecados puxam mais para hidratação do que para nutrição.',
  },
  {
    slug: 'nutricao',
    termo: 'Nutrição',
    definicao:
      'Reposição de lipídios (óleos e manteigas) que dão brilho e maciez ao fio. Fios porosos ou quimicamente tratados costumam precisar de mais nutrição para selar a cutícula depois da hidratação.',
  },
  {
    slug: 'reconstrucao',
    termo: 'Reconstrução',
    definicao:
      'Reposição de proteína (como queratina ou proteína hidrolisada) para repor a estrutura interna do fio, geralmente danificada por química ou calor. Excesso de reconstrução deixa o fio duro e quebradiço — por isso costuma ser usada com menos frequência que hidratação.',
  },
  {
    slug: 'cronograma-capilar',
    termo: 'Cronograma capilar',
    definicao:
      'Rotina que alterna hidratação, nutrição e reconstrução ao longo da semana ou do mês, na proporção que o fio da pessoa precisa — não existe uma proporção única certa para todo mundo.',
  },
  {
    slug: 'sulfato',
    termo: 'Sulfato',
    definicao:
      'Tensoativo comum em shampoos que gera espuma e limpa bem, mas pode ressecar fios porosos, cacheados ou quimicamente tratados. "Sem sulfato" não significa que o produto não limpa — significa que usa um tensoativo mais suave.',
  },
  {
    slug: 'silicone',
    termo: 'Silicone',
    definicao:
      'Ingrediente que reveste o fio, dando brilho e reduzindo o frizz na hora, mas pode acumular com o tempo se não for removido com uma limpeza mais profunda de vez em quando. Nem todo silicone é "pesado" — alguns são solúveis em água.',
  },
  {
    slug: 'low-poo-no-poo',
    termo: 'Low poo / No poo',
    definicao:
      'Métodos de lavagem com shampoo sem sulfato (low poo) ou sem shampoo tradicional, só com condicionador ou produtos de limpeza suave (no poo). Comuns em rotinas para cachos e fios ressecados.',
  },
  {
    slug: 'co-wash',
    termo: 'Co-wash',
    definicao:
      'Lavar o cabelo só com condicionador, sem shampoo. Ajuda a preservar óleos naturais em fios secos ou cacheados, mas não substitui uma limpeza com shampoo de tempos em tempos.',
  },
  {
    slug: 'selagem',
    termo: 'Selagem da cutícula',
    definicao:
      'Fechar a cutícula do fio com água fria ou um produto ácido/oleoso ao final da hidratação, deixando o fio mais liso e brilhante e reduzindo a perda de umidade.',
  },
  {
    slug: 'ph-capilar',
    termo: 'pH capilar',
    definicao:
      'O couro cabeludo e o fio saudáveis são levemente ácidos (pH em torno de 4,5–5,5). Produtos muito alcalinos (pH alto) abrem a cutícula e podem ressecar ou enfraquecer o fio com o uso repetido.',
  },
  {
    slug: 'proteina-hidrolisada',
    termo: 'Proteína hidrolisada',
    definicao:
      'Proteína quebrada em moléculas pequenas o bastante para penetrar no fio (não só cobrir por fora), usada em tratamentos de reconstrução. Exemplos comuns: queratina hidrolisada, proteína de trigo, colágeno.',
  },
  {
    slug: 'densidade-capilar',
    termo: 'Densidade capilar',
    definicao:
      'Quantidade de fios por área do couro cabeludo — diferente de "grossura do fio" (espessura de cada fio individual). Dois cabelos podem ter fios igualmente grossos e densidades bem diferentes.',
  },
  {
    slug: 'dermatite-seborreica',
    termo: 'Dermatite seborreica',
    definicao:
      'Condição comum do couro cabeludo que causa descamação, oleosidade e coceira. Piora com estresse e certos produtos; casos persistentes valem uma avaliação com dermatologista, não só troca de shampoo.',
  },
  {
    slug: 'transicao-capilar',
    termo: 'Transição capilar',
    definicao:
      'Período de deixar crescer o cabelo natural sobre um trecho quimicamente alisado, geralmente cortando as pontas alisadas aos poucos até o fio ficar 100% natural.',
  },
  {
    slug: 'big-chop',
    termo: 'Big chop',
    definicao:
      'Cortar de uma vez todo o cabelo quimicamente alisado, pulando o período de transição gradual — troca crescimento por um resultado imediato.',
  },
];
