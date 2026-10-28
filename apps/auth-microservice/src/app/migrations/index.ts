import { InitSchema1793153570821 } from './1793153570821-InitSchema';
import { AddRefreshTokenUsedAt1793175600000 } from './1793175600000-AddRefreshTokenUsedAt';

/**
 * Migrations run on startup, in order. They are imported explicitly (not via
 * a glob) so webpack bundles them into main.js. Add every new migration here.
 */
export const migrations = [
  InitSchema1793153570821,
  AddRefreshTokenUsedAt1793175600000,
];
