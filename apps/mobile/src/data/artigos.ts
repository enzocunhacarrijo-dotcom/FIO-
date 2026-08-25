export type Artigo = {
  slug: string;
  titulo: string;
  resumo: string;
  corpo: string[];
};

export const ARTIGOS: Artigo[] = [
  {
    slug: 'como-ler-um-rotulo',
    titulo: 'Como ler o rótulo de um produto capilar',
    resumo: 'Os ingredientes vêm em ordem de concentração — os primeiros da lista importam mais que os últimos.',
    corpo: [
      'A lista de ingredientes (INCI) é ordenada por concentração, do maior para o menor. Os cinco primeiros itens costumam responder pela maior parte da fórmula — é ali que vale prestar mais atenção, não no meio ou no fim da lista.',
      'Água (Aqua) quase sempre lidera a lista em produtos à base de água, o que é normal. Em seguida costumam vir os tensoativos de limpeza (em shampoos) ou os agentes condicionantes (em condicionadores e máscaras).',
      'Um ingrediente "restrito" aparecendo nos últimos lugares da lista está em quantidade mínima — nem sempre é motivo pra descartar o produto. O scanner do app já pesa isso ao avaliar a compatibilidade com o seu perfil.',
      'Termos genéricos como "fragrância" (fragrance/parfum) escondem misturas de várias substâncias que o fabricante não é obrigado a detalhar — vale ficar atento se você tem histórico de sensibilidade no couro cabeludo.',
    ],
  },
  {
    slug: 'porosidade-o-que-significa',
    titulo: 'Porosidade capilar: o que ela muda na sua rotina',
    resumo: 'Fios de porosidade alta e baixa pedem estratégias quase opostas para os mesmos produtos funcionarem.',
    corpo: [
      'Porosidade é a facilidade com que a cutícula do fio deixa água e produtos entrarem e saírem. Ela é influenciada por genética, mas também por química (coloração, alisamento) e calor repetido, que abrem a cutícula de forma permanente.',
      'Fios de porosidade baixa têm a cutícula mais fechada: produtos demoram para penetrar e costumam "escorregar" pelo fio sem fazer efeito. Calor leve (uma touca térmica, por exemplo) ajuda a abrir a cutícula na hora da hidratação.',
      'Fios de porosidade alta absorvem água e produto rápido, mas também perdem umidade rápido — por isso parecem sempre secos mesmo com hidratação frequente. Selar a cutícula ao final da rotina (água fria, um óleo leve) ajuda a reter o que foi absorvido.',
      'Sua análise mostra uma estimativa de porosidade com base nas fotos e no questionário — é um ponto de partida, não uma medição de laboratório.',
    ],
  },
  {
    slug: 'hidratacao-nutricao-reconstrucao',
    titulo: 'Hidratação, nutrição e reconstrução: qual seu fio pede primeiro',
    resumo: 'Os três pilares do cronograma capilar resolvem problemas diferentes — usar o errado pode piorar o quadro.',
    corpo: [
      'Hidratação repõe água (elasticidade, maciez). Nutrição repõe lipídios (brilho, maciez ao toque). Reconstrução repõe proteína (força, resistência à quebra). É comum confundir os três porque os sintomas de falta de cada um se parecem — fio "ressecado" e "sem vida" pode ser falta de qualquer um deles.',
      'Um sinal de que falta reconstrução: o fio estica bastante quando molhado e não volta ao tamanho original, ou quebra fácil ao pentear molhado. Um sinal de que falta hidratação: o fio parece "seco por dentro" mesmo logo depois de um creme.',
      'Excesso de reconstrução deixa o fio duro, quebradiço e "espetado" — o oposto do que hidratação faz. Por isso a proporção certa varia por pessoa: quem faz química com frequência costuma precisar de mais reconstrução; quem tem fio naturalmente ressecado, de mais hidratação.',
      'A rotina semanal gerada pelo app já equilibra essas três frentes com base no que suas fotos e respostas indicam — mas ela é um ponto de partida, ajuste conforme você sentir o fio reagir.',
    ],
  },
  {
    slug: 'sinais-de-dano',
    titulo: 'Sinais de dano no fio: químico, térmico e mecânico',
    resumo: 'Nem toda quebra vem do mesmo lugar — reconhecer a causa muda o que fazer a respeito.',
    corpo: [
      'Dano químico vem de coloração, descoloração, alisamento ou permanente — costuma deixar o fio poroso, elástico demais quando molhado, e mais claro ou opaco onde o produto agiu.',
      'Dano térmico vem de secador, chapinha ou babyliss em temperatura alta ou uso muito frequente sem protetor térmico — costuma aparecer como pontas ressecadas, pontas duplas e perda de brilho concentrada nas partes mais expostas ao calor.',
      'Dano mecânico vem de fricção e tração: pentear com força, prender o cabelo apertado, dormir sem proteção, atrito com tecidos ásperos — costuma se concentrar em pontos específicos (nuca, temporais) em vez do fio inteiro.',
      'Identificar qual predomina muda a prioridade da rotina: dano químico pede mais reconstrução, dano térmico pede mais hidratação e redução de calor, dano mecânico pede mudança de hábito antes de qualquer produto.',
    ],
  },
  {
    slug: 'quando-procurar-dermatologista',
    titulo: 'Quando vale procurar um dermatologista',
    resumo: 'O app avalia o que aparece nas fotos, mas alguns sinais pedem avaliação médica, não cosmética.',
    corpo: [
      'Queda intensa, localizada ou repentina (tufos de cabelo, falhas visíveis no couro cabeludo) não é algo que produto resolve sozinho — pode ter causas hormonais, nutricionais ou dermatológicas que precisam de diagnóstico.',
      'Coceira frequente, descamação intensa, vermelhidão, dor ou feridas no couro cabeludo também estão fora do que uma análise cosmética consegue avaliar com segurança.',
      'Quando sua análise identifica esses sinais nas fotos ou no questionário, ela mostra um aviso recomendando avaliação profissional — isso não substitui a consulta, é só um alerta para você não adiar.',
      'Fora esses casos, a maioria das queixas (frizz, ressecamento, oleosidade, quebra leve) responde bem a ajustes de rotina, que é o que o app foi feito para recomendar.',
    ],
  },
];
