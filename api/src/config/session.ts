import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import { env } from './env.js';

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore({
   host: env.SESSION_DB_HOST,
   port: env.SESSION_DB_PORT,
   user: env.SESSION_DB_USER,
   password: env.SESSION_DB_PASSWORD,
   database: env.SESSION_DB_NAME,
});

export const sessionMiddleware = session({
   name: 'vms.sid',
   secret: env.SESSION_SECRET as string,
   store: sessionStore,
   resave: false,
   saveUninitialized: false,

   cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
   },
});
