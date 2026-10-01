import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { hasCompletedQuestionnaire } from '@/api/questionnaire';
import { getLatestPhotos } from '@/api/photos';
import { getLatestAnalysis } from '@/api/analysis';
import { CAPTURE_STEPS } from '@/data/capture-steps';
import { LogoMark } from '@/components/logo';
import { Strand } from '@/components/strand';
import { colors } from '@/theme/tokens';

type Destination =
  | '/welcome'
  | '/onboarding/questionario'
  | '/captura'
  | '/analise'
  | '/analise/resultado';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    if (status !== 'ready') return;

    if (!user) {
      setDestination('/welcome');
      return;
    }
    if (!accessToken) {
      setDestination('/welcome');
      return;
    }

    hasCompletedQuestionnaire(accessToken)
      .then(async (done) => {
        if (!done) {
          setDestination('/onboarding/questionario');
          return;
        }
        const photos = await getLatestPhotos(accessToken);
        const kindsPresent = new Set(photos.map((p) => p.kind));
        const allCaptured = CAPTURE_STEPS.every((step) => kindsPresent.has(step.kind));
        if (!allCaptured) {
          setDestination('/captura');
          return;
        }
        const analysis = await getLatestAnalysis(accessToken);
        setDestination(analysis ? '/analise/resultado' : '/analise');
      })
      .catch(() => setDestination('/onboarding/questionario'));
  }, [status, user, accessToken]);

  if (!destination) {
    return (
      <View style={styles.center}>
        <LogoMark size={72} />
        <Strand width={64} stroke={3} color={colors.primary} animated />
      </View>
    );
  }

  return <Redirect href={destination} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: colors.bg,
  },
});
