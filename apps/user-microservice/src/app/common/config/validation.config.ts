import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),

  // USER DB
  USER_DB_HOST: Joi.string().required(),
  USER_DB_PORT: Joi.number().required(),
  USER_DB_USERNAME: Joi.string().required(),
  USER_DB_PASSWORD: Joi.string().required(),
  USER_DB_NAME: Joi.string().required(),
  USER_DB_SCHEMA: Joi.string().required(),
});
