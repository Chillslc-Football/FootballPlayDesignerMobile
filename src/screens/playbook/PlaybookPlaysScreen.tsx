import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlayDiagramThumbnail } from '../../components/PlayDiagramThumbnail';
import { PlaybookList } from '../../components/PlaybookList';
import { PlaybookContent } from '../../components/PlaybookContent';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';
import { usePlaybook } from '../../playbook/PlaybookProvider';
import { buildPlaySubtitle } from '../../utils/playDisplay';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'Plays'>;

export function PlaybookPlaysScreen({ navigation, route }: Props) {
  const { categoryName } = route.params;
  const { getPlaysForCategory } = usePlaybook();
  const plays = getPlaysForCategory(categoryName);

  return (
    <PlaybookContent>
      <PlaybookList
        items={plays.map((play) => ({
          key: play.id,
          label: play.name,
          subtitle: buildPlaySubtitle(play.playType, play.formationName, play.categories),
          leading: <PlayDiagramThumbnail play={play.diagramPlay} />,
          onPress: () =>
            navigation.navigate('PlayDetail', {
              playId: play.id,
              playName: play.name,
              categoryName,
            }),
        }))}
      />
    </PlaybookContent>
  );
}
