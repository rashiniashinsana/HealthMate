import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useHealth } from '../hooks/useHealth';
import { UserGoals } from '../types/goals';
import { COLORS, RADII, SPACING } from '../utils/constants';
import {
  ActivityLevel,
  BmiInputErrors,
  BmiResult,
  calculateBMI,
  getRecommendedBaselines,
  validateBmiInputs,
} from '../utils/healthCalculators';
import { showAlert } from '../utils/platformAlert';

interface BmiCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

const ACTIVITY_OPTIONS: Array<{ key: ActivityLevel; label: string }> = [
  { key: 'light', label: 'Light' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'active', label: 'Active' },
];

export const BmiCalculatorModal: React.FC<BmiCalculatorModalProps> = ({
  visible,
  onClose,
}) => {
  const { updateGoals } = useHealth();

  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('68');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [errors, setErrors] = useState<BmiInputErrors>({});
  const [result, setResult] = useState<{
    bmi: BmiResult;
    baselines: UserGoals;
  } | null>(null);
  const [applying, setApplying] = useState(false);

  const handleCalculate = useCallback(() => {
    const nextErrors = validateBmiInputs(height, weight);
    setErrors(nextErrors);

    if (nextErrors.height || nextErrors.weight) {
      setResult(null);
      return;
    }

    const weightKg = Number(weight.trim());
    const heightCm = Number(height.trim());

    setResult({
      bmi: calculateBMI(weightKg, heightCm),
      baselines: getRecommendedBaselines(weightKg, activityLevel),
    });
  }, [height, weight, activityLevel]);

  const handleApplyGoals = useCallback(async () => {
    if (!result) {
      return;
    }
    try {
      setApplying(true);
      await updateGoals(result.baselines);
      onClose();
      showAlert(
        'Goals Updated',
        `Applied daily targets: ${result.baselines.stepGoal.toLocaleString()} steps, ${result.baselines.calorieGoal.toLocaleString()} kcal, and ${result.baselines.waterGoal.toLocaleString()} ml water.`
      );
    } catch (err) {
      showAlert(
        'Update Failed',
        err instanceof Error ? err.message : 'Could not update your goals.'
      );
    } finally {
      setApplying(false);
    }
  }, [result, updateGoals, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons
                name="calculator-variant-outline"
                size={22}
                color={COLORS.primary}
              />
              <Text style={styles.title}>BMI & Baseline Calculator</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={COLORS.textMuted}
              />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollBody}
          >
            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.height ? styles.inputError : undefined,
                  ]}
                  value={height}
                  onChangeText={(text) => {
                    setHeight(text);
                    if (errors.height) {
                      setErrors((prev) => ({ ...prev, height: undefined }));
                    }
                  }}
                  placeholder="170"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                {errors.height ? (
                  <Text style={styles.errorText}>{errors.height}</Text>
                ) : null}
              </View>

              <View style={styles.inputCol}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.weight ? styles.inputError : undefined,
                  ]}
                  value={weight}
                  onChangeText={(text) => {
                    setWeight(text);
                    if (errors.weight) {
                      setErrors((prev) => ({ ...prev, weight: undefined }));
                    }
                  }}
                  placeholder="68"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="decimal-pad"
                  maxLength={5}
                />
                {errors.weight ? (
                  <Text style={styles.errorText}>{errors.weight}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.activityGroup}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.segmentedRow}>
                {ACTIVITY_OPTIONS.map((opt) => {
                  const selected = activityLevel === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setActivityLevel(opt.key)}
                      style={[
                        styles.segmentPill,
                        selected && styles.segmentPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          selected && styles.segmentTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={handleCalculate}
              style={({ pressed }) => [
                styles.calculateBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.calculateBtnText}>Calculate</Text>
            </Pressable>

            {result ? (
              <View style={styles.resultCard}>
                <View style={styles.bmiTopRow}>
                  <View
                    style={[
                      styles.bmiBadge,
                      { backgroundColor: result.bmi.tint },
                    ]}
                  >
                    <Text
                      style={[styles.bmiScore, { color: result.bmi.color }]}
                    >
                      {result.bmi.bmi.toFixed(1)}
                    </Text>
                    <Text
                      style={[styles.bmiUnit, { color: result.bmi.color }]}
                    >
                      BMI
                    </Text>
                  </View>

                  <View style={styles.bmiInfo}>
                    <Text
                      style={[styles.bmiCategory, { color: result.bmi.color }]}
                    >
                      {result.bmi.category}
                    </Text>
                    <Text style={styles.bmiTip}>{result.bmi.healthRisk}</Text>
                  </View>
                </View>

                <View style={styles.baselinesBox}>
                  <Text style={styles.baselinesTitle}>
                    Recommended Daily Targets
                  </Text>
                  <View style={styles.baselinesGrid}>
                    <View style={styles.baselineItem}>
                      <Text
                        style={[styles.baselineVal, { color: COLORS.steps }]}
                      >
                        {result.baselines.stepGoal.toLocaleString()}
                      </Text>
                      <Text style={styles.baselineLbl}>Steps</Text>
                    </View>
                    <View style={styles.baselineItem}>
                      <Text
                        style={[
                          styles.baselineVal,
                          { color: COLORS.calories },
                        ]}
                      >
                        {result.baselines.calorieGoal.toLocaleString()}
                      </Text>
                      <Text style={styles.baselineLbl}>kcal</Text>
                    </View>
                    <View style={styles.baselineItem}>
                      <Text
                        style={[styles.baselineVal, { color: COLORS.water }]}
                      >
                        {result.baselines.waterGoal.toLocaleString()}
                      </Text>
                      <Text style={styles.baselineLbl}>ml Water</Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={handleApplyGoals}
                  disabled={applying}
                  style={({ pressed }) => [
                    styles.applyBtn,
                    applying && styles.disabledBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-circle-outline"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.applyBtnText}>
                    {applying ? 'Applying…' : 'Apply to My Goals'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollBody: {
    gap: SPACING.md,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  inputCol: {
    flex: 1,
    gap: SPACING.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  input: {
    height: 44,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surfaceMuted,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.error,
  },
  activityGroup: {
    gap: SPACING.xs,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  segmentPill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.full,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  segmentPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  calculateBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADII.md,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculateBtnText: {
    color: COLORS.textOnPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: RADII.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  bmiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bmiBadge: {
    width: 68,
    height: 68,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bmiScore: {
    fontSize: 20,
    fontWeight: '800',
  },
  bmiUnit: {
    fontSize: 10,
    fontWeight: '700',
  },
  bmiInfo: {
    flex: 1,
    gap: 2,
  },
  bmiCategory: {
    fontSize: 16,
    fontWeight: '800',
  },
  bmiTip: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
  },
  baselinesBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  baselinesTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  baselinesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  baselineItem: {
    flex: 1,
    alignItems: 'center',
  },
  baselineVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  baselineLbl: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADII.md,
    height: 44,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.8,
  },
});
