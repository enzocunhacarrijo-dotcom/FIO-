import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as useNewsreaderFonts,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  useFonts as usePlexSansFonts,
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [newsreaderLoaded] = useNewsreaderFonts({
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
  });
  const [plexSansLoaded] = usePlexSansFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  });

  const fontsReady = newsreaderLoaded && plexSansLoaded;

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
