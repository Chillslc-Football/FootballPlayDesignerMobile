import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';
import { spacing, typography } from '../../design-system';
import type { TeamManagementRosterRow } from '../../types/teamRoster';
import {
  formatTeamManagementRoleLabel,
  getTeamManagementPrimaryLabel,
  getTeamManagementSecondaryEmail,
} from '../../utils/teamManagementRoster';
import { ProfileInitialsAvatar } from '../roster/ProfileInitialsAvatar';
import { PhoneActions } from '../phone/PhoneActions';
import { getRosterPlayerInitials } from '../../utils/rosterDisplay';

type TeamManagementRosterItemProps = {
  row: TeamManagementRosterRow;
  isLast?: boolean;
  canRemove?: boolean;
  removing?: boolean;
  onRemove?: () => void;
};

function getStatusColors(
  status: TeamManagementRosterRow['status'],
  palette: ReturnType<typeof useAppTheme>['palette'],
): { backgroundColor: string; color: string } {
  switch (status) {
    case 'Active':
      return {
        backgroundColor: `${palette.status.success}22`,
        color: palette.status.success,
      };
    case 'Pending':
      return {
        backgroundColor: `${palette.status.warning}22`,
        color: palette.status.warning,
      };
    case 'Expired':
      return {
        backgroundColor: `${palette.text.secondary}22`,
        color: palette.text.secondary,
      };
    case 'Revoked':
      return {
        backgroundColor: `${palette.status.error}22`,
        color: palette.status.error,
      };
    default:
      return {
        backgroundColor: `${palette.text.secondary}22`,
        color: palette.text.secondary,
      };
  }
}

export function TeamManagementRosterItem({
  row,
  isLast = false,
  canRemove = false,
  removing = false,
  onRemove,
}: TeamManagementRosterItemProps) {
  const { palette, colors } = useAppTheme();
  const primaryLabel = getTeamManagementPrimaryLabel(row);
  const secondaryEmail = getTeamManagementSecondaryEmail(row);
  const roleLabel = formatTeamManagementRoleLabel(row.role);
  const statusColors = getStatusColors(row.status, palette);
  const showRemove = canRemove && row.kind === 'member' && onRemove;
  const memberPhone = row.kind === 'member' ? row.phone : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          gap: spacing.md,
        },
        itemBorder: {
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        content: {
          flex: 1,
          gap: 4,
        },
        name: {
          ...typography.bodySmall,
          fontSize: typography.subheading.fontSize,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.primary,
        },
        email: {
          ...typography.bodySmall,
          color: palette.text.secondary,
        },
        metaRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.xs,
        },
        role: {
          ...typography.caption,
          color: palette.text.secondary,
        },
        phone: {
          ...typography.caption,
          color: palette.text.secondary,
          marginTop: spacing.xs,
        },
        statusBadge: {
          borderRadius: 999,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
        },
        statusText: {
          ...typography.caption,
          fontWeight: typography.label.fontWeight,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        },
        removeButton: {
          minWidth: 72,
          minHeight: 36,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: palette.status.error,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.sm,
        },
        removeButtonDisabled: {
          opacity: 0.6,
        },
        removeButtonPressed: {
          opacity: 0.85,
        },
        removeButtonText: {
          ...typography.caption,
          fontWeight: typography.label.fontWeight,
          color: palette.status.error,
        },
      }),
    [colors, palette],
  );

  return (
    <View style={[styles.item, !isLast && styles.itemBorder]}>
      <ProfileInitialsAvatar initials={getRosterPlayerInitials(primaryLabel)} />
      <View style={styles.content}>
        <Text style={styles.name}>{primaryLabel}</Text>
        {secondaryEmail ? <Text style={styles.email}>{secondaryEmail}</Text> : null}
        <View style={styles.metaRow}>
          <Text style={styles.role}>{roleLabel}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusColors.color }]}>{row.status}</Text>
          </View>
        </View>
        {memberPhone ? <Text style={styles.phone}>{memberPhone}</Text> : null}
        <PhoneActions phone={memberPhone} />
      </View>
      {showRemove ? (
        <Pressable
          style={({ pressed }) => [
            styles.removeButton,
            removing && styles.removeButtonDisabled,
            pressed && !removing && styles.removeButtonPressed,
          ]}
          onPress={onRemove}
          disabled={removing}
        >
          {removing ? (
            <ActivityIndicator color={palette.status.error} size="small" />
          ) : (
            <Text style={styles.removeButtonText}>Remove</Text>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}
