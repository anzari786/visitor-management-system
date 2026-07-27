import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

const startServer = async () => {
   try {
      app.listen(PORT, () => {
         console.log(`Server running on http://localhost:${PORT}`);
      });
   } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
   }
};

startServer();
