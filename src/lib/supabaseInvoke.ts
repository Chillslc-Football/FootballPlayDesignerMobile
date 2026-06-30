export async function getInvokeErrorMessage(
  error: unknown,
  fallbackMessage: string,
): Promise<string> {
  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const invokeError = error as {
    name?: string;
    message?: string;
    context?: Response;
  };

  if (invokeError.name === 'FunctionsHttpError' && invokeError.context instanceof Response) {
    try {
      const body = (await invokeError.context.json()) as { error?: string };

      if (body.error) {
        return body.error;
      }
    } catch {
      // Fall through to generic message below.
    }
  }

  if (typeof invokeError.message === 'string' && invokeError.message.length > 0) {
    return invokeError.message;
  }

  return fallbackMessage;
}
