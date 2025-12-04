export interface AppConfig {
  PORT: number;
  API_KEY_MIDDLEWARE: string;
  SITE_TITLE: string | undefined;
  DOC_TITLE: string | undefined;
  DOC_DESCRIPTION: string | undefined;
  DOC_VERSION: string | undefined;
  JWT_SECRET: string | undefined;
  JWT_EXPIRES_IN: string | undefined;
  JWT_REFRESH_SECRET: string | undefined;
  JWT_REFRESH_EXPIRES_IN: string | undefined;
}
