import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlaybookList } from '../../components/PlaybookList';
import { PlaybookContent } from '../../components/PlaybookContent';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';
import { usePlaybook } from '../../playbook/PlaybookProvider';

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
          subtitle: play.formationName,
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
