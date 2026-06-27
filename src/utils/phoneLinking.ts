import { Alert, Linking } from 'react-native';

function normalizePhoneForLink(phone: string): string {
  return phone.trim();
}

export function buildTelUrl(phone: string): string {
  return `tel:${normalizePhoneForLink(phone)}`;
}

export function buildSmsUrl(phone: string): string {
  return `sms:${normalizePhoneForLink(phone)}`;
}

async function openPhoneLink(url: string, failureMessage: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open', failureMessage);
  }
}

export async function openPhoneCall(phone: string): Promise<void> {
  const trimmed = phone.trim();

  if (!trimmed) {
    return;
  }

  await openPhoneLink(buildTelUrl(trimmed), 'Could not open the phone dialer.');
}

export async function openPhoneText(phone: string): Promise<void> {
  const trimmed = phone.trim();

  if (!trimmed) {
    return;
  }

  await openPhoneLink(buildSmsUrl(trimmed), 'Could not open the messaging app.');
}
