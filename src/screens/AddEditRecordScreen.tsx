import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  CompositeNavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { useHealth } from '../hooks/useHealth';
import { HealthFormErrors, HealthFormValues } from '../models/HealthRecord';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';
import { CARD_SHADOW, COLORS, RADII, SPACING } from '../utils/constants';
import { getOffsetDateISO, getTodayISO } from '../utils/dateUtils';
import { showAlert } from '../utils/platformAlert';
import {
  hasValidationErrors,
  validateHealthForm,
} from '../utils/validation';

type AddEditRouteProp = RouteProp<RootStackParamList, 'AddEditRecord'>;
type AddEditNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'AddRecord'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const AddEditRecordScreen: React.FC = () => {
  const navigation = useNavigation<AddEditNavProp>();
  const route = useRoute<AddEditRouteProp>();
  const insets = useSafeAreaInsets();
  const existingRecord = route.params?.record;
  const isEditing = Boolean(existingRecord);

  const { addEntry, updateEntry } = useHealth();

  const [values, setValues] = useState<HealthFormValues>({
    date: existingRecord?.date ?? getTodayISO(),
    steps: existingRecord ? String(existingRecord.steps) : '',
    calories: existingRecord ? String(existingRecord.calories) : '',
    water: existingRecord ? String(existingRecord.water) : '',
  });
  const [errors, setErrors] = useState<HealthFormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof HealthFormValues, boolean>>
  >({});
  const [focusedField, setFocusedField] = useState<
    keyof HealthFormValues | null
  >(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = useCallback(
    (field: keyof HealthFormValues, nextValue: string) => {
      const nextValues = { ...values, [field]: nextValue };
      setValues(nextValues);
      setTouched((prev) => ({ ...prev, [field]: true }));
      const nextErrors = validateHealthForm(nextValues);
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
    },
    [values]
  );

  const closeOrReset = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    setValues({
      date: getTodayISO(),
      steps: '',
      calories: '',
      water: '',
    });
    setErrors({});
    setTouched({});
    navigation.navigate('Dashboard');
  }, [navigation]);

  const handleSubmit = useCallback(async () => {
    const allErrors = validateHealthForm(values);
    setErrors(allErrors);
    setTouched({ date: true, steps: true, calories: true, water: true });

    if (hasValidationErrors(allErrors)) {
      return;
    }

    const payload = {
      date: values.date.trim(),
      steps: Number(values.steps.trim()),
      calories: Number(values.calories.trim()),
      water: Number(values.water.trim()),
    };

    try {
      setSubmitting(true);
      if (isEditing && existingRecord) {
        await updateEntry(existingRecord.id, payload);
        closeOrReset();
        showAlert('Record Updated', 'Your health entry has been updated.');
      } else {
        await addEntry(payload);
        closeOrReset();
        showAlert('Record Saved', 'Your daily health entry has been logged.');
      }
    } catch (err) {
      showAlert(
        'Save Failed',
        err instanceof Error ? err.message : 'Unable to save health record.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [values, isEditing, existingRecord, updateEntry, addEntry, closeOrReset]);

  const todayISO = getTodayISO();
  const yesterdayISO = getOffsetDateISO(-1);

  const getInputBoxStyle = (field: keyof HealthFormValues) => {
    const hasError = touched[field] && Boolean(errors[field]);
    const isFocused = focusedField === field;
    return [
      styles.inputBox,
      isFocused && styles.inputBoxFocused,
      hasError && styles.inputBoxError,
    ];
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: SPACING.xl + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          {/* Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <View style={getInputBoxStyle('date')}>
              <MaterialCommunityIcons
                name={Theme.icons.calendar}
                size={20}
                color={COLORS.primary}
              />
              <TextInput
                style={styles.input}
                value={values.date}
                onChangeText={(text) => updateField('date', text)}
                onFocus={() => setFocusedField('date')}
                onBlur={() => setFocusedField(null)}
                placeholder="2026-11-26"
                placeholderTextColor={COLORS.textMuted}
                maxLength={10}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.quickChipsRow}>
              <Pressable
                onPress={() => updateField('date', todayISO)}
                style={[
                  styles.quickChip,
                  values.date === todayISO && styles.quickChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    values.date === todayISO && styles.quickChipTextActive,
                  ]}
                >
                  Today
                </Text>
              </Pressable>
              <Pressable
                onPress={() => updateField('date', yesterdayISO)}
                style={[
                  styles.quickChip,
                  values.date === yesterdayISO && styles.quickChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.quickChipText,
                    values.date === yesterdayISO && styles.quickChipTextActive,
                  ]}
                >
                  Yesterday
                </Text>
              </Pressable>
            </View>
            <View style={styles.errorSlot}>
              {touched.date && errors.date ? (
                <View style={styles.errorRow}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={14}
                    color={COLORS.error}
                  />
                  <Text style={styles.errorText}>{errors.date}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Steps */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Steps Walked</Text>
            <View style={getInputBoxStyle('steps')}>
              <MaterialCommunityIcons
                name={Theme.icons.stepsShoe}
                size={20}
                color={COLORS.steps}
              />
              <TextInput
                style={styles.input}
                value={values.steps}
                onChangeText={(text) => updateField('steps', text)}
                onFocus={() => setFocusedField('steps')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. 8500"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={styles.unitSuffix}>steps</Text>
            </View>
            <View style={styles.errorSlot}>
              {touched.steps && errors.steps ? (
                <View style={styles.errorRow}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={14}
                    color={COLORS.error}
                  />
                  <Text style={styles.errorText}>{errors.steps}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Calories */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Calories Burned</Text>
            <View style={getInputBoxStyle('calories')}>
              <MaterialCommunityIcons
                name={Theme.icons.calories}
                size={20}
                color={COLORS.calories}
              />
              <TextInput
                style={styles.input}
                value={values.calories}
                onChangeText={(text) => updateField('calories', text)}
                onFocus={() => setFocusedField('calories')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. 480"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Text style={styles.unitSuffix}>kcal</Text>
            </View>
            <View style={styles.errorSlot}>
              {touched.calories && errors.calories ? (
                <View style={styles.errorRow}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={14}
                    color={COLORS.error}
                  />
                  <Text style={styles.errorText}>{errors.calories}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Water */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Water Intake (ml)</Text>
            <View style={getInputBoxStyle('water')}>
              <MaterialCommunityIcons
                name={Theme.icons.water}
                size={20}
                color={COLORS.water}
              />
              <TextInput
                style={styles.input}
                value={values.water}
                onChangeText={(text) => updateField('water', text)}
                onFocus={() => setFocusedField('water')}
                onBlur={() => setFocusedField(null)}
                placeholder="e.g. 2000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Text style={styles.unitSuffix}>ml</Text>
            </View>
            <View style={styles.quickChipsRow}>
              {[1000, 1500, 2000, 2500].map((preset) => (
                <Pressable
                  key={preset}
                  onPress={() => updateField('water', String(preset))}
                  style={styles.quickChip}
                >
                  <Text style={styles.quickChipText}>{preset} ml</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.errorSlot}>
              {touched.water && errors.water ? (
                <View style={styles.errorRow}>
                  <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={14}
                    color={COLORS.error}
                  />
                  <Text style={styles.errorText}>{errors.water}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.saveButton,
              submitting && styles.disabledButton,
              pressed && styles.saveButtonPressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.textOnPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={20}
                  color={COLORS.textOnPrimary}
                />
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Update Record' : 'Save Record'}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={closeOrReset}
            disabled={submitting}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
    ...CARD_SHADOW,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  inputBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  inputBoxError: {
    borderColor: COLORS.error,
    backgroundColor: '#FFF5F5',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  unitSuffix: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: 2,
  },
  quickChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.surfaceMuted,
  },
  quickChipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quickChipTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  // Reserve consistent vertical space so validation messages appear without layout shift.
  errorSlot: {
    minHeight: 18,
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error,
  },
  buttonGroup: {
    gap: SPACING.sm + 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: RADII.md,
    height: 52,
    ...CARD_SHADOW,
  },
  saveButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textOnPrimary,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    height: 48,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  pressed: {
    opacity: 0.8,
  },
});
