import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlaybookList } from '../../components/PlaybookList';
import { PlaybookContent } from '../../components/PlaybookContent';
import { getCategoryById } from '../../data/playbookData';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'Subcategories'>;

export function PlaybookSubcategoriesScreen({ navigation, route }: Props) {
  const { categoryId } = route.params;
  const category = getCategoryById(categoryId);

  if (!category) {
    return (
      <PlaybookContent>
        <PlaybookList items={[]} />
      </PlaybookContent>
    );
  }

  return (
    <PlaybookContent>
      <PlaybookList
        items={category.subcategories.map((subcategory) => ({
          key: subcategory.id,
          label: subcategory.name,
          subtitle: `${subcategory.plays.length} plays`,
          onPress: () =>
            navigation.navigate('Plays', {
              categoryId,
              subcategoryId: subcategory.id,
              subcategoryName: subcategory.name,
            }),
        }))}
      />
    </PlaybookContent>
  );
}
