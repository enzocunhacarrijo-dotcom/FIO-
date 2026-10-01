import type { PhotoKind } from '@hair-analysis/shared';

export type CaptureStep = {
  kind: PhotoKind;
  title: string;
  instruction: string;
  guideShape: 'portrait' | 'circle' | 'closeup';
  guideCaption: string;
};

export const CAPTURE_STEPS: CaptureStep[] = [
  {
    kind: 'comprimento',
    title: 'Comprimento e textura',
    instruction: 'Cabelo solto, luz natural, fundo neutro. Enquadre à distância média, encaixando cabeça e ombros na silhueta.',
    guideShape: 'portrait',
    guideCaption: 'De costas: cabeça e ombros dentro da silhueta',
  },
  {
    kind: 'raiz',
    title: 'Raiz e couro cabeludo',
    instruction: 'Separe o cabelo ao meio e aproxime a câmera da raiz, centralizando o repartido na linha do círculo.',
    guideShape: 'circle',
    guideCaption: 'Centralize o repartido na linha',
  },
  {
    kind: 'pontas',
    title: 'Pontas do fio',
    instruction: 'Pegue uma mecha e aproxime a câmera das pontas, alinhando o fio dentro do contorno.',
    guideShape: 'closeup',
    guideCaption: 'Alinhe uma mecha dentro do contorno',
  },
];
