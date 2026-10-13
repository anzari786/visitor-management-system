import app from './app.js';
import { env } from './config/env.js';
import { startScheduler } from './jobs/scheduler.js';
import { registerNotificationDispatchJob } from './jobs/notification-dispatch.job.js';
import { registerVisitExpirationJob } from './jobs/visit-expiration.job.js';

const PORT = env.PORT || 5000;

const startServer = async () => {
   try {
      registerVisitExpirationJob();
      registerNotificationDispatchJob();
      startScheduler();

      app.listen(PORT, () => {
         console.log(`Server running on http://localhost:${PORT}`);
      });
   } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
   }
};

startServer();
