import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { palette, radius } from '../../design-system';
import type { FilmProvider } from '../../utils/filmProvider';
import { getThumbnailUrl } from '../../utils/filmThumbnail';

type FilmThumbnailProps = {
  videoSource: string;
  provider: FilmProvider;
  height: number;
  rounded?: boolean;
};

export function FilmThumbnail({
  videoSource,
  provider,
  height,
  rounded = false,
}: FilmThumbnailProps) {
  const thumbnailUrl = getThumbnailUrl(videoSource, provider);
  const [failed, setFailed] = useState(false);

  if (!thumbnailUrl || failed) {
    return null;
  }

  return (
    <View style={[styles.container, { height }, rounded && styles.rounded]}>
      <Image
        source={{ uri: thumbnailUrl }}
        style={styles.image}
        contentFit="cover"
        transition={150}
        recyclingKey={thumbnailUrl}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: palette.background.card,
  },
  rounded: {
    borderRadius: radius.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
