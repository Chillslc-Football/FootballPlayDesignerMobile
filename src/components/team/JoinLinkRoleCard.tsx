import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';
import { radius, spacing, typography } from '../../design-system';
import type { JoinLinkRole } from '../../types/joinLink';
import { JOIN_LINK_ROLE_HINTS } from '../../types/joinLink';
import { formatInviteRoleLabel } from '../../utils/inviteRoles';
import { formatJoinLinkDisplay } from '../../utils/joinLinkUrl';

type JoinLinkRoleCardProps = {
  role: JoinLinkRole;
  joinUrl: string | null;
  copied: boolean;
  regenerating: boolean;
  disabled?: boolean;
  onCopy: () => void;
  onRegenerate: () => void;
};

export function JoinLinkRoleCard({
  role,
  joinUrl,
  copied,
  regenerating,
  disabled = false,
  onCopy,
  onRegenerate,
}: JoinLinkRoleCardProps) {
  const { palette, cardPresets } = useAppTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...cardPresets.default.container,
          marginBottom: 0,
          gap: spacing.md,
        },
        header: {
          gap: spacing.xs,
        },
        title: {
          ...typography.subheading,
          fontWeight: typography.heading.fontWeight,
          color: palette.text.primary,
        },
        hint: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 20,
        },
        linkBox: {
          borderWidth: 1,
          borderColor: palette.border.default,
          borderRadius: radius.md,
          backgroundColor: palette.background.secondary,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          minHeight: 44,
          justifyContent: 'center',
        },
        linkText: {
          ...typography.bodySmall,
          color: palette.text.primary,
        },
        linkPlaceholder: {
          ...typography.bodySmall,
          color: palette.text.muted,
        },
        actions: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
        },
        actionButton: {
          flexGrow: 1,
          minWidth: 120,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: palette.border.default,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 44,
        },
        actionButtonPrimary: {
          backgroundColor: palette.interactive.primary,
          borderColor: palette.interactive.primary,
        },
        actionButtonDisabled: {
          opacity: 0.6,
        },
        actionButtonPressed: {
          opacity: 0.85,
        },
        actionButtonText: {
          ...typography.bodySmall,
          fontWeight: typography.label.fontWeight,
          color: palette.text.primary,
        },
      }),
    [cardPresets, palette],
  );

  const displayUrl = joinUrl ? formatJoinLinkDisplay(joinUrl) : null;
  const actionsDisabled = disabled || !joinUrl || regenerating;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{formatInviteRoleLabel(role)}</Text>
        <Text style={styles.hint}>{JOIN_LINK_ROLE_HINTS[role]}</Text>
      </View>

      <View style={styles.linkBox}>
        {displayUrl ? (
          <Text style={styles.linkText} selectable>
            {displayUrl}
          </Text>
        ) : (
          <Text style={styles.linkPlaceholder}>Link unavailable</Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.actionButtonPrimary,
            actionsDisabled && styles.actionButtonDisabled,
            pressed && !actionsDisabled && styles.actionButtonPressed,
          ]}
          onPress={onCopy}
          disabled={actionsDisabled}
        >
          <Text style={styles.actionButtonText}>{copied ? 'Copied' : 'Copy Link'}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            actionsDisabled && styles.actionButtonDisabled,
            pressed && !actionsDisabled && styles.actionButtonPressed,
          ]}
          onPress={onRegenerate}
          disabled={actionsDisabled}
        >
          {regenerating ? (
            <ActivityIndicator color={palette.text.primary} size="small" />
          ) : (
            <Text style={styles.actionButtonText}>Regenerate</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
