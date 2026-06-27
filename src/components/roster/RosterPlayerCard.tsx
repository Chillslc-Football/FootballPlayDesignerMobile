import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../../design-system/AppThemeProvider';
import { spacing, typography } from '../../design-system';
import type { TeamRosterMember } from '../../types/team';
import {
  formatRosterJerseyNumber,
  formatRosterPositionLine,
  getRosterPlayerLabel,
} from '../../utils/rosterDisplay';
import { ProfileAvatar } from './ProfileAvatar';
import { PhoneActions } from '../phone/PhoneActions';

type RosterPlayerCardProps = {
  player: TeamRosterMember;
  signedUrl?: string | null;
  onPress: () => void;
  isLast?: boolean;
};

export function RosterPlayerCard({
  player,
  signedUrl = null,
  onPress,
  isLast = false,
}: RosterPlayerCardProps) {
  const { palette, colors } = useAppTheme();
  const label = getRosterPlayerLabel(player);
  const jerseyLabel = formatRosterJerseyNumber(player.jersey_number);
  const positionLine = formatRosterPositionLine(
    player.primary_position,
    player.secondary_position,
  );
  const phone = player.phone?.trim() || null;
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
        itemPressed: {
          backgroundColor: colors.surface,
        },
        content: {
          flex: 1,
          gap: 2,
        },
        jersey: {
          ...typography.caption,
          fontWeight: typography.label.fontWeight,
          color: palette.text.label,
        },
        name: {
          ...typography.bodySmall,
          fontSize: typography.subheading.fontSize,
          fontWeight: typography.subheading.fontWeight,
          color: palette.text.primary,
        },
        positions: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          marginTop: spacing.xs,
        },
        phone: {
          ...typography.caption,
          color: palette.text.secondary,
          marginTop: spacing.xs,
        },
        chevron: {
          fontSize: 22,
          color: colors.textMuted,
          fontWeight: '300',
        },
      }),
    [colors, palette],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        !isLast && styles.itemBorder,
        pressed && styles.itemPressed,
      ]}
      onPress={onPress}
    >
      <ProfileAvatar
        signedUrl={signedUrl}
        displayName={player.display_name}
        email={player.email}
        size="md"
      />
      <View style={styles.content}>
        {jerseyLabel ? <Text style={styles.jersey}>{jerseyLabel}</Text> : null}
        <Text style={styles.name}>{label}</Text>
        {positionLine ? <Text style={styles.positions}>{positionLine}</Text> : null}
        {phone ? <Text style={styles.phone}>{phone}</Text> : null}
        <PhoneActions phone={phone} />
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}
