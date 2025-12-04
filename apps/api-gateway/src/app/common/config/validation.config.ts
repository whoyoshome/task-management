import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),
  PORT: Joi.number().default(3000),

  // Swagger
  SITE_TITLE: Joi.string().required(),
  DOC_TITLE: Joi.string().required(),
  DOC_DESCRIPTION: Joi.string().required(),
  DOC_VERSION: Joi.string().required(),

  // API key
  API_KEY_MIDDLEWARE: Joi.string().required(),
});
