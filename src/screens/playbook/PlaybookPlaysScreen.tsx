import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlaybookList } from '../../components/PlaybookList';
import { PlaybookContent } from '../../components/PlaybookContent';
import { getSubcategoryById } from '../../data/playbookData';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'Plays'>;

export function PlaybookPlaysScreen({ navigation, route }: Props) {
  const { categoryId, subcategoryId } = route.params;
  const subcategory = getSubcategoryById(categoryId, subcategoryId);

  if (!subcategory) {
    return (
      <PlaybookContent>
        <PlaybookList items={[]} />
      </PlaybookContent>
    );
  }

  return (
    <PlaybookContent>
      <PlaybookList
        items={subcategory.plays.map((play) => ({
          key: play.id,
          label: play.name,
          subtitle: play.formation,
          onPress: () =>
            navigation.navigate('PlayDetail', {
              playId: play.id,
              playName: play.name,
            }),
        }))}
      />
    </PlaybookContent>
  );
}
