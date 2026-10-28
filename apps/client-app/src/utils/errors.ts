/**
 * Message of an API error (axios), or `fallback`. Validation errors arrive
 * as a list of messages and are joined.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' && message ? message : fallback;
}
