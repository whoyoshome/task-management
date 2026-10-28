import { describe, expect, it } from 'vitest';
import { taskKey } from './taskKey';

describe('taskKey', () => {
  it('joins the project key and the task number', () => {
    expect(taskKey('WEB', 12)).toBe('WEB-12');
  });

  it('falls back to the project key for tasks without a number', () => {
    expect(taskKey('WEB', null)).toBe('WEB');
  });

  it('has no key without a project key', () => {
    expect(taskKey(undefined, 3)).toBeUndefined();
  });
});
