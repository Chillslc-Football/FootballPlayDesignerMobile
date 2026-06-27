import { supabase } from './supabase';
import { getPasswordResetRedirectUrl } from '../utils/passwordResetUrl';

const MISSING_WEB_APP_URL_MESSAGE =
  'EXPO_PUBLIC_WEB_APP_URL is not configured. Password reset requires a redirect URL.';

export async function requestPasswordResetEmail(email: string): Promise<void> {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    throw new Error('No email address is available for this account.');
  }

  const redirectTo = getPasswordResetRedirectUrl();

  if (!redirectTo) {
    throw new Error(MISSING_WEB_APP_URL_MESSAGE);
  }

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export { MISSING_WEB_APP_URL_MESSAGE as PASSWORD_RESET_MISSING_WEB_APP_URL_MESSAGE };
