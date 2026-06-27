import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { fetchTeamManagementRoster } from '../../lib/teamManagementRepository';
import { useTeam } from '../../team/TeamProvider';
import type { TeamManagementRosterRow } from '../../types/teamRoster';

export function useTeamManagementRoster() {
  const { selectedTeam } = useTeam();
  const [rosterRows, setRosterRows] = useState<TeamManagementRosterRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const hasLoadedRosterRef = useRef(false);

  const loadRoster = useCallback(async (teamId: string, background = false) => {
    if (!background) {
      setRosterLoading(true);
    }
    setRosterError(null);

    try {
      const rows = await fetchTeamManagementRoster(teamId);
      setRosterRows(rows);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load team members.';
      setRosterError(message);
      if (!background) {
        setRosterRows([]);
      }
    } finally {
      if (!background) {
        setRosterLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const teamId = selectedTeam?.id;

      if (!teamId) {
        setRosterRows([]);
        setRosterError(null);
        setRosterLoading(false);
        hasLoadedRosterRef.current = false;
        return;
      }

      void loadRoster(teamId, hasLoadedRosterRef.current);
      hasLoadedRosterRef.current = true;
    }, [loadRoster, selectedTeam?.id]),
  );

  return {
    teamId: selectedTeam?.id ?? null,
    rosterRows,
    rosterLoading,
    rosterError,
    loadRoster,
  };
}
