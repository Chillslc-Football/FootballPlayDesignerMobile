import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '../auth/AuthProvider';
import { MenuItem } from '../components/MenuItem';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme';

export function MoreScreen() {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScreenContainer title="More">
      <View style={styles.menu}>
        <MenuItem label="Team" icon="👥" />
        <MenuItem label="Settings" icon="⚙️" />
        <MenuItem label="Help" icon="❓" />
        <MenuItem
          label={signingOut ? 'Signing Out...' : 'Sign Out'}
          icon="🚪"
          onPress={handleSignOut}
          isLast
        />
      </View>

      {signingOut ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}
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
  loadingOverlay: {
    marginTop: 16,
    alignItems: 'center',
  },
});
