import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),

  // AUTH DB
  AUTH_DB_HOST: Joi.string().required(),
  AUTH_DB_PORT: Joi.number().required(),
  AUTH_DB_USERNAME: Joi.string().required(),
  AUTH_DB_PASSWORD: Joi.string().required(),
  AUTH_DB_NAME: Joi.string().required(),
  AUTH_DB_SCHEMA: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

});
