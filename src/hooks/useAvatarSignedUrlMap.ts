import { useEffect, useMemo, useState } from 'react';

import { createAvatarSignedUrls } from '../lib/avatarStorageRepository';

function buildAvatarPathsKey(storagePaths: Array<string | null | undefined>): string {
  return storagePaths
    .map((path) => path?.trim() || '')
    .filter(Boolean)
    .sort()
    .join('|');
}

export function useAvatarSignedUrlMap(storagePaths: Array<string | null | undefined>): {
  signedUrlsByPath: Map<string, string>;
  signing: boolean;
} {
  const pathsKey = useMemo(() => buildAvatarPathsKey(storagePaths), [storagePaths]);
  const [signedUrlsByPath, setSignedUrlsByPath] = useState<Map<string, string>>(() => new Map());
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!pathsKey) {
      setSignedUrlsByPath(new Map());
      setSigning(false);
      return;
    }

    let cancelled = false;
    setSigning(true);

    void createAvatarSignedUrls(storagePaths)
      .then((nextSignedUrls) => {
        if (!cancelled) {
          setSignedUrlsByPath(nextSignedUrls);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSignedUrlsByPath(new Map());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSigning(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pathsKey]);

  return { signedUrlsByPath, signing };
}
