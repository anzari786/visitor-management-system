export const env = {
   // Application
   NODE_ENV: process.env.NODE_ENV ?? 'development',
   PORT: Number(process.env.PORT ?? 5000),
   CLIENT_URL: process.env.CLIENT_URL!,

   // Prisma Database
   DATABASE_URL: process.env.DATABASE_URL!,
   DATABASE_HOST: process.env.DATABASE_HOST!,
   DATABASE_PORT: Number(process.env.DATABASE_PORT),
   DATABASE_USER: process.env.DATABASE_USER!,
   DATABASE_PASSWORD: process.env.DATABASE_PASSWORD!,
   DATABASE_NAME: process.env.DATABASE_NAME!,

   // Session Database
   SESSION_DB_HOST: process.env.SESSION_DB_HOST!,
   SESSION_DB_PORT: Number(process.env.SESSION_DB_PORT),
   SESSION_DB_USER: process.env.SESSION_DB_USER!,
   SESSION_DB_PASSWORD: process.env.SESSION_DB_PASSWORD!,
   SESSION_DB_NAME: process.env.SESSION_DB_NAME!,

   // Session
   SESSION_SECRET: process.env.SESSION_SECRET!,

   // SMTP / transactional email
   SMTP_HOST: process.env.SMTP_HOST,
   SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
   SMTP_SECURE: process.env.SMTP_SECURE === 'true',
   SMTP_USER: process.env.SMTP_USER,
   SMTP_PASS: process.env.SMTP_PASS,
   SMTP_FROM:
      process.env.SMTP_FROM ??
      '"ATI VMS" <noreply@ati.gov.et>',

   // Local account password setup invitations
   PASSWORD_SETUP_TOKEN_TTL_HOURS: Number(
      process.env.PASSWORD_SETUP_TOKEN_TTL_HOURS ?? 72,
   ),
} as const;
