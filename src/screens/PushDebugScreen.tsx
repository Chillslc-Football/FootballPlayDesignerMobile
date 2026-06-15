import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '../components/ScreenContainer';
import { usePushDebugState } from '../notifications/pushDebugLog';
import { colors } from '../theme';

function formatValue(value: boolean | string | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Unknown';
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  return value;
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function PushDebugScreen() {
  const { snapshot, entries } = usePushDebugState();

  return (
    <ScreenContainer title="Push Debug" subtitle="Temporary troubleshooting view">
      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <DebugRow
          label="PushNotificationProvider mounted"
          value={snapshot.providerMounted ? 'Yes' : 'No'}
        />
        <DebugRow
          label="Authenticated user detected"
          value={snapshot.authenticatedUserId ?? 'No'}
        />
        <DebugRow label="Device.isDevice" value={formatValue(snapshot.isDevice)} />
        <DebugRow
          label="Permission status"
          value={
            snapshot.permissionStatus
              ? `${snapshot.permissionStatus}${
                  snapshot.permissionGranted === null
                    ? ''
                    : ` (granted: ${snapshot.permissionGranted ? 'true' : 'false'})`
                }`
              : 'Unknown'
          }
        />
        <DebugRow label="EAS projectId" value={snapshot.easProjectId ?? 'Missing'} />
        <DebugRow label="Expo push token" value={snapshot.expoPushToken ?? 'Not acquired'} />
        <DebugRow label="Supabase upsert result" value={snapshot.upsertResult ?? 'Not attempted'} />
        <DebugRow label="FLOW STOP" value={snapshot.flowStopMessage ?? 'None'} />
        <DebugRow label="Last debug update" value={snapshot.lastUpdatedAt ?? 'None'} />
      </View>

      <View style={styles.logCard}>
        <Text style={styles.sectionTitle}>Debug Log ({entries.length})</Text>
        {entries.length === 0 ? (
          <Text style={styles.emptyText}>No PushDebug messages captured yet.</Text>
        ) : (
          entries
            .slice()
            .reverse()
            .map((entry) => (
              <View key={entry.id} style={styles.logEntry}>
                <Text style={styles.logMeta}>
                  {entry.timestamp} · {entry.level.toUpperCase()}
                </Text>
                <Text style={styles.logStep}>{entry.step}</Text>
                {entry.details ? (
                  <Text style={styles.logDetails}>{JSON.stringify(entry.details, null, 2)}</Text>
                ) : null}
                {entry.error ? (
                  <Text style={styles.logError}>{JSON.stringify(entry.error, null, 2)}</Text>
                ) : null}
              </View>
            ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  logCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rowValue: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  logEntry: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 12,
    gap: 4,
  },
  logMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  logStep: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  logDetails: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  logError: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.gold,
  },
});
