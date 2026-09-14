type ScheduledJob = {
   name: string;
   hour: number;
   minute: number;
   run: () => Promise<void>;
};

const jobs: ScheduledJob[] = [];
const runningJobs = new Set<string>();

export const registerDailyJob = (
   name: string,
   hour: number,
   minute: number,
   run: () => Promise<void>,
): void => {
   jobs.push({ name, hour, minute, run });
};

const msUntilNextRun = (hour: number, minute: number): number => {
   const now = new Date();
   const next = new Date(now);
   next.setHours(hour, minute, 0, 0);

   if (next <= now) {
      next.setDate(next.getDate() + 1);
   }

   return next.getTime() - now.getTime();
};

const runJobSafely = async (job: ScheduledJob): Promise<void> => {
   if (runningJobs.has(job.name)) {
      console.warn(
         `[scheduler] Skipping "${job.name}" — previous run still in progress`,
      );
      return;
   }

   runningJobs.add(job.name);
   const startedAt = new Date().toISOString();

   try {
      console.log(`[scheduler] Starting job "${job.name}" at ${startedAt}`);
      await job.run();
   } catch (error) {
      console.error(`[scheduler] Job "${job.name}" failed:`, error);
   } finally {
      runningJobs.delete(job.name);
   }
};

const scheduleJob = (job: ScheduledJob): void => {
   const scheduleNext = (): void => {
      const delayMs = msUntilNextRun(job.hour, job.minute);

      setTimeout(async () => {
         await runJobSafely(job);
         scheduleNext();
      }, delayMs);
   };

   scheduleNext();
};

export const startScheduler = (): void => {
   if (jobs.length === 0) {
      return;
   }

   console.log(
      `[scheduler] Starting ${jobs.length} scheduled job(s): ${jobs.map((job) => job.name).join(', ')}`,
   );

   for (const job of jobs) {
      scheduleJob(job);
   }
};
