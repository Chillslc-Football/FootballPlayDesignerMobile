import { ScreenContainer } from '../components/ScreenContainer';
import { PlaceholderText } from '../components/PlaceholderText';

export function MessagesScreen() {
  return (
    <ScreenContainer title="Messages" scrollable={false}>
      <PlaceholderText message="Messaging functionality coming soon" />
    </ScreenContainer>
  );
}
