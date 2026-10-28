import { describe, expect, it } from 'vitest';
import { moveColumnCount } from './ProjectBoard';
import type { Board } from '../services/boardService';

const board: Board = {
  id: 'board-1',
  project_id: 'project-1',
  name: 'Default Board',
  is_default: true,
  columns: [
    { id: 'c1', status: 'pending', order_index: 0, wip_limit: null, task_count: 2, over_wip_limit: false },
    { id: 'c2', status: 'in-progress', order_index: 1, wip_limit: 2, task_count: 2, over_wip_limit: false },
  ],
} as Board;

describe('moveColumnCount', () => {
  it('moves one task between columns and flags the WIP limit', () => {
    const next = moveColumnCount(board, 'pending', 'in-progress');

    expect(next.columns[0]).toMatchObject({ task_count: 1, over_wip_limit: false });
    expect(next.columns[1]).toMatchObject({ task_count: 3, over_wip_limit: true });
  });

  it('clears the flag when the column drops back to its limit', () => {
    const over = moveColumnCount(board, 'pending', 'in-progress');
    const back = moveColumnCount(over, 'in-progress', 'pending');

    expect(back.columns[1]).toMatchObject({ task_count: 2, over_wip_limit: false });
  });

  it('does nothing when the status does not change', () => {
    expect(moveColumnCount(board, 'pending', 'pending')).toEqual(board);
  });
});
