import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore({
   host: process.env.SESSION_DB_HOST,
   port: Number(process.env.SESSION_DB_PORT),
   user: process.env.SESSION_DB_USER,
   password: process.env.SESSION_DB_PASSWORD,
   database: process.env.SESSION_DB_NAME,
});

export const sessionMiddleware = session({
   name: 'vms.sid',
   secret: process.env.SESSION_SECRET as string,
   store: sessionStore,
   resave: false,
   saveUninitialized: false,

   cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
   },
});
