export const env = {
   // App
   NODE_ENV: process.env.NODE_ENV ?? 'development',
   PORT: Number(process.env.PORT ?? 5000),
   CLIENT_URL: process.env.CLIENT_URL!,

   // Prisma Database
   DATABASE_URL: process.env.DATABASE_URL!,

   // Session Database
   SESSION_DB_HOST: process.env.SESSION_DB_HOST!,
   SESSION_DB_PORT: Number(process.env.SESSION_DB_PORT),
   SESSION_DB_USER: process.env.SESSION_DB_USER!,
   SESSION_DB_PASSWORD: process.env.SESSION_DB_PASSWORD!,
   SESSION_DB_NAME: process.env.SESSION_DB_NAME!,

   // Session
   SESSION_SECRET: process.env.SESSION_SECRET!,
};
