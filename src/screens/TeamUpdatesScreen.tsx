import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../auth/AuthProvider';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  createTeamUpdate,
  fetchTeamUpdatesByTeam,
  setShowOnHome,
  subscribeTeamUpdatesByTeam,
} from '../lib/teamUpdateRepository';
import { useTeam } from '../team/TeamProvider';
import { colors } from '../theme';
import { DEFAULT_TEAM_UPDATE_TYPE, type TeamUpdate } from '../types/teamUpdate';
import { formatTeamUpdateDate, formatTeamUpdateType } from '../utils/teamUpdateDisplay';

export function TeamUpdatesScreen() {
  const { user } = useAuth();
  const { selectedTeam } = useTeam();
  const [updates, setUpdates] = useState<TeamUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [showOnHome, setShowOnHomeValue] = useState(false);
  const [creating, setCreating] = useState(false);
  const loadedTeamIdRef = useRef<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;

  const resetCreateForm = useCallback(() => {
    setTitle('');
    setBody('');
    setIsPinned(false);
    setShowOnHomeValue(false);
    setShowCreateForm(false);
  }, []);

  const loadUpdates = useCallback(async (teamId: string, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const loadedUpdates = await fetchTeamUpdatesByTeam(teamId);

      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      setUpdates(loadedUpdates);
      setError(null);
      loadedTeamIdRef.current = teamId;
    } catch (loadError) {
      if (selectedTeamIdRef.current !== teamId) {
        return;
      }

      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load team updates.';
      setError(message);

      if (!silent) {
        setUpdates([]);
      }
    } finally {
      if (!silent && selectedTeamIdRef.current === teamId) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeamIdRef.current;

      if (!teamId) {
        setUpdates([]);
        setError(null);
        setLoading(false);
        loadedTeamIdRef.current = null;
        return;
      }

      const isFirstLoadForTeam = loadedTeamIdRef.current !== teamId;
      void loadUpdates(teamId, { silent: !isFirstLoadForTeam });

      const unsubscribe = subscribeTeamUpdatesByTeam(teamId, () => {
        if (selectedTeamIdRef.current !== teamId) {
          return;
        }

        void loadUpdates(teamId, { silent: true });
      });

      return unsubscribe;
    }, [selectedTeam?.id, loadUpdates]),
  );

  const handleCreateUpdate = async () => {
    const teamId = selectedTeamIdRef.current;

    if (!teamId || !user) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const created = await createTeamUpdate({
        teamId,
        title,
        body,
        update_type: DEFAULT_TEAM_UPDATE_TYPE,
        is_pinned: isPinned,
        createdBy: user.id,
      });

      if (showOnHome) {
        await setShowOnHome(created.id, true);
      }

      resetCreateForm();
      await loadUpdates(teamId, { silent: true });
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : 'Failed to create team update.';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const canCreate =
    title.trim().length > 0 && body.trim().length > 0 && !creating && !loading && Boolean(user);

  if (loading) {
    return (
      <ScreenContainer title="Team Updates" subtitle={selectedTeam?.name} scrollable={false}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer title="Team Updates" subtitle={selectedTeam?.name}>
      <Pressable
        style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
        onPress={() => setShowCreateForm((current) => !current)}
      >
        <Text style={styles.createButtonText}>
          {showCreateForm ? 'Cancel' : 'Create Update'}
        </Text>
      </Pressable>

      {showCreateForm ? (
        <View style={styles.createForm}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Update title"
            placeholderTextColor={colors.textMuted}
            editable={!creating}
          />

          <Text style={styles.fieldLabel}>Body</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder="Write the update..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            editable={!creating}
          />

          <Text style={styles.fieldLabel}>Update type</Text>
          <Text style={styles.readOnlyValue}>{formatTeamUpdateType(DEFAULT_TEAM_UPDATE_TYPE)}</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pin update</Text>
            <Switch
              value={isPinned}
              onValueChange={setIsPinned}
              trackColor={{ false: colors.cardBorder, true: colors.accent }}
              thumbColor={colors.text}
              disabled={creating}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Show on home</Text>
            <Switch
              value={showOnHome}
              onValueChange={setShowOnHomeValue}
              trackColor={{ false: colors.cardBorder, true: colors.accent }}
              thumbColor={colors.text}
              disabled={creating}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              (!canCreate || pressed) && styles.submitButtonDisabled,
            ]}
            onPress={handleCreateUpdate}
            disabled={!canCreate}
          >
            {creating ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Post Update</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!error && updates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No team updates have been posted yet.</Text>
        </View>
      ) : null}

      {updates.map((update) => (
        <View
          key={update.id}
          style={[styles.updateCard, update.is_pinned && styles.updateCardPinned]}
        >
          <View style={styles.titleRow}>
            <Text style={styles.updateTitle}>{update.title}</Text>
            <View style={styles.badgeRow}>
              {update.show_on_home ? (
                <View style={styles.homeBadge}>
                  <Text style={styles.homeBadgeText}>Home</Text>
                </View>
              ) : null}
              {update.is_pinned ? (
                <View style={styles.pinnedBadge}>
                  <Text style={styles.pinnedBadgeText}>Pinned</Text>
                </View>
              ) : null}
            </View>
          </View>

          <Text style={styles.updateMeta}>
            {formatTeamUpdateType(update.update_type)} · {formatTeamUpdateDate(update.created_at)}
          </Text>
          <Text style={styles.updateBody}>{update.body}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  createButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
  createForm: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 8,
  },
  bodyInput: {
    minHeight: 120,
  },
  readOnlyValue: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.text,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.background,
  },
  error: {
    fontSize: 15,
    color: colors.gold,
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  updateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  updateCardPinned: {
    borderColor: colors.gold,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  updateTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  homeBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  homeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pinnedBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinnedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  updateMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  updateBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
});
