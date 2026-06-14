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

  const value = useMemo(
    () => ({
      plays,
      categories,
      loading,
      error,
      refreshPlays,
      getPlaysForCategory,
      loadPlayDetail,
    }),
    [plays, categories, loading, error, refreshPlays, getPlaysForCategory, loadPlayDetail],
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
