export type TeamEventReminderOptionValue =
  | 'none'
  | '0'
  | '15'
  | '30'
  | '60'
  | '120'
  | '1440';

export type TeamEventReminderOption = {
  value: TeamEventReminderOptionValue;
  label: string;
};

export const DEFAULT_TEAM_EVENT_REMINDER_OPTION: TeamEventReminderOptionValue = '60';

export const TEAM_EVENT_REMINDER_OPTIONS: TeamEventReminderOption[] = [
  { value: 'none', label: 'None' },
  { value: '0', label: 'At event time' },
  { value: '15', label: '15 minutes before' },
  { value: '30', label: '30 minutes before' },
  { value: '60', label: '1 hour before' },
  { value: '120', label: '2 hours before' },
  { value: '1440', label: '1 day before' },
];

export type TeamEventReminderFields = {
  reminder_enabled: boolean;
  reminder_minutes_before: number;
};

export function reminderOptionToFields(
  option: TeamEventReminderOptionValue,
): TeamEventReminderFields {
  if (option === 'none') {
    return {
      reminder_enabled: false,
      reminder_minutes_before: 60,
    };
  }

  return {
    reminder_enabled: true,
    reminder_minutes_before: Number(option),
  };
}

export function reminderFieldsToOption(
  reminderEnabled: boolean,
  reminderMinutesBefore: number,
): TeamEventReminderOptionValue {
  if (!reminderEnabled) {
    return 'none';
  }

  const match = TEAM_EVENT_REMINDER_OPTIONS.find(
    (option) => option.value !== 'none' && Number(option.value) === reminderMinutesBefore,
  );

  return match?.value ?? DEFAULT_TEAM_EVENT_REMINDER_OPTION;
}

export function formatTeamEventReminderLabel(
  reminderEnabled: boolean,
  reminderMinutesBefore: number,
): string {
  if (!reminderEnabled) {
    return 'None';
  }

  const option = TEAM_EVENT_REMINDER_OPTIONS.find(
    (entry) => entry.value !== 'none' && Number(entry.value) === reminderMinutesBefore,
  );

  return option?.label ?? `${reminderMinutesBefore} minutes before`;
}

export function getTeamEventReminderOptionLabel(option: TeamEventReminderOptionValue): string {
  return (
    TEAM_EVENT_REMINDER_OPTIONS.find((entry) => entry.value === option)?.label ??
    formatTeamEventReminderLabel(
      option !== 'none',
      option === 'none' ? 60 : Number(option),
    )
  );
}
