import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

type UploadFilmPlayerProps = {
  signedUrl: string;
};

export function UploadFilmPlayer({ signedUrl }: UploadFilmPlayerProps) {
  const player = useVideoPlayer(signedUrl, (instance) => {
    instance.loop = false;
    instance.play();
  });

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        allowsFullscreen
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
  },
});
