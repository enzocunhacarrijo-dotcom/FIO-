import { create } from 'zustand';
import { questionnaireResponseSchema, type ObjetivoPrincipal, type QuestionnaireResponse } from '@hair-analysis/shared';
import { getOrderedQuestions, QUESTIONS, type Question } from '@/data/questions';

const initialAnswers: Partial<QuestionnaireResponse> = {
  usoCalor: [],
  historicoQuimica: [],
  exposicaoAgua: [],
  objetivos: [],
  restricoes: [],
  produtosAtuais: '',
  frequenciaCalor: null,
  tempoUltimaQuimica: null,
  genero: null,
};

function visibleIndices(questions: Question[], answers: Partial<QuestionnaireResponse>): number[] {
  return questions.map((_, i) => i).filter((i) => {
    const q = questions[i];
    return q ? (q.showIf ? q.showIf(answers) : true) : false;
  });
}

type QuestionnaireState = {
  questions: Question[];
  answers: Partial<QuestionnaireResponse>;
  stepIndex: number;
  start: (objetivo: ObjetivoPrincipal | null) => void;
  setAnswer: <K extends keyof QuestionnaireResponse>(id: K, value: QuestionnaireResponse[K]) => void;
  canAdvance: () => boolean;
  isLast: () => boolean;
  next: () => void;
  back: () => void;
  progress: () => { current: number; total: number };
  getValidatedResponse: () => QuestionnaireResponse | null;
  reset: () => void;
};

export const useQuestionnaireStore = create<QuestionnaireState>((set, get) => ({
  questions: QUESTIONS,
  answers: { ...initialAnswers },
  stepIndex: 0,

  start: (objetivo) =>
    set((s) => {
      const questions = getOrderedQuestions(objetivo);
      const stillValidIndex = s.stepIndex < questions.length ? s.stepIndex : 0;
      return { questions, stepIndex: stillValidIndex };
    }),

  setAnswer: (id, value) => set((s) => ({ answers: { ...s.answers, [id]: value } })),

  canAdvance: () => {
    const { answers, stepIndex, questions } = get();
    const q = questions[stepIndex];
    if (!q) return false;
    if (q.kind === 'single') {
      if (q.id === 'genero') return true;
      const value = answers[q.id];
      return value !== undefined && value !== null && value !== '';
    }
    if (q.kind === 'multi') {
      const arr = (answers[q.id] as string[] | undefined) ?? [];
      return arr.length >= (q.minSelected ?? 0);
    }
    return true;
  },

  isLast: () => {
    const { answers, stepIndex, questions } = get();
    const vis = visibleIndices(questions, answers);
    return vis.at(-1) === stepIndex;
  },

  next: () =>
    set((s) => {
      const vis = visibleIndices(s.questions, s.answers);
      const pos = vis.indexOf(s.stepIndex);
      const nextIndex = vis[pos + 1];
      return nextIndex !== undefined ? { stepIndex: nextIndex } : {};
    }),

  back: () =>
    set((s) => {
      const vis = visibleIndices(s.questions, s.answers);
      const pos = vis.indexOf(s.stepIndex);
      const prevIndex = pos > 0 ? vis[pos - 1] : undefined;
      return prevIndex !== undefined ? { stepIndex: prevIndex } : {};
    }),

  progress: () => {
    const { answers, stepIndex, questions } = get();
    const vis = visibleIndices(questions, answers);
    return { current: vis.indexOf(stepIndex) + 1, total: vis.length };
  },

  getValidatedResponse: () => {
    const parsed = questionnaireResponseSchema.safeParse(get().answers);
    return parsed.success ? parsed.data : null;
  },

  reset: () => set({ answers: { ...initialAnswers }, stepIndex: 0 }),
}));
