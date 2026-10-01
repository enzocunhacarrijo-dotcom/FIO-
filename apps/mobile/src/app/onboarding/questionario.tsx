import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/button';
import { HelpNote } from '@/components/help-note';
import { OptionCard } from '@/components/option-card';
import { ProgressBar } from '@/components/progress-bar';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { resolveOptions, toggleMultiValue } from '@/data/questions';
import { submitQuestionnaire } from '@/api/questionnaire';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { useQuestionnaireStore } from '@/store/questionnaire';
import { colors, fontFamily, spacing } from '@/theme/tokens';

export default function QuestionarioScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const start = useQuestionnaireStore((s) => s.start);
  const questions = useQuestionnaireStore((s) => s.questions);
  const answers = useQuestionnaireStore((s) => s.answers);
  const stepIndex = useQuestionnaireStore((s) => s.stepIndex);
  const setAnswer = useQuestionnaireStore((s) => s.setAnswer);
  const canAdvance = useQuestionnaireStore((s) => s.canAdvance());
  const isLast = useQuestionnaireStore((s) => s.isLast());
  const { current, total } = useQuestionnaireStore(useShallow((s) => s.progress()));
  const next = useQuestionnaireStore((s) => s.next);
  const back = useQuestionnaireStore((s) => s.back);
  const getValidatedResponse = useQuestionnaireStore((s) => s.getValidatedResponse);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question = questions[stepIndex];
  if (!question) return null;
  const options = resolveOptions(question, answers);

  async function handleContinue() {
    if (!isLast) {
      next();
      return;
    }

    if (!accessToken) {
      setSubmitError('Sessão inválida. Volte e entre novamente.');
      return;
    }
    const respostas = getValidatedResponse();
    if (!respostas) {
      setSubmitError('Algumas respostas ficaram incompletas. Revise as etapas anteriores.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitQuestionnaire(accessToken, respostas);
      router.replace('/captura');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Não foi possível salvar suas respostas.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    if (current > 1) {
      back();
    } else {
      router.back();
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.topBar}>
          <ScreenHeader title="Sobre você e seu cabelo" onBack={handleBack} />
          <ProgressBar current={current} total={total} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.questionHeader}>
            <Text style={styles.title}>{question.title}</Text>
            {question.subtitle && <Text style={styles.subtitle}>{question.subtitle}</Text>}
            {question.helpText && <HelpNote key={question.id} text={question.helpText} />}
          </View>

          {question.kind === 'single' && (
            <View style={styles.options}>
              {options.map((opt) => (
                <OptionCard
                  key={opt.value}
                  label={opt.label}
                  mode="single"
                  selected={answers[question.id] === opt.value}
                  onPress={() => setAnswer(question.id, opt.value as never)}
                />
              ))}
            </View>
          )}

          {question.kind === 'multi' && (
            <View style={styles.options}>
              {options.map((opt) => {
                const currentValues = (answers[question.id] as string[] | undefined) ?? [];
                return (
                  <OptionCard
                    key={opt.value}
                    label={opt.label}
                    mode="multi"
                    selected={currentValues.includes(opt.value)}
                    onPress={() =>
                      setAnswer(question.id, toggleMultiValue(currentValues, options, opt.value) as never)
                    }
                  />
                );
              })}
            </View>
          )}

          {question.kind === 'text' && (
            <TextField
              value={(answers[question.id] as string | undefined) ?? ''}
              onChangeText={(text) => setAnswer(question.id, text as never)}
              placeholder={question.placeholder}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          {submitError && <Text style={styles.error}>{submitError}</Text>}
          <Button
            label={isLast ? 'Concluir' : 'Continuar'}
            onPress={handleContinue}
            disabled={!canAdvance}
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  questionHeader: {
    gap: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 23,
    lineHeight: 29,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.textMuted,
  },
  options: {
    gap: spacing.md,
  },
  textArea: {
    minHeight: 100,
    paddingTop: spacing.lg,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  error: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.dangerText,
  },
});
