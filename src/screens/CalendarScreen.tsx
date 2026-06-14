import { ScreenContainer } from '../components/ScreenContainer';
import { PlaceholderText } from '../components/PlaceholderText';

export function CalendarScreen() {
  return (
    <ScreenContainer title="Calendar" scrollable={false}>
      <PlaceholderText message="Calendar functionality coming soon" />
    </ScreenContainer>
  );
}
