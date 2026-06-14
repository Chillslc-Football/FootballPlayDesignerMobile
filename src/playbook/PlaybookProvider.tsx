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
  fetchPlayById,
  fetchPlaysByTeam,
  filterPlaysByCategory,
  getCategoriesFromPlays,
  updatePlayNotes,
  updatePlayPlayerNotes,
} from '../lib/playRepository';
import type { PlayCategoryGroup, PlayDetail, PlaySummary } from '../types/play';
import { useTeam } from '../team/TeamProvider';

type PlaybookContextValue = {
  plays: PlaySummary[];
  categories: PlayCategoryGroup[];
  loading: boolean;
  error: string | null;
  refreshPlays: () => Promise<void>;
  getPlaysForCategory: (categoryName: string) => PlaySummary[];
  loadPlayDetail: (playId: string) => Promise<PlayDetail | null>;
  savePlayNotes: (playId: string, notes: string) => Promise<{ error: string | null }>;
  savePlayAssignments: (
    playId: string,
    playerNotes: Record<string, string>,
  ) => Promise<{ error: string | null }>;
};

const PlaybookContext = createContext<PlaybookContextValue | undefined>(undefined);

type PlaybookProviderProps = {
  children: ReactNode;
};

export function PlaybookProvider({ children }: PlaybookProviderProps) {
  const { selectedTeam } = useTeam();
  const [plays, setPlays] = useState<PlaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPlays = useCallback(async () => {
    if (!selectedTeam) {
      setPlays([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedPlays = await fetchPlaysByTeam(selectedTeam.id);
      setPlays(loadedPlays);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load playbook.';
      setError(message);
      setPlays([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    void refreshPlays();
  }, [refreshPlays]);

  const categories = useMemo(() => getCategoriesFromPlays(plays), [plays]);

  const getPlaysForCategory = useCallback(
    (categoryName: string) => filterPlaysByCategory(plays, categoryName),
    [plays],
  );

  const loadPlayDetail = useCallback(
    async (playId: string) => {
      if (!selectedTeam) {
        return null;
      }

      return fetchPlayById(selectedTeam.id, playId);
    },
    [selectedTeam],
  );

  const savePlayNotes = useCallback(
    async (playId: string, notes: string) => {
      if (!selectedTeam) {
        return { error: 'No team selected.' };
      }

      try {
        await updatePlayNotes(selectedTeam.id, playId, notes);
        return { error: null };
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : 'Failed to save notes.';
        return { error: message };
      }
    },
    [selectedTeam],
  );

  const savePlayAssignments = useCallback(
    async (playId: string, playerNotes: Record<string, string>) => {
      if (!selectedTeam) {
        return { error: 'No team selected.' };
      }

      try {
        await updatePlayPlayerNotes(selectedTeam.id, playId, playerNotes);
        return { error: null };
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : 'Failed to save assignments.';
        return { error: message };
      }
    },
    [selectedTeam],
  );

  const value = useMemo(
    () => ({
      plays,
      categories,
      loading,
      error,
      refreshPlays,
      getPlaysForCategory,
      loadPlayDetail,
      savePlayNotes,
      savePlayAssignments,
    }),
    [
      plays,
      categories,
      loading,
      error,
      refreshPlays,
      getPlaysForCategory,
      loadPlayDetail,
      savePlayNotes,
      savePlayAssignments,
    ],
  );

  return <PlaybookContext.Provider value={value}>{children}</PlaybookContext.Provider>;
}

export function usePlaybook() {
  const context = useContext(PlaybookContext);

  if (!context) {
    throw new Error('usePlaybook must be used within a PlaybookProvider');
  }

  return context;
}
