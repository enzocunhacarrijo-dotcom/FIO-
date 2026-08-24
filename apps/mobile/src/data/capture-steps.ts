import type { PhotoKind } from '@hair-analysis/shared';

export type CaptureStep = {
  kind: PhotoKind;
  title: string;
  instruction: string;
  guideShape: 'portrait' | 'circle' | 'closeup';
};

export const CAPTURE_STEPS: CaptureStep[] = [
  {
    kind: 'comprimento',
    title: 'Comprimento e textura',
    instruction: 'Cabelo solto, luz natural, fundo neutro. Enquadre à distância média, do jeito que a silhueta mostra.',
    guideShape: 'portrait',
  },
  {
    kind: 'raiz',
    title: 'Raiz e couro cabeludo',
    instruction: 'Separe o cabelo ao meio e aproxime a câmera da raiz, centralizando o repartido no círculo.',
    guideShape: 'circle',
  },
  {
    kind: 'pontas',
    title: 'Pontas do fio',
    instruction: 'Pegue uma mecha e aproxime a câmera das pontas, enchendo o quadro central.',
    guideShape: 'closeup',
  },
];
