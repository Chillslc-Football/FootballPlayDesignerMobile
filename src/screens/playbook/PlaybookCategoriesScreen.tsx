import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlaybookList } from '../../components/PlaybookList';
import { ScreenContainer } from '../../components/ScreenContainer';
import { playbookCategories } from '../../data/playbookData';
import { PlaybookStackParamList } from '../../navigation/PlaybookStack';

type Props = NativeStackScreenProps<PlaybookStackParamList, 'Categories'>;

export function PlaybookCategoriesScreen({ navigation }: Props) {
  return (
    <ScreenContainer title="Playbook" subtitle="Browse by category">
      <PlaybookList
        items={playbookCategories.map((category) => ({
          key: category.id,
          label: category.name,
          subtitle: `${category.subcategories.length} sections`,
          icon: category.icon,
          onPress: () =>
            navigation.navigate('Subcategories', {
              categoryId: category.id,
              categoryName: category.name,
            }),
        }))}
      />
    </ScreenContainer>
  );
}
