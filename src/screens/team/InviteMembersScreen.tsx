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

import { EventFormFieldError, EventFormFieldLabel } from '../../components/calendar/EventFormFieldLabel';
import { EventFormPickerField } from '../../components/calendar/EventFormPickerField';
import { InviteRolePickerModal } from '../../components/team/InviteRolePickerModal';
import { ScreenContainer } from '../../components/ScreenContainer';
import { inputPresets, radius, spacing, typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { createTeamInvite, sendTeamInviteEmail } from '../../lib/teamInviteRepository';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useTeam } from '../../team/TeamProvider';
import type { InviteRole } from '../../types/teamRoster';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import {
  formatInviteRoleLabel,
  getInviteRolesForMemberRole,
  validateInviteEmail,
  validateInviteRole,
} from '../../utils/inviteRoles';

type Props = NativeStackScreenProps<MoreStackParamList, 'InviteMembers'>;

export function InviteMembersScreen({ navigation }: Props) {
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const canInvite = canEditPlayMetadata(selectedTeamMemberRole);
  const allowedRoles = useMemo(
    () => getInviteRolesForMemberRole(selectedTeamMemberRole),
    [selectedTeamMemberRole],
  );

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>(allowedRoles[0] ?? 'player');
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    if (allowedRoles.length === 0) {
      return;
    }

    if (!allowedRoles.includes(role)) {
      setRole(allowedRoles[0]);
    }
  }, [allowedRoles, role]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: spacing.lg,
        },
        card: {
          ...cardPresets.default.container,
          marginBottom: 0,
        },
        intro: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
          marginBottom: spacing.lg,
        },
        field: {
          marginBottom: spacing.lg,
        },
        input: {
          ...inputPresets.default.field,
          marginBottom: 0,
        },
        inputError: {
          borderColor: palette.status.error,
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
        noticeCard: {
          ...cardPresets.default.container,
          marginBottom: 0,
        },
        noticeText: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
        unauthorized: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
        errorBanner: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 22,
          marginBottom: spacing.md,
        },
      }),
    [cardPresets, palette],
  );

  if (!canInvite) {
    return (
      <ScreenContainer title="Invite Members">
        <Text style={styles.unauthorized}>
          Team management actions are available to coaches and team owners.
        </Text>
      </ScreenContainer>
    );
  }

  if (!selectedTeam) {
    return (
      <ScreenContainer title="Invite Members">
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Select a team from More → Account → Switch Team before sending invites.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSubmit = () => {
    if (submitting) {
      return;
    }

    const nextEmailError = validateInviteEmail(email);
    const nextRoleError = validateInviteRole(role, allowedRoles);

    setEmailError(nextEmailError);
    setRoleError(nextRoleError);
    setError(null);

    if (nextEmailError || nextRoleError) {
      return;
    }

    void (async () => {
      setSubmitting(true);

      try {
        const invite = await createTeamInvite(selectedTeam.id, email, role);

        try {
          await sendTeamInviteEmail(invite.token);
        } catch {
          // Invite was created; Team Management will show the pending invite after goBack.
        }

        navigation.goBack();
      } catch (submitError) {
        const message =
          submitError instanceof Error ? submitError.message : 'Could not create invite.';
        setError(message);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <ScreenContainer title="Invite Members" subtitle={selectedTeam.name}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.intro}>
            Enter the recipient&apos;s email and role. They must sign in with that email to join.
            Invites expire in 14 days.
          </Text>

          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <View style={styles.field}>
            <EventFormFieldLabel label="Email" required />
            <TextInput
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (emailError) {
                  setEmailError(null);
                }
              }}
              placeholder="name@example.com"
              placeholderTextColor={inputPresets.default.placeholderColor}
              style={[styles.input, emailError && styles.inputError]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!submitting}
            />
            <EventFormFieldError message={emailError} />
          </View>

          <EventFormPickerField
            label="Role"
            value={formatInviteRoleLabel(role)}
            placeholder="Select role"
            onPress={() => setRolePickerOpen(true)}
            disabled={submitting || allowedRoles.length === 0}
            required
            error={roleError}
          />

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
              <Text style={styles.submitButtonText}>Send Invite</Text>
            )}
          </Pressable>
        </View>
      </View>

      <InviteRolePickerModal
        visible={rolePickerOpen}
        roles={allowedRoles}
        selectedRole={role}
        onSelect={setRole}
        onClose={() => setRolePickerOpen(false)}
      />
    </ScreenContainer>
  );
}
