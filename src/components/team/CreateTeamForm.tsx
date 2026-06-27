import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EventFormFieldError, EventFormFieldLabel } from '../calendar/EventFormFieldLabel';
import { inputPresets, radius, spacing, typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { debugCreateTeamAttempt } from '../../lib/teamRepository';
import { useTeam } from '../../team/TeamProvider';
import {
  DEFAULT_TEAM_FORMAT,
  TEAM_FORMAT_OPTIONS,
  type TeamFormat,
} from '../../types/teamFormat';

type CreateTeamFormProps = {
  onCreated?: (teamName: string) => void;
};

export function CreateTeamForm({ onCreated }: CreateTeamFormProps) {
  const { refreshTeams, selectTeam } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const [teamName, setTeamName] = useState('');
  const [teamFormat, setTeamFormat] = useState<TeamFormat>(DEFAULT_TEAM_FORMAT);
  const [submitting, setSubmitting] = useState(false);
  const [debugText, setDebugText] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...cardPresets.default.container,
          marginBottom: 0,
          gap: spacing.lg,
        },
        intro: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
        field: {
          gap: spacing.sm,
        },
        input: {
          ...inputPresets.default.field,
          marginBottom: 0,
        },
        inputError: {
          borderColor: palette.status.error,
        },
        formatOptions: {
          gap: spacing.sm,
        },
        formatOption: {
          borderWidth: 1,
          borderColor: palette.border.default,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        formatOptionSelected: {
          borderColor: palette.interactive.primary,
          backgroundColor: palette.background.secondary,
        },
        formatOptionPressed: {
          opacity: 0.85,
        },
        formatOptionDisabled: {
          opacity: 0.6,
        },
        formatLabel: {
          ...typography.bodySmall,
          color: palette.text.primary,
        },
        formatHint: {
          ...typography.caption,
          color: palette.text.secondary,
          lineHeight: 18,
        },
        submitButton: {
          backgroundColor: palette.interactive.primary,
          borderRadius: radius.md,
          paddingVertical: spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        submitButtonDisabled: {
          opacity: 0.6,
        },
        submitButtonPressed: {
          opacity: 0.85,
        },
        submitButtonText: {
          ...typography.bodySmall,
          fontWeight: typography.label.fontWeight,
          color: palette.text.primary,
        },
        debugPanel: {
          borderWidth: 1,
          borderColor: palette.border.default,
          borderRadius: radius.md,
          backgroundColor: palette.background.secondary,
          padding: spacing.md,
          gap: spacing.sm,
        },
        debugTitle: {
          ...typography.label,
          color: palette.text.primary,
        },
        debugText: {
          ...typography.caption,
          color: palette.text.primary,
          fontFamily: 'monospace',
          lineHeight: 18,
        },
        checkmark: {
          ...typography.bodySmall,
          color: palette.text.primary,
          fontWeight: typography.label.fontWeight,
        },
      }),
    [cardPresets, palette],
  );

  const handleSubmit = () => {
    if (submitting) {
      return;
    }

    const trimmed = teamName.trim();
    const nextNameError =
      trimmed.length === 0
        ? 'Team name is required.'
        : trimmed.length < 2
          ? 'Team name must be at least 2 characters.'
          : null;

    setNameError(nextNameError);
    setDebugText('Create started');

    if (nextNameError) {
      return;
    }

    void (async () => {
      setSubmitting(true);

      try {
        const result = await debugCreateTeamAttempt(trimmed, teamFormat);
        setDebugText(result.debugText);

        if (!result.verified) {
          return;
        }

        await refreshTeams();

        if (result.parsedTeamId) {
          await selectTeam(result.parsedTeamId);
        }

        onCreated?.(trimmed);
      } catch (attemptError) {
        const message =
          attemptError instanceof Error ? attemptError.message : 'Create team attempt failed.';

        setDebugText((current) =>
          [current ?? 'Create started', `Unhandled error: ${message}`].join('\n\n'),
        );
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <View style={styles.card}>
      <Text style={styles.intro}>
        Start a team you own. Your memberships on other teams stay unchanged.
      </Text>

      <View style={styles.field}>
        <EventFormFieldLabel label="Team Name" required />
        <TextInput
          value={teamName}
          onChangeText={(value) => {
            setTeamName(value);
            if (nameError) {
              setNameError(null);
            }
          }}
          placeholder="e.g. Varsity Offense"
          placeholderTextColor={inputPresets.default.placeholderColor}
          style={[styles.input, nameError && styles.inputError]}
          maxLength={120}
          editable={!submitting}
        />
        <EventFormFieldError message={nameError} />
      </View>

      <View style={styles.field}>
        <EventFormFieldLabel label="Team Format" required />
        <View style={styles.formatOptions}>
          {TEAM_FORMAT_OPTIONS.map((option) => {
            const isSelected = teamFormat === option.value;

            return (
              <Pressable
                key={option.value}
                style={({ pressed }) => [
                  styles.formatOption,
                  isSelected && styles.formatOptionSelected,
                  submitting && styles.formatOptionDisabled,
                  pressed && !submitting && styles.formatOptionPressed,
                ]}
                onPress={() => setTeamFormat(option.value)}
                disabled={submitting}
              >
                <Text style={styles.formatLabel}>{option.label}</Text>
                {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.formatHint}>
          Sets how many players appear in the Play Designer for this team.
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          submitting && styles.submitButtonDisabled,
          pressed && !submitting && styles.submitButtonPressed,
        ]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={palette.text.primary} />
        ) : (
          <Text style={styles.submitButtonText}>Create Team</Text>
        )}
      </Pressable>

      {debugText ? (
        <View style={styles.debugPanel} accessibilityRole="text">
          <Text style={styles.debugTitle}>Create Team debug output</Text>
          <Text selectable style={styles.debugText}>
            {debugText}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
