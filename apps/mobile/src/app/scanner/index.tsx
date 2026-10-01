import { useRef, useState } from 'react';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { validateCaptureUri, type CaptureValidation } from '@/lib/capture-validation';
import { prepareForUpload } from '@/lib/image-prep';
import { scanProduct } from '@/api/scanner';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { useScannerStore } from '@/store/scanner';
import { colors, motion, radii, spacing } from '@/theme/tokens';

type ReviewState = { uri: string; validation: CaptureValidation } | null;

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const GUIDE_H = 220;
const CORNER = 28;

// Retângulo guia com cantos em L e contorno tracejado "marchando".
function LabelGuide({ width }: { width: number }) {
  const offset = useSharedValue(0);
  useEffect(() => {
    offset.value = withRepeat(withTiming(-24, { duration: 1200, easing: Easing.linear }), -1);
  }, [offset]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  const w = width;
  const h = GUIDE_H;
  const r = radii.lg;
  return (
    <Svg width={w} height={h}>
      <AnimatedRect
        x={1.5}
        y={1.5}
        width={w - 3}
        height={h - 3}
        rx={r}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={3}
        strokeDasharray="12 12"
        fill="none"
        animatedProps={animatedProps}
      />
      {[
        `M 1.5 ${CORNER + r} L 1.5 ${r} Q 1.5 1.5 ${r} 1.5 L ${CORNER + r} 1.5`,
        `M ${w - CORNER - r} 1.5 L ${w - r} 1.5 Q ${w - 1.5} 1.5 ${w - 1.5} ${r} L ${w - 1.5} ${CORNER + r}`,
        `M ${w - 1.5} ${h - CORNER - r} L ${w - 1.5} ${h - r} Q ${w - 1.5} ${h - 1.5} ${w - r} ${h - 1.5} L ${w - CORNER - r} ${h - 1.5}`,
        `M ${CORNER + r} ${h - 1.5} L ${r} ${h - 1.5} Q 1.5 ${h - 1.5} 1.5 ${h - r} L 1.5 ${h - CORNER - r}`,
      ].map((d) => (
        <Path key={d} d={d} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" fill="none" />
      ))}
    </Svg>
  );
}

function Shutter({ onPress, disabled, busy }: { onPress: () => void; disabled: boolean; busy: boolean }) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Capturar foto"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.92, motion.spring.press);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, motion.spring.press);
      }}
      disabled={disabled}
    >
      <Animated.View style={[styles.shutterOuter, disabled && styles.shutterDisabled, animated]}>
        {busy ? <Strand width={28} stroke={3} color={colors.text} animated loop /> : <View style={styles.shutterInner} />}
      </Animated.View>
    </Pressable>
  );
}

export default function ScannerCaptureScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setLastResult = useScannerStore((s) => s.setLastResult);
  const { width: screenWidth } = useWindowDimensions();
  const guideWidth = Math.round(screenWidth * 0.78);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [review, setReview] = useState<ReviewState>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function runValidation(uri: string) {
    const validation = await validateCaptureUri(uri);
    setReview({ uri, validation });
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      await runValidation(photo.uri);
    } catch {
      setUploadError('Não foi possível capturar a foto. Tente de novo.');
    } finally {
      setCapturing(false);
    }
  }

  async function handlePickFromGallery() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      setUploadError('Sem acesso à galeria. Permita o acesso nas configurações do iPhone.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (result.canceled || !result.assets[0]) return;
    await runValidation(result.assets[0].uri);
  }

  function handleRetry() {
    setReview(null);
    setUploadError(null);
  }

  async function handleConfirm() {
    if (!review || !review.validation.ok || !accessToken) return;
    setUploading(true);
    setUploadError(null);
    try {
      const prepared = await prepareForUpload(review.uri);
      const result = await scanProduct(accessToken, prepared);
      setLastResult(result);
      router.replace('/scanner/resultado');
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Não foi possível ler este produto.');
    } finally {
      setUploading(false);
    }
  }

  if (review) {
    const validation = review.validation;
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeInDown.duration(220)} style={styles.reviewContent}>
          <ScreenHeader title="Ler produto" onBack={() => router.back()} />
          <Image source={{ uri: review.uri }} style={styles.reviewImage} resizeMode="cover" />
          {!validation.ok && (
            <Text variant="bodySm" tone="danger">
              {validation.message}
            </Text>
          )}
          {uploadError && (
            <Text variant="bodySm" tone="danger">
              {uploadError}
            </Text>
          )}
          <View style={styles.reviewActions}>
            <Button
              label="Tirar de novo"
              variant="secondary"
              onPress={handleRetry}
              disabled={uploading}
              style={styles.actionBtn}
            />
            {validation.ok && (
              <Button
                label="Avaliar produto"
                onPress={handleConfirm}
                loading={uploading}
                disabled={uploading}
                style={styles.actionBtn}
              />
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Strand width={48} stroke={3} color={colors.primary} animated loop />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeInDown.duration(220)} style={styles.permissionContent}>
          <ScreenHeader title="Ler produto" onBack={() => router.back()} />
          <Text variant="body" tone="muted">
            Para ler o rótulo, o app precisa de acesso à câmera. Você também pode enviar uma foto já existente da
            galeria.
          </Text>
          {uploadError && (
            <Text variant="bodySm" tone="danger">
              {uploadError}
            </Text>
          )}
          <View style={styles.stack}>
            <Button label="Permitir câmera" onPress={requestPermission} />
            <Button label="Usar galeria em vez disso" variant="secondary" onPress={handlePickFromGallery} />
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraRoot}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      <View style={styles.guideLayer} pointerEvents="none">
        <LabelGuide width={guideWidth} />
      </View>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.instructionPill}>
          <Text variant="eyebrow" tone="onPrimary" style={styles.dim}>
            Ler produto
          </Text>
          <Text variant="bodyLg" tone="onPrimary" style={styles.centerText}>
          Aponte para a lista de ingredientes do rótulo. Aproxime até o texto ficar nítido e legível.
          </Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomOverlay} pointerEvents="box-none">
        {uploadError && (
          <Text variant="bodySm" style={styles.errorTextOnDark}>
            {uploadError}
          </Text>
        )}
        <View style={styles.captureRow}>
          <Pressable accessibilityRole="button" onPress={handlePickFromGallery} style={styles.galleryBtn}>
            <Text variant="caption" tone="onPrimary">
              Galeria
            </Text>
          </Pressable>
          <Shutter onPress={handleCapture} disabled={!cameraReady || capturing} busy={capturing} />
          <View style={styles.galleryBtn} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  cameraRoot: { flex: 1, backgroundColor: '#000' },

  permissionContent: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: spacing.xxl },
  stack: { gap: spacing.md },

  guideLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  instructionPill: {
    alignSelf: 'center',
    maxWidth: 340,
    backgroundColor: colors.overlay,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
  },
  dim: { textAlign: 'center', opacity: 0.72 },
  centerText: { textAlign: 'center' },

  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterDisabled: { opacity: 0.5 },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' },
  galleryBtn: { width: 64, alignItems: 'center' },

  reviewContent: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  reviewImage: { flex: 1, borderRadius: radii.xl, backgroundColor: colors.surfaceSunken },
  reviewActions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1 },
  errorTextOnDark: { color: '#FFD9CC', textAlign: 'center' },
});
