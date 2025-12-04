import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),

  // TASK DB
  TASK_DB_HOST: Joi.string().required(),
  TASK_DB_PORT: Joi.number().required(),
  TASK_DB_USERNAME: Joi.string().required(),
  TASK_DB_PASSWORD: Joi.string().required(),
  TASK_DB_NAME: Joi.string().required(),
  TASK_DB_SCHEMA: Joi.string().required(),
});
