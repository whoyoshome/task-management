/**
 * A task's key, as in Jira: the project key and the task's number within
 * the project (WEB-12). Without a number (older dev data) it is just the
 * project key; without a project key there is no key.
 */
export function taskKey(
  projectKey: string | undefined,
  number: number | null | undefined
): string | undefined {
  if (!projectKey) return undefined;
  return number != null ? `${projectKey}-${number}` : projectKey;
}
