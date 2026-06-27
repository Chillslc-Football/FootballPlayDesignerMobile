import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createTeam as createTeamRecord,
  deleteTeam as deleteTeamRecord,
  fetchUserTeamMemberships,
  updateLastTeamId,
} from '../lib/teamRepository';
import type { Team, TeamMembership, TeamRole } from '../types/team';
import type { TeamFormat } from '../types/teamFormat';
import { useAuth } from '../auth/AuthProvider';

type CreateTeamResult = {
  error: string | null;
  teamId: string | null;
};

type DeleteTeamResult = {
  error: string | null;
};

type TeamContextValue = {
  memberships: TeamMembership[];
  selectedTeam: Team | null;
  selectedTeamMemberRole: TeamRole | null;
  loading: boolean;
  error: string | null;
  selectTeam: (teamId: string) => Promise<void>;
  switchTeam: () => void;
  refreshTeams: () => Promise<void>;
  createTeam: (name: string, format: TeamFormat) => Promise<CreateTeamResult>;
  deleteTeam: (teamId: string) => Promise<DeleteTeamResult>;
};

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

type TeamProviderProps = {
  children: ReactNode;
};

export function TeamProvider({ children }: TeamProviderProps) {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedTeamMemberRole, setSelectedTeamMemberRole] = useState<TeamRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTeams = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setSelectedTeam(null);
      setSelectedTeamMemberRole(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { memberships: loadedMemberships, lastTeamId } = await fetchUserTeamMemberships(
        user.id,
      );

      setMemberships(loadedMemberships);

      const activeMembership = lastTeamId
        ? loadedMemberships.find((membership) => membership.team.id === lastTeamId)
        : undefined;

      if (activeMembership) {
        setSelectedTeam(activeMembership.team);
        setSelectedTeamMemberRole(activeMembership.role);
      } else {
        setSelectedTeam(null);
        setSelectedTeamMemberRole(null);
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load teams.';
      setError(message);
      setMemberships([]);
      setSelectedTeam(null);
      setSelectedTeamMemberRole(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshTeams();
  }, [refreshTeams]);

  const selectTeam = useCallback(
    async (teamId: string) => {
      const membership = memberships.find((item) => item.team.id === teamId);

      if (!membership || !user) {
        return;
      }

      setSelectedTeam(membership.team);
      setSelectedTeamMemberRole(membership.role);

      try {
        await updateLastTeamId(user.id, teamId);
      } catch (updateError) {
        const message =
          updateError instanceof Error ? updateError.message : 'Failed to save team selection.';
        setError(message);
      }
    },
    [memberships, user],
  );

  const switchTeam = useCallback(() => {
    setSelectedTeam(null);
    setSelectedTeamMemberRole(null);
    setError(null);
  }, []);

  const createTeam = useCallback(
    async (name: string, format: TeamFormat): Promise<CreateTeamResult> => {
      if (!user) {
        return { error: 'Not signed in', teamId: null };
      }

      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return { error: 'Team name must be at least 2 characters.', teamId: null };
      }

      setError(null);

      try {
        const membership = await createTeamRecord(user.id, trimmed, format);

        const { memberships: loadedMemberships } = await fetchUserTeamMemberships(user.id);
        const activeMembership = loadedMemberships.find(
          (item) => item.team.id === membership.team.id,
        );

        if (!activeMembership) {
          throw new Error(
            `public.teams row for id "${membership.team.id}" was not returned by membership refresh after create.`,
          );
        }

        setMemberships(loadedMemberships);
        setSelectedTeam(activeMembership.team);
        setSelectedTeamMemberRole(activeMembership.role);

        return { error: null, teamId: activeMembership.team.id };
      } catch (createError) {
        const message =
          createError instanceof Error ? createError.message : 'Could not create team.';

        try {
          await refreshTeams();
        } catch {
          // Keep the original create error visible.
        }

        setError(message);
        return { error: message, teamId: null };
      }
    },
    [refreshTeams, user],
  );

  const deleteTeam = useCallback(
    async (teamId: string): Promise<DeleteTeamResult> => {
      if (!user) {
        return { error: 'Not signed in' };
      }

      if (selectedTeamMemberRole !== 'team_owner') {
        return { error: 'Only team owners can delete teams' };
      }

      if (!selectedTeam || teamId !== selectedTeam.id) {
        return { error: 'You can only delete the active team' };
      }

      setLoading(true);
      setError(null);

      try {
        await deleteTeamRecord(teamId, { role: selectedTeamMemberRole });

        const { memberships: loadedMemberships, lastTeamId } = await fetchUserTeamMemberships(
          user.id,
        );

        if (loadedMemberships.some((membership) => membership.team.id === teamId)) {
          throw new Error(
            'Team delete appeared to succeed but the team is still in your memberships.',
          );
        }

        setMemberships(loadedMemberships);

        const preferredMembership = lastTeamId
          ? loadedMemberships.find((membership) => membership.team.id === lastTeamId)
          : undefined;

        const nextMembership =
          preferredMembership ??
          loadedMemberships[0] ??
          null;

        if (nextMembership) {
          setSelectedTeam(nextMembership.team);
          setSelectedTeamMemberRole(nextMembership.role);

          try {
            await updateLastTeamId(user.id, nextMembership.team.id);
          } catch (updateError) {
            const message =
              updateError instanceof Error
                ? updateError.message
                : 'Failed to save team selection after delete.';
            setError(message);
          }
        } else {
          setSelectedTeam(null);
          setSelectedTeamMemberRole(null);
        }

        return { error: null };
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : 'Could not delete team.';

        try {
          await refreshTeams();
        } catch {
          // Keep the original delete error visible.
        }

        setError(message);
        return { error: message };
      } finally {
        setLoading(false);
      }
    },
    [refreshTeams, selectedTeam, selectedTeamMemberRole, user],
  );

  const value = useMemo(
    () => ({
      memberships,
      selectedTeam,
      selectedTeamMemberRole,
      loading,
      error,
      selectTeam,
      switchTeam,
      refreshTeams,
      createTeam,
      deleteTeam,
    }),
    [
      memberships,
      selectedTeam,
      selectedTeamMemberRole,
      loading,
      error,
      selectTeam,
      switchTeam,
      refreshTeams,
      createTeam,
      deleteTeam,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const context = useContext(TeamContext);

  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }

  return context;
}
