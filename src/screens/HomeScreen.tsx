import { StyleSheet, Text } from 'react-native';

import { Card } from '../components/Card';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../theme';

export function HomeScreen() {
  return (
    <ScreenContainer
      title="Football Play Designer"
      subtitle="Team Companion App"
    >
      <Card title="Upcoming Event">
        <Text style={styles.cardText}>Team Practice</Text>
        <Text style={styles.cardSubtext}>Tomorrow at 4:00 PM</Text>
      </Card>

      <Card title="Recent Message">
        <Text style={styles.cardText}>Coach Johnson</Text>
        <Text style={styles.cardSubtext}>
          Review the new red zone package before Friday.
        </Text>
      </Card>

      <Card title="Playbook Updates">
        <Text style={styles.cardText}>3 new plays added</Text>
        <Text style={styles.cardSubtext}>Updated this week in your playbook</Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
