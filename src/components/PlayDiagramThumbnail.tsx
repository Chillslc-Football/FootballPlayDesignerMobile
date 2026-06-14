import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FIELD_ASPECT_RATIO } from '../playDiagram/constants/field';
import { ReadOnlyPlayDiagram } from '../playDiagram/ReadOnlyPlayDiagram';
import type { RenderPlay } from '../playDiagram/types';
import { colors } from '../theme';

type PlayDiagramThumbnailProps = {
  play: RenderPlay | null;
};

function PlayDiagramThumbnailComponent({ play }: PlayDiagramThumbnailProps) {
  if (!play) {
    return (
      <View style={styles.placeholder} pointerEvents="none">
        <Text style={styles.placeholderText}>No diagram</Text>
      </View>
    );
  }

  return <ReadOnlyPlayDiagram play={play} compact style={styles.thumbnail} />;
}

export const PlayDiagramThumbnail = memo(PlayDiagramThumbnailComponent);

const THUMBNAIL_WIDTH = 72;

const styles = StyleSheet.create({
  thumbnail: {
    width: THUMBNAIL_WIDTH,
  },
  placeholder: {
    width: THUMBNAIL_WIDTH,
    aspectRatio: FIELD_ASPECT_RATIO,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
