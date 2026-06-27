import { useMemo } from 'react';
import { PlatformPressable } from '@react-navigation/elements';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const HIDDEN_TAB_ROUTE_NAMES = new Set(['Updates']);

type TabDescriptors = BottomTabBarProps['descriptors'];

function descriptorsWithForcedTabPress(
  descriptors: TabDescriptors,
  visibleRoutes: BottomTabBarProps['state']['routes'],
  navigation: BottomTabBarProps['navigation'],
): TabDescriptors {
  const next: TabDescriptors = { ...descriptors };

  for (const route of visibleRoutes) {
    const descriptor = next[route.key];
    if (!descriptor) {
      continue;
    }

    const originalTabBarButton = descriptor.options.tabBarButton;

    next[route.key] = {
      ...descriptor,
      options: {
        ...descriptor.options,
        tabBarButton: (buttonProps) => {
          const onPress = () => {
            navigation.navigate(route.name, route.params);
          };

          if (originalTabBarButton) {
            return originalTabBarButton({
              ...buttonProps,
              onPress,
            });
          }

          return <PlatformPressable {...buttonProps} onPress={onPress} />;
        },
      },
    };
  }

  return next;
}

/**
 * React Navigation still allocates flex space for tabs whose tabBarButton returns null.
 * Filter hidden routes so the six visible tabs each receive exactly 1/6 width.
 */
export function EqualWidthBottomTabBar(props: BottomTabBarProps) {
  const visibleRoutes = props.state.routes.filter(
    (route) => !HIDDEN_TAB_ROUTE_NAMES.has(route.name),
  );

  const focusedRoute = props.state.routes[props.state.index];
  const visibleIndex =
    focusedRoute != null
      ? visibleRoutes.findIndex((route) => route.key === focusedRoute.key)
      : -1;

  const hiddenTabFocused = visibleIndex < 0;
  // BottomTabBar requires a valid routes[index]; -1 crashes when reading route.key.
  const displayIndex = hiddenTabFocused ? 0 : visibleIndex;

  const descriptors = useMemo(() => {
    if (!hiddenTabFocused) {
      return props.descriptors;
    }

    return descriptorsWithForcedTabPress(
      props.descriptors,
      visibleRoutes,
      props.navigation,
    );
  }, [hiddenTabFocused, props.descriptors, props.navigation, visibleRoutes]);

  if (visibleRoutes.length === 0) {
    return null;
  }

  return (
    <BottomTabBar
      {...props}
      descriptors={descriptors}
      state={{
        ...props.state,
        routes: visibleRoutes,
        index: displayIndex,
      }}
    />
  );
}
