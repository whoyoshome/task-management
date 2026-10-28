import { InitSchema1793153567713 } from './1793153567713-InitSchema';
import { AddTaskHistoryActor1793157563276 } from './1793157563276-AddTaskHistoryActor';
import { AllowEmptyTaskDescription1793190000000 } from './1793190000000-AllowEmptyTaskDescription';
import { AddTaskNumber1793210000000 } from './1793210000000-AddTaskNumber';

/**
 * Migrations run on startup, in order. They are imported explicitly (not via
 * a glob) so webpack bundles them into main.js. Add every new migration here.
 */
export const migrations = [
  InitSchema1793153567713,
  AddTaskHistoryActor1793157563276,
  AllowEmptyTaskDescription1793190000000,
  AddTaskNumber1793210000000,
];
