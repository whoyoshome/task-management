import * as Joi from 'joi';
import { databaseEnvSchema } from '@libs/database';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),
  ...databaseEnvSchema('USER'),
});
