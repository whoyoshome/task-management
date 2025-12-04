import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  siteTitle: process.env.SITE_TITLE,
  docTitle: process.env.DOC_TITLE,
  docDescription: process.env.DOC_DESCRIPTION,
  docVersion: process.env.DOC_VERSION,
}));
