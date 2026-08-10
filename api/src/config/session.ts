import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { env } from './env.js';

const MySQLStore = MySQLStoreFactory(session);

/**
 * Persists session rows in the Prisma-managed `sessions` table
 * (session_id / expires / data) on the primary application database.
 *
 * `createDatabaseTable` is false so migrations own the schema —
 * see the Session model in prisma/schema.prisma.
 */
const sessionStore = new MySQLStore({
   host: env.DATABASE_HOST,
   port: env.DATABASE_PORT,
   user: env.DATABASE_USER,
   password: env.DATABASE_PASSWORD,
   database: env.DATABASE_NAME,
   createDatabaseTable: false,
   clearExpired: true,
   checkExpirationInterval: 1000 * 60 * 15,
   expiration: 1000 * 60 * 60 * 8,
   schema: {
      tableName: 'sessions',
      columnNames: {
         session_id: 'session_id',
         expires: 'expires',
         data: 'data',
      },
   },
});

export const SESSION_COOKIE_NAME = 'vms.sid';
export const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 8; // 8 hours

export const sessionMiddleware = session({
   name: SESSION_COOKIE_NAME,
   secret: env.SESSION_SECRET,
   store: sessionStore,
   resave: false,
   saveUninitialized: false,
   rolling: true,
   cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
   },
});
