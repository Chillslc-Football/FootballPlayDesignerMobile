import { PlaybookProvider } from '../playbook/PlaybookProvider';
import { PlaybookStack } from '../navigation/PlaybookStack';

export function PlaybookScreen() {
  return (
    <PlaybookProvider>
      <PlaybookStack />
    </PlaybookProvider>
  );
}
