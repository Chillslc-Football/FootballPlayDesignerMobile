import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PositionPickerModal } from '../../components/roster/PositionPickerModal';
import { ScreenContainer } from '../../components/ScreenContainer';
import { useAppTheme } from '../../design-system';
import { radius, spacing, typography } from '../../design-system';
import { fetchTeamPlayDataByTeam } from '../../lib/playRepository';
import { updateTeamMemberPlayerInfo } from '../../lib/teamRepository';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { PLAYER_POSITIONS } from '../../types/playerPosition';
import { useTeam } from '../../team/TeamProvider';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { parseJerseyNumberInput } from '../../utils/rosterDisplay';
import {
  buildRosterPositionOptions,
  extractPositionsFromTeamPlayData,
  isRosterPositionAllowed,
} from '../../utils/teamPlayPositions';

type Props = NativeStackScreenProps<MoreStackParamList, 'RosterPlayerEdit'>;

type ActivePicker = 'primary' | 'secondary' | null;

export function RosterPlayerEditScreen({ navigation, route }: Props) {
  const { userId, displayName, jerseyNumber, primaryPosition, secondaryPosition } = route.params;
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const [jerseyInput, setJerseyInput] = useState(
    jerseyNumber === null ? '' : String(jerseyNumber),
  );
  const [primary, setPrimary] = useState<string | null>(primaryPosition);
  const [secondary, setSecondary] = useState<string | null>(secondaryPosition);
  const [positionOptions, setPositionOptions] = useState<string[]>([...PLAYER_POSITIONS]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = canEditPlayMetadata(selectedTeamMemberRole);

  useEffect(() => {
    const teamId = selectedTeam?.id;

    if (!teamId) {
      setPositionOptions(
        buildRosterPositionOptions([], [primaryPosition, secondaryPosition]),
      );
      setLoadingPositions(false);
      return;
    }

    void (async () => {
      setLoadingPositions(true);

      try {
        const playData = await fetchTeamPlayDataByTeam(teamId);
        const playDerived = extractPositionsFromTeamPlayData(playData);
        setPositionOptions(
          buildRosterPositionOptions(playDerived, [primaryPosition, secondaryPosition]),
        );
      } catch {
        setPositionOptions(
          buildRosterPositionOptions([], [primaryPosition, secondaryPosition]),
        );
      } finally {
        setLoadingPositions(false);
      }
    })();
  }, [primaryPosition, secondaryPosition, selectedTeam?.id]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: spacing.lg,
        },
        card: {
          ...cardPresets.default.container,
          gap: spacing.lg,
          marginBottom: 0,
        },
        fieldGroup: {
          gap: spacing.sm,
        },
        label: {
          ...typography.bodySmall,
          fontWeight: typography.label.fontWeight,
          color: palette.text.label,
          textTransform: 'uppercase',
          letterSpacing: typography.label.letterSpacing,
        },
        input: {
          backgroundColor: palette.background.secondary,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: palette.border.default,
          paddingHorizontal: 14,
          paddingVertical: spacing.md,
          fontSize: typography.subheading.fontSize,
          color: palette.text.primary,
          minHeight: 44,
        },
        pickerButton: {
          backgroundColor: palette.background.secondary,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: palette.border.default,
          paddingHorizontal: 14,
          paddingVertical: spacing.md,
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        pickerButtonDisabled: {
          opacity: 0.6,
        },
        pickerButtonPressed: {
          opacity: 0.9,
        },
        pickerValue: {
          ...typography.bodySmall,
          color: palette.text.primary,
        },
        pickerPlaceholder: {
          ...typography.bodySmall,
          color: palette.text.muted,
        },
        chevron: {
          fontSize: 20,
          color: palette.text.muted,
          fontWeight: '300',
        },
        helperText: {
          ...typography.caption,
          color: palette.text.muted,
        },
        error: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 22,
        },
        saveButton: {
          backgroundColor: palette.interactive.primary,
          borderRadius: radius.md,
          minHeight: 44,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
        },
        saveButtonPressed: {
          opacity: 0.9,
        },
        saveButtonDisabled: {
          opacity: 0.6,
        },
        saveButtonText: {
          ...typography.bodySmall,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.primary,
        },
        unauthorized: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
      }),
    [cardPresets, palette],
  );

  if (!canEdit) {
    return (
      <ScreenContainer title="Edit Player" subtitle={displayName}>
        <Text style={styles.unauthorized}>You do not have permission to edit player information.</Text>
      </ScreenContainer>
    );
  }

  const handleSave = () => {
    if (!selectedTeam || saving) {
      return;
    }

    const parsedJersey = parseJerseyNumberInput(jerseyInput);

    if (parsedJersey === 'invalid') {
      setError('Jersey number must be between 0 and 99.');
      return;
    }

    if (!isRosterPositionAllowed(primary, positionOptions)) {
      setError('Choose a valid primary position.');
      return;
    }

    if (!isRosterPositionAllowed(secondary, positionOptions)) {
      setError('Choose a valid secondary position.');
      return;
    }

    void (async () => {
      setSaving(true);
      setError(null);

      try {
        await updateTeamMemberPlayerInfo(selectedTeam.id, userId, {
          jerseyNumber: parsedJersey,
          primaryPosition: primary,
          secondaryPosition: secondary,
        });
        navigation.goBack();
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : 'Failed to save player information.';
        setError(message);
      } finally {
        setSaving(false);
      }
    })();
  };

  return (
    <ScreenContainer title="Edit Player" subtitle={displayName}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Jersey Number</Text>
            <TextInput
              value={jerseyInput}
              onChangeText={setJerseyInput}
              placeholder="Optional (0–99)"
              placeholderTextColor={palette.text.muted}
              style={styles.input}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.helperText}>Leave blank if this player has no jersey number.</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Primary Position</Text>
            <Pressable
              style={({ pressed }) => [
                styles.pickerButton,
                loadingPositions && styles.pickerButtonDisabled,
                pressed && !loadingPositions && styles.pickerButtonPressed,
              ]}
              onPress={() => setActivePicker('primary')}
              disabled={loadingPositions}
            >
              {loadingPositions ? (
                <ActivityIndicator color={palette.text.muted} size="small" />
              ) : (
                <>
                  <Text style={primary ? styles.pickerValue : styles.pickerPlaceholder}>
                    {primary ?? 'Select position'}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Secondary Position</Text>
            <Pressable
              style={({ pressed }) => [
                styles.pickerButton,
                loadingPositions && styles.pickerButtonDisabled,
                pressed && !loadingPositions && styles.pickerButtonPressed,
              ]}
              onPress={() => setActivePicker('secondary')}
              disabled={loadingPositions}
            >
              {loadingPositions ? (
                <ActivityIndicator color={palette.text.muted} size="small" />
              ) : (
                <>
                  <Text style={secondary ? styles.pickerValue : styles.pickerPlaceholder}>
                    {secondary ?? 'None'}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            (pressed || saving) && styles.saveButtonPressed,
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={palette.text.primary} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </View>

      <PositionPickerModal
        visible={activePicker === 'primary'}
        title="Primary Position"
        options={positionOptions}
        selectedValue={primary}
        onSelect={setPrimary}
        onClose={() => setActivePicker(null)}
      />

      <PositionPickerModal
        visible={activePicker === 'secondary'}
        title="Secondary Position"
        options={positionOptions}
        selectedValue={secondary}
        allowNone
        onSelect={setSecondary}
        onClose={() => setActivePicker(null)}
      />
    </ScreenContainer>
  );
}
