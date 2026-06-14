import { StyleSheet, View } from 'react-native';

import { MenuItem } from '../components/MenuItem';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme';

export function MoreScreen() {
  return (
    <ScreenContainer title="More">
      <View style={styles.menu}>
        <MenuItem label="Team" icon="👥" />
        <MenuItem label="Settings" icon="⚙️" />
        <MenuItem label="Help" icon="❓" isLast />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  menu: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
});
