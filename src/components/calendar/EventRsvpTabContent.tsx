import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '../../design-system';
import {
  RSVP_STATUS_SUMMARY_LABELS,
  type RsvpGroupMember,
  type TeamEventRsvpSummary,
} from '../../utils/teamEventRsvpDisplay';

type EventRsvpTabContentProps = {
  summary: TeamEventRsvpSummary | null;
  loading: boolean;
  error: string | null;
};

function memberLabel(member: RsvpGroupMember): string {
  return member.display_name?.trim() || 'Team member';
}

function SummaryRow({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryCount}>{count}</Text>
    </View>
  );
}

function GroupSection({
  title,
  members,
}: {
  title: string;
  members: RsvpGroupMember[];
}) {
  return (
    <View style={styles.groupSection}>
      <Text style={styles.groupTitle}>{title}</Text>
      {members.length === 0 ? (
        <Text style={styles.emptyGroupText}>None</Text>
      ) : (
        members.map((member) => (
          <Text key={member.user_id} style={styles.memberName}>
            {memberLabel(member)}
          </Text>
        ))
      )}
    </View>
  );
}

export function EventRsvpTabContent({ summary, loading, error }: EventRsvpTabContentProps) {
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={palette.text.muted} size="small" />
      </View>
    );
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  if (!summary) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <SummaryRow label={RSVP_STATUS_SUMMARY_LABELS.accepted} count={summary.counts.accepted} />
        <SummaryRow label={RSVP_STATUS_SUMMARY_LABELS.tentative} count={summary.counts.tentative} />
        <SummaryRow label={RSVP_STATUS_SUMMARY_LABELS.declined} count={summary.counts.declined} />
        <SummaryRow
          label={RSVP_STATUS_SUMMARY_LABELS.noResponse}
          count={summary.counts.noResponse}
        />
      </View>

      <GroupSection title="Accepted" members={summary.accepted} />
      <GroupSection title="Tentative" members={summary.tentative} />
      <GroupSection title="Declined" members={summary.declined} />
      <GroupSection title="No Response" members={summary.noResponse} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  centered: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: palette.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border.default,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    ...typography.body,
    color: palette.text.secondary,
  },
  summaryCount: {
    ...typography.subheading,
    color: palette.text.primary,
    fontVariant: ['tabular-nums'],
  },
  groupSection: {
    gap: spacing.xs,
  },
  groupTitle: {
    ...typography.caption,
    color: palette.text.muted,
    fontWeight: typography.subheading.fontWeight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  memberName: {
    ...typography.body,
    color: palette.text.primary,
    paddingVertical: spacing.xs,
  },
  emptyGroupText: {
    ...typography.body,
    color: palette.text.muted,
    fontStyle: 'italic',
  },
  error: {
    ...typography.body,
    color: palette.status.error,
  },
});
