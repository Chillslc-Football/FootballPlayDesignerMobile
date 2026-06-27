export type Palette = {
  background: {
    primary: string;
    secondary: string;
    card: string;
  };
  border: {
    default: string;
    subtle: string;
  };
  divider: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    disabled: string;
    label: string;
  };
  interactive: {
    primary: string;
    primaryLight: string;
  };
  accent: {
    default: string;
  };
  navigation: {
    tabBar: string;
    tabActive: string;
    tabInactive: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
};

export type LegacyColors = {
  background: string;
  surface: string;
  card: string;
  cardBorder: string;
  primary: string;
  primaryLight: string;
  accent: string;
  gold: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  tabBar: string;
  tabBarActive: string;
  tabBarInactive: string;
  divider: string;
};
