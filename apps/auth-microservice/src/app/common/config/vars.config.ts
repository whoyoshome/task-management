export interface AppConfig {
  AUTH_DB_HOST: string;
  AUTH_DB_PORT: string;
  AUTH_DB_USERNAME: string;
  AUTH_DB_PASSWORD: string;
  AUTH_DB_NAME: string;
  AUTH_DB_SCHEMA: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
}
