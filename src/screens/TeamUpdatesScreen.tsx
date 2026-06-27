import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';

import { useAuth } from '../auth/AuthProvider';
import { ScreenContainer } from '../components/ScreenContainer';
import {
  createTeamUpdate,
  fetchTeamUpdatesByTeam,
  subscribeTeamUpdatesByTeam,
} from '../lib/teamUpdateRepository';
import { useTeam } from '../team/TeamProvider';
import { colors } from '../theme';
import { DEFAULT_TEAM_UPDATE_TYPE, type TeamUpdate } from '../types/teamUpdate';
import { canEditPlayMetadata } from '../utils/canEditPlayMetadata';
import { formatTeamUpdateDate } from '../utils/teamUpdateDisplay';
import type { RootTabParamList } from '../navigation/TabNavigator';

type UpdatesRouteProp = RouteProp<RootTabParamList, 'Updates'>;

export function TeamUpdatesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const route = useRoute<UpdatesRouteProp>();
  const { user } = useAuth();
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const [updates, setUpdates] = useState<TeamUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [creating, setCreating] = useState(false);
  const loadedTeamIdRef = useRef<string | null>(null);
  const selectedTeamIdRef = useRef<string | null>(null);

  selectedTeamIdRef.current = selectedTeam?.id ?? null;
  const canCreateUpdate = canEditPlayMetadata(selectedTeamMemberRole);

  const resetCreateForm = useCallback(() => {
    setUpdateText('');
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
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setUpdates([]);
        setError(null);
        setLoading(false);
        loadedTeamIdRef.current = null;
        return;
      }

      const isFirstLoadForTeam = loadedTeamIdRef.current !== teamId;
      void loadUpdates(teamId, { silent: !isFirstLoadForTeam });

      const unsubscribe = subscribeTeamUpdatesByTeam(
        teamId,
        () => {
          if (selectedTeamIdRef.current !== teamId) {
            return;
          }

          void loadUpdates(teamId, { silent: true });
        },
        { channelName: `team-updates-screen:${teamId}` },
      );

      return unsubscribe;
    }, [selectedTeam?.id, loadUpdates]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!route.params?.openCreate || !canCreateUpdate) {
        return;
      }

      setShowCreateForm(true);
      navigation.setParams({});
    }, [canCreateUpdate, navigation, route.params?.openCreate]),
  );

  const handleCreateUpdate = async () => {
    const teamId = selectedTeam?.id;

    if (!teamId || !user) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createTeamUpdate({
        teamId,
        body: updateText,
        update_type: DEFAULT_TEAM_UPDATE_TYPE,
        is_pinned: false,
        createdBy: user.id,
      });

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

  const canSubmit =
    updateText.trim().length > 0 && !creating && !loading && Boolean(user) && canCreateUpdate;

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
      {canCreateUpdate ? (
        <Pressable
          style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          onPress={() => setShowCreateForm((current) => !current)}
        >
          <Text style={styles.createButtonText}>
            {showCreateForm ? 'Cancel' : 'Create Update'}
          </Text>
        </Pressable>
      ) : null}

      {canCreateUpdate && showCreateForm ? (
        <View style={styles.createForm}>
          <Text style={styles.fieldLabel}>Update</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={updateText}
            onChangeText={setUpdateText}
            placeholder="Write the update..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            editable={!creating}
          />

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              (!canSubmit || pressed) && styles.submitButtonDisabled,
            ]}
            onPress={handleCreateUpdate}
            disabled={!canSubmit}
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
        <View key={update.id} style={styles.updateCard}>
          <Text style={styles.updateMeta}>{formatTeamUpdateDate(update.created_at)}</Text>
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
