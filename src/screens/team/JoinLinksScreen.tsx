import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';

import { JoinLinkRoleCard } from '../../components/team/JoinLinkRoleCard';
import { ScreenContainer } from '../../components/ScreenContainer';
import { spacing, typography } from '../../design-system';
import { useAppTheme } from '../../design-system/AppThemeProvider';
import { fetchTeamJoinLinks, regenerateTeamJoinLink } from '../../lib/joinLinkRepository';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useTeam } from '../../team/TeamProvider';
import type { JoinLinkRecord, JoinLinkRole } from '../../types/joinLink';
import { canEditPlayMetadata } from '../../utils/canEditPlayMetadata';
import { getInviteRolesForMemberRole } from '../../utils/inviteRoles';
import { buildJoinTeamUrl, getJoinLinkWebAppOrigin, MISSING_WEB_APP_URL_MESSAGE } from '../../utils/joinLinkUrl';

type Props = NativeStackScreenProps<MoreStackParamList, 'JoinLinks'>;

export function JoinLinksScreen({}: Props) {
  const { selectedTeam, selectedTeamMemberRole } = useTeam();
  const { palette, cardPresets } = useAppTheme();
  const canManageLinks = canEditPlayMetadata(selectedTeamMemberRole);
  const allowedRoles = useMemo(
    () => getInviteRolesForMemberRole(selectedTeamMemberRole),
    [selectedTeamMemberRole],
  );

  const [links, setLinks] = useState<JoinLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedRole, setCopiedRole] = useState<JoinLinkRole | null>(null);
  const [regeneratingRole, setRegeneratingRole] = useState<JoinLinkRole | null>(null);
  const hasLoadedRef = useRef(false);

  const loadLinks = useCallback(
    async (teamId: string, background = false) => {
      if (!background) {
        setLoading(true);
      }
      setError(null);

      try {
        const loadedLinks = await fetchTeamJoinLinks(teamId);
        setLinks(loadedLinks);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Failed to load join links.';
        setError(message);
        if (!background) {
          setLinks([]);
        }
      } finally {
        if (!background) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId || !canManageLinks) {
        setLinks([]);
        setError(null);
        setLoading(false);
        hasLoadedRef.current = false;
        return;
      }

      void loadLinks(teamId, hasLoadedRef.current);
      hasLoadedRef.current = true;
    }, [canManageLinks, loadLinks, selectedTeam?.id]),
  );

  const linksByRole = useMemo(() => {
    const map = new Map<JoinLinkRole, JoinLinkRecord>();

    for (const link of links) {
      map.set(link.role, link);
    }

    return map;
  }, [links]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          gap: spacing.lg,
        },
        intro: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
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
        warningText: {
          ...typography.bodySmall,
          color: palette.status.warning,
          lineHeight: 22,
        },
        unauthorized: {
          ...typography.bodySmall,
          color: palette.text.secondary,
          lineHeight: 22,
        },
        centered: {
          alignItems: 'center',
          paddingVertical: spacing.xl,
        },
        errorText: {
          ...typography.bodySmall,
          color: palette.status.error,
          lineHeight: 22,
        },
      }),
    [cardPresets, palette],
  );

  const handleCopyLink = async (role: JoinLinkRole) => {
    const link = linksByRole.get(role);

    if (!link || !selectedTeam) {
      return;
    }

    setError(null);

    try {
      const joinUrl = buildJoinTeamUrl(link.token);
      await Clipboard.setStringAsync(joinUrl);
      setCopiedRole(role);
      setTimeout(() => {
        setCopiedRole((current) => (current === role ? null : current));
      }, 2000);
    } catch (copyError) {
      const message =
        copyError instanceof Error ? copyError.message : 'Could not copy join link. Try again.';
      setError(message);
    }
  };

  const handleRegenerateLink = (role: JoinLinkRole) => {
    if (!selectedTeam || regeneratingRole) {
      return;
    }

    Alert.alert('Regenerate link?', 'The old link will stop working.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Regenerate',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setRegeneratingRole(role);
            setError(null);

            try {
              await regenerateTeamJoinLink(selectedTeam.id, role);
              await loadLinks(selectedTeam.id, true);
            } catch (regenerateError) {
              const message =
                regenerateError instanceof Error
                  ? regenerateError.message
                  : 'Could not regenerate join link.';
              setError(message);
            } finally {
              setRegeneratingRole(null);
            }
          })();
        },
      },
    ]);
  };

  if (!canManageLinks) {
    return (
      <ScreenContainer title="Join Links">
        <Text style={styles.unauthorized}>
          Team management actions are available to coaches and team owners.
        </Text>
      </ScreenContainer>
    );
  }

  if (!selectedTeam) {
    return (
      <ScreenContainer title="Join Links">
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>
            Select a team from More → Account → Switch Team before managing join links.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const webAppOriginMissing = getJoinLinkWebAppOrigin() === null;

  return (
    <ScreenContainer title="Join Links" subtitle={selectedTeam.name}>
      <View style={styles.content}>
        <Text style={styles.intro}>
          Share these reusable links with your team. Anyone with a link can join at that role after
          signing in.
        </Text>

        {webAppOriginMissing ? (
          <Text style={styles.warningText}>{MISSING_WEB_APP_URL_MESSAGE}</Text>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={palette.interactive.primary} />
          </View>
        ) : (
          allowedRoles.map((role) => {
            const link = linksByRole.get(role);
            const joinUrl =
              link && getJoinLinkWebAppOrigin() ? buildJoinTeamUrl(link.token) : null;

            return (
              <JoinLinkRoleCard
                key={role}
                role={role}
                joinUrl={joinUrl}
                copied={copiedRole === role}
                regenerating={regeneratingRole === role}
                onCopy={() => {
                  void handleCopyLink(role);
                }}
                onRegenerate={() => handleRegenerateLink(role)}
              />
            );
          })
        )}
      </View>
    </ScreenContainer>
  );
}
