import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/button';
import { CaptureGuide } from '@/components/capture-guide';
import { Icon } from '@/components/icon';
import { Strand } from '@/components/strand';
import { Text } from '@/components/text';
import { CAPTURE_STEPS } from '@/data/capture-steps';
import { validateCaptureUri, type CaptureValidation } from '@/lib/capture-validation';
import { prepareForUpload } from '@/lib/image-prep';
import { uploadPhoto } from '@/api/photos';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/store/auth';
import { colors, motion, radii, spacing } from '@/theme/tokens';

type ReviewState = { uri: string; validation: CaptureValidation } | null;

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

export default function CapturaScreen() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stepIndex, setStepIndex] = useState(0);
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [review, setReview] = useState<ReviewState>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const step = CAPTURE_STEPS[stepIndex];
  if (!step) return null;

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

  function toggleFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
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
      await uploadPhoto(accessToken, step.kind, prepared);
      setReview(null);
      if (stepIndex + 1 < CAPTURE_STEPS.length) {
        setStepIndex(stepIndex + 1);
      } else {
        router.replace('/analise');
      }
    } catch (err) {
      console.error('[captura] falha ao preparar/enviar foto:', err);
      const detail = err instanceof Error ? err.message : String(err);
      setUploadError(err instanceof ApiError ? err.message : `Não foi possível enviar a foto. (${detail})`);
    } finally {
      setUploading(false);
    }
  }

  if (review) {
    const validation = review.validation;
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeInDown.duration(220)} style={styles.reviewContent}>
          <View style={styles.reviewHeader}>
            <Text variant="eyebrow" tone="muted">
              Foto {stepIndex + 1} de {CAPTURE_STEPS.length}
            </Text>
            <Text variant="h2">{step.title}</Text>
          </View>
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
              label="Refazer"
              variant="secondary"
              onPress={handleRetry}
              disabled={uploading}
              style={styles.actionBtn}
            />
            {validation.ok && (
              <Button
                label="Usar foto"
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
          <View style={styles.permissionIcon}>
            <Icon name="camera" size={24} color={colors.primaryStrong} />
          </View>
          <Text variant="h1">Precisamos da câmera</Text>
          <Text variant="body" tone="muted">
            Para fotografar {step.title.toLowerCase()}, o app precisa de acesso à câmera. Você também pode enviar uma
            foto já existente da galeria.
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
        facing={facing}
        mirror={facing === 'front'}
        onCameraReady={() => setCameraReady(true)}
      />

      <CaptureGuide shape={step.guideShape} caption={step.guideCaption} />

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.instructionPill}>
          <Text variant="eyebrow" tone="onPrimary" style={styles.dim}>
            Foto {stepIndex + 1} de {CAPTURE_STEPS.length}
          </Text>
          <Text variant="bodyLg" tone="onPrimary" style={styles.centerText}>
            {step.instruction}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Trocar câmera"
            onPress={toggleFacing}
            style={styles.galleryBtn}
          >
            <Text variant="caption" tone="onPrimary">
              {facing === 'back' ? 'Selfie' : 'Traseira'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  cameraRoot: { flex: 1, backgroundColor: '#000' },

  permissionContent: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.xxl },
  permissionIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: { gap: spacing.md },

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
  reviewHeader: { gap: spacing.xs },
  reviewImage: { flex: 1, borderRadius: radii.xl, backgroundColor: colors.surfaceSunken },
  reviewActions: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1 },
  errorTextOnDark: { color: '#FFD9CC', textAlign: 'center' },
});
